from rest_framework import serializers
from .models import AIChatMessage, Bot
from .prompt_sync import get_bot_prompt_path, get_bot_prompt_template_name

class BotSerializer(serializers.ModelSerializer):
    prompt_template_name = serializers.SerializerMethodField()
    prompt_file_exists = serializers.SerializerMethodField()

    class Meta:
        model = Bot
        fields = (
            'id',
            'name',
            'avatar',
            'system_prompt',
            'is_exclusive',
            'is_active',
            'created_at',
            'prompt_template_name',
            'prompt_file_exists',
        )
        read_only_fields = ('id', 'created_at', 'prompt_template_name', 'prompt_file_exists')

    def get_prompt_template_name(self, obj):
        return get_bot_prompt_template_name(obj)

    def get_prompt_file_exists(self, obj):
        return get_bot_prompt_path(obj).exists()

class AIChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIChatMessage
        fields = ('role', 'content', 'timestamp', 'bot')
