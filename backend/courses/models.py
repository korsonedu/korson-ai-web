from django.db import models
from django.conf import settings

from quizzes.models import KnowledgePoint

class Album(models.Model):
    name = models.CharField(max_length=100, verbose_name="专辑名称")
    description = models.TextField(blank=True, verbose_name="专辑描述")
    cover_image = models.ImageField(upload_to='album_covers/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Course(models.Model):
    title = models.CharField(max_length=200)
    album_obj = models.ForeignKey(Album, on_delete=models.SET_NULL, null=True, blank=True, related_name='courses', verbose_name="所属专辑")
    description = models.TextField()
    knowledge_point = models.ForeignKey(KnowledgePoint, on_delete=models.SET_NULL, null=True, blank=True, related_name='courses', verbose_name="挂载知识点")
    cover_image = models.ImageField(upload_to='course_covers/', blank=True, null=True)
    video_file = models.FileField(upload_to='course_videos/', blank=True, null=True)
    elo_reward = models.IntegerField(default=50, verbose_name="观看完成奖励 ELO")
    courseware = models.FileField(upload_to='courseware/', blank=True, null=True, verbose_name="课件")
    reference_materials = models.FileField(upload_to='references/', blank=True, null=True, verbose_name="参考资料")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True)

    def __str__(self):
        return self.title

class StartupMaterial(models.Model):
    name = models.CharField(max_length=200, verbose_name="资料名称")
    description = models.TextField(blank=True, verbose_name="资料简介")
    file = models.FileField(upload_to='startup_materials/', verbose_name="文件")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class VideoProgress(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='progress_records')
    last_position = models.FloatField(default=0, help_text="上次观看位置（秒）")
    is_finished = models.BooleanField(default=False, verbose_name="是否观看完成")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'course')

    def __str__(self):
        return f"{self.user.username} - {self.course.title} ({'完成' if self.is_finished else '进行中'})"
