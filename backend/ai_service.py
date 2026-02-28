import os
import json
import re
import requests
from django.conf import settings
from quizzes.models import Question, KnowledgePoint

class AIService:
    DIRECTION_RULES = {
        'BASE': {'prefixes': ['MB', 'IF', 'MA'], 'title': "基础理论组", 'rule': "强调传导机制。主观题要求逻辑严密，名词解释需包含背景、内涵、评价。"},
        'CALC': {'prefixes': ['CF', 'IV', 'DR'], 'title': "计算与实务组", 'rule': "必须包含具体财务数据情境。计算题要求分步骤给出标准计算流程。"},
        'REAL': {'prefixes': ['CE'], 'title': "论述与现实组", 'rule': "结合最新政策（如化债、LPR、PSL）。要求答案展现政策的宏观背景与微观传导。"},
        'ADV': {'prefixes': ['AF', 'AD'], 'title': "压轴拔高组", 'rule': "涉及金融科技、行为金融。答案需展现前沿学术视野，逻辑链条极长。"}
    }

    @classmethod
    def build_smart_generate_prompt(cls, kps_data, target_types=None):
        types_desc = "、".join(target_types) if target_types else "单项选择题、计算题、名词解释、简答题、论述题"
        
        specific_direction_hints = []
        for kp in kps_data:
            code = kp.get('code', '')
            prefix = code.split('-')[0].upper() if '-' in code else ''
            for key, config in cls.DIRECTION_RULES.items():
                if prefix in config['prefixes']:
                    specific_direction_hints.append(f"针对 [{code}]：{config['rule']}")

        directions_text = "\n".join(specific_direction_hints)

        prompt = f"""你是一位顶尖的中国金融硕士（431）考研命题专家。请针对以下知识点命制高质量题目。

【核心任务】
题型范围：{types_desc}。

【前缀驱动规则】
{directions_text}

【答案质量硬性要求（非常重要）】
1. 客观题：'answer' 仅填 A/B/C/D。'explanation' 需详细说明正确项逻辑及干扰项陷阱。
2. 主观题（名词解释、简答、计算、论述）：
   - 'answer' 必须是【满分范文级】解答！禁止只有一两句话。
   - 名词解释：要求涵盖 定义 + 核心要素 + 理论意义。不少于 150 字。
   - 简答题：要求逻辑分点（1. 2. 3.）。不少于 300 字。
   - 论述题：要求展现【背景 + 理论分析 + 现实联系 + 结论建议】的完整论文结构。不少于 600 字。
   - 计算题：'answer' 必须包含完整的【已知条件 + 适用公式 + 逐步计算过程 + 最终结论】。
3. 'explanation' 字段在出题阶段用于记录【评分要点与判分权重】，作为后续 AI 批改的依据。

【输入数据】
{json.dumps(kps_data, ensure_ascii=False)}

【输出格式】
返回严格的 JSON 数组。禁止 Markdown 标记。
JSON Schema:
[
  {{
    "q_type": "objective | subjective",
    "subjective_type": "noun | short | essay | calculate",
    "question": "题干内容（严谨学术）",
    "options": {{ "A": "...", "B": "...", "C": "...", "D": "..." }},
    "answer": "极高质量的满分标准答案",
    "explanation": "本题的评分要点、踩分点及命题逻辑",
    "related_knowledge_id": "知识点 code",
    "difficulty_level": "easy | normal | hard | extreme"
  }}
]"""
        return prompt

    @classmethod
    def preview_generate_questions(cls, kp_ids, count_per_kp=1, target_types=None):
        kps = KnowledgePoint.objects.filter(id__in=kp_ids)
        if not kps: return []
        kps_data = [{"code": kp.code, "name": kp.name, "description": kp.description} for kp in kps]
        user_prompt = cls.build_smart_generate_prompt(kps_data, target_types)
        if count_per_kp > 1: user_prompt += f"\n每个知识点生成 {count_per_kp} 道题。"
        res = cls.call_ai([{"role": "system", "content": "你直接输出 JSON 数组。"}, {"role": "user", "content": user_prompt}])
        if not res: return []
        try:
            content = res['choices'][0]['message']['content']
            json_str = re.sub(r'^```json\s*', '', content.strip(), flags=re.I)
            json_str = re.sub(r'\s*```$', '', json_str).strip()
            data = json.loads(json_str)
            for q in data:
                kp = KnowledgePoint.objects.filter(code=q.get('related_knowledge_id')).first()
                q['kp_name'] = kp.name if kp else "未知"; q['kp_id'] = kp.id if kp else None
            return data
        except: return []

    @classmethod
    def call_ai(cls, messages, temperature=0.7):
        config = cls.get_llm_config()
        if not config['api_key']: return None
        try:
            r = requests.post(config['base_url'], headers={"Authorization": f"Bearer {config['api_key'].strip()}", "Content-Type": "application/json"}, json={"model": config['model'], "messages": messages, "temperature": temperature, "max_tokens": 8192}, timeout=120)
            return r.json()
        except: return None

    @classmethod
    def get_llm_config(cls):
        return {
            "api_key": getattr(settings, 'LLM_API_KEY', os.getenv('DEEPSEEK_API_KEY', '')),
            "base_url": getattr(settings, 'LLM_BASE_URL', os.getenv('LLM_BASE_URL', 'https://api.siliconflow.cn/v1/chat/completions')),
            "model": getattr(settings, 'LLM_MODEL', os.getenv('LLM_MODEL', 'deepseek-ai/DeepSeek-V3'))
        }
