import os
import requests
import json
import re
from django.conf import settings

class AIService:
    """
    UniMind AI 核心服务类
    统一管理 SiliconFlow API 调用、提示词加载与个性化配置
    """
    
    @staticmethod
    def get_template(scene, filename):
        path = os.path.join(settings.BASE_DIR, scene, 'templates', filename)
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                return f.read()
        return ""

    @staticmethod
    def extract_json(raw_content):
        """
        全能提取器：优先尝试标签提取，兼容旧版 JSON。
        这种方式能 100% 保留 LaTeX 源码，不被转义符干扰。
        """
        content = raw_content.strip()
        
        # 1. 尝试标签提取 (新版推荐格式)
        analysis_m = re.search(r'\[ANALYSIS\](.*?)(\[|$)', content, re.I | re.S)
        score_m = re.search(r'\[SCORE\]\s*([\d\.]+)', content, re.I)
        feedback_m = re.search(r'\[FEEDBACK\](.*?)(\[|$)', content, re.I | re.S)
        rating_m = re.search(r'\[RATING\]\s*(\d)', content, re.I)

        if analysis_m or score_m:
            return {
                "score": float(score_m.group(1)) if score_m else 0,
                "feedback": feedback_m.group(1).strip() if feedback_m else "已评阅",
                "analysis": analysis_m.group(1).strip() if analysis_m else "解析生成中...",
                "fsrs_rating": int(rating_m.group(1)) if rating_m else 2
            }

        # 2. 兼容性：如果 AI 还是输出了 JSON
        content = re.sub(r'^```json\s*', '', content)
        content = re.sub(r'^```\s*', '', content).rstrip('`')
        
        try:
            data = json.loads(content)
            return {k.lower(): v for k, v in data.items()}
        except:
            # 最后的正则兜底提取 (针对损坏的 JSON)
            score_match = re.search(r'"score":\s*([\d\.]+)', content, re.I)
            feedback_match = re.search(r'"feedback":\s*"(.*?)"', content, re.I | re.S)
            analysis_match = re.search(r'"analysis":\s*"(.*)', content, re.I | re.S)
            
            score_val = float(score_match.group(1)) if score_match else 0
            analysis_text = analysis_match.group(1) if analysis_match else "解析生成中..."
            analysis_text = re.sub(r'"\s*}\s*$', '', analysis_text).replace('\\n', '\n').replace('\\"', '"')
            
            return {
                "score": score_val,
                "feedback": feedback_match.group(1) if feedback_match else "评分完成",
                "analysis": analysis_text,
                "fsrs_rating": 2
            }

    @staticmethod
    def call_ai(messages, model="deepseek-ai/DeepSeek-V3.2", max_tokens=8192, temperature=0.1, response_format=None):
        api_key = os.getenv('DEEPSEEK_API_KEY')
        if not api_key: return None

        url = "https://api.siliconflow.cn/v1/chat/completions"
        payload = {
            "model": model,
            "messages": messages,
            "stream": False,
            "max_tokens": max_tokens, 
            "temperature": temperature
        }
        # 当使用标签模式时，不再强制 response_format
        if response_format: payload["response_format"] = response_format

        try:
            res = requests.post(url, headers={"Authorization": f"Bearer {api_key.strip()}", "Content-Type": "application/json"}, json=payload, timeout=120)
            return res.json() if res.status_code == 200 else None
        except: return None

    @classmethod
    def grade_question(cls, question_text, user_answer, correct_answer, q_type, max_score, grading_points="", subjective_type=""):
        prompt = cls.get_template('quizzes', 'grading_prompt.txt')
        prompt = prompt.format(
            question_text=question_text,
            subjective_type=subjective_type or "客观选择题",
            max_score=max_score,
            grading_points=grading_points or "准确选择正确选项",
            correct_answer=correct_answer,
            user_answer=user_answer
        )
        
        system_msg = (
            "你是一位专业的学术导师。请直接输出以下标记格式（不要输出 JSON）：\n"
            "[SCORE] 这里填写实得分数\n"
            "[FEEDBACK] 这里填写具体的得分或扣分原因点评（严禁使用开场白）\n"
            "[RATING] 这里填写 1-4 的记忆等级\n"
            "[ANALYSIS] 这里填写深度的学术解析，以“以下对题目进行分析：”开头，详细展示推导过程。控制在 2000 字内。"
        )
        
        messages = [{"role": "system", "content": system_msg}, {"role": "user", "content": prompt}]
        # 使用标签模式，不再受 JSON 对象模式的限制
        res = cls.call_ai(messages, max_tokens=8192)
        if not res: return None
        
        return cls.extract_json(res['choices'][0]['message']['content'])

    @classmethod
    def chat_with_assistant(cls, bot, history_msgs, user_message, student_context=""):
        base_system_prompt = bot.system_prompt if (bot and bot.system_prompt) else cls.get_template('ai_assistant', 'base_assistant_prompt.txt')
        if bot and bot.is_exclusive:
            mentor_template = cls.get_template('ai_assistant', 'exclusive_mentor_prompt.txt')
            context_prompt = mentor_template.format(student_context=student_context)
            full_system_prompt = f"{base_system_prompt}\n\n{context_prompt}"
        else:
            full_system_prompt = base_system_prompt

        messages = [{"role": "system", "content": full_system_prompt}] + history_msgs + [{"role": "user", "content": user_message}]
        res = cls.call_ai(messages, max_tokens=3000, temperature=0.7)
        return res

    @classmethod
    def simple_chat(cls, system_prompt, user_message, max_tokens=2000):
        """用于题目生成、文本解析等通用场景"""
        messages = [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_message}]
        return cls.call_ai(messages, max_tokens=max_tokens)
