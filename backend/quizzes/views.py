import os
import requests
import json
import datetime
import re
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Question, QuizAttempt, UserQuestionStatus, KnowledgePoint
from .serializers import QuestionSerializer, QuizAttemptSerializer, UserQuestionStatusSerializer, KnowledgePointSerializer
from users.models import User
from users.serializers import UserSerializer

def get_quiz_template(filename):
    """从模板文件夹读取提示词内容"""
    path = os.path.join(os.path.dirname(__file__), 'templates', filename)
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    return ""

def extract_json_from_text(content):
    """从 AI 返回的文本中稳健地提取 JSON 数据"""
    try:
        # 优先尝试匹配 Markdown 代码块中的 JSON
        json_match = re.search(r'```(?:json)?\s*(\[.*\]|\{.*\})\s*```', content, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(1))
        # 其次尝试匹配首个 [ 或 { 到末尾
        json_match = re.search(r'(\[.*\]|\{.*\})', content, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(1))
        # 最后直接尝试解析
        return json.loads(content.strip())
    except Exception as e:
        raise ValueError(f"JSON 解析失败: {str(e)}。原始内容: {content[:200]}")

class QuestionListView(generics.ListCreateAPIView):
    serializer_class = QuestionSerializer
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = Question.objects.all().order_by('-created_at')
        
        # Shared filters
        q = self.request.query_params.get('search')
        kp_id = self.request.query_params.get('kp')
        q_type = self.request.query_params.get('type')
        
        if q: qs = qs.filter(text__icontains=q)
        if kp_id: qs = qs.filter(knowledge_point_id=kp_id)
        if q_type: qs = qs.filter(q_type=q_type)

        if user.is_staff and not self.request.query_params.get('limit'):
            return qs

        # If kp_id is provided, return all questions for that KP (for Knowledge Map)
        if kp_id:
            return qs

        now = timezone.now()
        limit = self.request.query_params.get('limit', 10)
        try: limit = int(limit)
        except: limit = 10

        review_ids = UserQuestionStatus.objects.filter(user=user, next_review_at__lte=now).values_list('question_id', flat=True)
        attempted_ids = UserQuestionStatus.objects.filter(user=user).values_list('question_id', flat=True)
        
        # 1. 优先获取艾宾浩斯记忆曲线中已到期需要复习的题目
        due_ids = list(Question.objects.filter(id__in=review_ids).values_list('id', flat=True)[:limit])
        
        # 2. 如果复习的题不够本次抽题数量，用没做过的新题补足即可
        needed = limit - len(due_ids)
        new_ids = []
        if needed > 0:
            new_ids = list(Question.objects.exclude(id__in=attempted_ids).values_list('id', flat=True)[:needed])
            
        final_ids = due_ids + new_ids
        # 返回最终整合好的指定数量的 QuerySet
        return Question.objects.filter(id__in=final_ids)

    def perform_create(self, serializer):
        question = serializer.save()
        if not question.ai_answer:
            self.generate_ai_answer(question)

    def generate_ai_answer(self, question):
        api_key = os.getenv('DEEPSEEK_API_KEY')
        if not api_key: return
        
        template = get_quiz_template('ai_answer_prompt.txt') or "解析题目: {question_text}"
        prompt = template.format(
            q_type_display=question.get_subjective_type_display() if question.q_type == 'subjective' else '客观题',
            question_text=question.text,
            grading_points=question.grading_points or '无'
        )
        
        try:
            res = requests.post(
                "https://api.deepseek.com/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model": "deepseek-chat",
                    "messages": [{"role": "system", "content": "你是一位专业的学术助教。"}, {"role": "user", "content": prompt}],
                    "stream": False
                },
                timeout=60
            )
            if res.status_code == 200:
                question.ai_answer = res.json()['choices'][0]['message']['content']
                question.save()
        except: pass

class GradeSubjectiveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        question_id = request.data.get('question_id')
        user_answer = request.data.get('answer')
        
        if not user_answer:
            return Response({'error': '请提供答题内容'}, status=400)

        try:
            question = Question.objects.get(id=question_id)
        except Question.DoesNotExist:
            return Response({'error': '题目不存在'}, status=404)

        max_score = question.get_max_score()
        api_key = os.getenv('DEEPSEEK_API_KEY')
        if not api_key:
            return Response({'error': '后端 AI 密钥未配置'}, status=500)
        
        template = get_quiz_template('grading_prompt.txt') or "评分: {user_answer}"
        prompt = template.format(
            question_text=question.text,
            subjective_type=question.get_subjective_type_display(),
            max_score=max_score,
            grading_points=question.grading_points or "全面准确回答",
            correct_answer=question.correct_answer or "见 AI 解析",
            user_answer=user_answer
        )

        try:
            res = requests.post(
                "https://api.deepseek.com/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model": "deepseek-chat",
                    "messages": [
                        {"role": "system", "content": "你是一位专业的阅卷老师。只输出标准的 JSON 字符串。"}, 
                        {"role": "user", "content": prompt}
                    ],
                    "response_format": {"type": "json_object"},
                    "stream": False,
                    "temperature": 0.1
                },
                timeout=60
            )
            if res.status_code != 200:
                return Response({'error': f'AI 评分服务异常 ({res.status_code})'}, status=res.status_code)
            
            result = res.json()
            raw_content = result['choices'][0]['message']['content']
            grade_data = extract_json_from_text(raw_content)
            
            score_val = float(grade_data.get('score', grade_data.get('Score', 0)))
            feedback = grade_data.get('feedback', grade_data.get('Feedback', '回答已评收'))
            analysis = grade_data.get('analysis', grade_data.get('Analysis', '解析生成中'))

            user = request.user
            normalized_score = score_val / max_score if max_score > 0 else 0
            status_obj, _ = UserQuestionStatus.objects.get_or_create(user=user, question=question)
            
            if normalized_score < 0.6:
                status_obj.wrong_count += 1
                status_obj.last_correct = False
                status_obj.review_stage = 0
            else:
                status_obj.last_correct = True
                status_obj.review_stage += 1

            intervals = [0, 1, 2, 4, 7, 15, 30, 60]
            stage = min(status_obj.review_stage, len(intervals)-1)
            status_obj.next_review_at = timezone.now() + datetime.timedelta(days=intervals[stage])
            status_obj.save()
            
            expected_score = 1 / (1 + 10**( (question.difficulty - user.elo_score) / 400 ))
            elo_change = int(32 * (normalized_score - expected_score))
            user.elo_score += elo_change
            user.save(update_fields=['elo_score'])
            
            return Response({
                'score': score_val,
                'max_score': max_score,
                'feedback': feedback,
                'analysis': analysis,
                'ai_answer': question.ai_answer,
                'elo_change': elo_change
            })
        except Exception as e:
            return Response({'error': f'评分逻辑错误: {str(e)}'}, status=500)

class ToggleFavoriteView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        q_id = request.data.get('question_id')
        status_obj, _ = UserQuestionStatus.objects.get_or_create(user=request.user, question_id=q_id)
        status_obj.is_favorite = not status_obj.is_favorite
        status_obj.save()
        return Response({'is_favorite': status_obj.is_favorite})

class WrongQuestionListView(generics.ListAPIView):
    serializer_class = UserQuestionStatusSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        return UserQuestionStatus.objects.filter(user=self.request.user, wrong_count__gt=0).order_by('-wrong_count')

class FavoriteQuestionListView(generics.ListAPIView):
    serializer_class = UserQuestionStatusSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        return UserQuestionStatus.objects.filter(user=self.request.user, is_favorite=True)

class QuestionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAdminUser]

class QuizAttemptCreateView(generics.CreateAPIView):
    serializer_class = QuizAttemptSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user
        is_initial = not user.has_completed_initial_assessment
        avg_difficulty = 1000
        expected_score = 1 / (1 + 10**( (avg_difficulty - user.elo_score) / 400 ))
        score = serializer.validated_data.get('score', 0)
        elo_change = int(32 * (score - expected_score))
        if is_initial and score > 0.8: elo_change += 200
        attempt = serializer.save(user=user, is_initial_placement=is_initial, elo_change=elo_change)
        user.elo_score += elo_change
        if is_initial: user.has_completed_initial_assessment = True
        user.save()

class LeaderboardView(generics.ListAPIView):
    queryset = User.objects.filter(is_active=True).order_by('-elo_score')[:50]
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

class QuizStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        now = timezone.now()
        review_count = UserQuestionStatus.objects.filter(user=user, next_review_at__lte=now).count()
        attempted_ids = UserQuestionStatus.objects.filter(user=user).values_list('question_id', flat=True)
        new_questions_count = Question.objects.exclude(id__in=attempted_ids).count()
        return Response({'review_goal': review_count, 'new_questions': new_questions_count})

class IsAdminUserOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS: return True
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)

class KnowledgePointListView(generics.ListCreateAPIView):
    queryset = KnowledgePoint.objects.all().order_by('-created_at')
    serializer_class = KnowledgePointSerializer
    permission_classes = [IsAdminUserOrReadOnly]

class KnowledgePointDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = KnowledgePoint.objects.all()
    serializer_class = KnowledgePointSerializer
    permission_classes = [IsAdminUserOrReadOnly]

