from django.urls import path
from .views import QuestionListCreateView, QuestionDetailView, AnswerCreateView, QuestionActionView, AnswerDetailView, AnswerActionView

urlpatterns = [
    path('questions/', QuestionListCreateView.as_view(), name='question-list'),
    path('questions/<int:pk>/', QuestionDetailView.as_view(), name='question-detail'),
    path('questions/<int:pk>/action/', QuestionActionView.as_view(), name='question-action'),
    path('answers/', AnswerCreateView.as_view(), name='answer-create'),
    path('answers/<int:pk>/', AnswerDetailView.as_view(), name='answer-detail'),
    path('answers/<int:pk>/action/', AnswerActionView.as_view(), name='answer-action'),
]
