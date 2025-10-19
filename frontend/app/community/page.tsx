// app/community/page.tsx

"use client";

import { useState, useEffect } from "react";
import { usePostStore } from "../store/usePostStore";
import { useProfileStore } from "../store/useProfileStore";
import CommunityNavbar from "../_components/feed/CommunityNavbar";
import PostBox from "../_components/feed/PostBox";
import PostCard from "../_components/feed/PostCard";
import Aside from "../_components/feed/Aside";
import { DEFAULT_PROFILE_PICTURE } from "../helper";
import { Loader2 } from "lucide-react";
import { getProfileImage } from "../utils/getProfileImage";

export default function Community() {
  const [showPostBox, setShowPostBox] = useState(false);
  const [searchType, setSearchType] = useState<"posts" | "profiles" | "hashtags">("posts");
  const [pendingSearch, setPendingSearch] = useState<string | null>(null);
  const [loadingFollowId, setLoadingFollowId] = useState<number | null>(null);
  

  const {
    posts,
    filteredPosts,
    filteredProfiles,
    filteredHashtags,
    activeHashtag,
    activeSearch,
    filterBySearch,
    getAllPosts,
    loading,
    loadingHashtag,
    error,
    initSocket,
    resetFilteredResults,
  } = usePostStore();

  const { user, fetchMyFollowing, toggleFollow, followingStatus } = useProfileStore();

  useEffect(() => {
    resetFilteredResults();
    setPendingSearch(null);
    setSearchType("posts");
    getAllPosts();
    initSocket();
    fetchMyFollowing();
  }, []);

  const hasProfiles = filteredProfiles && filteredProfiles.length > 0;
  const hasHashtags = filteredHashtags && filteredHashtags.length > 0;
  const isFiltering = !!activeSearch || !!activeHashtag || !!pendingSearch;

  const displayedPosts =
    searchType === "posts"
      ? (isFiltering ? filteredPosts || [] : posts)
      : posts;

  const handleSearchSubmit = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    setPendingSearch(searchTerm.trim());
    setSearchType("posts");
    resetFilteredResults();
  };

  const handleSearchTypeChange = (type: "posts" | "profiles" | "hashtags") => {
    setSearchType(type);
    if (pendingSearch) {
      if (type === "hashtags") {
        filterBySearch(pendingSearch, "hashtags");
      } else {
        filterBySearch(pendingSearch, type);
      }
      setPendingSearch(null);
    }
  };

  const handleFollowToggle = async (id: number) => {
    setLoadingFollowId(id);
    try {
      await toggleFollow(id);
    } finally {
      setLoadingFollowId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 md:px-6 px-3">
      <CommunityNavbar
        onCreatePost={() => setShowPostBox(true)}
        onSearch={handleSearchSubmit}
        onReset={() => {
          setSearchType("posts");
          setPendingSearch(null);
        }}
      />

      <section className="flex justify-center gap-6 lg:gap-14 max-w-screen-xl mx-auto">
        <main className="flex-[3] mt-4 max-w-3xl w-full">
          <PostBox visible={showPostBox} onClose={() => setShowPostBox(false)} />

          {/* Search type buttons */}
          {pendingSearch && (
            <div className="flex justify-center gap-4 mb-4">
              <button
                onClick={() => handleSearchTypeChange("posts")}
                className="px-4 py-1.5 rounded-full border bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                Posts
              </button>
              <button
                onClick={() => handleSearchTypeChange("profiles")}
                className="px-4 py-1.5 rounded-full border bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                Profiles
              </button>
              
            </div>
          )}

          {/* Loading states */}
          {loading && !isFiltering && !pendingSearch && (
            <div className="text-center text-gray-500 py-8">Loading posts...</div>
          )}
          {loadingHashtag && (
            <div className="text-center py-12">
              <svg
                className="animate-spin h-8 w-8 mx-auto mb-3 text-[#008753]"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              </svg>
              <div className="text-gray-600">
                Searching results for{" "}
                <span className="font-medium">
                  {activeHashtag ? `#${activeHashtag}` : activeSearch ? `"${activeSearch}"` : ""}
                </span>
                ...
              </div>
            </div>
          )}

          {/* Profiles search results with follow/unfollow */}
          {searchType === "profiles" && hasProfiles && (
            <div className="grid gap-3">
              {filteredProfiles.map((profile) => {
                const isFollowing = followingStatus[profile.user_id] || false;

                return (
                  <div
                    key={profile.user_id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={getProfileImage(profile.profile_picture) || DEFAULT_PROFILE_PICTURE}
                        alt={profile.full_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium text-gray-800">{profile.full_name}</p>
                        <p className="text-sm text-gray-500">{profile.username}</p>
                      </div>
                    </div>

                    {user?.id !== profile.user_id && (
                      <button
                        onClick={() => handleFollowToggle(profile.user_id)}
                        disabled={loadingFollowId === profile.user_id}
                        className={`px-4 py-1.5 rounded-full text-sm flex items-center justify-center gap-2 ${
                          isFollowing
                            ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {loadingFollowId === profile.user_id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isFollowing ? (
                          "Following"
                        ) : (
                          "Follow"
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Hashtags search results */}
          {searchType === "hashtags" && hasHashtags && (
            <div className="space-y-2">
              {filteredHashtags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => filterBySearch(tag.tag, "posts")}
                  className="block w-full text-left text-[#008753] hover:underline"
                >
                  #{tag.tag} <span className="text-gray-500 text-sm">({tag.use_count})</span>
                </button>
              ))}
            </div>
          )}

          {/* Posts */}
          {searchType === "posts" && displayedPosts.length > 0 && (
            <div className="space-y-4">
              {displayedPosts.map((post) => (
                <PostCard
                  key={post.id}
                  id={post.id}
                  author={{
                    user_id: post.author.user_id,
                    full_name: post.author.full_name,
                    username: post.author.username,
                    profile_picture: post.author.profile_picture || DEFAULT_PROFILE_PICTURE,
                    whatsapp_number: post.author.whatsapp_number || "",
                    is_following: post.author.is_following,
                  }}
                  content={post.content}
                  image={post.image || null}
                  likes_count={post.likes_count}
                  comments_count={post.comments_count}
                  impressions_count={post.impressions_count || 0}
                  is_liked={post.is_liked ?? false}
                  is_bookmarked={post.is_bookmarked ?? false}
                  created_at={post.created_at}
                  onReloadPosts={getAllPosts}
                />
              ))}
            </div>
          )}

          {/* Error or empty states */}
          {error && <div className="text-center text-red-500 py-8">{error}</div>}

          {!loading &&
            !loadingHashtag &&
            displayedPosts.length === 0 &&
            !hasProfiles &&
            !hasHashtags &&
            !pendingSearch && (
              <div className="text-center text-gray-400 py-8">
                {activeHashtag
                  ? `No posts found for #${activeHashtag}.`
                  : activeSearch
                  ? `No results found for "${activeSearch}".`
                  : "No posts yet — be the first to share something!"}
              </div>
            )}
        </main>

        <aside className="hidden lg:block md:w-[28rem] mt-4 border-l border-gray-200 pl-6">
          <Aside />
        </aside>
      </section>
    </div>
  );
}
