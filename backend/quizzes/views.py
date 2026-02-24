import os
import requests
import json
import datetime
import re
import csv
import io
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Question, QuizAttempt, UserQuestionStatus, KnowledgePoint, QuizExam, ExamQuestionResult
from .serializers import (
    QuestionSerializer, QuizAttemptSerializer, UserQuestionStatusSerializer, 
    KnowledgePointSerializer, QuizExamSerializer
)
from users.models import User
from users.serializers import UserSerializer
from .fsrs import FSRS
from users.views import IsMember
import random
from ai_service import AIService
from notifications.models import Notification

class QuestionListView(generics.ListCreateAPIView):
    serializer_class = QuestionSerializer
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAdminUser()]
        return [IsMember()]

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

        if kp_id:
            return qs

        now = timezone.now()
        # 硬性冷却：30分钟内复习过的题不再抽选，给大脑留出间隔时间
        cooldown_time = now - datetime.timedelta(minutes=30)
        limit = self.request.query_params.get('limit', 10)
        try: limit = int(limit)
        except: limit = 10

        # 获取所有符合条件的候选 ID，排除已掌握的题目
        mastered_ids = UserQuestionStatus.objects.filter(user=user, is_mastered=True).values_list('question_id', flat=True)
        
        review_ids = list(UserQuestionStatus.objects.filter(
            user=user, 
            next_review_at__lte=now,
            is_mastered=False
        ).exclude(
            last_review__gt=cooldown_time # 过滤掉最近 30 分钟内刚做过的题
        ).values_list('question_id', flat=True))
        
        attempted_ids = UserQuestionStatus.objects.filter(user=user).values_list('question_id', flat=True)
        
        # 1. 已到期需要复习的题目
        due_ids = review_ids[:limit]
        
        # 2. 如果复习的题不够本次抽题数量，用没做过的新题补足
        needed = limit - len(due_ids)
        new_ids = []
        if needed > 0:
            new_ids = list(Question.objects.exclude(
                id__in=attempted_ids
            ).exclude(
                id__in=mastered_ids
            ).values_list('id', flat=True)[:needed])
            
        final_ids = due_ids + new_ids
        
        random.shuffle(final_ids)
        return Question.objects.filter(id__in=final_ids)

    def perform_create(self, serializer):
        question = serializer.save()
        if not question.ai_answer:
            self.generate_ai_answer(question)

    def generate_ai_answer(self, question):
        template = AIService.get_template('quizzes', 'ai_answer_prompt.txt') or "解析题目: {question_text}"
        prompt = template.format(
            q_type_display=question.get_subjective_type_display() if question.q_type == 'subjective' else '客观题',
            question_text=question.text,
            grading_points=question.grading_points or '无'
        )
        
        res = AIService.simple_chat("你是一位专业的学术助教。", prompt)
        if res:
            question.ai_answer = res['choices'][0]['message']['content']
            question.save()

class GradeSubjectiveView(APIView):
    permission_classes = [IsMember]

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
        
        try:
            grade_data = AIService.grade_question(
                question_text=question.text,
                user_answer=user_answer,
                correct_answer=question.correct_answer,
                q_type=question.q_type,
                max_score=max_score,
                grading_points=question.grading_points,
                subjective_type=question.get_subjective_type_display() if question.q_type == 'subjective' else "客观题"
            )
            
            if not grade_data:
                return Response({'error': 'AI 评分服务异常'}, status=500)
            
            score_val = float(grade_data.get('score', 0))
            feedback = grade_data.get('feedback', '回答已评阅')
            analysis = grade_data.get('analysis', '解析生成中')
            fsrs_rating = int(grade_data.get('fsrs_rating', 2))

            user = request.user
            normalized_score = score_val / max_score if max_score > 0 else 0
            
            status_obj, _ = UserQuestionStatus.objects.get_or_create(user=user, question=question)
            status_obj = FSRS.update_status(status_obj, fsrs_rating)
            
            if normalized_score < 0.6:
                status_obj.wrong_count += 1
                status_obj.last_correct = False
            else:
                status_obj.last_correct = True
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
    permission_classes = [IsMember]
    def post(self, request):
        q_id = request.data.get('question_id')
        status_obj, _ = UserQuestionStatus.objects.get_or_create(user=request.user, question_id=q_id)
        status_obj.is_favorite = not status_obj.is_favorite
        status_obj.save()
        return Response({'is_favorite': status_obj.is_favorite})

