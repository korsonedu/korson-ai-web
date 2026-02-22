from django.db import models
from django.conf import settings

class StudyTask(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    task_name = models.CharField(max_length=200)
    duration_minutes = models.IntegerField(default=25)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

from users.models import DailyPlan

class ChatMessage(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    related_plan = models.ForeignKey(DailyPlan, on_delete=models.SET_NULL, null=True, blank=True, related_name='broadcast_messages')

    class Meta:
        ordering = ['timestamp']
