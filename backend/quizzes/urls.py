from django.urls import path
from .views import (
    QuestionListView, QuestionDetailView, QuizAttemptCreateView, 
    LeaderboardView, GradeSubjectiveView, ToggleFavoriteView, QuizStatsView,
    WrongQuestionListView, FavoriteQuestionListView,
    KnowledgePointListView, KnowledgePointDetailView, GenerateBulkQuestionsView,
    GenerateFromTextView, AIPreviewParseView, BulkImportQuestionsView
)

urlpatterns = [
    path('questions/', QuestionListView.as_view(), name='question-list'),
    path('questions/<int:pk>/', QuestionDetailView.as_view(), name='question-detail'),
    path('submit/', QuizAttemptCreateView.as_view(), name='quiz-submit'),
    path('leaderboard/', LeaderboardView.as_view(), name='leaderboard'),
    path('grade-subjective/', GradeSubjectiveView.as_view(), name='grade-subjective'),
    path('stats/', QuizStatsView.as_view(), name='quiz-stats'),
    path('favorite/toggle/', ToggleFavoriteView.as_view(), name='favorite-toggle'),
    path('wrong-questions/', WrongQuestionListView.as_view(), name='wrong-questions'),
    path('favorites/', FavoriteQuestionListView.as_view(), name='favorites-list'),
    path('knowledge-points/', KnowledgePointListView.as_view(), name='knowledge-point-list'),
    path('knowledge-points/<int:pk>/', KnowledgePointDetailView.as_view(), name='knowledge-point-detail'),
    path('knowledge-points/<int:pk>/generate/', GenerateBulkQuestionsView.as_view(), name='knowledge-point-generate'),
    path('ai-generate-from-text/', GenerateFromTextView.as_view(), name='ai-generate-from-text'),
    path('ai-parse-raw-text/', AIPreviewParseView.as_view(), name='ai-parse-raw-text'),
    path('ai-bulk-import/', BulkImportQuestionsView.as_view(), name='ai-bulk-import'),
]