class ToggleMasteredView(APIView):
    permission_classes = [IsMember]
    def post(self, request):
        q_id = request.data.get('question_id')
        status_obj, _ = UserQuestionStatus.objects.get_or_create(user=request.user, question_id=q_id)
        status_obj.is_mastered = not status_obj.is_mastered
        status_obj.save()
        return Response({'is_mastered': status_obj.is_mastered})

class WrongQuestionListView(generics.ListAPIView):
    serializer_class = UserQuestionStatusSerializer
    permission_classes = [IsMember]
    def get_queryset(self):
        return UserQuestionStatus.objects.filter(user=self.request.user, wrong_count__gt=0).order_by('-wrong_count')

class FavoriteQuestionListView(generics.ListAPIView):
    serializer_class = UserQuestionStatusSerializer
    permission_classes = [IsMember]
    def get_queryset(self):
        return UserQuestionStatus.objects.filter(user=self.request.user, is_favorite=True)

class QuestionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAdminUser]

class QuizAttemptCreateView(generics.CreateAPIView):
    serializer_class = QuizAttemptSerializer
    permission_classes = [IsMember]

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
    permission_classes = [IsMember]

class QuizStatsView(APIView):
    permission_classes = [IsMember]

    def get(self, request):
        user = request.user
        now = timezone.now()
        
        status_qs = UserQuestionStatus.objects.filter(user=user)
        
        # 今日复习任务 (Due Today)
        review_count = status_qs.filter(next_review_at__lte=now).count()
        
        # FSRS 预警: 稳定性 < 7天 且 下次复习在 3天内 的题目
        # 这代表短期记忆中容易遗忘的部分
        at_risk_count = status_qs.filter(
            stability__lt=7,
            next_review_at__lte=now + datetime.timedelta(days=3),
            next_review_at__gt=now
        ).count()

        attempted_ids = status_qs.values_list('question_id', flat=True)
        new_questions_count = Question.objects.exclude(id__in=attempted_ids).count()
        
        # 自动生成复习提醒
        if review_count > 0:
            today_notif = Notification.objects.filter(recipient=user, ntype='fsrs_reminder', created_at__date=now.date()).exists()
            if not today_notif:
                Notification.objects.create(recipient=user, ntype='fsrs_reminder', title='今日复习任务已就绪', content=f'你有 {review_count} 道题目已进入 FSRS 遗忘临界点。', link='/tests')

        return Response({
            'review_goal': review_count,
            'new_questions': new_questions_count,
            'at_risk_count': at_risk_count
        })

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

def process_exam_grading(user, exam, questions_data, api_key):
    """后台异步批改整张试卷"""
    total_score = 0
    max_total_score = 0
    total_difficulty = 0
    question_count = 0
    
    for item in questions_data:
        q_id = item.get('question_id')
        user_answer = item.get('answer')
        
        try:
            question = Question.objects.get(id=q_id)
        except Question.DoesNotExist:
            continue
            
        max_score = question.get_max_score()
        max_total_score += max_score
        total_difficulty += (question.difficulty or 1000)
        question_count += 1
        
        # 统一调用 AI 服务进行判分与解析（选择题也包含解析）
        try:
            grade_data = AIService.grade_question(
                question_text=question.text,
                user_answer=user_answer,
                correct_answer=question.correct_answer,
                q_type=question.q_type,
                max_score=max_score,
                grading_points=question.grading_points,
                subjective_type=question.get_subjective_type_display() if question.q_type == 'subjective' else "客观选择题"
            )
            
            if grade_data:
                score_val = float(grade_data.get('score', 0))
                # 客观题强制覆盖分数为数据库校验结果
                if question.q_type == 'objective':
                    is_correct = str(user_answer).strip() == str(question.correct_answer).strip()
                    score_val = 10 if is_correct else 0
                
                fsrs_rating = int(grade_data.get('fsrs_rating', 2))
                normalized_score = score_val / max_score if max_score > 0 else 0
                total_score += score_val
                
                # FSRS 状态更新
                status_obj, _ = UserQuestionStatus.objects.get_or_create(user=user, question=question)
                status_obj = FSRS.update_status(status_obj, fsrs_rating)
                status_obj.last_review = timezone.now() # 记录复习时间，触发冷却
                if normalized_score < 0.6:
                    status_obj.wrong_count += 1
                    status_obj.last_correct = False
                else:
                    status_obj.last_correct = True
                status_obj.save()
                
                # 保存详细记录
                ExamQuestionResult.objects.create(
                    exam=exam,
                    question=question,
                    user_answer=user_answer,
                    score=score_val,
                    max_score=max_score,
                    feedback=grade_data.get('feedback', '已评阅'),
                    analysis=grade_data.get('analysis', '解析生成中...'),
                    is_correct=normalized_score >= 0.6
                )
        except Exception as e:
            print(f"Error grading Q{q_id}: {e}")
            ExamQuestionResult.objects.create(
                exam=exam,
                question=question,
                user_answer=user_answer,
                score=0,
                max_score=max_score,
                feedback="评分服务异常",
                analysis=f"错误详情: {str(e)}",
                is_correct=False
            )
    
    # 结算 ELO 和 发送通知
    avg_score = total_score / max_total_score if max_total_score > 0 else 0
    avg_difficulty = total_difficulty / question_count if question_count > 0 else 1000
    
    # ELO 结算：根据本次考试的平均难度计算预期得分
    expected_score = 1 / (1 + 10**( (avg_difficulty - user.elo_score) / 400 ))
    elo_change = int(32 * (avg_score - expected_score))
    user.elo_score += elo_change
    user.save()
    
    exam.total_score = total_score
    exam.max_score = max_total_score
    exam.elo_change = elo_change
    exam.save()
    
    Notification.objects.create(
        recipient=user,
        ntype='system',
        title='📝 评估完成',
        content=f'得分：{total_score}/{max_total_score}。本次测验平均难度：{int(avg_difficulty)}。',
        link=f'/tests?action=view_report&exam_id={exam.id}'
    )

