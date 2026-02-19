from django.urls import path
from .views import ArticleListCreateView, ArticleDetailView, ArticleIncrementViewView

urlpatterns = [
    path('', ArticleListCreateView.as_view(), name='article-list'),
    path('<int:pk>/', ArticleDetailView.as_view(), name='article-detail'),
    path('<int:pk>/view/', ArticleIncrementViewView.as_view(), name='article-view-increment'),
]
