from rest_framework import serializers
from .models import Question, QuizAttempt, KnowledgePoint, UserQuestionStatus
from users.serializers import UserSerializer

class KnowledgePointSerializer(serializers.ModelSerializer):
    class Meta:
        model = KnowledgePoint
        fields = '__all__'

class QuestionSerializer(serializers.ModelSerializer):
    knowledge_point_detail = KnowledgePointSerializer(source='knowledge_point', read_only=True)
    is_favorite = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = '__all__'

    def get_is_favorite(self, obj):
        user = self.context.get('request').user
        if user.is_authenticated:
            status = UserQuestionStatus.objects.filter(user=user, question=obj).first()
            return status.is_favorite if status else False
        return False

class UserQuestionStatusSerializer(serializers.ModelSerializer):
    question_detail = QuestionSerializer(source='question', read_only=True)
    class Meta:
        model = UserQuestionStatus
        fields = '__all__'

class QuizAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizAttempt
        fields = '__all__'
        read_only_fields = ('user', 'elo_change')
