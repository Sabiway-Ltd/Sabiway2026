from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User
from .models import Comment, Post, Reply


class Phase5ForumSafetyTests(TestCase):
    def setUp(self):
        self.author_user = User.objects.create_user(
            email="phase5-author@example.com",
            full_name="Phase Five Author",
            password="StrongPassword123!",
            role=User.Role.CLIENT,
        )
        self.reader_user = User.objects.create_user(
            email="phase5-reader@example.com",
            full_name="Phase Five Reader",
            password="StrongPassword123!",
            role=User.Role.CLIENT,
        )
        self.author = self.author_user.profile
        self.reader = self.reader_user.profile
        self.author.phone_number = "+2348012345678"
        self.author.save(update_fields=["phone_number"])
        self.client = APIClient()
        self.client.force_authenticate(self.reader_user)
        self.post = Post.objects.create(author=self.author, content="Community safety test")
        self.comment = Comment.objects.create(user=self.author, post=self.post, content="First comment")

    def test_comment_and_reply_payloads_do_not_expose_phone_number(self):
        comment_response = self.client.get(f"/api/posts/{self.post.id}/comments/")
        self.assertEqual(comment_response.status_code, 200)
        self.assertNotIn("phone_number", comment_response.data[0]["user"])

        reply = Reply.objects.create(user=self.author, comment=self.comment, content="A reply")
        reply_response = self.client.get(f"/api/posts/comments/{self.comment.id}/replies/")
        self.assertEqual(reply_response.status_code, 200)
        matching = next(item for item in reply_response.data if str(item["id"]) == str(reply.id))
        self.assertNotIn("phone_number", matching["user"])

    def test_direct_comment_and_reply_creation_reject_hidden_posts(self):
        self.post.is_hidden = True
        self.post.save(update_fields=["is_hidden"])

        comment_response = self.client.post(
            "/api/posts/comments/",
            {"post": str(self.post.id), "content": "Should not publish"},
            format="json",
        )
        self.assertEqual(comment_response.status_code, 400)

        reply_response = self.client.post(
            "/api/posts/replies/",
            {"comment": str(self.comment.id), "content": "Should not publish"},
            format="json",
        )
        self.assertEqual(reply_response.status_code, 400)

    def test_parent_reply_must_belong_to_same_comment(self):
        second_comment = Comment.objects.create(user=self.author, post=self.post, content="Second comment")
        parent = Reply.objects.create(user=self.author, comment=self.comment, content="Parent")

        response = self.client.post(
            "/api/posts/replies/",
            {
                "comment": str(second_comment.id),
                "parent_reply": str(parent.id),
                "content": "Invalid nesting",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("parent_reply", response.data)

    def test_post_page_size_is_capped_at_fifty(self):
        Post.objects.bulk_create(
            [Post(author=self.author, content=f"Feed item {index}") for index in range(60)]
        )
        response = self.client.get("/api/posts/", {"page_size": 400})
        self.assertEqual(response.status_code, 200)
        self.assertLessEqual(len(response.data["results"]), 50)
        self.assertIsNotNone(response.data["next"])
