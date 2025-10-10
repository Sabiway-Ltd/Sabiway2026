// app/community/page.tsx

"use client";

import { useState, useEffect } from "react";
import { usePostStore } from "../store/usePostStore";
import CommunityNavbar from "../_components/feed/CommunityNavbar";
import PostBox from "../_components/feed/PostBox";
import PostCard from "../_components/feed/PostCard";
import Aside from "../_components/feed/Aside";

export default function Community() {
  const [showPostBox, setShowPostBox] = useState(false);
  const { posts, getAllPosts, loading, error } = usePostStore();

  useEffect(() => {
    getAllPosts();
  }, [getAllPosts]);

  return (
    <div className="min-h-screen bg-gray-50 md:px-6 px-3 ">
      {/* Navbar */}
      <CommunityNavbar onCreatePost={() => setShowPostBox(true)} />

      <section className="flex justify-center gap-6 lg:gap-14 max-w-screen-xl mx-auto">
        {/* Feed Section */}
        <main className="flex-[3] mt-4 max-w-2xl w-full">
          {/* Post Creation Box */}
          <PostBox visible={showPostBox} onClose={() => setShowPostBox(false)} />

          {/* Loading */}
          {loading && (
            <div className="text-center text-gray-500 py-8">
              Loading posts...
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-center text-red-500 py-8">{error}</div>
          )}

          {/* Empty State */}
          {!loading && posts.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              No posts yet — be the first to share something!
            </div>
          )}

          {/* Posts Feed */}
          <div className="mt-2 space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                id={post.id}
                author={{
                  full_name: post.author.full_name,
                  username: post.author.username,
                  profile_picture:
                    post.author.profile_picture ||
                    "https://res.cloudinary.com/devqbjptr/image/upload/v1759934268/Avatar_2_rl1a6d.png",
                  whatsapp_number: post.author.whatsapp_number || "",
                }}
                content={post.content}
                image={post.image || null}
                likes_count={post.likes_count}
                comments_count={post.comments_count}
                impressions={post.impressions_count || 0}
                is_liked={post.is_liked ?? false}
                is_bookmarked={post.is_bookmarked ?? false}  // ✅ ADD THIS
                created_at={post.created_at}
              />


            ))}
          </div>
        </main>

        {/* Sidebar (Desktop only) */}
        <aside className="hidden lg:block w-64 mt-4 border-l border-gray-200 pl-6">
          <Aside />
        </aside>
      </section>
    </div>
  );
}
