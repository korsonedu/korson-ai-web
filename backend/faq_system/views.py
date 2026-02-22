from rest_framework import generics, permissions, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from .models import Question, Answer
from .serializers import QuestionSerializer, AnswerSerializer

class QuestionListCreateView(generics.ListCreateAPIView):
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['content', 'user__nickname']

    def get_queryset(self):
        qs = Question.objects.all().select_related('user').prefetch_related('answers__user')
        
        # Filter Logic
        filter_type = self.request.query_params.get('filter', 'all')
        if filter_type == 'solved':
            qs = qs.filter(is_solved=True)
        elif filter_type == 'unsolved':
            qs = qs.filter(is_solved=False)
        elif filter_type == 'starred':
            # Assuming regular users can see starred questions too
            qs = qs.filter(is_starred=True)
            
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class QuestionDetailView(generics.RetrieveDestroyAPIView):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_destroy(self, instance):
        # Allow owner or admin to delete
        if instance.user == self.request.user or self.request.user.role == 'admin':
            instance.delete()
        else:
            raise permissions.PermissionDenied("无权删除")

class AnswerCreateView(generics.CreateAPIView):
    serializer_class = AnswerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        question_id = request.data.get('question')
        try:
            question = Question.objects.get(id=question_id)
        except Question.DoesNotExist:
            return Response({'error': 'Question not found'}, status=404)

        is_teacher = request.user.role == 'admin'
        
        # 逻辑：首次回答仅允许教师
        if question.answers.count() == 0:
            if not is_teacher:
                return Response({'error': '首个回答必须由教师完成'}, status=403)
            # 教师回答后，自动标记为已解决（可选逻辑，暂保留为手动或默认逻辑）
            question.is_solved = True
            question.save()

        # Create answer
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user, is_teacher=is_teacher, question=question)
        
        # 如果是追问，可能将状态改为未解决？这里保持简单，由管理员手动控制状态
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class QuestionActionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            question = Question.objects.get(pk=pk)
        except Question.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        # Star Logic (Only Admin)
        if 'toggle_star' in request.data:
            if request.user.role != 'admin':
                return Response({'error': 'Permission denied'}, status=403)
            question.is_starred = not question.is_starred
            question.save()
            return Response({'status': 'ok', 'is_starred': question.is_starred})

        # Solve Logic (Owner or Admin)
        if 'toggle_solved' in request.data:
            if request.user != question.user and request.user.role != 'admin':
                return Response({'error': 'Permission denied'}, status=403)
            question.is_solved = not question.is_solved
            question.save()
            return Response({'status': 'ok', 'is_solved': question.is_solved})

        return Response({'error': 'Invalid action'}, status=400)
