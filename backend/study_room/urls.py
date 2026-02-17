from django.urls import path
from .views import ChatMessageListView

urlpatterns = [
    path('messages/', ChatMessageListView.as_view(), name='chat-messages'),
]
