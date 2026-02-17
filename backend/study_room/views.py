from rest_framework import generics, permissions
from .models import ChatMessage
from .serializers import ChatMessageSerializer

class ChatMessageListView(generics.ListCreateAPIView):
    queryset = ChatMessage.objects.all().order_by('timestamp')
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
