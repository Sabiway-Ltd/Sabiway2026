"use client";

import { useState, useEffect } from "react";
import { usePostStore } from "../store/usePostStore";
import { useProfileStore } from "../store/useProfileStore";
import CommunityNavbar from "../_components/feed/CommunityNavbar";
import PostBox from "../_components/feed/PostBox";
import PostCard from "../_components/feed/PostCard";
import Aside from "../_components/feed/Aside";

export default function Community() {
  const [showPostBox, setShowPostBox] = useState(false);

  const {
    posts,
    filteredPosts,
    activeHashtag,
    getAllPosts,
    loading,
    loadingHashtag,
    error,
    initSocket, // ⚡ Init socket
  } = usePostStore();

  const { followingStatus, fetchMyFollowing } = useProfileStore();

  // Load posts & initialize socket on mount
  useEffect(() => {
    getAllPosts();
    initSocket(); // ⚡ Attach socket listeners for real-time updates
  }, [getAllPosts, initSocket]);

  // Load following status once on mount
  useEffect(() => {
    fetchMyFollowing();
  }, [fetchMyFollowing]);

  const isFiltering = activeHashtag !== null;
  const displayedPosts = isFiltering ? filteredPosts : posts;

  return (
    <div className="min-h-screen bg-gray-50 md:px-6 px-3">
      {/* Navbar */}
      <CommunityNavbar onCreatePost={() => setShowPostBox(true)} />

      <section className="flex justify-center gap-6 lg:gap-14 max-w-screen-xl mx-auto">
        {/* Feed Section */}
        <main className="flex-[3] mt-4 max-w-2xl w-full">
          {/* Post Creation Box */}
          <PostBox visible={showPostBox} onClose={() => setShowPostBox(false)} />

          {/* Global Loading */}
          {loading && !isFiltering && (
            <div className="text-center text-gray-500 py-8">Loading posts...</div>
          )}

          {/* Hashtag-specific loading */}
          {loadingHashtag && isFiltering && (
            <div className="text-center py-12">
              <svg className="animate-spin h-8 w-8 mx-auto mb-3" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              </svg>
              <div className="text-gray-600">
                Searching results for <span className="font-medium">#{activeHashtag}</span>...
              </div>
            </div>
          )}

          {/* Error */}
          {error && <div className="text-center text-red-500 py-8">{error}</div>}

          {/* Empty State */}
          {!loading && !loadingHashtag && displayedPosts.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              {isFiltering
                ? `No posts found for #${activeHashtag}.`
                : "No posts yet — be the first to share something!"}
            </div>
          )}

          {/* Posts Feed */}
          {!loadingHashtag && (
            <div className="mt-2 space-y-4">
              {displayedPosts.map((post) => (
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
                />
              ))}
            </div>
          )}
        </main>

        {/* Sidebar */}
        <aside className="hidden lg:block w-64 mt-4 border-l border-gray-200 pl-6">
          <Aside />
        </aside>
      </section>
    </div>
  );
}
