from rest_framework import serializers
from .models import Article

class ArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Article
        fields = ('id', 'title', 'content', 'author_display_name', 'tags', 'cover_image', 'created_at', 'updated_at', 'author', 'views')
        read_only_fields = ('author', 'views')
