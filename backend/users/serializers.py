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
        fields = ("school_name", "school_short_name", "school_description", "school_logo", "invite_code")

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    invite_code = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ("username", "password", "invite_code")

    def validate(self, attrs):
        # 如果是第一个用户，不强制要求邀请码
        if User.objects.count() == 0:
            return attrs
            
        invite_code = attrs.get("invite_code")
        if not invite_code:
            raise serializers.ValidationError({"invite_code": "请填写邀请码"})
            
        config = SystemConfig.objects.first()
        if config and invite_code != config.invite_code:
            raise serializers.ValidationError({"invite_code": "邀请码无效"})
            
        return attrs

    def create(self, validated_data):
        # 移除邀请码，因为模型中没有该字段
        validated_data.pop("invite_code", None)
        
        # 如果是第一个用户，设为管理员且具有后台权限
        if User.objects.count() == 0:
            user = User.objects.create_superuser(
                username=validated_data["username"],
                password=validated_data["password"],
                role="admin"
            )
        else:
            user = User.objects.create_user(
                username=validated_data["username"],
                password=validated_data["password"],
                role="student"
            )
        return user
