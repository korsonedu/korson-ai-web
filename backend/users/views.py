from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny
from .serializers import UserSerializer, RegisterSerializer, SystemConfigSerializer, DailyPlanSerializer
from .models import User, SystemConfig, DailyPlan
from django.utils import timezone
import datetime

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
