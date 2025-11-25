"use client";

import { useState, useEffect } from "react";
import { BiLinkAlt } from "react-icons/bi";
import toast from "react-hot-toast";
import { Loader2, Smartphone } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import ProfileImageModal from "@/app/_components/common/ProfileImageModal";
import IconTooltipButton from "@/app/_components/common/IconTooltipButton";
import { RenderPostList } from "../common/RenderPostList ";
import { DEFAULT_AVATAR } from "@/app/utils/getProfileImage";
import { CLOUDINARY_CLOUD_NAME, DEFAULT_PROFILE_PICTURE } from "@/app/helper";
import { useProfileStore } from "@/app/store/useProfileStore";
import { usePostStore } from "@/app/store/usePostStore";
import ProfilePageSkeleton from "./ProfilePageSkeleton";

interface ProfileProps {
  username: string;
  currentUserId?: string;
}

export default function UserProfile({ username, currentUserId }: ProfileProps) {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [loadingFollow, setLoadingFollow] = useState(false);

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
    resetUserPosts,
    userNextPage,
    userHasMore,
    getPostById,
  } = usePostStore();

  // Fetch profile + posts
  useEffect(() => {
    if (username) {
      resetUserPosts();
      getProfileByUsername(username);
      getPostsByUsername(username, 1);
    }
  }, [username]);

  // Handle follow toggle
  const handleFollowToggle = async () => {
    if (!otherProfile) return;
    setLoadingFollow(true);
    try {
      await toggleFollow(otherProfile.user_id);
    } finally {
      setLoadingFollow(false);
    }
  };

  // Copy profile link
  const handleCopyProfileLink = async () => {
    if (!otherProfile) return;
    const profileUrl = `${window.location.origin}/profile/${otherProfile.username.replace("@", "")}`;
    await navigator.clipboard.writeText(profileUrl);
    toast.success("Profile link copied");
  };

  if (profileLoading || (postsLoading && userPosts.length === 0)) {
    return(
        <ProfilePageSkeleton/>
    )
  }

  if (profileError || postsError) {
    return <p className="text-red-500">{profileError || postsError}</p>;
  }

  if (!otherProfile) {
    return <p className="text-gray-500"></p>;
  }

  const {
    user_id,
    full_name,
    username: userUsername,
    profile_picture,
    followers_count,
    following_count,
    posts_count,
    job,
  } = otherProfile;

  const isFollowing = followingStatus[user_id] || false;

  return (
    <div className="max-w-3xl mx-auto pb-5 md:px-4 px-2">
      {/* Profile Header */}
      <div className="flex flex-col items-center gap-4 mb-8 relative">
        {/* Profile Picture */}
        <div className="relative w-[100px] h-[100px]">
          <div className="relative w-24 h-24 py-1 px-1 rounded-full overflow-hidden shadow-sm bg-[#0087530D]/50">
            <button
              onClick={() => setIsImageModalOpen(true)}
              className="block w-full h-full focus:outline-none"
            >
              <img
                src={
                  profile_picture?.startsWith("http")
                    ? profile_picture
                    : profile_picture
                    ? `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${profile_picture}`
                    : DEFAULT_AVATAR
                }
                alt={full_name}
                className="w-full h-full rounded-full object-cover transition-transform duration-200 hover:scale-105"
                onError={(e) => (e.currentTarget.src = DEFAULT_AVATAR)}
              />
            </button>
          </div>
        </div>

        {/* Profile Info */}
        <div className="text-center">
          <h1 className="text-xl font-bold text-[#008753]">{full_name}</h1>

          <div className="flex items-center justify-center gap-1">
            <p className="text-gray-600">{userUsername}</p>
            <button
              onClick={handleCopyProfileLink}
              className="flex items-center gap-1 text-xs ml-2 h-auto rounded-md text-[#008753] hover:text-green-900 transition"
            >
              <BiLinkAlt size={16} />
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-3">
            {job && <div className="flex items-center gap-1 text-gray-600 text-sm">{job}</div>}

            {currentUserId !== user_id && (
              <button
                onClick={handleFollowToggle}
                disabled={loadingFollow}
                className={`text-xs px-4 py-2 rounded-md font-medium shadow-sm transition-all duration-200 focus:outline-none
                  ${
                    isFollowing
                      ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      : "bg-[#008753] text-white hover:bg-green-900"
                  }
                  ${loadingFollow ? "opacity-70 cursor-not-allowed" : ""}
                `}
              >
                {loadingFollow ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : isFollowing ? (
                  "Following"
                ) : (
                  "Follow"
                )}
              </button>
            )}

            <IconTooltipButton
              onClick={() => window.open("https://play.google.com/store/apps?hl=en", "_blank")}
              icon={Smartphone}
              label="Contact on Mobile App"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-around text-center w-full mt-4">
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
      </div>

      {/* Posts Section */}
      <div className="mt-8">
        <h2 className="font-semibold text-lg mb-3 text-center border-b border-solid pb-2">Posts</h2>

        {userPosts.length > 0 ? (
          <div className="space-y-6">
            <RenderPostList posts={userPosts} emptyMessage="No Post" reloadFn={getPostById} />

            {postsLoading && (
              <div className="flex justify-center items-center gap-2 py-4">
                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                <p className="text-gray-400 text-sm">Loading more posts...</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500 text-center">No posts yet.</p>
        )}
      </div>

      {/* Profile Image Modal */}
      <ProfileImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        imageUrl={profile_picture}
        altText={full_name}
      />
    </div>
  );
}
