# profiles/views.py

from rest_framework import viewsets, status, generics, permissions
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Profile, Follow, generate_initials
from .serializers import ProfileSerializer
from .permissions import IsProfileOwnerOrReadOnly
from django.db.models import F, Count




class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.select_related("user").all()
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated, IsProfileOwnerOrReadOnly]
    lookup_field = "user_id"

    def get_object(self):
        user_id = self.kwargs.get(self.lookup_field)
        return get_object_or_404(Profile, user__id=user_id)

    def get_or_create_profile(self, user):
        """Ensure user always has a profile"""
        profile, _ = Profile.objects.get_or_create(
            user=user,
            defaults={
                "full_name": getattr(user, "full_name", None) or user.email.split("@")[0],
                "initials": generate_initials(getattr(user, "full_name", None) or user.email.split("@")[0]),
                "username": f"@{user.email.split('@')[0]}",
            }
        )
        return profile

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def follow(self, request, user_id=None):
        target = self.get_object()
        follower_profile = self.get_or_create_profile(request.user)

        if follower_profile == target:
            return Response({"detail": "Cannot follow yourself."}, status=status.HTTP_400_BAD_REQUEST)

        obj, created = Follow.objects.get_or_create(follower=follower_profile, following=target)
        if created:
            # Update counts using the correct related_names
            follower_profile.following_count = follower_profile.following_rel.count()
            follower_profile.save(update_fields=["following_count"])
            target.followers_count = target.followers_rel.count()
            target.save(update_fields=["followers_count"])
            return Response({"detail": "Followed"}, status=status.HTTP_201_CREATED)

        return Response({"detail": "Already following"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def unfollow(self, request, user_id=None):
        target = self.get_object()
        follower_profile = self.get_or_create_profile(request.user)

        deleted, _ = Follow.objects.filter(follower=follower_profile, following=target).delete()
        if deleted:
            # Update counts using the correct related_names
            follower_profile.following_count = follower_profile.following_rel.count()
            follower_profile.save(update_fields=["following_count"])
            target.followers_count = target.followers_rel.count()
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
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        """Return the profile of the logged-in user"""
        # Profile ID now matches User ID
        profile, _ = Profile.objects.get_or_create(
            user=self.request.user,
            defaults={
                "full_name": getattr(self.request.user, "full_name", None) or self.request.user.email.split("@")[0],
                "initials": generate_initials(getattr(self.request.user, "full_name", None) or self.request.user.email.split("@")[0]),
                "username": f"@{self.request.user.email.split('@')[0]}",
            }
        )
        return profile



class TopContributorsView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        contributors = (
            Profile.objects
            .annotate(
                comments_count=Count("comments", distinct=True),   # assumes related_name="comments"
                likes_received=Count("likes", distinct=True),      # assumes related_name="likes"
            )
            .annotate(
                score=F("posts_count") + F("comments_count") + F("likes_received")
            )
            .order_by("-score")[:10]
        )

        data = [{
            "user_id": p.pk,  # profile ID == user ID
            "username": p.username,
            "full_name": p.full_name,
            "profile_picture": str(p.profile_picture) if p.profile_picture else None,
            "score": p.score,
        } for p in contributors]

        return Response(data)

class MyFollowersView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = Profile.objects.get(user=request.user)
        # Get followers directly via queryset
        followers_qs = Profile.objects.filter(following_rel__following=profile).select_related("user")
        serializer = ProfileSerializer(followers_qs, many=True, context={'request': request})
        return Response(serializer.data)


class MyFollowingView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = Profile.objects.get(user=request.user)
        # Get following directly via queryset
        following_qs = Profile.objects.filter(followers_rel__follower=profile).select_related("user")
        serializer = ProfileSerializer(following_qs, many=True, context={'request': request})
        return Response(serializer.data)
