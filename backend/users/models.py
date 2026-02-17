from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings

class User(AbstractUser):
    ROLE_CHOICES = (
        ('student', '学生'),
        ('admin', '管理员'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
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

    def save(self, *args, **kwargs):
        if not self.avatar_seed:
            self.avatar_seed = self.username
        self.avatar_url = f"https://api.dicebear.com/7.x/{self.avatar_style}/svg?seed={self.avatar_seed}"
        
        # 自动同步管理员权限
        if self.role == 'admin':
            self.is_staff = True
        
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['-elo_score']

class DailyPlan(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.CharField(max_length=200)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

class SystemConfig(models.Model):
    school_name = models.CharField(max_length=100, default='知行网校')
    school_short_name = models.CharField(max_length=20, default='知行', verbose_name="网校缩写")
    school_description = models.TextField(default='Knowledge In Action')
    school_logo = models.ImageField(upload_to='school_logos/', blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.school_name
