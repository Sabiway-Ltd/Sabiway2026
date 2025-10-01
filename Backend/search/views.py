# search/views.py
from django.shortcuts import render
from django.db.models import Q
from rest_framework.response import Response
from rest_framework.views import APIView

from posts.models import Post, Hashtag, Comment, Reply
from posts.serializers import PostListSerializer, HashtagSerializer
from profiles.models import Profile

class SearchView(APIView):
    def get(self, request):
        q = request.GET.get("q", "")
        search_type = request.GET.get("type", "posts")

        if search_type == "posts":
            posts = Post.objects.filter(Q(content__icontains=q)).order_by("-created_at")[:50]
            return Response(PostListSerializer(posts, many=True).data)

        elif search_type == "profiles":
            profiles = Profile.objects.filter(
                Q(username__icontains=q) | Q(full_name__icontains=q)
            )[:50]
            return Response([
                {
                    "user_id": p.user.id,
                    "username": p.username,
                    "full_name": p.full_name,
                    "profile_picture": str(p.profile_picture) if p.profile_picture else None,
                } for p in profiles
            ])

        elif search_type == "hashtags":
            tags = Hashtag.objects.filter(tag__icontains=q).order_by("-use_count")[:50]
            return Response(HashtagSerializer(tags, many=True).data)

        return Response({"detail": "Invalid search type"}, status=400)
