// app/community/page.tsx

"use client";

import { useState } from "react";
import CommunityNavbar from "../_components/feed/CommunityNavbar";
import PostBox from "../_components/feed/PostBox";
import PostCard from "../_components/feed/PostCard";
import Aside from "../_components/feed/Aside";

export default function Community() {
  const [showPostBox, setShowPostBox] = useState(false);

  // ✅ Dummy static posts
  const dummyPosts = [
    {
      id: "1",
      author: {
        user_id: "u1",
        full_name: "Jane Doe",
        username: "janedoe",
        profile_picture:
          "https://res.cloudinary.com/devqbjptr/image/upload/v1759934268/Avatar_2_rl1a6d.png",
        whatsapp_number: "1234567890",
        is_following: true,
      },
      content: "This is a dummy post on Sabiway 🎉",
      image: null,
      likes_count: 12,
      comments_count: 4,
      impressions_count: 50,
      is_liked: false,
      is_bookmarked: false,
      created_at: "2025-10-15T10:00:00Z",
    },
    {
      id: "2",
      author: {
        user_id: "u2",
        full_name: "John Smith",
        username: "johnsmith",
        profile_picture:
          "https://res.cloudinary.com/devqbjptr/image/upload/v1759934268/Avatar_2_rl1a6d.png",
        whatsapp_number: "",
        is_following: false,
      },
      content: "Another dummy post — static data is working fine 😎",
      image:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
      likes_count: 34,
      comments_count: 10,
      impressions_count: 120,
      is_liked: true,
      is_bookmarked: true,
      created_at: "2025-10-14T18:30:00Z",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 md:px-6 px-3">
      {/* Navbar */}
      <CommunityNavbar onCreatePost={() => setShowPostBox(true)} />

      <section className="flex justify-center gap-6 lg:gap-14 max-w-screen-xl mx-auto">
        {/* Feed Section */}
        <main className="flex-[3] mt-4 max-w-2xl w-full">
          {/* Post Creation Box */}
          <PostBox visible={showPostBox} onClose={() => setShowPostBox(false)} />

          {/* Posts Feed */}
          <div className="mt-2 space-y-4">
            {dummyPosts.map((post) => (
              <PostCard
                key={post.id}
                id={post.id}
                author={post.author}
                content={post.content}
                image={post.image}
                likes_count={post.likes_count}
                comments_count={post.comments_count}
                impressions_count={post.impressions_count}
                is_liked={post.is_liked}
                is_bookmarked={post.is_bookmarked}
                created_at={post.created_at}
              />
            ))}
          </div>
        </main>

        {/* Sidebar */}
        <aside className="hidden lg:block w-64 mt-4 border-l border-gray-200 pl-6">
          <Aside />
        </aside>
      </section>
    </div>
  );
}
