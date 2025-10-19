"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useProfileStore } from "@/app/store/useProfileStore";
import { usePostStore } from "@/app/store/usePostStore";
import { useAuthStore } from "@/app/store/useAuthStore"; // ✅ for current user
import { BiEnvelope, BiLinkAlt } from "react-icons/bi";
import toast from "react-hot-toast";
import { Button } from "@/src/components/ui/button";
import { Loader2 } from "lucide-react"; // ✅ for spinner
import ProfilePostCard from "@/app/_components/profile/ProfilePostCard";
import CommunityNavbar from "@/app/_components/feed/CommunityNavbar";
import { CLOUDINARY_CLOUD_NAME } from "@/app/helper";
import { DEFAULT_AVATAR } from "@/app/utils/getProfileImage";

export default function ProfilePage() {
  const { username } = useParams();
  const { user } = useAuthStore(); // ✅ current logged-in user

  const {
    otherProfile,
    loading: profileLoading,
    error: profileError,
    getProfileByUsername,
    followingStatus,
    toggleFollow,
  } = useProfileStore();

  const {
    userPosts,
    loading: postsLoading,
    error: postsError,
    getPostsByUsername,
  } = usePostStore();

  const [loadingFollow, setLoadingFollow] = useState(false);

  // ✅ Fetch profile and posts on mount
  useEffect(() => {
    if (username) {
      getProfileByUsername(username as string);
      getPostsByUsername(username as string);
    }
  }, [username, getProfileByUsername, getPostsByUsername]);

  if (profileLoading || postsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  if (profileError || postsError) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-red-500">{profileError || postsError}</p>
      </div>
    );
  }

  if (!otherProfile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500">Profile not found.</p>
      </div>
    );
  }

  const {
    user_id,
    full_name,
    username: userUsername,
    profile_picture,
    followers_count,
    following_count,
    posts_count,
    email,
    bio,
  } = otherProfile;

  const isFollowing = followingStatus[user_id] || false;

  const handleCopyProfileLink = async () => {
    const profileUrl = `${window.location.origin}/profile/${userUsername}`;
    await navigator.clipboard.writeText(profileUrl);
    toast.success("Profile link copied");
  };

  const handleFollowToggle = async () => {
    setLoadingFollow(true);
    try {
      await toggleFollow(user_id);
    } finally {
      setLoadingFollow(false);
    }
  };

  return (
    <div>
      <div className="md:px-6 px-3">
        <CommunityNavbar onCreatePost={() => alert("Create Post Clicked")} />
      </div>

      <div className="max-w-3xl mx-auto pb-5 px-4">
        {/* 🔹 Header */}
        <div className="flex justify-center">
          <div className="flex gap-3 items-center">
            <img
               src={
                  profile_picture && profile_picture.startsWith("http")
                  ? profile_picture
                  : profile_picture
                  ? `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${profile_picture}`
                  : DEFAULT_AVATAR

                }
              alt={full_name}
              className="w-32 h-32 rounded-full object-cover border border-gray-300"
            />
            <div className="space-y-2">
              <h1 className="mt-4 text-2xl font-semibold">{full_name}</h1>

              <div className="flex items-center gap-2">
                <p className="text-gray-500">{userUsername}</p>
                <Button
                  onClick={handleCopyProfileLink}
                  variant="outline"
                  className="flex items-center gap-1 text-xs px-1 py-2 h-auto"
                >
                  <BiLinkAlt size={12} />
                </Button>

                {/* ✅ Follow / Unfollow button */}
                {user?.id !== user_id && (
                  <Button
                    onClick={handleFollowToggle}
                    disabled={loadingFollow}
                    variant={isFollowing ? "secondary" : "default"}
                    className={`text-xs px-3 py-2 h-auto ${
                      isFollowing
                        ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        : "bg-[#008753] text-white hover:bg-green-900"
                    }`}
                  >
                    {loadingFollow ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isFollowing ? (
                      "Following"
                    ) : (
                      "Follow"
                    )}
                  </Button>
                )}
              </div>

              {email && (
                <div className="text-gray-600 flex gap-1 items-center">
                  <BiEnvelope size={20} />
                  {email}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 🔹 Stats */}
        <div className="mt-6 flex justify-around text-center">
          <div>
            <p className="font-semibold text-lg">{followers_count}</p>
            <p className="text-gray-500 text-sm">Followers</p>
          </div>
          <div>
            <p className="font-semibold text-lg">{following_count}</p>
            <p className="text-gray-500 text-sm">Following</p>
          </div>
          <div>
            <p className="font-semibold text-lg">{posts_count}</p>
            <p className="text-gray-500 text-sm">Posts</p>
          </div>
        </div>

        {/* 🔹 Bio */}
        {bio && (
          <div className="mt-6">
            <h2 className="font-semibold text-lg mb-1">About</h2>
            <p className="text-gray-700 leading-relaxed">{bio}</p>
          </div>
        )}

        {/* 🔹 Posts Section */}
        <div className="mt-8">
          <h2 className="font-semibold text-lg mb-3">Posts</h2>

          {userPosts.length > 0 ? (
            <div className="space-y-6">
              {userPosts.map((post) => (
                <ProfilePostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No posts yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
