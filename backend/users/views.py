from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from .serializers import UserSerializer, RegisterSerializer, SystemConfigSerializer, DailyPlanSerializer, ActivationCodeSerializer
from .models import User, SystemConfig, DailyPlan, ActivationCode
from django.utils import timezone
import datetime

class IsMember(permissions.BasePermission):
    """
    允许会员或管理员访问。
    """
    message = "您需要先成为学员（激活会员）才能使用此功能。"

    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.is_member or request.user.role == 'admin' or request.user.is_superuser)
        )

class ActivateMembershipView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        code_str = request.data.get('code')
        if not code_str:
            return Response({'error': '请输入激活码'}, status=400)
        
        try:
            code_obj = ActivationCode.objects.get(code=code_str, is_used=False)
        except ActivationCode.DoesNotExist:
            return Response({'error': '无效或已被使用的激活码'}, status=400)
        
        # 激活会员
        user = request.user
        user.is_member = True
        user.save()
        
        # 标记激活码已使用
        code_obj.is_used = True
        code_obj.used_by = user
        code_obj.used_at = timezone.now()
        code_obj.save()
        
        return Response({'status': 'ok', 'message': '会员已成功激活', 'user': UserSerializer(user).data})

class ActivationCodeListView(generics.ListCreateAPIView):
    queryset = ActivationCode.objects.all().order_by('-created_at')
    serializer_class = ActivationCodeSerializer
    permission_classes = [permissions.IsAdminUser]

    def perform_create(self, serializer):
        # 可以在这里增加逻辑自动生成 code，或者由前端传入
        serializer.save()

class ActivationCodeDetailView(generics.DestroyAPIView):
    queryset = ActivationCode.objects.all()
    serializer_class = ActivationCodeSerializer
    permission_classes = [permissions.IsAdminUser]

    def perform_destroy(self, instance):
        # 如果已被使用，需要收回用户的会员权限
        if instance.is_used and instance.used_by:
            user = instance.used_by
            user.is_member = False
            user.save()
        instance.delete()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

class UpdateProfileView(generics.UpdateAPIView):
    serializer_class = UserSerializer
    def get_object(self):
        return self.request.user
    
    def perform_update(self, serializer):
        user = serializer.save()
        user.avatar_url = f"https://api.dicebear.com/7.x/{user.avatar_style}/svg?seed={user.avatar_seed}"
        user.save()

from django.db.models import Q

class DailyPlanListView(generics.ListCreateAPIView):
    serializer_class = DailyPlanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Return incomplete plans OR plans completed today (Beijing Time)
        now = timezone.now().astimezone(datetime.timezone(datetime.timedelta(hours=8)))
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        return DailyPlan.objects.filter(
            Q(user=self.request.user) & 
            (Q(is_completed=False) | Q(is_completed=True, completed_at__gte=today_start))
        ).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class DailyPlanDetailView(generics.UpdateAPIView, generics.DestroyAPIView):
    serializer_class = DailyPlanSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        return DailyPlan.objects.filter(user=self.request.user)

    def perform_update(self, serializer):
        is_completed = self.request.data.get('is_completed')
        if is_completed is not None:
            # If marking as completed, set timestamp
            if is_completed:
                serializer.save(completed_at=timezone.now())
            else:
                serializer.save(completed_at=None)
        else:
            serializer.save()

from django.db.models import Sum, Count, Q
from quizzes.models import UserQuestionStatus, KnowledgePoint
from courses.models import VideoProgress, Course

class BIAnalyticsView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        # 1. 知识点错题热力图 (取前10)
        kp_errors = UserQuestionStatus.objects.values(
            'question__knowledge_point__name'
        ).annotate(
            total_errors=Sum('wrong_count')
        ).filter(
            question__knowledge_point__name__isnull=False
        ).order_by('-total_errors')[:10]

        # 2. 课程完播率统计
        course_stats = VideoProgress.objects.values(
            'course__title'
        ).annotate(
            total_views=Count('user', distinct=True),
            completions=Count('id', filter=Q(is_finished=True))
        ).order_by('-total_views')[:10]

        # 3. 活跃用户概览
        total_users = User.objects.count()
        member_users = User.objects.filter(is_member=True).count()

        return Response({
            'kp_errors': list(kp_errors),
            'course_stats': list(course_stats),
            'user_overview': {
                'total': total_users,
                'members': member_users,
                'member_rate': round(member_users / total_users * 100, 1) if total_users > 0 else 0
            }
        })

