import os
import threading
from django.db import connections
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import AIChatMessage, Bot
from .serializers import AIChatMessageSerializer, BotSerializer
from .utils import get_student_academic_context
from users.views import IsMember
from ai_service import AIService

def process_ai_chat(user, bot, user_message, api_key, pending_msg_id, history_limit=10):
    # Filter out pending messages from history
    history_objs = AIChatMessage.objects.filter(user=user, bot=bot).order_by('-timestamp')[:history_limit]
    history_msgs = [{"role": h.role, "content": h.content} for h in reversed(history_objs) if h.content != "[Thinking...]"]
    
    student_context = ""
    if bot and bot.is_exclusive:
        student_context = get_student_academic_context(user)

    try:
        res = AIService.chat_with_assistant(bot, history_msgs, user_message, student_context)
        
        pending_msg = AIChatMessage.objects.filter(id=pending_msg_id).first()
        
        if res and 'choices' in res:
            ai_content = res['choices'][0]['message']['content']
            finish_reason = res['choices'][0].get('finish_reason')
            
            # Format math
            ai_content = ai_content.replace('\\[', ' $$ ').replace('\\]', ' $$ ').replace('\\(', ' $ ').replace('\\)', ' $ ')
            
            if finish_reason == 'length':
                ai_content += "\n\n(已达到单次回复上限...)"
            
            if pending_msg:
                pending_msg.content = ai_content
                pending_msg.save()
        else:
            if pending_msg:
                pending_msg.content = "AI 助教暂时无法响应，请稍后再试。"
                pending_msg.save()
                
    except Exception as e:
        print(f"AI Chat Thread Error: {e}")
        pending_msg = AIChatMessage.objects.filter(id=pending_msg_id).first()
        if pending_msg:
            pending_msg.content = f"抱歉，连接中断: {str(e)}"
            pending_msg.save()
    finally:
        connections.close_all()

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
        return [IsMember()]

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
    permission_classes = [IsMember]

    def post(self, request):
        user_message = request.data.get('message')
        bot_id = request.data.get('bot_id')
        if not user_message: return Response({'error': 'Message is required'}, status=400)

        bot = Bot.objects.filter(id=bot_id).first()
        if bot: sync_bot_prompt(bot) 

        # 1. Save User Message
        AIChatMessage.objects.create(user=request.user, role='user', content=user_message, bot=bot)
        
        # 2. Create Pending Assistant Message
        pending_msg = AIChatMessage.objects.create(user=request.user, role='assistant', content="[Thinking...]", bot=bot)

        api_key = os.getenv('DEEPSEEK_API_KEY')
        
        # 3. Start Background Thread
        thread = threading.Thread(
            target=process_ai_chat,
            args=(request.user, bot, user_message, api_key, pending_msg.id)
        )
        thread.start()

        return Response({'status': 'pending'})

class AIChatListView(generics.ListAPIView):
    serializer_class = AIChatMessageSerializer
    permission_classes = [IsMember]
    def get_queryset(self):
        bot_id = self.request.query_params.get('bot_id')
        qs = AIChatMessage.objects.filter(user=self.request.user)
        if bot_id: qs = qs.filter(bot_id=bot_id)
        return qs

class AIChatResetView(APIView):
    permission_classes = [IsMember]
    def post(self, request):
        bot_id = request.data.get('bot_id')
        qs = AIChatMessage.objects.filter(user=request.user)
        if bot_id: qs = qs.filter(bot_id=bot_id)
        qs.delete()
        return Response({'status': 'cleared'})
