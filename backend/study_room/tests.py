from rest_framework import status
from rest_framework.test import APITestCase

from study_room.models import ChatMessage
from users.models import User


class UndoBroadcastTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="u1", password="pass123", is_member=True)
        self.other = User.objects.create_user(username="u2", password="pass123", is_member=True)
        self.client.force_authenticate(user=self.user)

    def test_can_undo_latest_normal_message(self):
        msg = ChatMessage.objects.create(user=self.user, content="普通聊天消息")

        resp = self.client.post(f"/api/study/messages/{msg.id}/undo/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertFalse(ChatMessage.objects.filter(id=msg.id).exists())

    def test_can_undo_latest_task_state_message_even_if_not_latest_overall(self):
        task_msg = ChatMessage.objects.create(user=self.user, content="💪 开始了“宏观专题”任务")
        ChatMessage.objects.create(user=self.user, content="后续普通消息")

        resp = self.client.post(f"/api/study/messages/{task_msg.id}/undo/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertFalse(ChatMessage.objects.filter(id=task_msg.id).exists())

    def test_cannot_undo_non_latest_and_non_task_state_message(self):
        old_msg = ChatMessage.objects.create(user=self.user, content="更早的一条普通消息")
        ChatMessage.objects.create(user=self.user, content="最新普通消息")

        resp = self.client.post(f"/api/study/messages/{old_msg.id}/undo/")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(ChatMessage.objects.filter(id=old_msg.id).exists())
