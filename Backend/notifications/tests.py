from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings

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

    @patch("notifications.signals.requests.post")
    def test_like_notifies_post_author_and_uses_internal_header(self, mock_post):
        author = self.make_profile("author@example.com", "Post Author", "post_author")
        actor = self.make_profile("actor@example.com", "Like Actor", "like_actor")
        post = Post.objects.create(author=author, content="Hello #SabiWay")

        Like.objects.create(user=actor, post=post)

        notification = Notification.objects.get(type="like", user=author, actor=actor)
        self.assertEqual(notification.target_object_id, str(post.id))
        mock_post.assert_called()

    @patch("notifications.signals.requests.post")
    def test_self_like_does_not_create_notification(self, mock_post):
        author = self.make_profile("self@example.com", "Self User", "self_user")
        post = Post.objects.create(author=author, content="Own post")
        Notification.objects.all().delete()
        mock_post.reset_mock()

        Like.objects.create(user=author, post=post)

        self.assertFalse(Notification.objects.filter(type="like").exists())
        mock_post.assert_not_called()

    @patch("notifications.signals.requests.post")
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

    @patch("notifications.signals.requests.post")
    def test_new_post_notifies_each_follower_once(self, mock_post):
        author = self.make_profile("creator@example.com", "Creator", "creator")
        follower = self.make_profile("follower@example.com", "Follower", "follower")
        Follow.objects.create(follower=follower, following=author)
        Notification.objects.all().delete()
        mock_post.reset_mock()

        post = Post.objects.create(author=author, content="New community update")

        notification = Notification.objects.get(type="post", user=follower, actor=author)
        self.assertEqual(notification.target_object_id, str(post.id))
        self.assertEqual(mock_post.call_count, 1)
