from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Article
from .serializers import ArticleSerializer
from django.db.models import Count

class IsAdminUserOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)

class ArticleListCreateView(generics.ListCreateAPIView):
    serializer_class = ArticleSerializer
    permission_classes = [IsAdminUserOrReadOnly]

    def get_queryset(self):
        qs = Article.objects.all().order_by('-created_at')
        tag = self.request.query_params.get('tag')
        q = self.request.query_params.get('search')
        kp = self.request.query_params.get('kp')
        if tag: qs = qs.filter(tags__contains=tag)
        if q: qs = qs.filter(title__icontains=q)
        if kp: qs = qs.filter(knowledge_point_id=kp)
        return qs

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        # 标签统计逻辑保持，仅统计当前过滤结果相关的更好（可选，这里保持全量）
        all_articles = Article.objects.all()
        tag_counts = {}
        for art in all_articles:
            if isinstance(art.tags, list):
                for t in art.tags: tag_counts[t] = tag_counts.get(t, 0) + 1
        
        return Response({
            'articles': serializer.data,
            'tag_stats': tag_counts
        })

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class ArticleDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    permission_classes = [IsAdminUserOrReadOnly]

class ArticleIncrementViewView(generics.GenericAPIView):
    queryset = Article.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.views += 1
        instance.save(update_fields=['views'])
        return Response({'views': instance.views}, status=status.HTTP_200_OK)
