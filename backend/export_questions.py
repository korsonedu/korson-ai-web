"""
export_questions.py
=============================
用途：将本地数据库中的题目和知识点导出为干净的 JSON 种子文件（精简结构）。
用法：./venv/bin/python export_questions.py
产出：seed_questions.json

注意：请先运行 smart_clean.py 清理重复题目后，再运行此脚本。
"""

import os
import django
import sys
import json

sys.path.append("/Users/eular/Desktop/官网0215/backend")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "school_system.settings")
django.setup()

from quizzes.models import Question

def export_data():
    questions = Question.objects.select_related('knowledge_point', 'knowledge_point__parent').all().order_by('id')
    q_list = []
    
    for q in questions:
        # 跳过题干为空的无效题
        if not q.text or not q.text.strip():
            print(f"  ⚠️  跳过空题干 ID={q.id}")
            continue

        # 新版导出：知识点层级直接附加到了题目属性中
        q_list.append({
            "id": q.id,
            "text": q.text,
            "q_type": q.q_type,
            "subjective_type": q.subjective_type or None,
            "options": q.options or None,
            "correct_answer": q.correct_answer or "",
            "grading_points": q.grading_points or "",
            "ai_answer": q.ai_answer or "",
            "difficulty": q.difficulty or 1200,
            "knowledge_point_name": q.knowledge_point.name if q.knowledge_point else None,
            "parent_knowledge_point": q.knowledge_point.parent.name if q.knowledge_point and q.knowledge_point.parent else None,
        })
        
    print(f"✅ 导出题目: {len(q_list)} 道")

    output_path = os.path.join(os.path.dirname(__file__), "seed_questions.json")

    # 去除了沉长的 knowledge_points 核心数组
    seed_data = {
        "questions": q_list
    }

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(seed_data, f, ensure_ascii=False, indent=2)

    print(f"\n🎉 导出完成！文件路径: {output_path}")
    print(f"   题目数量: {len(q_list)} 道 (知识点已折叠至题目内部)")
    print(f"\n➡️  下一步：AI可以基于此精简结构出题，增量补入并 Push 到服务器运行 seed_questions.py")

if __name__ == '__main__':
    export_data()
