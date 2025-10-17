"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePostStore } from "../store/usePostStore";
import { useProfileStore } from "../store/useProfileStore";
import CommunityNavbar from "../_components/feed/CommunityNavbar";
import PostBox from "../_components/feed/PostBox";
import PostCard from "../_components/feed/PostCard";
import Aside from "../_components/feed/Aside";
import { DEFAULT_PROFILE_PICTURE } from "../helper";

export default function Community() {
  const [showPostBox, setShowPostBox] = useState(false);
  const [searchType, setSearchType] = useState<"posts" | "profiles">("posts");

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
  } = usePostStore();

  const { fetchMyFollowing } = useProfileStore();

  /* -------------------------------
     🟢 Load posts + socket once
  ------------------------------- */
  useEffect(() => {
    getAllPosts();
    initSocket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------------------
     🟢 Load following once
  ------------------------------- */
  useEffect(() => {
    fetchMyFollowing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isFiltering =
    (activeSearch && activeSearch.trim() !== "") ||
    (activeHashtag && activeHashtag.trim() !== "");

  const hasProfiles = filteredProfiles && filteredProfiles.length > 0;
  const hasHashtags = filteredHashtags && filteredHashtags.length > 0;
  const displayedPosts = isFiltering ? filteredPosts : posts;

  /* -------------------------------
     🧭 Handle Search Type Switch
  ------------------------------- */
  const handleSearchTypeChange = (type: "posts" | "profiles") => {
    setSearchType(type);
    if (activeSearch) {
      filterBySearch(activeSearch, type);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 md:px-6 px-3">
      {/* Navbar */}
      <CommunityNavbar onCreatePost={() => setShowPostBox(true)} />

      <section className="flex justify-center gap-6 lg:gap-14 max-w-screen-xl mx-auto">
        {/* Feed Section */}
        <main className="flex-[3] mt-4 max-w-3xl w-full">
          {/* Post Box */}
          <PostBox visible={showPostBox} onClose={() => setShowPostBox(false)} />

          {/* Global Loading */}
          {loading && !isFiltering && (
            <div className="text-center text-gray-500 py-8">Loading posts...</div>
          )}

          {/* -------------------------------
              SEARCH / HASHTAG RESULTS
          -------------------------------- */}
          {loadingHashtag ? (
            <div className="text-center py-12">
              <div className="flex justify-center gap-4 mb-4">
                  <button
                    onClick={() => handleSearchTypeChange("posts")}
                    className={`px-4 py-1.5 rounded-full border ${
                      searchType === "posts"
                        ? "bg-[#008753] text-white border-[#008753]"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    Posts
                  </button>
                  <button
                    onClick={() => handleSearchTypeChange("profiles")}
                    className={`px-4 py-1.5 rounded-full border ${
                      searchType === "profiles"
                        ? "bg-[#008753] text-white border-[#008753]"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    Profiles
                  </button>
                </div>
              <svg
                className="animate-spin h-8 w-8 mx-auto mb-3 text-[#008753]"
                viewBox="0 0 24 24"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
              </svg>
              <div className="text-gray-600">
                Searching results for{" "}
                <span className="font-medium">
                  {activeHashtag
                    ? `#${activeHashtag}`
                    : activeSearch
                    ? `"${activeSearch}"`
                    : ""}
                </span>
                ...
              </div>
            </div>
          ) : (
            <div className="mt-2 space-y-4">
              {/* 🔹 Search Type Buttons */}
              {activeSearch && !activeHashtag && (
                <div className="flex justify-center gap-4 mb-4">
                  <button
                    onClick={() => handleSearchTypeChange("posts")}
                    className={`px-4 py-1.5 rounded-full border ${
                      searchType === "posts"
                        ? "bg-[#008753] text-white border-[#008753]"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    Posts
                  </button>
                  <button
                    onClick={() => handleSearchTypeChange("profiles")}
                    className={`px-4 py-1.5 rounded-full border ${
                      searchType === "profiles"
                        ? "bg-[#008753] text-white border-[#008753]"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    Profiles
                  </button>
                </div>
              )}

              {/* 🔹 Profiles */}
              {searchType === "profiles" && filteredProfiles.length > 0 && (
                <div className="grid gap-3">
                  {filteredProfiles.map((user) => (
                    <Link
                      key={user.user_id}
                      href={`/profile/${user.username.replace("@", "")}`}
                      className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition"
                    >
                      <img
                        src={user.profile_picture || DEFAULT_PROFILE_PICTURE}
                        alt={user.full_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium text-gray-800">
                          {user.full_name}
                        </p>
                        <p className="text-sm text-gray-500">{user.username}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* 🔹 Hashtags */}
              {hasHashtags && (
                <div className="space-y-2">
                  {filteredHashtags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => filterBySearch(tag.tag, "posts")}
                      className="block w-full text-left text-[#008753] hover:underline"
                    >
                      #{tag.tag}{" "}
                      <span className="text-gray-500 text-sm">
                        ({tag.use_count})
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* 🔹 Posts */}
              {searchType === "posts" && (
                (isFiltering ? filteredPosts : posts).map((post) => (
                  <PostCard
                    key={post.id}
                    id={post.id}
                    author={{
                      user_id: post.author.user_id,
                      full_name: post.author.full_name,
                      username: post.author.username,
                      profile_picture:
                        post.author.profile_picture ||
                        "https://res.cloudinary.com/devqbjptr/image/upload/v1759934268/Avatar_2_rl1a6d.png",
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
                ))
              )}

            </div>
          )}

          {/* Error */}
          {error && <div className="text-center text-red-500 py-8">{error}</div>}

          {/* Empty State */}
          {!loading &&
            !loadingHashtag &&
            displayedPosts.length === 0 &&
            !hasProfiles &&
            !hasHashtags && (
              <div className="text-center text-gray-400 py-8">
                {activeHashtag
                  ? `No posts found for #${activeHashtag}.`
                  : activeSearch
                  ? `No results found for "${activeSearch}".`
                  : "No posts yet — be the first to share something!"}
              </div>
            )}
        </main>

        {/* Sidebar */}
        <aside className="hidden lg:block md:w-[28rem] mt-4 border-l border-gray-200 pl-6">
          <Aside />
        </aside>
      </section>
    </div>
  );
}
