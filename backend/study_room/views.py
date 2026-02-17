from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.core.files.storage import default_storage
from django.conf import settings
from .models import ChatMessage
from .serializers import ChatMessageSerializer

class ChatMessageListView(generics.ListCreateAPIView):
    queryset = ChatMessage.objects.all().order_by('timestamp')
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ImageUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        file = request.FILES.get('image')
        if not file:
            return Response({'error': 'No file uploaded'}, status=400)
        
        # 保存文件
        file_name = default_storage.save(f'chat_images/{file.name}', file)
        file_url = request.build_absolute_uri(settings.MEDIA_URL + file_name)
        
        return Response({'url': file_url})
