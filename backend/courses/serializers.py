from rest_framework import serializers
from .models import Course, Album, StartupMaterial

class AlbumSerializer(serializers.ModelSerializer):
    class Meta:
        model = Album
        fields = '__all__'

class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = '__all__'
        read_only_fields = ('author',)

class StartupMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = StartupMaterial
        fields = '__all__'
