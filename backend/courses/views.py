from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Course, Album, StartupMaterial, VideoProgress
from .serializers import CourseSerializer, AlbumSerializer, StartupMaterialSerializer
from users.views import IsMember

class VideoProgressUpdateView(APIView):
    permission_classes = [IsMember]

    def post(self, request, pk):
        try:
            course = Course.objects.get(pk=pk)
            pos = request.data.get('position', 0)
            finished = request.data.get('is_finished', False)
            
            progress, created = VideoProgress.objects.get_or_create(
                user=request.user,
                course=course
            )
            
            # 如果之前没完成，现在标记为完成，则发放奖励
            elo_added = 0
            if finished and not progress.is_finished:
                progress.is_finished = True
                user = request.user
                user.elo_score += course.elo_reward
                user.save()
                elo_added = course.elo_reward
            
            progress.last_position = pos
            progress.save()
            
            return Response({
                'status': 'ok', 
                'is_finished': progress.is_finished,
                'elo_added': elo_added,
                'new_score': request.user.elo_score
            })
        except Course.DoesNotExist:
            return Response({'error': 'Course not found'}, status=404)

class StartupMaterialListCreateView(generics.ListCreateAPIView):
    queryset = StartupMaterial.objects.all().order_by('-created_at')
    serializer_class = StartupMaterialSerializer
    def get_permissions(self):
        if self.request.method == 'POST': return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]

class StartupMaterialDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = StartupMaterial.objects.all()
    serializer_class = StartupMaterialSerializer
    def get_permissions(self):
        if self.request.method in ['PATCH', 'PUT', 'DELETE']: return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]

class AlbumListCreateView(generics.ListCreateAPIView):
    queryset = Album.objects.all().order_by('-created_at')
    serializer_class = AlbumSerializer
    def get_permissions(self):
        if self.request.method == 'POST': return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]

class AlbumDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Album.objects.all()
    serializer_class = AlbumSerializer
    def get_permissions(self):
        if self.request.method in ['PATCH', 'PUT', 'DELETE']: return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]

class CourseListCreateView(generics.ListCreateAPIView):
    serializer_class = CourseSerializer
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAdminUser()]
        return [IsMember()]

    def get_queryset(self):
        qs = Course.objects.all().order_by('-created_at')
        q = self.request.query_params.get('search')
        kp = self.request.query_params.get('kp')
        if q: qs = qs.filter(title__icontains=q)
        if kp: qs = qs.filter(knowledge_point_id=kp)
        return qs

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    
    def get_permissions(self):
        if self.request.method in ['PATCH', 'PUT', 'DELETE']:
            return [permissions.IsAdminUser()]
        return [IsMember()]

class AwardEloView(APIView):
    permission_classes = [IsMember]

    def post(self, request, pk):
        try:
            course = Course.objects.get(pk=pk)
            user = request.user
            user.elo_score += course.elo_reward
            user.save()
            return Response({
                'status': 'success', 
                'elo_added': course.elo_reward, 
                'new_score': user.elo_score
            })
        except Course.DoesNotExist:
            return Response({'error': '课程不存在'}, status=404)
