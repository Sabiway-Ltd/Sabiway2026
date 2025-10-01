from rest_framework import viewsets, status, generics, permissions
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Profile, Follow
from .serializers import ProfileSerializer
from .permissions import IsProfileOwnerOrReadOnly


class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.select_related("user").all()
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated, IsProfileOwnerOrReadOnly]
    lookup_field = "user_id"   # we want to use the related User’s id in URLs

    def get_object(self):
        """Override to fetch profile by user_id instead of profile pk."""
        user_id = self.kwargs.get(self.lookup_field)
        return get_object_or_404(Profile, user__id=user_id)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def follow(self, request, user_id=None):
        target = self.get_object()
        follower_profile = request.user.profile

        if follower_profile == target:
            return Response({"detail": "Cannot follow yourself."}, status=status.HTTP_400_BAD_REQUEST)

        obj, created = Follow.objects.get_or_create(follower=follower_profile, following=target)
        if created:
            follower_profile.following_count += 1
            follower_profile.save(update_fields=["following_count"])
            target.followers_count += 1
            target.save(update_fields=["followers_count"])
            return Response({"detail": "Followed"}, status=status.HTTP_201_CREATED)
        return Response({"detail": "Already following"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def unfollow(self, request, user_id=None):
        target = self.get_object()
        follower_profile = request.user.profile

        deleted, _ = Follow.objects.filter(follower=follower_profile, following=target).delete()
        if deleted:
            follower_profile.following_count = max(0, follower_profile.following_count - 1)
            follower_profile.save(update_fields=["following_count"])
            target.followers_count = max(0, target.followers_count - 1)
            target.save(update_fields=["followers_count"])
            return Response({"detail": "Unfollowed"}, status=status.HTTP_200_OK)

        return Response({"detail": "Not following"}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["get"], permission_classes=[IsAuthenticated])
    def followers(self, request, user_id=None):
        target = self.get_object()
        qs = target.followers_rel.select_related("follower__user").all()
        profiles = [f.follower for f in qs]
        serializer = ProfileSerializer(profiles, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], permission_classes=[IsAuthenticated])
    def following(self, request, user_id=None):
        target = self.get_object()
        qs = target.following_rel.select_related("following__user").all()
        profiles = [f.following for f in qs]
        serializer = ProfileSerializer(profiles, many=True)
        return Response(serializer.data)


class ProfileDetailView(generics.RetrieveUpdateAPIView):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user.profile
