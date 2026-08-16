import os
from unittest.mock import patch

from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from accounts.models import User
from profiles.models import Profile

from .models import Comment, Post, Reply
from .realtime import broadcast_forum_event


class ForumOwnershipTests(TestCase):
    def setUp(self):
        self.owner_user = User.objects.create_user(
            email="owner@example.com",
            full_name="Owner User",
            password="StrongPassword123!",
        )
        self.other_user = User.objects.create_user(
            email="other@example.com",
            full_name="Other User",
            password="StrongPassword123!",
        )
        self.owner = Profile.objects.create(
            user=self.owner_user,
            full_name="Owner User",
            username="@owner",
        )
        self.other = Profile.objects.create(
            user=self.other_user,
            full_name="Other User",
            username="@other",
        )
        self.post = Post.objects.create(author=self.owner, content="Original post")
        self.comment = Comment.objects.create(
            user=self.owner,
            post=self.post,
            content="Owner comment",
        )
        self.reply = Reply.objects.create(
            user=self.owner,
            comment=self.comment,
            content="Owner reply",
        )
        self.client = APIClient()

    def test_non_owner_cannot_update_or_delete_post(self):
        self.client.force_authenticate(self.other_user)
        patch_response = self.client.patch(
            f"/api/posts/{self.post.id}/",
            {"content": "Hijacked"},
            format="json",
        )
        delete_response = self.client.delete(f"/api/posts/{self.post.id}/")

        self.assertEqual(patch_response.status_code, 403)
        self.assertEqual(delete_response.status_code, 403)
        self.post.refresh_from_db()
        self.assertEqual(self.post.content, "Original post")

    @patch("posts.views.broadcast_forum_event")
    def test_owner_can_update_post_and_broadcast(self, broadcast):
        self.client.force_authenticate(self.owner_user)
        response = self.client.patch(
            f"/api/posts/{self.post.id}/",
            {"content": "Updated by owner"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.post.refresh_from_db()
        self.assertEqual(self.post.content, "Updated by owner")
        broadcast.assert_called_once()
        self.assertEqual(broadcast.call_args.args[0]["action"], "update")

    def test_non_owner_cannot_update_or_delete_comment(self):
        self.client.force_authenticate(self.other_user)
        patch_response = self.client.patch(
            f"/api/posts/comments/{self.comment.id}/",
            {"content": "Hijacked comment"},
            format="json",
        )
        delete_response = self.client.delete(f"/api/posts/comments/{self.comment.id}/")

        self.assertEqual(patch_response.status_code, 403)
        self.assertEqual(delete_response.status_code, 403)

    def test_non_owner_cannot_update_or_delete_reply(self):
        self.client.force_authenticate(self.other_user)
        patch_response = self.client.patch(
            f"/api/posts/replies/{self.reply.id}/",
            {"content": "Hijacked reply"},
            format="json",
        )
        delete_response = self.client.delete(f"/api/posts/replies/{self.reply.id}/")

        self.assertEqual(patch_response.status_code, 403)
        self.assertEqual(delete_response.status_code, 403)


class RealtimeBroadcastTests(TestCase):
    @override_settings(EXPRESS_URL="http://realtime:5000")
    @patch.dict(os.environ, {"INTERNAL_BROADCAST_TOKEN": "test-internal-token"}, clear=False)
    @patch("posts.realtime.requests.post")
    def test_broadcast_uses_internal_authentication_header(self, post):
        result = broadcast_forum_event({"action": "delete", "post_id": "abc"})

        self.assertTrue(result)
        post.assert_called_once_with(
            "http://realtime:5000/broadcast",
            json={"action": "delete", "post_id": "abc"},
            headers={"x-sabiway-internal-token": "test-internal-token"},
            timeout=2,
        )
