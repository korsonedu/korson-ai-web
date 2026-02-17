from django.urls import path
from .views import ChatMessageListView, ImageUploadView

urlpatterns = [
    path('messages/', ChatMessageListView.as_view(), name='chat-messages'),
    path('upload-image/', ImageUploadView.as_view(), name='upload-image'),
]
