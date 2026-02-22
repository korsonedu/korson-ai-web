from rest_framework import serializers
from .models import Question, Answer
from users.serializers import UserSerializer

class AnswerSerializer(serializers.ModelSerializer):
    user_detail = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = Answer
        fields = '__all__'
        read_only_fields = ('user', 'is_teacher', 'created_at')

class QuestionSerializer(serializers.ModelSerializer):
    user_detail = UserSerializer(source='user', read_only=True)
    answers = AnswerSerializer(many=True, read_only=True)
    first_answer = serializers.SerializerMethodField()
    reply_count = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at', 'is_solved', 'is_starred')

    def get_first_answer(self, obj):
        # 获取第一条回答（通常是老师的回答）
        first = obj.answers.first()
        if first:
            return AnswerSerializer(first).data
        return None

    def get_reply_count(self, obj):
        return obj.answers.count()
