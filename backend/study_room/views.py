from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.core.files.storage import default_storage
from django.conf import settings
from .models import ChatMessage
from users.models import DailyPlan
from .serializers import ChatMessageSerializer
from users.views import IsMember

class ChatMessageListView(generics.ListCreateAPIView):
    queryset = ChatMessage.objects.all().order_by('timestamp')
    serializer_class = ChatMessageSerializer
    permission_classes = [IsMember]

    def perform_create(self, serializer):
        related_plan_id = self.request.data.get('related_plan_id')
        related_plan = None
        if related_plan_id:
            try:
                related_plan = DailyPlan.objects.get(id=related_plan_id, user=self.request.user)
            except DailyPlan.DoesNotExist:
                pass
        
        serializer.save(user=self.request.user, related_plan=related_plan)

class UndoBroadcastView(APIView):
    permission_classes = [IsMember]

    def post(self, request, pk):
        try:
            message = ChatMessage.objects.get(pk=pk, user=request.user)
            if message.related_plan:
                # Revert plan status
                plan = message.related_plan
                plan.is_completed = False
                plan.completed_at = None
                plan.save()
            
            # Delete message
            message.delete()
            return Response({'status': 'success'})
        except ChatMessage.DoesNotExist:
            return Response({'error': 'Message not found'}, status=404)

class ImageUploadView(APIView):
    permission_classes = [IsMember]
    def post(self, request):
        file = request.FILES.get('image')
        if not file:
            return Response({'error': 'No file uploaded'}, status=400)
        
        # 保存文件
        file_name = default_storage.save(f'chat_images/{file.name}', file)
        file_url = request.build_absolute_uri(settings.MEDIA_URL + file_name)
        
        return Response({'url': file_url})
