from django.db import models
from django.conf import settings

class KnowledgePoint(models.Model):
    LEVEL_CHOICES = (
        ('sub', '模块(SUB)'),
        ('ch', '篇章(CH)'),
        ('sec', '小节(SEC)'),
        ('kp', '考点(KP)'),
    )
    code = models.CharField(max_length=50, blank=True, null=True, verbose_name="唯一编码(如MB-1001)")
    name = models.CharField(max_length=100, verbose_name="知识点名称")
    level = models.CharField(max_length=10, choices=LEVEL_CHOICES, default='kp', verbose_name="层级")
    prefix_category = models.CharField(max_length=20, blank=True, null=True, verbose_name="学科前缀", help_text="如 MB, IF, CF 等")
    description = models.TextField(blank=True, verbose_name="知识点描述")
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='children', verbose_name="上级知识点")
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # 自动提取前缀，例如从 "MB-1001" 提取 "MB"
        if self.level == 'kp' and self.code:
            parts = self.code.split('-')
            if len(parts) > 1:
                self.prefix_category = parts[0].strip().upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"[{self.code}] {self.name}" if self.code else self.name

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
    DIFFICULTY_LEVELS = (
        ('entry', '入门 (Entry)'),
        ('easy', '简单 (Easy)'),
        ('normal', '适当 (Normal)'),
        ('hard', '困难 (Hard)'),
        ('extreme', '极限 (Extreme)'),
    )
    DIFFICULTY_MAP = {
        'entry': 800,
        'easy': 1000,
        'normal': 1200,
        'hard': 1400,
        'extreme': 1600,
    }
    
    knowledge_point = models.ForeignKey(KnowledgePoint, on_delete=models.SET_NULL, null=True, blank=True, related_name='questions')
    text = models.TextField(verbose_name="题目内容")
    q_type = models.CharField(max_length=20, choices=QUESTION_TYPES, default='objective')
    subjective_type = models.CharField(max_length=20, choices=SUBJECTIVE_TYPES, blank=True, null=True, verbose_name="主观题类型")
    difficulty_level = models.CharField(max_length=20, choices=DIFFICULTY_LEVELS, default='normal', verbose_name="难度等级")
    grading_points = models.TextField(blank=True, null=True, help_text="得分点说明（主观题必填）")
    options = models.JSONField(blank=True, null=True, help_text="客观题选项")
    correct_answer = models.TextField(blank=True, null=True, help_text="客观题标准答案或主观题参考答案")
    ai_answer = models.TextField(blank=True, null=True, verbose_name="AI 生成的深度解析答案")
    difficulty = models.IntegerField(default=1200, help_text="基准 ELO 分值")
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # 自动同步标签到分值 (如果难度分值为默认或未手动指定，则根据级别映射)
        if self.difficulty_level and (self._state.adding or self.difficulty == 1200):
            self.difficulty = self.DIFFICULTY_MAP.get(self.difficulty_level, 1200)
        super().save(*args, **kwargs)

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
    is_mastered = models.BooleanField(default=False, verbose_name="是否已掌握(排除)")
    wrong_count = models.IntegerField(default=0, verbose_name="错误次数")
    
    # FSRS Fields
    stability = models.FloatField(default=0.0, help_text="记忆稳定性 (S)，单位：天")
    difficulty = models.FloatField(default=0.0, help_text="记忆难度 (D)，范围 1-10")
    reps = models.IntegerField(default=0, help_text="总复习次数")
    lapses = models.IntegerField(default=0, help_text="忘记次数")
    last_review = models.DateTimeField(null=True, blank=True, help_text="上次复习时间")
    
    next_review_at = models.DateTimeField(auto_now_add=True)
    last_correct = models.BooleanField(default=False)

    class Meta:
        unique_together = ('user', 'question')

class QuizExam(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='exams')
    total_score = models.FloatField(default=0)
    max_score = models.FloatField(default=0)
    elo_change = models.IntegerField(default=0)
    summary = models.TextField(blank=True, help_text="AI 对整张试卷的综合点评")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

class ExamQuestionResult(models.Model):
    exam = models.ForeignKey(QuizExam, on_delete=models.CASCADE, related_name='results')
    question = models.ForeignKey(Question, on_delete=models.SET_NULL, null=True)
    user_answer = models.TextField()
    score = models.FloatField()
    max_score = models.FloatField()
    feedback = models.TextField(blank=True)
    analysis = models.TextField(blank=True, help_text="思维链分析")
    is_correct = models.BooleanField(default=False)
