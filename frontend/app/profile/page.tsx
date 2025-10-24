// app/profile/page.tsx

"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Edit, Trash, Bookmark, Camera } from "lucide-react";
import CommunityNavbar from "../_components/feed/CommunityNavbar";
import Footer from "../_components/landing_page/Footer";
import { useProfileStore, type Profile  } from "../store/useProfileStore";
import { usePostStore } from "../store/usePostStore";
import { post } from "../services/post";
import { CLOUDINARY_CLOUD_NAME, DEFAULT_PROFILE_PICTURE } from "../helper";
import DeleteConfirmModal from "../_components/common/DeleteConfirmModal";
import toast from "react-hot-toast";
import Button from "../_components/common/Button";
import { useAuthStore } from "../store/useAuthStore";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import ProfilePostCard from "../_components/profile/ProfilePostCard";
import { BiEnvelope, BiLinkAlt } from "react-icons/bi";
import PostCard from "../_components/feed/PostCard";



export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<"about" | "posts" | "bookmarks" | "followers" | "following">("about");
  const [editing, setEditing] = useState(false);
  const [editedData, setEditedData] = useState({ full_name: "", bio: "" });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [unfollowingUserId, setUnfollowingUserId] = useState<string | null>(null);
  const { logout } = useAuthStore();
  

  const [loadingFollowId, setLoadingFollowId] = useState<number | null>(null);
  const [localFollowing, setLocalFollowing] = useState<{ [key: number]: boolean }>({});


  const {
  profile,
  getMyProfile,
  updateProfile,
  loading: profileLoading,
  toggleFollow, // ✅ add this
} = useProfileStore();

const { currentPost, getPostById, error } = usePostStore();

  const { set } = usePostStore.getState(); // direct access for updating

  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editedPostContent, setEditedPostContent] = useState("");

  const [editedPostImage, setEditedPostImage] = useState<File | null>(null);
  const [uploadingPostImage, setUploadingPostImage] = useState(false);

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
  const [isFollowingModalOpen, setIsFollowingModalOpen] = useState(false);
  const [modalUsers, setModalUsers] = useState<Profile[]>([]);

  const { fetchMyFollowers, fetchMyFollowing, myFollowers, myFollowing } = useProfileStore();


const [loadingId, setLoadingId] = useState<number | null>(null);


