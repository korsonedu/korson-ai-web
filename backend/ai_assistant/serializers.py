from rest_framework import serializers
from .models import AIChatMessage, Bot

class BotSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bot
        fields = '__all__'

class AIChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIChatMessage
        fields = ('role', 'content', 'timestamp', 'bot')
