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
import { RenderPostList } from "../_components/common/RenderPostList ";
import ProfileImageModal from "../_components/common/ProfileImageModal";


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
      full_name: profile.full_name || "",
      bio: profile.bio || "",
      phone_number: profile.phone_number || "",
      role: profile.role || "",
      job: profile.job || "",
      country: profile.country || "",
      state: profile.state || "",
      area: profile.area || "",
      street: profile.street || ""
    });
    setEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    try {
      await updateProfile(profile.user_id, editedData);
      setEditing(false);
    } catch (error) {
      console.error("Failed to save profile:", error);
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



  return (
    <div className="flex flex-col min-h-screen  ">
      <div className="md:px-6 px-1">
        <CommunityNavbar onCreatePost={() => alert("Create Post Clicked")} />
      </div>

      <main className="mx-auto md:px-4 md:py-8 py-2 flex justify-center w-full flex-1 ">
        <div className="lg:w-[60%] md:w-[90%] w-full px-2 ">
          {/* 🧩 Profile Header */}
          <div className="flex flex-col  items-center  gap-4 mb-8 relative">
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
                    className="w-full h-full rounded-full object-cover transition-transform duration-200 hover:scale-105"
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

            <div className="text-center ">
              <h1 className="text-xl font-bold text-[#008753]">{profile.full_name}</h1>
              <div className="flex items-center  justify-center">
                <p className="text-gray-600">{profile.username}</p>
                <button
                    onClick={() => {handleCopyProfileLink(profile.username)}}
                    className="flex items-center gap-1 text-xs ml-2 h-auto 0 rounded-md"
                  >
                    <BiLinkAlt size={16} />
                  </button>
                </div>
            </div>


            <div className=" flex justify-around text-center w-full">
                <div>
                  <p className="font-semibold text-lg">{profile.followers_count}</p>
                  <p className="text-gray-500 text-sm">Followers</p>
                </div>
                <div>
                  <p className="font-semibold text-lg">{profile.following_count}</p>
                  <p className="text-gray-500 text-sm">Following</p>
                </div>
                <div>
                  <p className="font-semibold text-lg">{profile.posts_count}</p>
                  <p className="text-gray-500 text-sm">Posts</p>
                </div>
              </div>
          </div>

          <div className="text-[0.6rem] md:text-lg w-full">
            {/* 🧩 Tabs */}
            <div className="flex gap-1 md:gap-6 border-b mb-3 md:mb-6 w-full justify-between">
              <Button
                className={`pb-2 ${activeTab === "about" ? "text-[#008753] border-b-2 border-[#008753]" : "text-gray-600"}`}
                onClick={() => setActiveTab("about")}
              >
                About Me
              </Button>
              <Button
                className={`pb-2 ${activeTab === "posts" ? "text-[#008753] border-b-2 border-[#008753]" : "text-gray-600"}`}
                onClick={async () => {
                  try{
                    document.body.style.cursor = "wait";
                    const postsRes = await post.getByMe();
                    setMyPosts(postsRes.data.results || postsRes.data);
                  }catch (error){
                    console.log(error)
                  }finally{
                    setActiveTab("posts")
                    document.body.style.cursor = "default";
                  }
                }}
              >
                My Posts
              </Button>
              <Button
                className={`pb-2 ${activeTab === "bookmarks" ? "text-[#008753] border-b-2 border-[#008753]" : "text-gray-600"}`}
                onClick={async () => {
                  try{
                    document.body.style.cursor = "wait";
                    const bmRes = await post.getMyBookmarks();
                    setBookmarks(bmRes.data.results || bmRes.data);
                    
                  }catch (error){
                    console.log(error)
                  }finally{
                    setActiveTab("bookmarks")
                    document.body.style.cursor = "default";
                  }
                }}
              >
                Bookmarks
              </Button>
              <Button
                className={`pb-2 ${activeTab === "followers" ? "text-[#008753] border-b-2 border-[#008753]" : "text-gray-600"}`}
                onClick={async () => {
                  try {
                    document.body.style.cursor = "wait";
                    await fetchMyFollowers();
                  } catch (error) {
                    console.error(error);
                  } finally {
                    setActiveTab("followers");
                    document.body.style.cursor = "default";
                  }
                }}

              >
                Followers
              </Button>
              <Button
                className={`pb-2 ${activeTab === "following" ? "text-[#008753] border-b-2 border-[#008753]" : "text-gray-600"}`}
                onClick={async () => {
                  try {
                    document.body.style.cursor = "wait";
                    await fetchMyFollowing();
                  } catch (error) {
                    console.error(error);
                  } finally {
                    setActiveTab("following");
                    document.body.style.cursor = "default";
                  }
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
                    {/* Full Name */}
                    <div className="text-sm">
                      <label className="block text-sm font-medium text-gray-700">Full Name</label>
                      <input
                        value={editedData.full_name || ""}
                        onChange={(e) =>
                          setEditedData({ ...editedData, full_name: e.target.value })
                        }
                        className="w-full border rounded-lg p-2"
                      />
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Bio</label>
                      <textarea
                        value={editedData.bio || ""}
                        onChange={(e) =>
                          setEditedData({ ...editedData, bio: e.target.value })
                        }
                        className="w-full border rounded-lg p-2"
                      />
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                      <input
                        value={editedData.phone_number || ""}
                        onChange={(e) =>
                          setEditedData({ ...editedData, phone_number: e.target.value })
                        }
                        className="w-full border rounded-lg p-2"
                      />
                    </div>

                    {/* Role */}
                    {/* <div>
                      <label className="block text-sm font-medium text-gray-700">Role</label>
                      <select
                        value={editedData.role || ""}
                        onChange={(e) =>
                          setEditedData({ ...editedData, role: e.target.value })
                        }
                        className="w-full border rounded-lg p-2"
                      >
                        <option value="">Select role</option>
                        <option value="professional">Professional</option>
                        <option value="client">Client</option>
                      </select>
                    </div> */}

                    {/* Job */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Job</label>
                      <input
                        value={editedData.job || ""}
                        onChange={(e) =>
                          setEditedData({ ...editedData, job: e.target.value })
                        }
                        className="w-full border rounded-lg p-2"
                      />
                    </div>

                    {/* Address group */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Country</label>
                        <input
                          value={editedData.country || ""}
                          onChange={(e) =>
                            setEditedData({ ...editedData, country: e.target.value })
                          }
                          className="w-full border rounded-lg p-2"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">State</label>
                        <input
                          value={editedData.state || ""}
                          onChange={(e) =>
                            setEditedData({ ...editedData, state: e.target.value })
                          }
                          className="w-full border rounded-lg p-2"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Area</label>
                        <input
                          value={editedData.area || ""}
                          onChange={(e) =>
                            setEditedData({ ...editedData, area: e.target.value })
                          }
                          className="w-full border rounded-lg p-2"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Street</label>
                        <input
                          value={editedData.street || ""}
                          onChange={(e) =>
                            setEditedData({ ...editedData, street: e.target.value })
                          }
                          className="w-full border rounded-lg p-2"
                        />
                      </div>
                    </div>

                    {/* Buttons */}
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
                    <p className="text-sm"><strong>Email:</strong> {profile.email}</p>
                    {profile.bio && (
                      <p className="text-sm"><strong>Bio:</strong> {profile.bio }</p>
                    )}
                    {profile.phone_number && (
                      <p className="text-sm"><strong>Phone:</strong> {profile.phone_number }</p>
                    )}
                    {profile.role &&(
                      <p className="text-sm"><strong>Role:</strong> {profile.role }</p>
                    )}
                    {profile.job && (
                      <p className="text-sm"><strong>Job:</strong> {profile.job }</p>
                    )}
                    {profile.country && (
                      <p className="text-sm"><strong>Country:</strong> {profile.country }</p>
                    )}
                    {profile.state && (
                      <p className="text-sm"><strong>State:</strong> {profile.state }</p>
                    )}
                    {profile.area && (
                      <p className="text-sm"><strong>Area:</strong> {profile.area }</p>
                    )}
                    {profile.street && (
                      <p className="text-sm"><strong>Street:</strong> {profile.street }</p>
                    )}
                    <div className="flex gap-x-4">
                      <button
                        onClick={handleEditProfile}
                        className="mt-4 bg-[#008753] text-white px-4 py-2 rounded-full text-xs md:text-sm"
                      >
                        Edit Profile
                      </button>

                      <button
                        onClick={async () => {
                          await logout();
                        }}
                        className="mt-4 bg-red-500 text-white px-4 py-2 rounded-full text-xs md:text-sm"
                      >
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}


            {activeTab === "posts" && (
              <div className="flex ">
              <RenderPostList
                posts={myPosts}
                emptyMessage="You haven’t posted anything yet."
                reloadFn={getPostById}
              />

              </div>
            )}


            {activeTab === "bookmarks" && (
              <RenderPostList
                posts={bookmarks.map(bm => bm.post)}
                emptyMessage="No bookmarks yet."
                reloadFn={getPostById}
              />

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
                      <Link href={`/profile/${user.username}`}>
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
                      </Link>

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
                      <Link href={`/profile/${user.username}`}>
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
                      </Link>

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
                            {/* <span>Unfollowing...</span> */}
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
        
        
        </div>
      </main>


     {/* 🖼️ Profile Picture Modal */}
      <ProfileImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        imageUrl={profile?.profile_picture}
        altText={profile?.full_name || "User"}
      />


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