class SubmitExamView(APIView):
    permission_classes = [IsMember]

    def post(self, request):
        questions_data = request.data.get('answers', [])
        if not questions_data:
            return Response({'error': '无答题数据'}, status=400)
            
        api_key = os.getenv('DEEPSEEK_API_KEY')
        if not api_key:
            return Response({'error': 'AI 配置缺失'}, status=500)
            
        exam = QuizExam.objects.create(user=request.user)

        # 【优化】即时同步状态：确保题目立即打上“已复习”标记，防止异步判卷期间被再次抽到
        now = timezone.now()
        for item in questions_data:
            q_id = item.get('question_id')
            try:
                # 使用 get_or_create 确保新题也被即时排除
                status_obj, created = UserQuestionStatus.objects.get_or_create(
                    user=request.user, 
                    question_id=q_id
                )
                status_obj.last_review = now
                status_obj.save(update_fields=['last_review'])
            except Exception as e:
                print(f"Sync review status error for Q{q_id}: {e}")

        # 启动后台线程
        thread = threading.Thread(
            target=process_exam_grading,
            args=(request.user, exam, questions_data, api_key)
        )
        thread.start()
        
        return Response({'status': 'processing', 'message': '试卷已提交后台批改，结果将通过通知发送。'})

class LatestExamReportView(APIView):
    """
    获取最近一次考试报告。
    """
    permission_classes = [IsMember]

    def get(self, request):
        latest_exam = QuizExam.objects.filter(user=request.user).first()
        if not latest_exam:
            return Response({'error': '报告不存在'}, status=404)
            
        serializer = QuizExamSerializer(latest_exam)
        return Response(serializer.data)

class ExamDetailView(generics.RetrieveAPIView):
    """
    获取某次考试的详细报告
    """
    queryset = QuizExam.objects.all()
    serializer_class = QuizExamSerializer
    permission_classes = [IsMember]

    def get_queryset(self):
        return QuizExam.objects.filter(user=self.request.user)

class GenerateBulkQuestionsView(APIView):
    permission_classes = [permissions.IsAdminUser]
    def post(self, request, pk):
        try: kp = KnowledgePoint.objects.get(pk=pk)
        except KnowledgePoint.DoesNotExist: return Response({'error': '知识点不存在'}, status=404)
        template = AIService.get_template('quizzes', 'bulk_generate_prompt.txt')
        prompt = template.format(kp_name=kp.name, kp_description=kp.description, count=5)
        res = AIService.simple_chat("你是一位专业的出题官。", prompt)
        if not res: return Response({'error': 'AI 生成失败'}, status=500)
        content = res['choices'][0]['message']['content']
        questions_data = AIService.extract_json(content)
        for q_data in questions_data:
            Question.objects.create(knowledge_point=kp, **q_data)
        return Response({'status': 'success', 'count': len(questions_data)})

