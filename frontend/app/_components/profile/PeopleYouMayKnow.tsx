"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/app/store/useAuthStore";
import { useProfileStore } from "@/app/store/useProfileStore";
import { Button } from "@/src/components/ui/button";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { CLOUDINARY_CLOUD_NAME, DEFAULT_PROFILE_PICTURE } from "../../helper";
import Link from "next/link";

export default function PeopleYouMayKnow() {
  const { user } = useAuthStore();
  const {
    notFollowedProfiles,
    getNotFollowedProfiles,
    followingStatus,
    toggleFollow,
    loading,
  } = useProfileStore();

  const [loadingFollowId, setLoadingFollowId] = useState<number | null>(null);

  // Load “people you may know” on mount
  useEffect(() => {
    getNotFollowedProfiles();
  }, [getNotFollowedProfiles]);

  const handleFollowToggle = async (id: number) => {
    setLoadingFollowId(id);
    try {
      await toggleFollow(id);
    } finally {
      setLoadingFollowId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-4">
        <p className="text-sm text-gray-500 text-center">Loading suggestions...</p>
      </div>
    );
  }

  if (!notFollowedProfiles || notFollowedProfiles.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-4">
        <p className="text-sm text-gray-500 text-center">
          You’re following everyone in your circle!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#008753]/5 rounded-lg p-4">
      <h3 className="text-[1rem] font-semibold mb-4 text-gray-800 flex items-center gap-2">
        People You May Know
      </h3>

      <div className="space-y-3">
        {notFollowedProfiles.map((profile) => {
          const isFollowing = followingStatus[profile.user_id] || false;

          return (
            <motion.div
              key={profile.user_id}
              whileHover={{ scale: 1.02 }}
              className="flex items-start gap-x-2 justify-between bg-white  p-3 rounded-xl transition"
            >
              <Link href={`/profile/${profile.username}`}>
                <div className="flex items-center gap-3">
                  {profile.profile_picture ? (
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 shrink-0">
                      <img
                        src={
                          profile.profile_picture.startsWith("http")
                            ? profile.profile_picture
                            : `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${profile.profile_picture}`
                        }
                        alt={profile.full_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#1F2937] flex items-center justify-center text-white font-bold uppercase shrink-0">
                      {profile.initials}
                    </div>
                  )}

                  <div>
                    <p className="text-[13.5px] font-semibold text-gray-800">
                      {profile.full_name}
                    </p>
                    <p className="text-xs text-gray-500">{profile.username}</p>
                  </div>
                </div>
              </Link>

              {user?.id !== profile.user_id && (
                <Button
                  size="sm"
                  disabled={loadingFollowId === profile.user_id}
                  variant={isFollowing ? "secondary" : "default"}
                  className={`text-xs flex items-center justify-center gap-2 ${
                    isFollowing
                      ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      : "bg-[#008753] text-white hover:bg-green-900"
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
