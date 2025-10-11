// app/profile/page.tsx

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Edit, Trash, Bookmark, Camera } from "lucide-react";
import CommunityNavbar from "../_components/feed/CommunityNavbar";
import Footer from "../_components/landing_page/Footer";
import { useProfileStore } from "../store/useProfileStore";
import { usePostStore } from "../store/usePostStore";
import { post } from "../services/post";
import { CLOUDINARY_CLOUD_NAME, DEFAULT_PROFILE_PICTURE } from "../helper";
import DeleteConfirmModal from "../_components/common/DeleteConfirmModal";
import toast from "react-hot-toast";
import Button from "../_components/common/Button";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<"about" | "posts" | "bookmarks">("about");
  const [editing, setEditing] = useState(false);
  const [editedData, setEditedData] = useState({ full_name: "", whatsapp_number: "" });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const { profile, getMyProfile, updateProfile, loading: profileLoading } = useProfileStore();
  const { set } = usePostStore.getState(); // direct access for updating

  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editedPostContent, setEditedPostContent] = useState("");

  const [editedPostImage, setEditedPostImage] = useState<File | null>(null);
  const [uploadingPostImage, setUploadingPostImage] = useState(false);

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);





  // 🧩 Fetch Profile, Posts, and Bookmarks on mount
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await getMyProfile();

        const postsRes = await post.getAll();
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

  // 📝 Handle Edit Profile
  const handleEditProfile = () => {
    if (!profile) return;
    setEditedData({
      full_name: profile.full_name,
      whatsapp_number: profile.whatsapp_number || "",
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
      await post.unbookmark(postId);
      setBookmarks((prev) => prev.filter((b) => b.post.id !== postId));
      toast.success("Removed from bookmarks");
    } catch (err) {
      console.error("Unbookmark error:", err);
      toast.error("Failed to unbookmark post");
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
  try {
    let response;

    if (editedPostImage) {
      const fd = new FormData();
      fd.append("content", editedPostContent);
      fd.append("image", editedPostImage);

      setUploadingPostImage(true);

      response = await post.update(postId, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } else {
      response = await post.update(postId, { content: editedPostContent });
    }

    setMyPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, ...response.data } : p))
    );

    setEditingPostId(null);
    setEditedPostContent("");
    setEditedPostImage(null);
    setUploadingPostImage(false);

    toast.success("Post updated!");
  } catch (err) {
    console.error("Update post error:", err);
    toast.error("Failed to update post");
    setUploadingPostImage(false);
  }
};


  return (
    <div className="flex flex-col min-h-screen bg-gray-50 ">
      <div className="md:px-6 px-3">
        <CommunityNavbar onCreatePost={() => alert("Create Post Clicked")} />
      </div>

      <main className="flex-1 max-w-5xl mx-auto px-4 py-8">
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
                    profile.profile_picture && profile.profile_picture.startsWith("http")
                      ? profile.profile_picture
                      : `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${profile.profile_picture || "default_avatar.png"}`
                  }
                  alt={profile.full_name || "User"}
                  className="w-full h-full rounded-full object-cover hover:opacity-80 transition"
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
            <p className="text-gray-600">{profile.username}</p>
            <div className="flex gap-6 mt-3 text-sm text-gray-700">
              <span>{profile.followers_count} Followers</span>
              <span>{profile.following_count} Following</span>
              <span>{profile.posts_count} Posts</span>
            </div>
          </div>
        </div>

        {/* 🧩 Tabs */}
        <div className="flex gap-6 border-b mb-6">
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
                  <label className="block text-sm font-medium text-gray-700">WhatsApp Number</label>
                  <input
                    value={editedData.whatsapp_number}
                    onChange={(e) => setEditedData({ ...editedData, whatsapp_number: e.target.value })}
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
                <p><strong>WhatsApp:</strong> {profile.whatsapp_number || "—"}</p>
                <button
                  onClick={handleEditProfile}
                  className="mt-4 bg-[#008753] text-white px-4 py-2 rounded-full text-sm"
                >
                  Edit Profile
                </button>
              </>
            )}
          </div>
        )}

        {activeTab === "posts" && (
  <div className="space-y-4">
    {myPosts.length === 0 ? (
      <p className="text-gray-600">You haven’t posted anything yet.</p>
    ) : (
      myPosts.map((postItem) => (
  <div key={postItem.id} className="p-4 border rounded-lg bg-white shadow-sm">
    {editingPostId === postItem.id ? (
      <>
        <textarea
          className="w-full border rounded-lg p-2 mb-2"
          value={editedPostContent}
          onChange={(e) => setEditedPostContent(e.target.value)}
        />

        {/* Image preview and upload */}
        {editedPostImage ? (
          <img
            src={URL.createObjectURL(editedPostImage)}
            alt="Preview"
            className="w-full h-48 object-cover rounded-md mb-2"
          />
        ) : postItem.image ? (
          <Image
            src={postItem.image.startsWith("http") ? postItem.image : `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${postItem.image}`}
            alt="Post image"
            width={400}
            height={200}
            className="rounded-md mb-2"
          />
        ) : null}

        <input
          type="file"
          accept="image/*"
          className="mb-2"
          onChange={handlePostImageChange}
        />

        <div className="flex gap-4 mt-2">
          <button
            onClick={() => handleSavePost(postItem.id)}
            className="bg-[#008753] text-white px-4 py-2 rounded-full text-sm"
            disabled={uploadingPostImage}
          >
            {uploadingPostImage ? "Uploading..." : "Save"}
          </button>
          <button
            onClick={handleCancelEditPost}
            className="bg-gray-400 text-white px-4 py-2 rounded-full text-sm"
          >
            Cancel
          </button>
        </div>
      </>
    ) : (
      <>
        <p className="mb-2">{postItem.content}</p>
        {postItem.image && (
          <Image
            src={postItem.image.startsWith("http") ? postItem.image : `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${postItem.image}`}
            alt="Post image"
            width={400}
            height={200}
            className="rounded-md"
          />
        )}
        <div className="flex gap-4 mt-3 text-sm text-gray-600">
          <button
            onClick={() => handleEditPost(postItem.id, postItem.content)}
            className="flex items-center gap-1 text-blue-600"
          >
            <Edit className="h-4 w-4" /> Edit
          </button>
          <button
            onClick={() => {
              setPostToDelete(postItem.id);
              setIsDeleteModalOpen(true);
            }}
            className="flex items-center gap-1 text-red-600"
          >
            <Trash className="h-4 w-4" /> Delete
          </button>
        </div>
      </>
    )}
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
                <div
                  key={bm.id}
                  className="p-4 border rounded-lg bg-white shadow-sm flex items-center justify-between"
                >
                  <p>{bm.post?.text || bm.post?.content || "Bookmarked post"}</p>
                  <button onClick={() => handleUnbookmark(bm.post.id)}>
                    <Bookmark className="h-4 w-4 fill-blue-500 text-blue-500" />
                  </button>
                </div>
              ))
            )}
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
                profile.profile_picture && profile.profile_picture.startsWith("http")
                  ? profile.profile_picture
                  : `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${profile.profile_picture || "default_avatar.png"}`
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



      <Footer />
    </div>
  );
}
