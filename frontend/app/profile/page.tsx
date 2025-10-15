// app/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Edit, Trash, Bookmark, Camera } from "lucide-react";
import CommunityNavbar from "../_components/feed/CommunityNavbar";
import Footer from "../_components/landing_page/Footer";
import DeleteConfirmModal from "../_components/common/DeleteConfirmModal";
import Button from "../_components/common/Button";

const CLOUDINARY_CLOUD_NAME = "demo"; // dummy
const DEFAULT_PROFILE_PICTURE =
  "https://res.cloudinary.com/demo/image/upload/v1234567890/default_avatar.png";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<
    "about" | "posts" | "bookmarks" | "followers" | "following"
  >("about");
  const [editing, setEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    full_name: "John Doe",
    whatsapp_number: "+234 800 000 0000",
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Dummy profile
  const profile = {
    user_id: "1",
    full_name: "John Doe",
    username: "johndoe",
    email: "johndoe@example.com",
    whatsapp_number: "+234 800 000 0000",
    profile_picture: "",
    followers_count: 3,
    following_count: 2,
    posts_count: 2,
  };

  // Dummy followers/following
  const myFollowers = [
    { user_id: "2", full_name: "Jane Smith", username: "janes", profile_picture: "" },
    { user_id: "3", full_name: "David Kim", username: "davidk", profile_picture: "" },
  ];
  const myFollowing = [
    { user_id: "4", full_name: "Alex Johnson", username: "alexj", profile_picture: "" },
  ];

  // Dummy posts
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setMyPosts([
        {
          id: "101",
          content: "This is my first post! 🚀",
          image: "",
        },
        {
          id: "102",
          content: "Another day, another dummy post 😎",
          image: "https://via.placeholder.com/400x200",
        },
      ]);
      setBookmarks([
        {
          id: "201",
          post: { id: "101", content: "This is my first post! 🚀" },
        },
      ]);
      setLoading(false);
    }, 800);
  }, []);

  // Dummy handlers
  const handleEditProfile = () => {
    setEditing(true);
  };

  const handleSaveProfile = () => {
    setEditing(false);
  };

  const handleDeletePost = (id: string) => {
    setMyPosts((prev) => prev.filter((p) => p.id !== id));
    setIsDeleteModalOpen(false);
    setPostToDelete(null);
  };

  const handleUnbookmark = (postId: string) => {
    setBookmarks((prev) => prev.filter((b) => b.post.id !== postId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 ">
      <div className="md:px-6 px-3">
        <CommunityNavbar onCreatePost={() => alert("Create Post Clicked")} />
      </div>

      <main className="mx-auto px-4 py-8 flex justify-center w-full flex-1">
        <div className="lg:w-[60%] md:w-[90%] ">
          {/* 🧩 Profile Header */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8 relative">
            <div className="relative w-[100px] h-[100px]">
              <div className="relative w-24 h-24 py-1 px-1 rounded-full overflow-hidden shadow-sm bg-[#0087530D]/50">
                <img
                  src={
                    profile.profile_picture
                      ? profile.profile_picture
                      : DEFAULT_PROFILE_PICTURE
                  }
                  alt={profile.full_name}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <button
                type="button"
                className="absolute bottom-0 right-0 bg-[#008753] text-white p-2 rounded-full shadow-md transition"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>

            <div className="text-center md:text-left">
              <h1 className="text-2xl font-bold text-[#008753]">
                {profile.full_name}
              </h1>
              <p className="text-gray-600">{profile.username}</p>
              <div className="flex gap-6 mt-3 text-sm text-gray-700">
                <span>{profile.followers_count} Followers</span>
                <span>{profile.following_count} Following</span>
                <span>{profile.posts_count} Posts</span>
              </div>
            </div>
          </div>

          <div className="text-[0.6rem] md:text-lg w-full">
            {/* 🧩 Tabs */}
            <div className="flex gap-1 md:gap-6 border-b mb-3 md:mb-6 w-full">
              {["about", "posts", "bookmarks", "followers", "following"].map(
                (tab) => (
                  <Button
                    key={tab}
                    className={`pb-2 ${
                      activeTab === tab
                        ? "text-[#008753] border-b-2 border-[#008753]"
                        : "text-gray-600"
                    }`}
                    onClick={() =>
                      setActiveTab(tab as typeof activeTab)
                    }
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Button>
                )
              )}
            </div>

            {/* 🧩 Tab Content */}
            {activeTab === "about" && (
              <div className="space-y-4">
                {editing ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Full Name
                      </label>
                      <input
                        value={editedData.full_name}
                        onChange={(e) =>
                          setEditedData({
                            ...editedData,
                            full_name: e.target.value,
                          })
                        }
                        className="w-full border rounded-lg p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        WhatsApp Number
                      </label>
                      <input
                        value={editedData.whatsapp_number}
                        onChange={(e) =>
                          setEditedData({
                            ...editedData,
                            whatsapp_number: e.target.value,
                          })
                        }
                        className="w-full border rounded-lg p-2"
                      />
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={handleSaveProfile}
                        className="bg-[#008753] text-white px-4 py-2 rounded-full text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditing(false)}
                        className="bg-gray-400 text-white px-4 py-2 rounded-full text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p>
                      <strong>Email:</strong> {profile.email}
                    </p>
                    <p>
                      <strong>WhatsApp:</strong> {profile.whatsapp_number}
                    </p>

                    <div className="flex gap-x-4">
                      <button
                        onClick={handleEditProfile}
                        className="mt-4 bg-[#008753] text-white px-4 py-2 rounded-full text-xs md:text-sm"
                      >
                        Edit Profile
                      </button>
                      <button
                        className="mt-4 bg-red-500 text-white px-4 py-2 rounded-full text-xs md:text-sm"
                      >
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === "posts" && (
              <div className="space-y-4">
                {myPosts.map((post) => (
                  <div
                    key={post.id}
                    className="p-4 border rounded-lg bg-white shadow-sm"
                  >
                    <p className="mb-2">{post.content}</p>
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
                      <button
                        onClick={() => {
                          setPostToDelete(post.id);
                          setIsDeleteModalOpen(true);
                        }}
                        className="flex items-center gap-1 text-red-600"
                      >
                        <Trash className="h-4 w-4" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "bookmarks" && (
              <div className="space-y-4">
                {bookmarks.map((bm) => (
                  <div
                    key={bm.id}
                    className="p-4 border rounded-lg bg-white shadow-sm flex items-center justify-between"
                  >
                    <p>{bm.post?.content || "Bookmarked post"}</p>
                    <button onClick={() => handleUnbookmark(bm.post.id)}>
                      <Bookmark className="h-4 w-4 fill-blue-500 text-blue-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "followers" && (
              <div className="space-y-4">
                {myFollowers.map((u) => (
                  <div
                    key={u.user_id}
                    className="flex items-center gap-3 p-2 border rounded hover:bg-gray-50"
                  >
                    <img
                      src={u.profile_picture || DEFAULT_PROFILE_PICTURE}
                      alt={u.full_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium">{u.full_name}</p>
                      <p className="md:text-sm text-gray-500">{u.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "following" && (
              <div className="space-y-4">
                {myFollowing.map((u) => (
                  <div
                    key={u.user_id}
                    className="flex items-center justify-between gap-3 p-2 border rounded hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={u.profile_picture || DEFAULT_PROFILE_PICTURE}
                        alt={u.full_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium">{u.full_name}</p>
                        <p className="md:text-sm text-gray-500">{u.username}</p>
                      </div>
                    </div>
                    <button className="bg-red-500 text-white px-3 py-1 rounded-full md:text-sm hover:bg-red-600">
                      Unfollow
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DeleteConfirmModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={() => postToDelete && handleDeletePost(postToDelete)}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
