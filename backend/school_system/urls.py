from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/users/", include("users.urls")),
    path("api/quizzes/", include("quizzes.urls")),
    path("api/study/", include("study_room.urls")),
    path("api/courses/", include("courses.urls")),
    path("api/articles/", include("articles.urls")),
    path("api/ai/", include("ai_assistant.urls")),
    path("api/qa/", include("faq_system.urls")),
    path("api/notifications/", include("notifications.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
