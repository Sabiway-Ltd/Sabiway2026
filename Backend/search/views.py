from django.db.models import Q
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from posts.models import Hashtag, Post
from posts.serializers import HashtagSerializer, PostListSerializer
from profiles.models import Profile


class SearchView(APIView):
    """Public discovery for SabiForum content, profiles and hashtags only.

    Marketplace discovery intentionally remains under /api/marketplace/ so the
    platform has one authoritative service/job search contract.
    """

    permission_classes = [permissions.AllowAny]
    supported_types = {"posts", "profiles", "hashtags"}
    result_limit = 25
    minimum_query_length = 2

    def get(self, request):
        query = request.GET.get("q", "").strip()
        search_type = request.GET.get("type", "posts").strip().lower()

        if search_type not in self.supported_types:
            return Response(
                {"detail": "Invalid search type. Use posts, profiles or hashtags."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(query) < self.minimum_query_length:
            return Response(
                {"detail": f"Search must contain at least {self.minimum_query_length} characters."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if search_type == "posts":
            posts = (
                Post.objects.filter(content__icontains=query)
                .order_by("-created_at")[: self.result_limit]
            )
            return Response(PostListSerializer(posts, many=True, context={"request": request}).data)

        if search_type == "profiles":
            profiles = (
                Profile.objects.select_related("user")
                .filter(Q(username__icontains=query) | Q(full_name__icontains=query))
                .order_by("username")[: self.result_limit]
            )
            return Response(
                [
                    {
                        "user_id": profile.user_id,
                        "username": profile.username,
                        "full_name": profile.full_name,
                        "profile_picture": str(profile.profile_picture) if profile.profile_picture else None,
                        "role": profile.user.role,
                    }
                    for profile in profiles
                ]
            )

        hashtags = (
            Hashtag.objects.filter(tag__icontains=query)
            .order_by("-use_count", "tag")[: self.result_limit]
        )
        return Response(HashtagSerializer(hashtags, many=True).data)
