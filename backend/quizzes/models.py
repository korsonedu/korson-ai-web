from django.db import models
from django.conf import settings

class KnowledgePoint(models.Model):
    name = models.CharField(max_length=100, verbose_name="知识点名称")
    description = models.TextField(blank=True, verbose_name="知识点描述")
    structural_data = models.JSONField(default=dict, blank=True, help_text="存放通用的结构化数据，如公式库、背景资料等")
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='children', verbose_name="上级知识点")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Question(models.Model):
    QUESTION_TYPES = (
        ('objective', '客观题'),
        ('subjective', '主观题'),
    )
    SUBJECTIVE_TYPES = (
        ('noun', '名词解释'),
        ('short', '简答题'),
        ('essay', '论述题'),
        ('calculate', '计算题'),
    )
    knowledge_point = models.ForeignKey(KnowledgePoint, on_delete=models.SET_NULL, null=True, blank=True, related_name='questions')
    text = models.TextField(verbose_name="题目内容")
    q_type = models.CharField(max_length=20, choices=QUESTION_TYPES, default='objective')
    subjective_type = models.CharField(max_length=20, choices=SUBJECTIVE_TYPES, blank=True, null=True, verbose_name="主观题类型")
    grading_points = models.TextField(blank=True, null=True, help_text="得分点说明（主观题必填）")
    options = models.JSONField(blank=True, null=True, help_text="客观题选项")
    correct_answer = models.TextField(blank=True, null=True, help_text="客观题标准答案或主观题参考答案")
    ai_answer = models.TextField(blank=True, null=True, verbose_name="AI 生成的深度解析答案")
    difficulty = models.IntegerField(default=1000)
    created_at = models.DateTimeField(auto_now_add=True)

    def get_max_score(self):
        if self.q_type == 'objective': return 10
        if self.subjective_type == 'noun': return 5
        if self.subjective_type == 'short': return 10
        if self.subjective_type == 'essay': return 20
        return 10

    def __str__(self):
        return f"[{self.get_q_type_display()}] {self.text[:30]}"

class QuizAttempt(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    score = models.FloatField()
    elo_change = models.IntegerField(default=0)
    is_initial_placement = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

class UserQuestionStatus(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    is_favorite = models.BooleanField(default=False, verbose_name="是否收藏")
    wrong_count = models.IntegerField(default=0, verbose_name="错误次数")
    review_stage = models.IntegerField(default=0)
    next_review_at = models.DateTimeField(auto_now_add=True)
    last_correct = models.BooleanField(default=False)

    class Meta:
        unique_together = ('user', 'question')
