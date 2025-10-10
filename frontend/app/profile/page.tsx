// app/profile/page.tsx

"use client";

import { useState } from "react";
import Image from "next/image";
import CommunityNavbar from "../_components/feed/CommunityNavbar";
import Footer from "../_components/landing_page/Footer";
import { Edit, Trash, Bookmark } from "lucide-react";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<"about" | "posts" | "bookmarks">("about");

  // 🔹 Dummy profile
  const profile = {
    full_name: "Abdullah Adesina Dhikrullah",
    initials: "AD",
    email: "ab702810@gmail.com",
    username: "@abdullah_dhikrullah",
    profile_picture: null,
    followers_count: 120,
    following_count: 89,
    posts_count: 7,
    whatsapp_number: "+234 812 345 6789",
  };

  // 🔹 Dummy posts
  const posts = [
    { id: 1, text: "My first SabiWay post 🚀", image: "/dummy1.jpg" },
    { id: 2, text: "Loving this community ❤️ #SabiWay", image: null },
  ];

  // 🔹 Dummy bookmarks
  const bookmarks = [
    { id: 1, post: { text: "A bookmarked post with cool content ✨" } },
    { id: 2, post: { text: "Another saved gem from the community 🔥" } },
  ];

  // 🔹 Dummy logout
  const handleLogout = () => {
    alert("You have logged out!");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <CommunityNavbar onCreatePost={() => alert("Create Post Clicked")} />

      {/* ✅ main grows to push footer down */}
      <main className="flex-1 max-w-5xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
          <Image
            src={profile.profile_picture || "/default-avatar.png"}
            alt={profile.full_name}
            width={100}
            height={100}
            className="rounded-full object-cover"
          />
          <div className="text-center md:text-left">
            <h1 className="text-2xl font-bold text-[#008753]">{profile.full_name}</h1>
            <p className="text-gray-600">{profile.username}</p>
            <div className="flex gap-6 mt-3 text-sm text-gray-700">
              <span>{profile.followers_count} Followers</span>
              <span>{profile.following_count} Following</span>
              <span>{profile.posts_count} Posts</span>
            </div>
            <button
              onClick={handleLogout}
              className="mt-4 bg-red-500 text-white px-4 py-2 rounded-full text-sm"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b mb-6">
          <button
            className={`pb-2 ${activeTab === "about" ? "text-[#008753] border-b-2 border-[#008753]" : "text-gray-600"}`}
            onClick={() => setActiveTab("about")}
          >
            About Me
          </button>
          <button
            className={`pb-2 ${activeTab === "posts" ? "text-[#008753] border-b-2 border-[#008753]" : "text-gray-600"}`}
            onClick={() => setActiveTab("posts")}
          >
            My Posts
          </button>
          <button
            className={`pb-2 ${activeTab === "bookmarks" ? "text-[#008753] border-b-2 border-[#008753]" : "text-gray-600"}`}
            onClick={() => setActiveTab("bookmarks")}
          >
            Bookmarks
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "about" && (
          <div className="space-y-4">
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>WhatsApp:</strong> {profile.whatsapp_number}</p>
            <p><strong>Initials:</strong> {profile.initials}</p>
            <button className="mt-4 bg-[#008753] text-white px-4 py-2 rounded-full text-sm">
              Edit Profile
            </button>
          </div>
        )}

        {activeTab === "posts" && (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <p className="text-gray-600">You haven’t posted anything yet.</p>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="p-4 border rounded-lg bg-white shadow-sm">
                  <p className="mb-2">{post.text}</p>
                  {post.image && (
                    <Image
                      src={post.image}
                      alt="Post image"
                      width={400}
                      height={200}
                      className="rounded-md"
                    />
                  )}
                  <div className="flex gap-4 mt-3 text-sm text-gray-600">
                    <button className="flex items-center gap-1 text-blue-600">
                      <Edit className="h-4 w-4" /> Edit
                    </button>
                    <button className="flex items-center gap-1 text-red-600">
                      <Trash className="h-4 w-4" /> Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "bookmarks" && (
          <div className="space-y-4">
            {bookmarks.length === 0 ? (
              <p className="text-gray-600">No bookmarks yet.</p>
            ) : (
              bookmarks.map((bm) => (
                <div key={bm.id} className="p-4 border rounded-lg bg-white shadow-sm flex items-center justify-between">
                  <p>{bm.post.text}</p>
                  <Bookmark className="h-4 w-4 text-[#008753]" />
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* ✅ Footer stays below content */}
      <Footer />
      
    </div>
  );
}
