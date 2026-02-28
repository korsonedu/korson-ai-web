from django.urls import path
from .views import (
    QuestionListView, QuestionDetailView, QuizAttemptCreateView, 
    LeaderboardView, GradeSubjectiveView, ToggleFavoriteView, ToggleMasteredView, QuizStatsView,
    WrongQuestionListView, FavoriteQuestionListView,
    KnowledgePointListView, KnowledgePointDetailView, GenerateBulkQuestionsView,
    GenerateFromTextView, AIPreviewParseView, BulkImportQuestionsView,
    AdminQuestionListView, ExportStructuredQuestionsView, ImportCSVQuestionsView,
    SubmitExamView, LatestExamReportView, ExamDetailView,
    AIPreviewGenerateView, AIConfirmSaveQuestionsView
)

urlpatterns = [
    path('questions/', QuestionListView.as_view(), name='question-list'),
    path('questions/<int:pk>/', QuestionDetailView.as_view(), name='question-detail'),
    path('submit/', QuizAttemptCreateView.as_view(), name='quiz-submit'),
    path('submit-exam/', SubmitExamView.as_view(), name='quiz-submit-exam'),
    path('exams/<int:pk>/', ExamDetailView.as_view(), name='exam-detail'),
    path('latest-report/', LatestExamReportView.as_view(), name='latest-exam-report'),
    path('leaderboard/', LeaderboardView.as_view(), name='leaderboard'),
    path('grade-subjective/', GradeSubjectiveView.as_view(), name='grade-subjective'),
    path('stats/', QuizStatsView.as_view(), name='quiz-stats'),
    path('favorite/toggle/', ToggleFavoriteView.as_view(), name='favorite-toggle'),
    path('mastered/toggle/', ToggleMasteredView.as_view(), name='mastered-toggle'),
    path('wrong-questions/', WrongQuestionListView.as_view(), name='wrong-questions'),
    path('favorites/', FavoriteQuestionListView.as_view(), name='favorites-list'),
    path('knowledge-points/', KnowledgePointListView.as_view(), name='knowledge-point-list'),
    path('knowledge-points/<int:pk>/', KnowledgePointDetailView.as_view(), name='knowledge-point-detail'),
    path('knowledge-points/<int:pk>/generate/', GenerateBulkQuestionsView.as_view(), name='knowledge-point-generate'),
    # 智能出题工作流
    path('ai-smart-generate-preview/', AIPreviewGenerateView.as_view(), name='ai-smart-generate-preview'),
    path('ai-smart-generate-confirm/', AIConfirmSaveQuestionsView.as_view(), name='ai-smart-generate-confirm'),
    
    path('ai-generate-from-text/', GenerateFromTextView.as_view(), name='ai-generate-from-text'),
    path('ai-parse-raw-text/', AIPreviewParseView.as_view(), name='ai-parse-raw-text'),
    path('ai-bulk-import/', BulkImportQuestionsView.as_view(), name='ai-bulk-import'),
    path('import-csv/', ImportCSVQuestionsView.as_view(), name='import-csv'),
    # 管理员专用：分页题目列表
    path('admin/questions/', AdminQuestionListView.as_view(), name='admin-question-list'),
    # 管理员专用：导出结构化 AI 可读格式
    path('admin/export-structured/', ExportStructuredQuestionsView.as_view(), name='export-structured'),
]
