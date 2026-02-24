from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Article
from .serializers import ArticleSerializer
from django.db.models import Count
from users.views import IsMember

class IsAdminUserOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            # 修改这里：GET 请求也需要是会员
            return bool(request.user and request.user.is_authenticated and (request.user.is_member or request.user.role == 'admin'))
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)

class ArticleListCreateView(generics.ListCreateAPIView):
    serializer_class = ArticleSerializer
    permission_classes = [IsAdminUserOrReadOnly]

    def get_queryset(self):
        qs = Article.objects.all().order_by('-created_at')
        tag = self.request.query_params.get('tag')
        q = self.request.query_params.get('search')
        kp = self.request.query_params.get('kp')
        if tag: qs = qs.filter(tags__icontains=tag)
        if q: qs = qs.filter(title__icontains=q)
        if kp: qs = qs.filter(knowledge_point_id=kp)
        return qs

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        all_articles = Article.objects.all()
        tag_data = {} # {tag_name: {count: X, views: Y}}
        for art in all_articles:
            if isinstance(art.tags, list):
                for t in art.tags:
                    if t not in tag_data:
                        tag_data[t] = {'count': 0, 'views': 0}
                    tag_data[t]['count'] += 1
                    tag_data[t]['views'] += (art.views or 0)
        
        # 按点击量之和由高到低排序
        sorted_tags = sorted(tag_data.items(), key=lambda item: item[1]['views'], reverse=True)
        tag_stats = [{'name': k, 'count': v['count'], 'views': v['views']} for k, v in sorted_tags]
        
        return Response({
            'articles': serializer.data,
            'tag_stats': tag_stats
        })

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class ArticleDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    permission_classes = [IsAdminUserOrReadOnly]

class ArticleIncrementViewView(generics.GenericAPIView):
    queryset = Article.objects.all()
    permission_classes = [IsMember]

    def post(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.views += 1
        instance.save(update_fields=['views'])
        return Response({'views': instance.views}, status=status.HTTP_200_OK)
