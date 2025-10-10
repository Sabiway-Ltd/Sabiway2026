// app/_components/feed/Aside.tsx (or wherever your Aside is)
"use client";

import Image from "next/image";
import { useEffect } from "react";
import { usePostStore } from "@/app/store/usePostStore";

export default function Aside() {
  const {
    trendingHashtags,
    getTrendingHashtags,
    filterPostsByHashtag,
    resetFilteredPosts,
    filteredPosts,
    activeHashtag,
    loadingHashtag,
  } = usePostStore();

  const contributors = [
    { id: 1, name: "Aisha K.", bio: "Lorem ipsumnmhs shdlednn.....", avatar: "https://i.pravatar.cc/150?img=11" },
    { id: 2, name: "Chukwudi O.", bio: "Lorem ipsumnmhs shdlednn.....", avatar: "https://i.pravatar.cc/150?img=12" },
    { id: 3, name: "Ngozi E.", bio: "Lorem ipsumnmhs shdlednn.....", avatar: "https://i.pravatar.cc/150?img=13" },
  ];

  useEffect(() => {
    getTrendingHashtags();
  }, [getTrendingHashtags]);

  const handleHashtagClick = (tag: string) => {
    if (activeHashtag === tag) {
      resetFilteredPosts();
    } else {
      filterPostsByHashtag(tag);
    }
  };

  return (
    <aside className="w-full md:w-80 bg-[#F9FAFB] p-4 rounded-lg">
      {/* Trending Topics */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Trending Topics</h2>
        <div className="flex flex-wrap gap-2">
          {trendingHashtags.length > 0 ? (
            trendingHashtags.map((tag, idx) => {
              const isActive = activeHashtag === tag.tag;
              return (
                <button
                  key={idx}
                  onClick={() => handleHashtagClick(tag.tag)}
                  disabled={loadingHashtag && !isActive}
                  className={`px-4 py-2 border rounded-md text-sm font-medium shadow-sm transition
                    ${isActive ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 hover:bg-gray-100"}
                    ${loadingHashtag && !isActive ? "opacity-60 cursor-wait" : ""}`}
                >
                  {loadingHashtag && isActive ? (
                    // small inline indicator when the active tag is loading
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 inline-block" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      </svg>
                      #{tag.tag} ({tag.use_count})
                    </span>
                  ) : (
                    `#${tag.tag} (${tag.use_count})`
                  )}
                </button>
              );
            })
          ) : (
            <span className="text-gray-400 text-sm">No trending topics</span>
          )}
        </div>
      </div>

      {/* Top Contributors */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Top Contributors</h2>
        <div className="space-y-3">
          {contributors.map((c) => (
            <div key={c.id} className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
              <div className="relative w-10 h-10">
                <Image
                  src={c.avatar}
                  alt={c.name}
                  fill
                  className="rounded-full object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-semibold">{c.name}</p>
                <p className="text-xs text-gray-500">{c.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
