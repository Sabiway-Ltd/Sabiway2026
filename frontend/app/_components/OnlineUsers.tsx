"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/app/store/useAuthStore";
import { useProfileStore } from "@/app/store/useProfileStore";
import { Button } from "@/src/components/ui/button";
import Image from "next/image";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react"; // ✅ spinner icon
import { getProfileImage } from "../utils/getProfileImage";
import { CLOUDINARY_CLOUD_NAME, DEFAULT_PROFILE_PICTURE } from "../helper";

export default function OnlineUsers() {
  const { user, onlineUsers } = useAuthStore();
  const {
    profiles,
    getAllProfiles,
    followingStatus,
    toggleFollow,
    loading,
  } = useProfileStore();

  const [loadingFollowId, setLoadingFollowId] = useState<number | null>(null); // ✅ track which user is being followed/unfollowed

  // Load all profiles once
  useEffect(() => {
    getAllProfiles();
  }, [getAllProfiles]);

  // Merge online users with profile data
  const onlineProfiles = profiles.filter((profile) =>
    onlineUsers.some((u) => u.id === profile.user_id)
  );

  // Handle follow/unfollow action with spinner
  const handleFollowToggle = async (id: number) => {
    setLoadingFollowId(id);
    try {
      await toggleFollow(id);
    } finally {
      setLoadingFollowId(null);
    }
  };

  // If loading, show loading state
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-4">
        <p className="text-sm text-gray-500 text-center">Loading profiles...</p>
      </div>
    );
  }

  // If no users are online, return nothing
  if (onlineProfiles.length === 0) return null;


  return (
  <div className="bg-white rounded-2xl shadow-md p-4">
    <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
      🟢 Online Users
    </h3>

    <div className="space-y-3">
      {onlineProfiles.map((profile) => {
        const isFollowing = followingStatus[profile.user_id] || false;

        return (
          <motion.div
            key={profile.user_id}
            whileHover={{ scale: 1.02 }}
            className="flex items-center justify-between bg-gray-50 hover:bg-gray-100 p-3 rounded-xl transition"
          >
            <div className="flex items-center gap-3">
              {profile.profile_picture ? (
                <img
                  
                  src={
                    profile.profile_picture
                      ? profile.profile_picture.startsWith("http")
                        ? profile.profile_picture
                        : `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${profile.profile_picture}`
                      : DEFAULT_PROFILE_PICTURE
                  }
                  alt={profile.full_name}
                  className="rounded-full object-cover w-[40px] h-[40px]"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold">
                  {profile.initials}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {profile.full_name}
                </p>
                <p className="text-xs text-gray-500">{profile.username}</p>
              </div>
            </div>

            {user?.id !== profile.user_id && (
              <Button
                size="sm"
                disabled={loadingFollowId === profile.user_id}
                variant={isFollowing ? "secondary" : "default"}
                className={`text-sm flex items-center justify-center gap-2 ${
                  isFollowing
                    ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
                onClick={() => handleFollowToggle(profile.user_id)}
              >
                {loadingFollowId === profile.user_id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isFollowing ? (
                  "Following"
                ) : (
                  "Follow"
                )}
              </Button>
            )}
          </motion.div>
        );
      })}
    </div>
  </div>
);
}
