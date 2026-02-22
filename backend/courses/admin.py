from django.contrib import admin
from .models import Course, Album, StartupMaterial

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('title', 'album_obj', 'created_at')

@admin.register(Album)
class AlbumAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')

@admin.register(StartupMaterial)
class StartupMaterialAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
