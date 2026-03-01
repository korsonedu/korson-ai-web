import datetime

from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import User


class PresenceHeartbeatTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="testpass123")
        self.client.force_authenticate(user=self.user)

    def test_heartbeat_updates_presence_and_task(self):
        previous_last_active = self.user.last_active

        resp = self.client.post(
            "/api/users/heartbeat/",
            {
                "current_task": "数学刷题",
                "current_timer_end": (timezone.now() + datetime.timedelta(minutes=25)).isoformat(),
            },
            format="json",
        )

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.current_task, "数学刷题")
        self.assertIsNotNone(self.user.current_timer_end)
        self.assertGreaterEqual(self.user.last_active, previous_last_active)

    def test_online_list_excludes_stale_users(self):
        stale_user = User.objects.create_user(username="stale", password="testpass123")
        fresh_user = User.objects.create_user(username="fresh", password="testpass123")

        active_window = getattr(settings, "ONLINE_USER_ACTIVE_WINDOW_SECONDS", 300)
        User.objects.filter(pk=stale_user.pk).update(
            last_active=timezone.now() - datetime.timedelta(seconds=active_window + 60)
        )
        User.objects.filter(pk=fresh_user.pk).update(last_active=timezone.now())

        resp = self.client.get("/api/users/online/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        usernames = {item["username"] for item in resp.data}
        self.assertIn("fresh", usernames)
        self.assertNotIn("stale", usernames)

    def test_heartbeat_rejects_invalid_timer_format(self):
        resp = self.client.post(
            "/api/users/heartbeat/",
            {"current_timer_end": "not-a-datetime"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