class GenerateBulkQuestionsView(APIView):
    permission_classes = [permissions.IsAdminUser]
    def post(self, request, pk):
        try: kp = KnowledgePoint.objects.get(pk=pk)
        except KnowledgePoint.DoesNotExist: return Response({'error': '知识点不存在'}, status=404)
        api_key = os.getenv('DEEPSEEK_API_KEY')
        template = get_quiz_template('bulk_generate_prompt.txt')
        prompt = template.format(kp_name=kp.name, kp_description=kp.description, count=5)
        try:
            res = requests.post("https://api.deepseek.com/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={"model": "deepseek-chat", "messages": [{"role": "user", "content": prompt}], "stream": False}, timeout=90)
            content = res.json()['choices'][0]['message']['content']
            questions_data = extract_json_from_text(content)
            for q_data in questions_data:
                Question.objects.create(knowledge_point=kp, **q_data)
            return Response({'status': 'success', 'count': len(questions_data)})
        except Exception as e: return Response({'error': str(e)}, status=500)

class GenerateFromTextView(APIView):
    permission_classes = [permissions.IsAdminUser]
    def post(self, request):
        text = request.data.get('text'); kp_id = request.data.get('kp_id')
        num_obj = request.data.get('num_objective', 3); num_short = request.data.get('num_short', 1); num_essay = request.data.get('num_essay', 1)
        api_key = os.getenv('DEEPSEEK_API_KEY')
        template = get_quiz_template('generate_from_text_prompt.txt')
        prompt = template.format(text=text, num_obj=num_obj, num_short=num_short, num_essay=num_essay)
        try:
            res = requests.post("https://api.deepseek.com/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={"model": "deepseek-chat", "messages": [{"role": "user", "content": prompt}], "stream": False}, timeout=120)
            content = res.json()['choices'][0]['message']['content']
            qs_data = extract_json_from_text(content)
            created_count = 0
            for q in qs_data:
                clean_q = {
                    'text': q.get('text', q.get('question', '')),
                    'q_type': q.get('q_type', 'objective'),
                    'subjective_type': q.get('subjective_type'),
                    'options': q.get('options'),
                    'correct_answer': q.get('correct_answer', q.get('answer', '')),
                    'grading_points': q.get('grading_points', ''),
                    'difficulty': q.get('difficulty', 1000),
                    'knowledge_point_id': kp_id if kp_id else None
                }
                if clean_q['text']:
                    Question.objects.create(**clean_q)
                    created_count += 1
            return Response({'status': 'success', 'count': created_count})
        except Exception as e: return Response({'error': str(e)}, status=500)

import docx # 导入 Word 解析库

import threading
from django.core.cache import cache

def process_ai_parse_task(raw_text, kp_id, api_key, task_id):
    """后台分片处理长文本，带进度反馈和重试逻辑"""
    chunk_size = 2000 # 减小分片，彻底解决 AI 输出截断问题
    overlap = 150
    chunks = []
    for i in range(0, len(raw_text), chunk_size - overlap):
        chunks.append(raw_text[i:i + chunk_size])
    
    total_chunks = len(chunks[:25]) # 封顶支持 5万字左右
    all_questions = []
    template = get_quiz_template('preview_parse_prompt.txt')
    
    for i, chunk in enumerate(chunks[:25]):
        # 更新进度
        cache.set(f"parse_task_{task_id}", {"status": "processing", "progress": f"{i+1}/{total_chunks}", "data": all_questions}, 3600)
        
        prompt = template.format(raw_text=chunk)
        max_retries = 2
        for attempt in range(max_retries):
            try:
                res = requests.post("https://api.deepseek.com/chat/completions",
                    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                    json={
                        "model": "deepseek-chat", 
                        "messages": [{"role": "user", "content": prompt}], 
                        "stream": False, 
                        "temperature": 0.1,
                        "max_tokens": 3000 # 限制单次输出，防止过长
                    }, 
                    timeout=90)
                
                if res.status_code == 200:
                    content = res.json()['choices'][0]['message']['content']
                    try:
                        qs_data = extract_json_from_text(content)
                        if isinstance(qs_data, list):
                            for q in qs_data:
                                if not any(existing.get('text') == q.get('text') for existing in all_questions):
                                    all_questions.append(q)
                        break # 成功则跳出重试
                    except:
                        if attempt == max_retries - 1: print(f"Chunk {i} JSON extraction failed")
                else:
                    print(f"Chunk {i} API error: {res.status_code}")
            except Exception as e:
                print(f"Chunk {i} exception: {str(e)}")
                import time
                time.sleep(2)
    
    # 最终完成
    cache.set(f"parse_task_{task_id}", {"status": "completed", "progress": "100%", "data": all_questions}, 3600)

class AIPreviewParseView(APIView):
    """
    整理功能：改用高性能异步模式
    """
    permission_classes = [permissions.IsAdminUser]
    def post(self, request):
        raw_text = request.data.get('raw_text', '')
        file_obj = request.FILES.get('file')
        api_key = os.getenv('DEEPSEEK_API_KEY')
        
        if file_obj:
            if file_obj.name.endswith('.docx'):
                doc = docx.Document(file_obj)
                raw_text = "\n".join([p.text for p in doc.paragraphs])
            else:
                raw_text = file_obj.read().decode('utf-8', errors='ignore')

        if not raw_text.strip(): return Response({'error': '内容为空'}, status=400)

        task_id = datetime.datetime.now().strftime('%Y%m%d%H%M%S%f')
        cache.set(f"parse_task_{task_id}", {"status": "processing", "progress": "0%", "data": []}, 3600)
        
        thread = threading.Thread(target=process_ai_parse_task, args=(raw_text, None, api_key, task_id))
        thread.start()

        return Response({'task_id': task_id, 'status': 'processing'})

    def get(self, request):
        """前端轮询此接口获取结果"""
        task_id = request.query_params.get('task_id')
        result = cache.get(f"parse_task_{task_id}")
        if not result: return Response({'error': '任务不存在'}, status=404)
        return Response(result)

class BulkImportQuestionsView(APIView):
    permission_classes = [permissions.IsAdminUser]
    def post(self, request):
        questions_data = request.data.get('questions', [])
        kp_id = request.data.get('kp_id')
        created_count = 0
        for q in questions_data:
            clean_q = {
                'text': q.get('text', ''),
                'q_type': q.get('q_type', 'objective'),
                'subjective_type': q.get('subjective_type'),
                'options': q.get('options'),
                'correct_answer': q.get('correct_answer', ''),
                'grading_points': q.get('grading_points', ''),
                'ai_answer': q.get('analysis', ''),
                'knowledge_point_id': kp_id if kp_id else None
            }
            if clean_q['text']:
                Question.objects.create(**clean_q)
                created_count += 1
        return Response({'status': 'success', 'count': created_count})


class AdminQuestionListView(APIView):
    """
    管理员专用分页题目列表接口，支持搜索、知识点筛选和题型筛选。
    用于前端题库管理面板，性能优化版本，面向5000题以上的大规模题库。
    """
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        qs = Question.objects.select_related('knowledge_point').order_by('-created_at')

        # 过滤条件
        search = request.query_params.get('search', '').strip()
        kp_id = request.query_params.get('kp_id')
        q_type = request.query_params.get('q_type')

        if search:
            qs = qs.filter(text__icontains=search)
        if kp_id and kp_id != '0':
            qs = qs.filter(knowledge_point_id=kp_id)
        if q_type and q_type != 'all':
            qs = qs.filter(q_type=q_type)

        # 分页
        total = qs.count()
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 50))
        offset = (page - 1) * page_size
        questions = qs[offset:offset + page_size]

        data = []
        for q in questions:
            data.append({
                'id': q.id,
                'text': q.text,
                'q_type': q.q_type,
                'subjective_type': q.subjective_type,
                'correct_answer': q.correct_answer or '',
                'grading_points': q.grading_points or '',
                'ai_answer': q.ai_answer or '',
                'difficulty': q.difficulty,
                'options': q.options,
                'knowledge_point': q.knowledge_point.id if q.knowledge_point else None,
                'knowledge_point_name': q.knowledge_point.name if q.knowledge_point else '无',
            })

        return Response({
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size,
            'results': data
        })


