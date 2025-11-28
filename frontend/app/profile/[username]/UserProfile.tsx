"use client";

import { useState, useEffect } from "react";
import { BiLinkAlt } from "react-icons/bi";
import toast from "react-hot-toast";
import { Loader2, Smartphone } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import ProfileImageModal from "@/app/_components/common/ProfileImageModal";
import IconTooltipButton from "@/app/_components/common/IconTooltipButton";
import { RenderPostList } from "../../_components/common/RenderPostList ";
import { DEFAULT_AVATAR } from "@/app/utils/getProfileImage";
import { CLOUDINARY_CLOUD_NAME, DEFAULT_PROFILE_PICTURE } from "@/app/helper";
import { useProfileStore } from "@/app/store/useProfileStore";
import { usePostStore } from "@/app/store/usePostStore";
import ProfilePageSkeleton from "../../_components/profile/ProfilePageSkeleton";
import UserPostsMain from "./UserPostsMain";

interface ProfileProps {
  username: string;
}

export default function UserProfile({ username }: ProfileProps) {
  const { profile } = useProfileStore();
  const currentUserId = profile?.user_id;
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
    bio,
  } = otherProfile;

  const isFollowing = followingStatus[user_id] || false;

  return (
    <div className="max-w-3xl mx-auto pb-5 ">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-4  relative bg-[#008753]/5 rounded-lg py-5 px-4.5">

        {/* Row 1: Profile picture + info */}
        <div className="flex items-center gap-4 flex-1">
          
          {/* Profile Picture */}
          <div className="relative w-[80px] h-[80px] md:w-[100px] md:h-[100px]">
            <div className="relative w-20 h-20 md:w-24 md:h-24 py-1 px-1 rounded-full overflow-hidden shadow-sm bg-[#0087530D]/50">
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
          <div className="flex-1">
            <h1 className="text-base md:text-xl font-bold text-[#008753]">
              {full_name}
            </h1>

            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm md:text-[0.95rem] font-medium text-gray-500 truncate max-w-[200px] sm:max-w-full">
                {job ? job : username.replace('%40', '@')}
              </p>

              <button
                onClick={handleCopyProfileLink}
                className="flex items-center gap-1 text-xs rounded-md text-[#008753] hover:text-green-900 transition"
              >
                <BiLinkAlt size={16} />
              </button>
            </div>
            {bio && (
              <p className="text-sm md:text-[0.95rem] text-gray-500">{bio}</p>
            )}


            {/* Follow for Mobile */}
          <div className="md:hidden -ml-2  flex justify-start gap-x-2 items-center w-full md:w-auto">
            
            <IconTooltipButton
              onClick={() => window.open("https://play.google.com/store/apps?hl=en", "_blank")}
              icon={Smartphone}
              label="Mobile App"
            />

            {currentUserId !== user_id && (
              <button
                onClick={handleFollowToggle}
                disabled={loadingFollow}
                className={`text-xs px-3 py-1.5 rounded-md font-medium shadow-sm transition-all duration-200
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
          </div>
          </div>
        </div>

        {/* Row 2: Action buttons */}
        <div className="hidden md:flex justify-start md:justify-end gap-x-2 items-center w-full md:w-auto">
          
          <IconTooltipButton
            onClick={() => window.open("https://play.google.com/store/apps?hl=en", "_blank")}
            icon={Smartphone}
            label="Mobile App"
          />

          {currentUserId !== user_id && (
            <button
              onClick={handleFollowToggle}
              disabled={loadingFollow}
              className={`text-xs px-3 py-1.5 rounded-md font-medium shadow-sm transition-all duration-200
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
        </div>

      </div>


      {/* Posts Section */}
      <div className="mt-4">
        <div className="font-semibold text-md mb-3 border-b border-solid">
          <h2 className="border-b-2 border-solid border-[#008753] w-fit pb-2">
            Posts
          </h2>
        </div>


        {/* Replace RenderPostList with UserPostsMain */}
        <UserPostsMain username={username} />
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
