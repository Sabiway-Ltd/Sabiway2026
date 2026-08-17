from django.db.models import Q
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from operations.analytics import record_product_event
from posts.models import Hashtag, Post
from posts.serializers import HashtagSerializer, PostListSerializer
from profiles.models import Profile


class SearchView(APIView):
    permission_classes = [permissions.AllowAny]
    supported_types = {"posts", "profiles", "hashtags"}
    result_limit = 25
    minimum_query_length = 2
    maximum_query_length = 120

    def _measure(self, request, search_type, query, count):
        record_product_event(
            "search_performed",
            actor=request.user,
            properties={"category": search_type, "query_length": len(query), "result_count": count},
        )

    def get(self, request):
        query = request.GET.get("q", "").strip()
        search_type = request.GET.get("type", "posts").strip().lower()
        if search_type not in self.supported_types:
            return Response({"detail": "Invalid search type. Use posts, profiles or hashtags."}, status=status.HTTP_400_BAD_REQUEST)
        if len(query) < self.minimum_query_length:
            return Response({"detail": f"Search must contain at least {self.minimum_query_length} characters."}, status=status.HTTP_400_BAD_REQUEST)
        if len(query) > self.maximum_query_length:
            return Response({"detail": f"Search must contain no more than {self.maximum_query_length} characters."}, status=status.HTTP_400_BAD_REQUEST)

        if search_type == "posts":
            posts = list(Post.objects.filter(content__icontains=query).order_by("-created_at")[: self.result_limit])
            self._measure(request, search_type, query, len(posts))
            return Response(PostListSerializer(posts, many=True, context={"request": request}).data)
        if search_type == "profiles":
            profiles = list(Profile.objects.select_related("user").filter(Q(username__icontains=query) | Q(full_name__icontains=query)).order_by("username")[: self.result_limit])
            self._measure(request, search_type, query, len(profiles))
            return Response([{"user_id":p.user_id,"username":p.username,"full_name":p.full_name,"profile_picture":str(p.profile_picture) if p.profile_picture else None,"role":p.user.role} for p in profiles])
        hashtags = list(Hashtag.objects.filter(tag__icontains=query).order_by("-use_count", "tag")[: self.result_limit])
        self._measure(request, search_type, query, len(hashtags))
        return Response(HashtagSerializer(hashtags, many=True).data)
