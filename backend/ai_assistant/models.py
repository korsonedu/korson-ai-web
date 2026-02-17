from django.db import models
from django.conf import settings

class AIChatMessage(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    role = models.CharField(max_length=20) # 'user' or 'assistant'
    content = models.TextField()
    bot = models.ForeignKey('Bot', on_delete=models.CASCADE, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

class Bot(models.Model):
    name = models.CharField(max_length=100)
    avatar = models.ImageField(upload_to='bot_avatars/', blank=True, null=True)
    system_prompt = models.TextField()
    is_exclusive = models.BooleanField(default=False, verbose_name="是否为专属导师")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
