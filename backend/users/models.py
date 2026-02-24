from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings

class User(AbstractUser):
    ROLE_CHOICES = (
        ('student', '学生'),
        ('admin', '管理员'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    nickname = models.CharField(max_length=100, blank=True, verbose_name="昵称")
    elo_score = models.IntegerField(default=1000)
    has_completed_initial_assessment = models.BooleanField(default=False)
    elo_reset_count = models.IntegerField(default=0)
    avatar_url = models.URLField(blank=True, null=True)
    avatar_style = models.CharField(max_length=50, default='avataaars')
    avatar_seed = models.CharField(max_length=100, blank=True)
    avatar_options = models.JSONField(default=dict, blank=True)
    is_online = models.BooleanField(default=False)
    last_active = models.DateTimeField(auto_now=True)
    current_task = models.CharField(max_length=200, blank=True, null=True)
    current_timer_end = models.DateTimeField(blank=True, null=True)
    today_focused_minutes = models.IntegerField(default=0)
    today_completed_tasks = models.JSONField(default=list, blank=True)
    allow_broadcast = models.BooleanField(default=True)
    show_others_broadcast = models.BooleanField(default=True)
    bio = models.TextField(blank=True, null=True)
    is_member = models.BooleanField(default=False, verbose_name="是否会员")

    def save(self, *args, **kwargs):
        if not self.avatar_seed:
            self.avatar_seed = self.username
        self.avatar_url = f"https://api.dicebear.com/7.x/{self.avatar_style}/svg?seed={self.avatar_seed}"
        
        # 自动同步管理员权限
        if self.role == 'admin':
            self.is_staff = True
            self.is_member = True
        
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['-elo_score']

class ActivationCode(models.Model):
    code = models.CharField(max_length=50, unique=True, verbose_name="激活码")
    is_used = models.BooleanField(default=False, verbose_name="是否已使用")
    used_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="used_codes")
    used_at = models.DateTimeField(null=True, blank=True, verbose_name="使用时间")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.code} ({'已用' if self.is_used else '可用'})"

class DailyPlan(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.CharField(max_length=200)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

class SystemConfig(models.Model):
    school_name = models.CharField(max_length=100, default='科晟智慧')
    school_short_name = models.CharField(max_length=20, default='科晟', verbose_name="网校缩写")
    school_description = models.TextField(default='KORSON ACADEMY')
    school_logo = models.ImageField(upload_to="school_logos/", blank=True, null=True)
    invite_code = models.CharField(max_length=50, default="KORSON2025", verbose_name="邀请码")
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.school_name
