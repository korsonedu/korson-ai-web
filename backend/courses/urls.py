from django.urls import path
from .views import CourseListCreateView, CourseDetailView, AwardEloView, AlbumListCreateView, AlbumDetailView

urlpatterns = [
    path('', CourseListCreateView.as_view(), name='course-list'),
    path('<int:pk>/', CourseDetailView.as_view(), name='course-detail'),
    path('<int:pk>/award-elo/', AwardEloView.as_view(), name='course-award-elo'),
    path('albums/', AlbumListCreateView.as_view(), name='album-list'),
    path('albums/<int:pk>/', AlbumDetailView.as_view(), name='album-detail'),
]
