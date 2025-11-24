"use client";

import Image from "next/image";
import { useEffect } from "react";
import { usePostStore } from "@/app/store/usePostStore";
import { useProfileStore } from "@/app/store/useProfileStore";
import PeopleYouMayKnow from "../profile/PeopleYouMayKnow";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Aside() {
  const {
    trendingHashtags,
    getTrendingHashtags,
    filterPostsByHashtag,
    resetFilteredPosts,
    activeHashtag,
    loadingHashtag,
  } = usePostStore();

  const router = useRouter()

  const { topContributors, getTopContributors, loading } = useProfileStore();

  useEffect(() => {
    getTrendingHashtags();
    getTopContributors(); // ✅ fetch contributors on mount
  }, [getTrendingHashtags, getTopContributors]);

  const handleHashtagClick = (tag: string) => {
    if (activeHashtag === tag) {
      resetFilteredPosts();
    } else {
      filterPostsByHashtag(tag);
    }
  };

  return (
    <aside className="w-full   rounded-lg py-2">
      {/* Trending Topics */}
      <div className="mb-4 bg-[#008753]/5 rounded-lg p-4">
        <h2 className="text-[1rem] font-semibold mb-3">Trending Topics</h2>
        <div className="flex flex-wrap gap-2">
          {trendingHashtags.length > 0 ? (
            trendingHashtags.map((tag, idx) => {
              const isActive = activeHashtag === tag.tag;
              return (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    router.push(`/hashtag/${encodeURIComponent(tag.tag)}`);
                  }}
                  // disabled={loadingHashtag && !isActive}
                  className={`px-4 py-2 border rounded-md text-sm font-medium shadow-sm transition
                    ${isActive ? "bg-[#008753] text-white border-[#008753]" : "bg-white text-gray-700 hover:bg-gray-100"}
                    ${loadingHashtag && !isActive ? "opacity-60 cursor-wait" : ""}`}
                >
                  {tag.tag}
                </button>
              );
            })
          ) : (
            <span className="text-gray-400 text-sm">No trending topics</span>
          )}
        </div>
      </div>

     
      {/* Top Contributors */}
      <div className="bg-[#008753]/5 rounded-lg p-4">
        <h2 className="text-[1rem] font-semibold mb-3">Top Contributors</h2>
        <div className="flex flex-col gap-y-3">
          {loading ? (
            <p className="text-gray-400 text-sm">Loading...</p>
          ) : topContributors.length > 0 ? (
            topContributors.map((c) => (
              <Link href={`/profile/${c.username}`} key={c.user_id}>
                <div
                  
                  className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm"
                >
                  <div className="w-10 h-10">
                    <img
                      src={
                        c.profile_picture && c.profile_picture.trim() !== ""
                          ? c.profile_picture.startsWith("http")
                            ? c.profile_picture
                            : `https://res.cloudinary.com/devqbjptr/${c.profile_picture}`
                          : "https://res.cloudinary.com/devqbjptr/image/upload/v1759934268/Avatar_2_rl1a6d.png"
                      }
                      alt={c.full_name || "User"}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-[13.5px] font-semibold">{c.full_name}</p>
                    <p className="text-xs text-gray-500">{c.username}</p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-gray-400 text-sm">No contributors yet</p>
          )}
        </div>
      </div>


    </aside>
  );
}