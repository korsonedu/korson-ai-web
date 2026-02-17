from rest_framework import serializers
from .models import User, SystemConfig, DailyPlan

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'role', 'elo_score', 'avatar_url', 'avatar_style', 'avatar_seed', 'avatar_options', 'bio', 'is_online', 'current_task', 'current_timer_end', 'today_focused_minutes', 'today_completed_tasks', 'allow_broadcast', 'show_others_broadcast', 'has_completed_initial_assessment', 'elo_reset_count')
        read_only_fields = ('id', 'role', 'elo_score', 'avatar_url', 'is_online')

class DailyPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyPlan
        fields = '__all__'
        read_only_fields = ('user',)

class SystemConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemConfig
        fields = ('school_name', 'school_short_name', 'school_description', 'school_logo')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'password', 'role')

    def create(self, validated_data):
        # 如果是第一个用户，设为管理员且具有后台权限
        if User.objects.count() == 0:
            user = User.objects.create_superuser(
                username=validated_data['username'],
                password=validated_data['password'],
                role='admin'
            )
        else:
            user = User.objects.create_user(
                username=validated_data['username'],
                password=validated_data['password'],
                role='student'
            )
        return user
