import os
import requests
import json
import datetime
import re
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import AIChatMessage, Bot
from .serializers import AIChatMessageSerializer, BotSerializer
from .utils import get_student_academic_context

def get_ai_template(filename):
    path = os.path.join(os.path.dirname(__file__), 'templates', filename)
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    return ""

def get_bot_prompt_path(bot):
    base_dir = os.path.join(os.path.dirname(__file__), 'templates', 'bots')
    if not os.path.exists(base_dir):
        os.makedirs(base_dir)
    return os.path.join(base_dir, f"bot_{bot.id}_prompt.txt")

def sync_bot_prompt(bot):
    """双向同步核心：确保数据库与物理文件一致"""
    path = get_bot_prompt_path(bot)
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        if bot.system_prompt != content:
            bot.system_prompt = content
            bot.save(update_fields=['system_prompt'])
    else:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(bot.system_prompt)

class BotListCreateView(generics.ListCreateAPIView):
    serializer_class = BotSerializer
    def get_permissions(self):
        if self.request.method == 'POST': return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        bots = Bot.objects.all()
        for bot in bots: sync_bot_prompt(bot)
        return bots

    def perform_create(self, serializer):
        bot = serializer.save()
        sync_bot_prompt(bot) # 创建时立即生成物理文件

class BotDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Bot.objects.all()
    serializer_class = BotSerializer
    permission_classes = [permissions.IsAdminUser]

    def perform_update(self, serializer):
        bot = serializer.save()
        # 前端修改后，强制覆盖物理文件
        path = get_bot_prompt_path(bot)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(bot.system_prompt)

    def perform_destroy(self, instance):
        # 删除数据库记录前，先删除物理文件
        path = get_bot_prompt_path(instance)
        if os.path.exists(path):
            try:
                os.remove(path)
            except Exception as e:
                print(f"Error deleting file {path}: {str(e)}")
        instance.delete()

class AIChatView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user_message = request.data.get('message')
        bot_id = request.data.get('bot_id')
        if not user_message: return Response({'error': 'Message is required'}, status=400)

        bot = Bot.objects.filter(id=bot_id).first()
        if bot: sync_bot_prompt(bot) # 对话前进行终极同步

        AIChatMessage.objects.create(user=request.user, role='user', content=user_message, bot=bot)

        api_key = os.getenv('DEEPSEEK_API_KEY')
        url = "https://api.deepseek.com/chat/completions"
        headers = {"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"}

        # 优先级：机器人专属Prompt > 物理文件同步后的Prompt > 基础模板
        base_system_prompt = bot.system_prompt if (bot and bot.system_prompt) else get_ai_template('base_assistant_prompt.txt')
        
        if bot and bot.is_exclusive:
            student_context = get_student_academic_context(request.user)
            mentor_template = get_ai_template('exclusive_mentor_prompt.txt')
            full_system_prompt = mentor_template.format(student_context=student_context)
            if bot.system_prompt:
                full_system_prompt = f"{bot.system_prompt}\n\n{full_system_prompt}"
        else:
            full_system_prompt = base_system_prompt

        history_objs = AIChatMessage.objects.filter(user=request.user, bot=bot).order_by('-timestamp')[:10]
        history_msgs = [{"role": h.role, "content": h.content} for h in reversed(history_objs)]
        messages = [{"role": "system", "content": full_system_prompt}] + history_msgs

        data = {"model": "deepseek-chat", "messages": messages, "stream": False}

        try:
            response = requests.post(url, headers=headers, json=data, timeout=60)
            result = response.json()
            ai_content = result['choices'][0]['message']['content']
            ai_content = ai_content.replace('\\[', ' $$ ').replace('\\]', ' $$ ').replace('\\(', ' $ ').replace('\\)', ' $ ')
            AIChatMessage.objects.create(user=request.user, role='assistant', content=ai_content, bot=bot)
            return Response({'content': ai_content})
        except Exception as e:
            return Response({'error': f'连接 AI 失败: {str(e)}'}, status=500)

class AIChatListView(generics.ListAPIView):
    serializer_class = AIChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        bot_id = self.request.query_params.get('bot_id')
        qs = AIChatMessage.objects.filter(user=self.request.user)
        if bot_id: qs = qs.filter(bot_id=bot_id)
        return qs

class AIChatResetView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        bot_id = request.data.get('bot_id')
        qs = AIChatMessage.objects.filter(user=request.user)
        if bot_id: qs = qs.filter(bot_id=bot_id)
        qs.delete()
        return Response({'status': 'cleared'})