const handleFollowToggle = async (user: any) => {
  const isFollowing = localFollowing[user.user_id] ?? user.is_following_you;

  // Optimistic update
  setLocalFollowing((prev) => ({ ...prev, [user.user_id]: !isFollowing }));
  setLoadingFollowId(user.user_id);

  try {
    await toggleFollow(user.user_id);
    toast.success(isFollowing ? `Unfollowed ${user.full_name}` : `Followed ${user.full_name}`);
  } catch (err) {
    console.error(err);
    toast.error("Action failed");
    // Rollback on error
    setLocalFollowing((prev) => ({ ...prev, [user.user_id]: isFollowing }));
  } finally {
    setLoadingFollowId(null);
  }
};


  const handleCopyProfileLink = async (userUsername) => {
    const profileUrl = `${window.location.origin}/profile/${userUsername.replace("@", "")}`;
    await navigator.clipboard.writeText(profileUrl);
    toast.success("Profile link copied");
  };





  // 🧩 Fetch Profile, Posts, and Bookmarks on mount
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await getMyProfile();

        const postsRes = await post.getByMe();
        setMyPosts(postsRes.data.results || postsRes.data);

        const bmRes = await post.getMyBookmarks();
        setBookmarks(bmRes.data.results || bmRes.data);
      } catch (err) {
        console.error("Profile page load error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [getMyProfile]);

  const handleCopyPostLink = async () => {
    const postUrl = `${window.location.origin}/posts/${post.id}`;
    await navigator.clipboard.writeText(postUrl);
    toast.success("Post link copied");
  };

  

  // 📝 Handle Edit Profile
  const handleEditProfile = () => {
    if (!profile) return;
    setEditedData({
      full_name: profile.full_name,
      bio: profile.bio || "",
    });
    setEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    await updateProfile(profile.user_id, editedData);
    setEditing(false);
  };

  // 🗑️ Handle Delete Post
  const handleDeletePost = async (id: string) => {
    try {
      await post.delete(id);
      setMyPosts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Post deleted successfully");
    } catch (err) {
      console.error("Delete post error:", err);
      toast.error("Failed to delete post");
    }
  };

  // 🔖 Handle Unbookmark
 const handleUnbookmark = async (postId: string) => {
    try {
      setLoadingId(postId); // show spinner for this post
      await post.unbookmark(postId);
      setBookmarks((prev) => prev.filter((b) => b.post.id !== postId));
      toast.success("Removed from bookmarks");
    } catch (err) {
      console.error("Unbookmark error:", err);
      toast.error("Failed to unbookmark post");
    } finally {
      setLoadingId(null); // stop spinner
    }
  };

  

  // 📸 Handle Profile Picture Change
  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setSelectedImagePreview(previewUrl);
    setSelectedImageFile(file);

    // reset file input value immediately
    e.target.value = "";
  };

  const handleConfirmProfilePictureUpload = async () => {
  if (!selectedImageFile || !profile) return;

  const formData = new FormData();
  formData.append("profile_picture", selectedImageFile);

  try {
    setUploadingImage(true);
    await updateProfile(profile.user_id, formData);
    await getMyProfile();
    toast.success("Profile picture updated!");
    setSelectedImagePreview(null);
    setSelectedImageFile(null);
  } catch (err) {
    console.error("Profile picture upload error:", err);
    toast.error("Failed to update profile picture");
  } finally {
    setUploadingImage(false);
  }
};



  if (loading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading your profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">No profile found.</p>
      </div>
    );
  }


  // Start editing a post
  const handleEditPost = (postId: string, content: string) => {
    setEditingPostId(postId);
    setEditedPostContent(content);
  };

  
// Cancel editing
const handleCancelEditPost = () => {
  setEditingPostId(null);
  setEditedPostContent("");
};

const handlePostImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  setEditedPostImage(file);
};

const handleSavePost = async (postId: string) => {
  const postIndex = myPosts.findIndex((p) => p.id === postId);
  if (postIndex === -1) return;

  try {
    setUploadingPostImage(true);

    const fd = new FormData();
    fd.append("content", editedPostContent || "");

    // Only append new image if user changed it
    if (editedPostImage) {
      fd.append("image", editedPostImage);
    }

    // Use post.update service
    const response = await post.update(postId, fd);

    if (response?.data) {
      // Update local posts array
      setMyPosts((prev) =>
        prev.map((p) => (p.id === postId ? response.data : p))
      );

      toast.success("Post updated successfully!");
      setEditingPostId(null);
      setEditedPostContent("");
      setEditedPostImage(null);
    }
  } catch (error: any) {
    console.error("Update post error:", error.response?.data || error.message);
    toast.error(error.response?.data?.detail || "Failed to update post.");
  } finally {
    setUploadingPostImage(false);
  }
};


const handleShowFollowers = async () => {
  await fetchMyFollowers();
  setModalUsers(myFollowers);
  setIsFollowersModalOpen(true);
};

