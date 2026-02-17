from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Course, Album
from .serializers import CourseSerializer, AlbumSerializer

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
        return [permissions.IsAuthenticated()]

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
        return [permissions.IsAuthenticated()]

class AwardEloView(APIView):
    permission_classes = [permissions.IsAuthenticated]

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
