from rest_framework import serializers
from .models import User, SystemConfig, DailyPlan, ActivationCode

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'nickname', 'role', 'elo_score', 'avatar_url', 'avatar_style', 'avatar_seed', 'avatar_options', 'bio', 'is_online', 'current_task', 'current_timer_end', 'today_focused_minutes', 'today_completed_tasks', 'allow_broadcast', 'show_others_broadcast', 'has_completed_initial_assessment', 'elo_reset_count', 'is_member')
        read_only_fields = ('id', 'username', 'role', 'elo_score', 'avatar_url', 'is_online', 'is_member')

class ActivationCodeSerializer(serializers.ModelSerializer):
    used_by_username = serializers.CharField(source='used_by.username', read_only=True)
    
    class Meta:
        model = ActivationCode
        fields = '__all__'

class DailyPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyPlan
        fields = '__all__'
        read_only_fields = ('user',)

class SystemConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemConfig
        fields = ("school_name", "school_short_name", "school_description", "school_logo", "invite_code")

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("username", "password")

    def create(self, validated_data):
        # 如果是第一个用户，设为管理员且具有后台权限
        if User.objects.count() == 0:
            user = User.objects.create_superuser(
                username=validated_data["username"],
                password=validated_data["password"],
                nickname=validated_data["username"],
                role="admin"
            )
        else:
            user = User.objects.create_user(
                username=validated_data["username"],
                password=validated_data["password"],
                nickname=validated_data["username"],
                role="student"
            )
        return user
