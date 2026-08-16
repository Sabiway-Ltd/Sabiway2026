import os
from unittest.mock import patch

from django.test import TestCase, override_settings
from rest_framework.test import APIClient, APIRequestFactory

from accounts.models import User
from profiles.models import Follow, Profile
from profiles.serializers import ProfileSerializer

from .models import Bookmark, Comment, Hashtag, ModerationAudit, Post, PostReport, Reply
from .realtime import broadcast_forum_event


class ForumFixture(TestCase):
    def setUp(self):
        self.owner_user = User.objects.create_user(email="owner@example.com", full_name="Owner User", password="StrongPassword123!")
        self.other_user = User.objects.create_user(email="other@example.com", full_name="Other User", password="StrongPassword123!")
        self.staff_user = User.objects.create_user(email="staff@example.com", full_name="Staff User", password="StrongPassword123!", is_staff=True)

        # User creation already provisions a Profile through the accounts/profile signals.
        self.owner = Profile.objects.get(user=self.owner_user)
        self.owner.full_name = "Owner User"
        self.owner.username = "@owner"
        self.owner.phone_number = "07123456789"
        self.owner.street = "Private Street"
        self.owner.save()

        self.other = Profile.objects.get(user=self.other_user)
        self.other.full_name = "Other User"
        self.other.username = "@other"
        self.other.save()

        self.staff = Profile.objects.get(user=self.staff_user)
        self.staff.full_name = "Staff User"
        self.staff.username = "@staff"
        self.staff.save()

        self.post = Post.objects.create(author=self.owner, content="Original post #SabiWay")
        self.post.parse_and_attach_hashtags()
        self.comment = Comment.objects.create(user=self.owner, post=self.post, content="Owner comment")
        self.reply = Reply.objects.create(user=self.owner, comment=self.comment, content="Owner reply")
        self.client = APIClient()


