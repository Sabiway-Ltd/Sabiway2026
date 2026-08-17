import os
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from posts.models import Comment, Like, Post, Reply
from profiles.models import Follow, Profile
from .models import Notification


@override_settings(EXPRESS_URL="http://realtime.test")
class ForumNotificationSignalTests(TestCase):
    def make_profile(self, email, full_name, username):
        user = get_user_model().objects.create_user(
            email=email,
            full_name=full_name,
            password="StrongPassword123!",
        )
        profile, _ = Profile.objects.get_or_create(
            user=user,
            defaults={"full_name": full_name, "username": username},
        )
        if profile.username != username:
            profile.username = username
            profile.full_name = full_name
            profile.save(update_fields=["username", "full_name", "initials", "address"])
        return profile

    @patch.dict(os.environ, {"INTERNAL_BROADCAST_TOKEN": "phase6-token"}, clear=False)
    @patch("notifications.realtime.requests.post")
    def test_like_notifies_post_author_and_uses_internal_header(self, mock_post):
        mock_post.return_value.ok = True
        author = self.make_profile("author@example.com", "Post Author", "post_author")
        actor = self.make_profile("actor@example.com", "Like Actor", "like_actor")
        post = Post.objects.create(author=author, content="Hello #SabiWay")

        Like.objects.create(user=actor, post=post)

        notification = Notification.objects.get(type="like", user=author, actor=actor)
        self.assertEqual(notification.target_object_id, str(post.id))
        mock_post.assert_called()
        _, kwargs = mock_post.call_args
        self.assertEqual(kwargs["headers"]["x-sabiway-internal-token"], "phase6-token")
        self.assertEqual(kwargs["json"]["userId"], str(author.user.id))

    @patch("notifications.realtime.requests.post")
    def test_self_like_does_not_create_notification(self, mock_post):
        author = self.make_profile("self@example.com", "Self User", "self_user")
        post = Post.objects.create(author=author, content="Own post")
        Notification.objects.all().delete()
        mock_post.reset_mock()

        Like.objects.create(user=author, post=post)

        self.assertFalse(Notification.objects.filter(type="like").exists())
        mock_post.assert_not_called()

    @patch("notifications.realtime.requests.post")
    def test_reply_deduplicates_same_recipient(self, mock_post):
        author = self.make_profile("author2@example.com", "Author Two", "author_two")
        replier = self.make_profile("reply@example.com", "Reply User", "reply_user")
        post = Post.objects.create(author=author, content="Discussion")
        comment = Comment.objects.create(user=author, post=post, content="Question")
        parent = Reply.objects.create(user=author, comment=comment, content="Parent reply")
        Notification.objects.all().delete()
        mock_post.reset_mock()

        Reply.objects.create(
            user=replier,
            comment=comment,
            parent_reply=parent,
            content="Nested reply",
        )

        self.assertEqual(
            Notification.objects.filter(type="reply", user=author, actor=replier).count(),
            1,
        )

    @patch("notifications.realtime.requests.post")
    def test_new_post_notifies_each_follower_once(self, mock_post):
        author = self.make_profile("creator@example.com", "Creator", "creator")
        follower = self.make_profile("follower@example.com", "Follower", "follower")
        Follow.objects.create(follower=follower, following=author)
        Notification.objects.all().delete()
        mock_post.reset_mock()

        Post.objects.create(author=author, content="New community update")

        Notification.objects.get(type="post", user=follower, actor=author)
        self.assertEqual(mock_post.call_count, 1)


@override_settings(EXPRESS_URL="http://realtime.test")
class NotificationReadRealtimeTests(TestCase):
    def setUp(self):
        self.recipient = get_user_model().objects.create_user(
            email="recipient@example.com",
            full_name="Recipient",
            password="StrongPassword123!",
        )
        self.actor = get_user_model().objects.create_user(
            email="actor-read@example.com",
            full_name="Actor",
            password="StrongPassword123!",
        )
        self.notification = Notification.objects.create(
            user=self.recipient.profile,
            actor=self.actor.profile,
            type="follow",
            message="Actor followed you.",
        )
        self.second = Notification.objects.create(
            user=self.recipient.profile,
            actor=self.actor.profile,
            type="post",
            message="Actor posted.",
        )
        self.client = APIClient()
        self.client.force_authenticate(self.recipient)

    @patch.dict(os.environ, {"INTERNAL_BROADCAST_TOKEN": "phase6-token"}, clear=False)
    @patch("notifications.realtime.requests.post")
    def test_mark_read_broadcasts_authoritative_unread_count_with_internal_token(self, mock_post):
        mock_post.return_value.ok = True
        response = self.client.patch(f"/api/notifications/{self.notification.id}/read/", {}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["unread_count"], 1)
        _, kwargs = mock_post.call_args
        self.assertEqual(kwargs["headers"]["x-sabiway-internal-token"], "phase6-token")
        self.assertEqual(kwargs["json"], {
            "userId": str(self.recipient.id),
            "notification": {"action": "update_unread_count", "unread_count": 1},
        })

    @patch.dict(os.environ, {"INTERNAL_BROADCAST_TOKEN": "phase6-token"}, clear=False)
    @patch("notifications.realtime.requests.post")
    def test_mark_all_read_broadcasts_zero_unread_count(self, mock_post):
        mock_post.return_value.ok = True
        response = self.client.patch("/api/notifications/read/all/", {}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["unread_count"], 0)
        self.assertEqual(Notification.objects.filter(user=self.recipient.profile, is_read=False).count(), 0)
        _, kwargs = mock_post.call_args
        self.assertEqual(kwargs["json"]["notification"], {
            "action": "update_unread_count",
            "unread_count": 0,
        })

    def test_user_cannot_mark_another_users_notification_read(self):
        outsider = get_user_model().objects.create_user(
            email="outsider@example.com",
            full_name="Outsider",
            password="StrongPassword123!",
        )
        foreign_notification = Notification.objects.create(
            user=outsider.profile,
            actor=self.actor.profile,
            type="follow",
            message="Actor followed outsider.",
        )
        response = self.client.patch(f"/api/notifications/{foreign_notification.id}/read/", {}, format="json")
        self.assertEqual(response.status_code, 404)