class WeeklyCognitiveReportView(APIView):
    permission_classes = [IsMember]

    def get(self, request):
        user = request.user
        now = timezone.now()
        
        # 计算上周的起止时间 (周一 00:00:00 到 周日 23:59:59)
        # weekday(): 0 是周一, 6 是周日
        current_weekday = now.weekday()
        # 本周一的凌晨
        start_of_this_week = (now - datetime.timedelta(days=current_weekday)).replace(hour=0, minute=0, second=0, microsecond=0)
        # 上周一的凌晨
        start_of_last_week = start_of_this_week - datetime.timedelta(days=7)
        # 上周日的深夜
        end_of_last_week = start_of_this_week - datetime.timedelta(seconds=1)

        # 1. 认知资产转化 (基于上周数据)
        # 统计上周复习过且稳定性提升到长期的题目 (稳定性 > 21天视为初步进入永久资产)
        last_week_qs = UserQuestionStatus.objects.filter(user=user, last_review__range=(start_of_last_week, end_of_last_week))
        total_attempted = last_week_qs.count()
        permanent_assets = last_week_qs.filter(stability__gte=21).count()
        conversion_rate = round(permanent_assets / total_attempted * 100, 1) if total_attempted > 0 else 0

        # 2. ELO 战胜率
        all_active_users = User.objects.filter(is_active=True).order_by('elo_score')
        total_active = all_active_users.count()
        below_me = all_active_users.filter(elo_score__lt=user.elo_score).count()
        percentile = round(below_me / total_active * 100, 1) if total_active > 0 else 0

        # 3. 核心统计
        week_reviews = last_week_qs.aggregate(total_reps=Sum('reps'))['total_reps'] or 0
        
        return Response({
            'user_nickname': user.nickname or user.username,
            'conversion_rate': conversion_rate,
            'permanent_count': permanent_assets,
            'elo_percentile': percentile,
            'week_reviews': week_reviews,
            'current_elo': user.elo_score,
            'report_date': f"{start_of_last_week.strftime('%Y.%m.%d')} - {end_of_last_week.strftime('%m.%d')}",
            'week_label': f"{start_of_last_week.isocalendar()[0]}-W{start_of_last_week.isocalendar()[1]}"
        })

class OnlineUserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)
    def get_queryset(self):
        now = timezone.now()
        five_mins_ago = now - datetime.timedelta(minutes=5)
        return User.objects.filter(last_active__gte=five_mins_ago)

class SystemConfigView(generics.RetrieveUpdateAPIView):
    queryset = SystemConfig.objects.all()
    serializer_class = SystemConfigSerializer
    def get_object(self):
        config, created = SystemConfig.objects.get_or_create(id=1)
        return config
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS: return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

class ResetEloView(generics.UpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request, *args, **kwargs):
        user = self.request.user
        if user.elo_reset_count >= 1:
            return Response({'error': 'You can only reset ELO once.'}, status=400)
        user.elo_score = 1000
        user.has_completed_initial_assessment = False
        user.elo_reset_count += 1
        user.save()
        return Response(UserSerializer(user).data)

from django.contrib.auth import authenticate
from rest_framework.views import APIView

class LoginView(APIView):
    permission_classes = (AllowAny,)
    
    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')
        
        print(f"DEBUG: Login attempt for username: {username}")
        
        if not username or not password:
            return Response({'error': '请提供用户名和密码'}, status=status.HTTP_400_BAD_REQUEST)
            
        user = authenticate(username=username, password=password)
        
        if user:
            token, created = Token.objects.get_or_create(user=user)
            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])
            return Response({
                'token': token.key,
                'user': UserSerializer(user).data
            })
        else:
            print(f"DEBUG: Authentication failed for user: {username}")
            return Response({'error': '用户名或密码错误'}, status=status.HTTP_401_UNAUTHORIZED)

class UserDetailView(generics.RetrieveAPIView):

    serializer_class = UserSerializer

    def get_object(self):

        user = self.request.user

        user.last_active = timezone.now()

        user.save()

        return user

class UpdateEmailView(generics.UpdateAPIView):
    serializer_class = UserSerializer
    def get_object(self): return self.request.user
    def patch(self, request, *args, **kwargs):
        user = self.get_object()
        email = request.data.get('email')
        if email:
            user.email = email
            user.save()
            return Response(UserSerializer(user).data)
        return Response({'error': 'Email required'}, status=400)

class UpdatePasswordView(generics.UpdateAPIView):
    def get_object(self): return self.request.user
    def patch(self, request, *args, **kwargs):
        user = self.get_object()
        old_p = request.data.get('old_password')
        new_p = request.data.get('new_password')
        if user.check_password(old_p):
            user.set_password(new_p)
            user.save()
            return Response({'status': 'ok'})
        return Response({'old_password': ['Wrong']}, status=400)
