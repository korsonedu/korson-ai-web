from django.contrib import admin, messages
from .models import KnowledgePoint, Question, QuizAttempt, UserQuestionStatus, QuizExam, ExamQuestionResult

# 确保引入路径正确。如果 ai_service.py 就在同一目录下，请用 from .ai_service import AIService
# 如果在根目录，直接这样引入即可：
from ai_service import AIService 

@admin.register(KnowledgePoint)
class KnowledgePointAdmin(admin.ModelAdmin):
    list_display = ('get_tree_name', 'code', 'level', 'prefix_category', 'created_at')
    list_filter = ('level', 'prefix_category')
    search_fields = ('name', 'code', 'description')
    ordering = ('id',)
    
    # 【最关键的一行】：必须把函数名加到这个列表里，后台才会显示
    actions = ['generate_ai_questions']

    def get_tree_name(self, obj):
        indent_map = {'sub': '', 'ch': '— ', 'sec': '—— ', 'kp': '——— '}
        indent = indent_map.get(obj.level, '')
        return f"{indent}{obj.name}"
    get_tree_name.short_description = '知识点名称(树状)'

    # 【关键缩进】：这个函数必须在 KnowledgePointAdmin 类的内部
    @admin.action(description="🤖 AI 批量生成混合题型 (仅对选中考点)")
    def generate_ai_questions(self, request, queryset):
        # 过滤出叶子节点
        kp_queryset = queryset.filter(level='kp')
        
        if not kp_queryset.exists():
            self.message_user(request, "请至少选择一个具体的考点(kp级别)！", level=messages.WARNING)
            return
            
        try:
            # 调用 AI 服务
            count = AIService.batch_generate_questions(kp_queryset, count_per_kp=1)
            self.message_user(request, f"成功为选中的考点生成了 {count} 道题目！", level=messages.SUCCESS)
        except Exception as e:
            self.message_user(request, f"生题过程发生错误：{str(e)}", level=messages.ERROR)

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('id', 'text', 'q_type', 'difficulty_level', 'knowledge_point', 'created_at')
    list_filter = ('q_type', 'difficulty_level', 'knowledge_point__prefix_category')
    search_fields = ('text', 'knowledge_point__name', 'knowledge_point__code')
    raw_id_fields = ('knowledge_point',)

# 注册其他模型
admin.site.register(QuizAttempt)
admin.site.register(UserQuestionStatus)
admin.site.register(QuizExam)
admin.site.register(ExamQuestionResult)