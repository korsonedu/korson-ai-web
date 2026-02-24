"""
seed_questions.py
=============================
用途：将 seed_questions.json 中的题目和知识点导入（或更新）到数据库。
      修改为极简模式：支持 AI 直接生成题目而不需单独维护 knowledge_points 数组。
用法：python seed_questions.py   （在服务器上直接用 python，不需要 venv）
"""

import os
import django
import sys
import json

# 自动适配路径（本地或服务器均可）
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "school_system.settings")
django.setup()

from quizzes.models import Question, KnowledgePoint

def seed_data():
    seed_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "seed_questions.json")

    if not os.path.exists(seed_path):
        print(f"❌ 找不到种子文件：{seed_path}")
        return

    with open(seed_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 依然兼容老版本的独立 knowledge_points 数组（如果你的JSON里还有的话）
    kp_data = data.get("knowledge_points", [])
    q_data = data.get("questions", [])

    print(f"📦 种子文件包含: {len(q_data)} 道题目")
    print("开始导入...\n")

    kp_map = {}
    
    # === 第一步：历史包袱兼容（如果有独立的知识点数组则解析） ===
    if kp_data:
        parent_map = {}
        for kp in kp_data:
            obj, created = KnowledgePoint.objects.get_or_create(
                name=kp["name"],
                defaults={"description": kp.get("description", "")}
            )
            if not created and kp.get("description"):
                obj.description = kp["description"]
                obj.save(update_fields=["description"])
            kp_map[kp["name"]] = obj
            if kp.get("parent_name"):
                parent_map[kp["name"]] = kp["parent_name"]

        for name, parent_name in parent_map.items():
            if name in kp_map and parent_name in kp_map:
                child = kp_map[name]
                parent = kp_map[parent_name]
                if child.parent != parent:
                    child.parent = parent
                    child.save(update_fields=["parent"])
        print(f"✅ 提取并加载了 {len(kp_map)} 条旧版知识点配置...")

    # === 第二步：同步题目 ===
    created_count = 0
    updated_count = 0
    error_count = 0

    for i, q in enumerate(q_data):
        # 兼容两种格式：text 或 question_text
        text = q.get("text") or q.get("question_text", "")
        text = text.strip()
        
        if not text:
            continue

        # ====== 核心优化：动态处理知识点 ======
        # AI 出题时不需要维护 ID 和数组，只需要在题目中写明知识点的名称！
        # 兼容多种键名：knowledge_point_name, knowledge_point, kp_name
        kp_raw = q.get("knowledge_point_name") or q.get("knowledge_point") or q.get("kp_name")
        
        # 如果是字典（导出格式可能带详情），提取名称
        kp_name = kp_raw.get("name") if isinstance(kp_raw, dict) else kp_raw
        
        parent_kp_name = q.get("parent_knowledge_point") or q.get("parent_kp")

        kp_obj = None
        if kp_name:
            if kp_name in kp_map:
                kp_obj = kp_map[kp_name]
            else:
                # 动态建立/获取知识点关系
                parent_obj = None
                if parent_kp_name:
                    parent_obj, _ = KnowledgePoint.objects.get_or_create(name=parent_kp_name)
                
                kp_obj, _ = KnowledgePoint.objects.get_or_create(name=kp_name)
                if parent_obj and kp_obj.parent != parent_obj:
                    kp_obj.parent = parent_obj
                    kp_obj.save(update_fields=["parent"])
                
                kp_map[kp_name] = kp_obj

        try:
            diff_level = q.get("difficulty_level", "normal")
            diff_elo = q.get("difficulty_elo") or q.get("difficulty")
            
            # 如果提供了 ELO 数字但没提供 Level，反向推导 Level (可选)
            # 这里我们优先信任 JSON 中的 Level，如果没有则用默认，save() 方法会处理 Level -> ELO 的映射
            
            defaults = {
                "q_type": q.get("question_type") or q.get("q_type", "subjective"),
                "subjective_type": q.get("subjective_type"),
                "difficulty_level": diff_level,
                "options": q.get("options"),
                "correct_answer": q.get("correct_answer", ""),
                "grading_points": q.get("grading_points", ""),
                "ai_answer": q.get("ai_explanation") or q.get("ai_answer", ""),
                "difficulty": diff_elo if diff_elo else Question.DIFFICULTY_MAP.get(diff_level, 1200),
                "knowledge_point": kp_obj,
            }

            qid = q.get("id")
            if qid:
                # 如果题目带了 ID，则以 ID 为唯一标识更新
                defaults["text"] = text
                obj, created = Question.objects.update_or_create(id=qid, defaults=defaults)
            else:
                # 对于 AI 新生成的没有 ID 的题目，以 text 为唯一标识更新，防止重复创建
                obj, created = Question.objects.update_or_create(text=text, defaults=defaults)

            if created:
                created_count += 1
            else:
                updated_count += 1

            if (i + 1) % 20 == 0:
                print(f"  进度: {i + 1}/{len(q_data)}...")

        except Exception as e:
            print(f"  ⚠️  题目处理失败: {str(e)[:80]}")
            error_count += 1

    print(f"\n🎉 题目导入完成！")
    print(f"   新增题目: {created_count} 道")
    print(f"   更新题目: {updated_count} 道")
    print(f"   导入错误: {error_count} 道")
    print(f"   当前数据库总题数: {Question.objects.count()} 道")
    print(f"\n⚠️ 提示：为了安全支持仅含新题的 JSON 增量导入，已经移除了旧版的“自动删除缺失题目”逻辑。")

if __name__ == '__main__':
    seed_data()