class ExportStructuredQuestionsView(APIView):
    """
    导出结构化题目数据（AI 可读格式）。
    每道题都包含完整字段，可直接作为 AI 生成新题的参考模板。
    """
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        kp_id = request.query_params.get('kp_id')
        qs = Question.objects.select_related('knowledge_point').all()
        if kp_id and kp_id != '0':
            qs = qs.filter(knowledge_point_id=kp_id)

        structured = []
        for q in qs:
            structured.append({
                "id": q.id,
                "knowledge_point": q.knowledge_point.name if q.knowledge_point else None,
                "question_type": q.q_type,
                "subjective_type": q.subjective_type,
                "difficulty_elo": q.difficulty,
                "question_text": q.text,
                "options": q.options,
                "correct_answer": q.correct_answer,
                "grading_points": q.grading_points,
                "ai_explanation": q.ai_answer,
                # AI 生成新题时的模板提示
                "_schema_hint": {
                    "question_type": "objective | subjective",
                    "subjective_type": "noun | short | essay | calculate",
                    "difficulty_elo": "800-1800 integer (harder = higher)",
                    "options": "list of 4 strings for objective, null for subjective",
                    "correct_answer": "option text for objective, reference answer for subjective",
                    "grading_points": "scoring rubric, required for subjective questions"
                }
            })

        return Response({
            "total": len(structured),
            "format_version": "1.0",
            "description": "Korson Academy Question Bank - Structured Export for AI Generation",
            "questions": structured
        })
