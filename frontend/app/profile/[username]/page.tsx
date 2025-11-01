"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useProfileStore } from "@/app/store/useProfileStore";
import { usePostStore } from "@/app/store/usePostStore";
import { useAuthStore } from "@/app/store/useAuthStore";
import { BiLinkAlt } from "react-icons/bi";
import toast from "react-hot-toast";
import { Button } from "@/src/components/ui/button";
import { Loader2 } from "lucide-react";
import CommunityNavbar from "@/app/_components/feed/CommunityNavbar";
import { CLOUDINARY_CLOUD_NAME } from "@/app/helper";
import { DEFAULT_AVATAR } from "@/app/utils/getProfileImage";
import { useInfiniteScroll } from "@/app/hooks/useInfiniteScroll";
import PostCard from "@/app/_components/feed/PostCard";
import { DEFAULT_PROFILE_PICTURE } from "@/app/helper";
import IconTooltipButton from "@/app/_components/common/IconTooltipButton";
import { Smartphone } from "lucide-react";
import { RenderPostList } from "@/app/_components/common/RenderPostList ";

export default function ProfilePage() {
  const { username } = useParams();
  const { user } = useAuthStore();
   const { profile: currentUser } = useProfileStore();

  // console.log(currentUser)

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

  const [loadingFollow, setLoadingFollow] = useState(false);

  // ✅ Fetch profile + first page of posts
  useEffect(() => {
  if (username) {
    resetUserPosts();
    getProfileByUsername(username as string);
    getPostsByUsername(username as string, 1);
    }
    // ✅ only re-run if username changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);


  // ✅ Infinite Scroll Hook
  useInfiniteScroll({
    loading: postsLoading,
    hasMore: userHasMore,
    onLoadMore: () => getPostsByUsername(username as string, userNextPage),
  });

  // ✅ Handle loading + error states
  if (profileLoading || (postsLoading && userPosts.length === 0)) {
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
    job,
  } = otherProfile;

  const isFollowing = followingStatus[user_id] || false;

  const handleCopyProfileLink = async () => {
    const profileUrl = `${window.location.origin}/profile/${userUsername.replace("@", "")}`;
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
              className="w-24 h-24 rounded-full object-cover border border-gray-300"
            />
            <div className="space-y-1">
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


                {currentUser?.user_id !== user_id && (
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
              <div className="flex gap-x-3">
                {job && (
                  <div className="text-gray-600 flex gap-1 items-center">
                    {job}
                  </div>
                )}
                <IconTooltipButton
                  onClick={() => window.open("https://play.google.com/store/apps?hl=en", "_blank")}
                  icon={Smartphone}
                  label="Contact on Mobile App"
                  // bg="bg-[#008753]"
                  // textColor="text-white"
                />
              </div>
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

      

        {/* 🔹 Posts Section */}
        <div className="mt-8">
          <h2 className="font-semibold text-lg mb-3">Posts</h2>

          {userPosts.length > 0 ? (
            <div className="space-y-6">
              <RenderPostList
                posts={userPosts}
                emptyMessage="No Post"
                reloadFn={getPostById}
              />


              {postsLoading && (
                <div className="flex justify-center items-center gap-2 py-4">
                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                <p className="text-gray-400 text-sm">Loading more posts...</p>
              </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No posts yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