class GenerateFromTextView(APIView):
    permission_classes = [permissions.IsAdminUser]
    def post(self, request):
        text = request.data.get('text'); kp_id = request.data.get('kp_id')
        num_obj = request.data.get('num_objective', 3); num_short = request.data.get('num_short', 1); num_essay = request.data.get('num_essay', 1)
        template = AIService.get_template('quizzes', 'generate_from_text_prompt.txt')
        prompt = template.format(text=text, num_obj=num_obj, num_short=num_short, num_essay=num_essay)
        res = AIService.simple_chat("你是一位专业的出题官。", prompt)
        if not res: return Response({'error': 'AI 生成失败'}, status=500)
        content = res['choices'][0]['message']['content']
        qs_data = AIService.extract_json(content)
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
    template = AIService.get_template('quizzes', 'preview_parse_prompt.txt')
    
    for i, chunk in enumerate(chunks[:25]):
        # 更新进度
        cache.set(f"parse_task_{task_id}", {"status": "processing", "progress": f"{i+1}/{total_chunks}", "data": all_questions}, 3600)
        
        prompt = template.format(raw_text=chunk)
        res = AIService.simple_chat("你是一位专业的文本解析专家。", prompt, max_tokens=3000)
        if res:
            content = res['choices'][0]['message']['content']
            qs_data = AIService.extract_json(content)
            if isinstance(qs_data, list):
                for q in qs_data:
                    if not any(existing.get('text') == q.get('text') for existing in all_questions):
                        all_questions.append(q)
    
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
                'difficulty_level': q.get('difficulty_level', 'normal'),
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
                'difficulty_level': q.difficulty_level,
                'difficulty_level_display': q.get_difficulty_level_display(),
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
    直接同步至服务器本地 seed_questions.json。
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
                "difficulty_level": q.difficulty_level,
                "question_text": q.text,
                "options": q.options,
                "correct_answer": q.correct_answer,
                "grading_points": q.grading_points,
                "ai_explanation": q.ai_answer,
            })

        data = {
            "total": len(structured),
            "format_version": "1.1",
            "description": "UniMind.ai Question Bank - Structured Export",
            "format_reference": {
                "question_type": "objective | subjective",
                "subjective_type": "noun | short | essay | calculate",
                "difficulty_elo": "800-1800 integer (harder = higher)",
                "options": "list of 4 strings for objective, null for subjective",
                "correct_answer": "option text for objective, reference answer for subjective",
                "grading_points": "scoring rubric, required for subjective questions"
            },
            "questions": structured
        }

        # 持久化到服务器文件 (backend/seed_questions.json)
        file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "seed_questions.json")
        try:
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            return Response({
                "status": "success",
                "total": len(structured),
                "message": "已成功同步至服务器 seed_questions.json"
            })
        except Exception as e:
            return Response({"error": f"写入文件失败: {str(e)}"}, status=500)

class ImportCSVQuestionsView(APIView):
    permission_classes = [permissions.IsAdminUser]
    
    def post(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': '未上传文件'}, status=400)
            
        try:
            decoded_file = file_obj.read().decode('utf-8-sig')
            io_string = io.StringIO(decoded_file)
            reader = csv.DictReader(io_string)
            
            count = 0
            errors = []
            
            for row in reader:
                try:
                    # Expected CSV headers: text, answer, type(optional), difficulty(optional)
                    # Mapping flexible headers
                    text = row.get('text') or row.get('question') or row.get('题目')
                    answer = row.get('answer') or row.get('correct_answer') or row.get('答案')
                    q_type = row.get('type') or row.get('q_type') or row.get('题型') or 'objective'
                    difficulty = row.get('difficulty') or row.get('难度') or '1000'
                    
                    if not text: continue
                    
                    # Clean type
                    if '客观' in q_type or 'choice' in q_type: q_type = 'objective'
                    elif '主观' in q_type: q_type = 'subjective'
                    
                    Question.objects.create(
                        text=text,
                        correct_answer=answer,
                        q_type=q_type,
                        difficulty=int(difficulty) if str(difficulty).isdigit() else 1000
                    )
                    count += 1
                except Exception as e:
                    errors.append(f"Row error: {str(e)}")
            
            return Response({'status': 'success', 'count': count, 'errors': errors[:5]})
            
        except Exception as e:
            return Response({'error': f'CSV解析失败: {str(e)}'}, status=400)