class ForumOwnershipTests(ForumFixture):
    def test_non_owner_cannot_update_or_delete_post(self):
        self.client.force_authenticate(self.other_user)
        patch_response = self.client.patch(f"/api/posts/{self.post.id}/", {"content": "Hijacked"}, format="json")
        delete_response = self.client.delete(f"/api/posts/{self.post.id}/")
        self.assertEqual(patch_response.status_code, 403)
        self.assertEqual(delete_response.status_code, 403)
        self.post.refresh_from_db()
        self.assertEqual(self.post.content, "Original post #SabiWay")

    @patch("posts.views.broadcast_forum_event")
    def test_owner_can_update_post_and_broadcast(self, broadcast):
        self.client.force_authenticate(self.owner_user)
        response = self.client.patch(f"/api/posts/{self.post.id}/", {"content": "Updated by owner #Data"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.post.refresh_from_db()
        self.assertEqual(self.post.content, "Updated by owner #Data")
        self.assertTrue(Hashtag.objects.filter(tag="data", posts=self.post).exists())
        broadcast.assert_called_once()
        self.assertEqual(broadcast.call_args.args[0]["action"], "update")

    def test_non_owner_cannot_update_or_delete_comment(self):
        self.client.force_authenticate(self.other_user)
        self.assertEqual(self.client.patch(f"/api/posts/comments/{self.comment.id}/", {"content": "Hijacked"}, format="json").status_code, 403)
        self.assertEqual(self.client.delete(f"/api/posts/comments/{self.comment.id}/").status_code, 403)

    def test_non_owner_cannot_update_or_delete_reply(self):
        self.client.force_authenticate(self.other_user)
        self.assertEqual(self.client.patch(f"/api/posts/replies/{self.reply.id}/", {"content": "Hijacked"}, format="json").status_code, 403)
        self.assertEqual(self.client.delete(f"/api/posts/replies/{self.reply.id}/").status_code, 403)


class ForumJourneyTests(ForumFixture):
    @patch("posts.views.broadcast_forum_event")
    def test_create_post_extracts_hashtag(self, _broadcast):
        self.client.force_authenticate(self.other_user)
        response = self.client.post("/api/posts/", {"content": "Learning #Analytics with SabiWay"}, format="json")
        self.assertEqual(response.status_code, 201)
        created = Post.objects.get(id=response.data["id"])
        self.assertTrue(Hashtag.objects.filter(tag="analytics", posts=created).exists())

    def test_follow_and_unfollow_journey_updates_relationship(self):
        self.client.force_authenticate(self.other_user)
        follow = self.client.post(f"/api/profiles/{self.owner_user.id}/follow/")
        self.assertEqual(follow.status_code, 201)
        self.assertTrue(Follow.objects.filter(follower=self.other, following=self.owner).exists())
        self.owner.refresh_from_db()
        self.other.refresh_from_db()
        self.assertEqual(self.owner.followers_count, 1)
        self.assertEqual(self.other.following_count, 1)

        unfollow = self.client.post(f"/api/profiles/{self.owner_user.id}/unfollow/")
        self.assertEqual(unfollow.status_code, 200)
        self.assertFalse(Follow.objects.filter(follower=self.other, following=self.owner).exists())

    def test_bookmark_repost_and_unrepost_journey(self):
        self.client.force_authenticate(self.other_user)
        bookmark = self.client.post(f"/api/posts/{self.post.id}/bookmark/")
        self.assertEqual(bookmark.status_code, 201)
        self.assertTrue(Bookmark.objects.filter(user=self.other_user, post=self.post).exists())

        repost = self.client.post(f"/api/posts/{self.post.id}/repost/")
        self.assertEqual(repost.status_code, 201)
        self.assertTrue(Post.objects.filter(author=self.other, original_post=self.post).exists())

        duplicate = self.client.post(f"/api/posts/{self.post.id}/repost/")
        self.assertEqual(duplicate.status_code, 400)

        unrepost = self.client.delete(f"/api/posts/{self.post.id}/unrepost/")
        self.assertEqual(unrepost.status_code, 204)
        self.assertFalse(Post.objects.filter(author=self.other, original_post=self.post).exists())

    def test_hidden_post_is_not_publicly_discoverable(self):
        self.post.is_hidden = True
        self.post.save(update_fields=["is_hidden"])
        self.client.force_authenticate(user=None)
        self.assertEqual(self.client.get(f"/api/posts/{self.post.id}/").status_code, 404)
        feed = self.client.get("/api/posts/")
        self.assertEqual(feed.status_code, 200)
        ids = [str(item["id"]) for item in feed.data.get("results", feed.data)]
        self.assertNotIn(str(self.post.id), ids)

    def test_public_profile_serializer_does_not_leak_private_fields(self):
        request = APIRequestFactory().get("/")
        request.user = self.other_user
        data = ProfileSerializer(self.owner, context={"request": request}).data
        self.assertNotIn("email", data)
        self.assertNotIn("phone_number", data)
        self.assertNotIn("street", data)


class ModerationJourneyTests(ForumFixture):
    @patch("posts.views.send_resend_email")
    def test_report_remove_restore_records_immutable_audit_events(self, _email):
        self.client.force_authenticate(self.other_user)
        report_response = self.client.post(
            "/api/posts/report/",
            {"post_id": str(self.post.id), "reason": "Potential policy issue", "post_url": f"https://sabiway.com/posts/{self.post.id}"},
            format="json",
        )
        self.assertEqual(report_response.status_code, 201)
        report = PostReport.objects.get(id=report_response.data["report_id"])
        self.assertEqual(report.status, PostReport.Status.OPEN)
        self.assertTrue(ModerationAudit.objects.filter(report=report, action=ModerationAudit.Action.REPORTED).exists())

        self.client.force_authenticate(self.staff_user)
        with patch("posts.views.broadcast_forum_event"):
            remove = self.client.post(f"/api/posts/moderation/reports/{report.id}/action/", {"action": "remove", "note": "Reviewed and removed"}, format="json")
        self.assertEqual(remove.status_code, 200)
        self.post.refresh_from_db()
        report.refresh_from_db()
        self.assertTrue(self.post.is_hidden)
        self.assertEqual(report.status, PostReport.Status.REMOVED)
        self.assertTrue(ModerationAudit.objects.filter(report=report, action=ModerationAudit.Action.REMOVED).exists())

        with patch("posts.views.broadcast_forum_event"):
            restore = self.client.post(f"/api/posts/moderation/reports/{report.id}/action/", {"action": "restore", "note": "Appeal accepted"}, format="json")
        self.assertEqual(restore.status_code, 200)
        self.post.refresh_from_db()
        self.assertFalse(self.post.is_hidden)
        self.assertEqual(ModerationAudit.objects.filter(report=report).count(), 3)

    def test_non_staff_cannot_access_moderation_queue(self):
        self.client.force_authenticate(self.other_user)
        self.assertEqual(self.client.get("/api/posts/moderation/reports/").status_code, 403)


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