const handleShowFollowing = async () => {
  await fetchMyFollowing();
  setModalUsers(myFollowing);
  setIsFollowingModalOpen(true);
};





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
                <button
                  onClick={() => setIsImageModalOpen(true)}
                  className="block w-full h-full focus:outline-none"
                >
                  <img
                    src={
                      profile?.profile_picture
                        ? profile.profile_picture.startsWith("http")
                          ? profile.profile_picture
                          : `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${profile.profile_picture}`
                        : DEFAULT_PROFILE_PICTURE
                    }
                    alt={profile?.full_name || "User"}
                    className="w-full h-full rounded-full object-cover hover:opacity-80 transition"
                    onError={(e) => (e.currentTarget.src = DEFAULT_PROFILE_PICTURE)} // fallback safety
                  />

                </button>
              </div>





              {/* Hidden File Input */}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="profilePicUpload"
                onChange={handleProfilePictureChange}
              />

              {/* Camera Icon */}
              <button
                type="button"
                onClick={() => document.getElementById("profilePicUpload")?.click()}
                disabled={uploadingImage}
                className={`absolute bottom-0 right-0 bg-[#008753] text-white p-2 rounded-full shadow-md transition ${
                  uploadingImage ? "opacity-60 cursor-not-allowed" : "hover:bg-green-600"
                }`}
              >
                {uploadingImage ? (
                  <span className="text-xs animate-pulse">...</span>
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>

            </div>

            <div className="text-center md:text-left">
              <h1 className="text-2xl font-bold text-[#008753]">{profile.full_name}</h1>
              <div className="flex gap-2 items-center">
                <p className="text-gray-600">{profile.username}</p>
                <button
                    onClick={() => {handleCopyProfileLink(profile.username)}}
                    className="flex items-center gap-1 text-xs px-2 py-2 h-auto bg-gray-200 rounded-md"
                  >
                    <BiLinkAlt size={16} />
                  </button>
                </div>
              <div className="flex gap-6 mt-3 text-sm text-gray-700">
                <button
                  onClick={handleShowFollowers}
                  className="hover:underline"
                >
                  {profile.followers_count} Followers
                </button>

                <button
                  onClick={handleShowFollowing}
                  className="hover:underline"
                >
                  {profile.following_count} Following
                </button>

                <span>{profile.posts_count} Posts</span>
              </div>

            </div>
          </div>

          <div className="text-[0.6rem] md:text-lg w-full">
            {/* 🧩 Tabs */}
            <div className="flex gap-1 md:gap-6 border-b mb-3 md:mb-6 w-full">
              <Button
                className={`pb-2 ${activeTab === "about" ? "text-[#008753] border-b-2 border-[#008753]" : "text-gray-600"}`}
                onClick={() => setActiveTab("about")}
              >
                About Me
              </Button>
              <Button
                className={`pb-2 ${activeTab === "posts" ? "text-[#008753] border-b-2 border-[#008753]" : "text-gray-600"}`}
                onClick={() => setActiveTab("posts")}
              >
                My Posts
              </Button>
              <Button
                className={`pb-2 ${activeTab === "bookmarks" ? "text-[#008753] border-b-2 border-[#008753]" : "text-gray-600"}`}
                onClick={() => setActiveTab("bookmarks")}
              >
                Bookmarks
              </Button>
              <Button
                className={`pb-2 ${activeTab === "followers" ? "text-[#008753] border-b-2 border-[#008753]" : "text-gray-600"}`}
                onClick={async () => {
                  await fetchMyFollowers();
                  setActiveTab("followers");
                }}
              >
                Followers
              </Button>
              <Button
                className={`pb-2 ${activeTab === "following" ? "text-[#008753] border-b-2 border-[#008753]" : "text-gray-600"}`}
                onClick={async () => {
                  await fetchMyFollowing();
                  setActiveTab("following");
                }}
              >
                Following
              </Button>
            </div>


            {/* 🧩 Tab Content */}
            {activeTab === "about" && (
              <div className="space-y-4">
                {editing ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Full Name</label>
                      <input
                        value={editedData.full_name}
                        onChange={(e) => setEditedData({ ...editedData, full_name: e.target.value })}
                        className="w-full border rounded-lg p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Bio</label>
                      <input
                        value={editedData.bio}
                        onChange={(e) => setEditedData({ ...editedData, bio: e.target.value })}
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
                    <p><strong>Email:</strong> {profile.email}</p>
                    <p><strong>Bio:</strong> {profile.bio || "—"}</p>

                    <div className="flex gap-x-4">
                      {/* Edit */}
                      <button
                        onClick={handleEditProfile}
                        className="mt-4 bg-[#008753] text-white px-4 py-2 rounded-full text-xs md:text-sm"
                      >
                        Edit Profile
                      </button>

                      {/* Logout */}
                      <button
                      onClick={async () => {
                        await logout();
                        window.location.href = "/login"; // redirect to login after logout
                      }}
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
              <div className="flex ">
              <div className="space-y-4  w-full">
                {myPosts.length === 0 ? (
                  <p className="text-gray-600">You haven’t posted anything yet.</p>
                ) : (
                  myPosts.map((postItem) => (
                    <PostCard
                         key={postItem.id}
                          id={postItem.id}
                                        author={{
                                          user_id: postItem.author.user_id,
                                          full_name: postItem.author.full_name,
                                          username: postItem.author.username,
                                          profile_picture: postItem.author.profile_picture || DEFAULT_PROFILE_PICTURE,
                                          phone_number: postItem.author.phone_number || "",
                                          is_following: postItem.author.is_following,
                                        }}
                                        content={postItem.content}
                                        image={postItem.image || null}
                                        likes_count={postItem.likes_count}
                                        comments_count={postItem.comments_count}
                                        impressions_count={postItem.impressions_count || 0}
                                        is_liked={postItem.is_liked ?? false}
                                        is_bookmarked={postItem.is_bookmarked ?? false}
                                        created_at={postItem.created_at}
                                         onReloadPosts={() => getPostById(postItem.id)}
                                      />
            ))
                )}
              </div>
              </div>
            )}


            {activeTab === "bookmarks" && (
              <div className="space-y-4  w-full">
                {bookmarks.length === 0 ? (
                  <p className="text-gray-600">No bookmarks yet.</p>
                ) : (
                  bookmarks.map((bm) => (
                    <ProfilePostCard key={bm.id} post={bm.post} />
                  ))
                )}
              </div>
            )}

            {activeTab === "followers" && (
              <div className="space-y-4">
                {myFollowers.length === 0 ? (
                  <p className="text-gray-600">You have no followers yet.</p>
                ) : (
                  myFollowers.map((user) => (
                    <div
                      key={user.user_id}
                      className="flex items-center justify-between gap-3 p-2 border rounded hover:bg-gray-50"
                    >
                      {/* User Info */}
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            user.profile_picture
                              ? user.profile_picture.startsWith("http")
                                ? user.profile_picture
                                : `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${user.profile_picture}`
                              : DEFAULT_PROFILE_PICTURE
                          }
                          alt={user.full_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium">{user.full_name}</p>
                          <p className="md:text-sm text-gray-500">{user.username}</p>
                        </div>
                      </div>

                      {/* Follow/Unfollow Button */}
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => handleFollowToggle(user)}
                        disabled={loadingFollowId === user.user_id}
                        className={`px-3 py-1 rounded-full text-sm flex items-center justify-center gap-2 transition-all ${
                          (localFollowing[user.user_id] ?? user.is_following)
                            ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            : "bg-[#008753] text-white hover:bg-green-700"
                        }`}
                      >
                        {loadingFollowId === user.user_id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (localFollowing[user.user_id] ?? user.is_following) ? (
                          "Following"
                        ) : (
                          "Follow"
                        )}
                      </motion.button>
                    </div>
                  ))
                )}
              </div>
            )}


            {activeTab === "following" && (
              <div className="space-y-4">
                {myFollowing.length === 0 ? (
                  <p className="text-gray-600">You are not following anyone yet.</p>
                ) : (
                  myFollowing.map((user) => (
                    <div
                      key={user.user_id}
                      className="flex items-center justify-between gap-3 p-2 border rounded hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            user.profile_picture
                              ? user.profile_picture.startsWith("http")
                                ? user.profile_picture
                                : `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${user.profile_picture}`
                              : DEFAULT_PROFILE_PICTURE
                          }
                          alt={user.full_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium">{user.full_name}</p>
                          <p className="md:text-sm text-gray-500">{user.username}</p>
                        </div>
                      </div>

                      <button
                        onClick={async () => {
                          try {
                            setUnfollowingUserId(user.user_id); // start loading
                            await toggleFollow(user.user_id);
                          } catch (err) {
                            console.error(err);
                          } finally {
                            setUnfollowingUserId(null); // stop loading
                          }
                        }}
                        disabled={unfollowingUserId === user.user_id}
                        className={`flex items-center justify-center gap-2 px-3 py-1 rounded-full md:text-sm transition 
                          ${
                            unfollowingUserId === user.user_id
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-red-500 hover:bg-red-600 text-white"
                          }`}
                      >
                        {unfollowingUserId === user.user_id ? (
                          <>
                            <svg
                              className="animate-spin h-4 w-4 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                              ></path>
                            </svg>
                            <span>Unfollowing...</span>
                          </>
                        ) : (
                          "Unfollow"
                        )}
                      </button>

                    </div>
                  ))
                )}
              </div>
            )}
          </div>



          {(isFollowersModalOpen || isFollowingModalOpen) && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
              onClick={() => {
                setIsFollowersModalOpen(false);
                setIsFollowingModalOpen(false);
              }}
            >
              <div
                className="bg-white rounded-lg shadow-lg p-4 max-w-md w-full max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-lg font-semibold mb-4">
                  {isFollowersModalOpen ? "Followers" : "Following"}
                </h2>
                {modalUsers.length === 0 ? (
                  <p className="text-gray-600">No users found.</p>
                ) : (
                  modalUsers.map((user) => (
                    <div
                      key={user.user_id}
                      className="flex items-center gap-3 mb-3 p-2 hover:bg-gray-100 rounded"
                    >
                      <img
                        src={
                          user.profile_picture
                            ? user.profile_picture.startsWith("http")
                              ? user.profile_picture
                              : `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${user.profile_picture}`
                            : DEFAULT_PROFILE_PICTURE
                        }
                        alt={user.full_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-sm text-gray-500">{user.username}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}


          <DeleteConfirmModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={async () => {
              if (postToDelete) {
                await handleDeletePost(postToDelete);
              }
              setIsDeleteModalOpen(false);
              setPostToDelete(null);
            }}
          />

        
        </div>
      </main>


      {/* 🖼️ Profile Picture Modal */}
      {isImageModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 bg-opacity-30"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div
            className="relative bg-white rounded-lg shadow-lg p-2 max-w-[90%] max-h-[90%]"
            onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
          >
            <button
              onClick={() => setIsImageModalOpen(false)}
              className="absolute top-2 right-2 bg-black bg-opacity-60 text-white rounded-full p-1 hover:bg-opacity-80"
            >
              ✕
            </button>
            <img
              src={
                  profile?.profile_picture
                    ? profile.profile_picture.startsWith("http")
                      ? profile.profile_picture
                      : `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${profile.profile_picture}`
                    : DEFAULT_PROFILE_PICTURE
                }
              alt={profile.full_name || "User"}
              className="rounded-lg max-w-full max-h-[80vh] object-contain"
            />
          </div>
        </div>
      )}


      {/* 🖼️ Profile Picture Preview Modal */}
      {selectedImagePreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 bg-opacity-70"
          onClick={() => setSelectedImagePreview(null)}
        >
          <div
            className="relative bg-white rounded-lg shadow-lg p-4 max-w-[90%] max-h-[90%] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
          >
            <h2 className="text-lg font-semibold mb-3">Preview New Profile Picture</h2>
            <img
              src={selectedImagePreview}
              alt="Preview"
              className="rounded-full w-48 h-48 object-cover mb-4 border border-gray-200"
            />

            <div className="flex gap-4">
              <button
                onClick={handleConfirmProfilePictureUpload}
                disabled={uploadingImage}
                className="bg-[#008753] text-white px-4 py-2 rounded-full text-sm"
              >
                {uploadingImage ? "Uploading..." : "Update"}
              </button>

              <button
                onClick={() => {
                  setSelectedImagePreview(null);
                  setSelectedImageFile(null);
                }}
                className="bg-gray-400 text-white px-4 py-2 rounded-full text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}



      {/* <Footer /> */}
    </div>
  );
}