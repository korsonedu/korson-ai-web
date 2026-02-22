from django.contrib import admin
from .models import Question, Answer

class AnswerInline(admin.TabularInline):
    model = Answer
    extra = 0

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('user', 'content', 'is_solved', 'is_starred', 'created_at')
    list_filter = ('is_solved', 'is_starred', 'created_at')
    inlines = [AnswerInline]

@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ('user', 'question', 'is_teacher', 'created_at')
