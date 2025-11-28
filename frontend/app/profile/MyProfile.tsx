// app/profile/page.tsx

"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Edit, Trash, Bookmark, Camera } from "lucide-react";
import CommunityNavbar from "../_components/feed/CommunityNavbar";
import { useProfileStore, type Profile } from "@/app/store/useProfileStore";
import { usePostStore } from "@/app/store/usePostStore";
import { post } from "@/app/services/post";
import { CLOUDINARY_CLOUD_NAME, DEFAULT_PROFILE_PICTURE } from "@/app/helper";
import toast from "react-hot-toast";
import Button from "../_components/common/Button";
import { useAuthStore } from "@/app/store/useAuthStore";
import { motion } from "framer-motion";
import Link from "next/link";
import ProfilePostCard from "../_components/profile/ProfilePostCard";
import { BiEnvelope, BiLinkAlt } from "react-icons/bi";
import PostCard from "../_components/feed/PostCard";
import { RenderPostList } from "../_components/common/RenderPostList ";
import ProfileImageModal from "../_components/common/ProfileImageModal";
import ProfilePageSkeleton from "../_components/profile/ProfilePageSkeleton";
import PeopleYouMayKnow from "../_components/profile/PeopleYouMayKnow";
import Aside from "../_components/feed/Aside";
import MyPostsTab from "../_components/feed/MyPostsTab";
import MyPostsMain, { MyPostsMainRef } from "./MyPostsMain";
import MyBookmarksMain, {MyBookmarksMainRef} from "./MyBookmarksMain";


export default function MyProfile() {
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

  const myPostsRef = useRef<MyPostsMainRef>(null);
  const bookmarksRef = useRef<MyBookmarksMainRef>(null);
  

  const [loadingFollowId, setLoadingFollowId] = useState<number | null>(null);
  const [localFollowing, setLocalFollowing] = useState<{ [key: number]: boolean }>({});


  const {
  profile,
  getMyProfile,
  updateProfile,
  loading: profileLoading,
  toggleFollow, // ✅ add this
} = useProfileStore();

const { currentPost, getPostById, error,  } = usePostStore();

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
    const isFollowing = localFollowing[user.user_id] ?? user.is_following;

    // Optimistic update (instant UI update)
    setLocalFollowing((prev) => ({ ...prev, [user.user_id]: !isFollowing }));

    try {
      await toggleFollow(user.user_id);
      // toast.success(isFollowing ? `Unfollowed ${user.full_name}` : `Followed ${user.full_name}`);
    } catch (err) {
      console.error(err);
      toast.error("Action failed");

      // Rollback
      setLocalFollowing((prev) => ({ ...prev, [user.user_id]: isFollowing }));
    }
  };



  const handleCopyProfileLink = async (userUsername) => {
    const profileUrl = `${window.location.origin}/profile/${userUsername.replace("@", "")}`;
    await navigator.clipboard.writeText(profileUrl);
    toast.success("Profile link copied");
  };

  useEffect(() => {
  if (activeTab === "posts") {
    myPostsRef.current?.fetchMyPosts();
  }
}, [activeTab]);

useEffect(() => {
  if (activeTab === "bookmarks") {
    bookmarksRef.current?.fetchBookmarks();
  }
}, [activeTab]);





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


  // const fetchMyPosts = async () => {
  //   try{
  //     document.body.style.cursor = "wait";
  //     const postsRes = await post.getByMe();
  //     setMyPosts(postsRes.data.results || postsRes.data);
  //   }catch (error){
  //     console.log(error)
  //   }finally{
  //     document.body.style.cursor = "default";
  //   }
  // }

  const fetchBookmarkPosts = async () => {
    try{
      document.body.style.cursor = "wait";
      const bmRes = await post.getMyBookmarks();
      setBookmarks(bmRes.data.results || bmRes.data);
      
    }catch (error){
      console.log(error)
    }finally{
      document.body.style.cursor = "default";
    }
  }

  const handleUnfollow = async (user: any) => {
    const wasFollowing = localFollowing[user.user_id] ?? user.is_following;

    // Instantly flip button UI
    setLocalFollowing(prev => ({ ...prev, [user.user_id]: false }));

    try {
      await toggleFollow(user.user_id);
    } catch (err) {
      console.error(err);

      // Rollback
      setLocalFollowing(prev => ({ ...prev, [user.user_id]: wasFollowing }));
    }
  };




  if (loading || profileLoading) {
    return (
      <div>
        <ProfilePageSkeleton/>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {/* <p className="text-gray-600">No profile found.</p> */}
      </div>
    );
  }



  return (
    <div className="flex flex-col min-h-screen  ">
      <section>
        <main className="mx-auto md:pb-8 pb-2 flex justify-center w-full flex-1 ">
          <div className=" w-full px-2 ">
            {/* 🧩 Profile Header */}
            <div className="flex flex-row  items-center  gap-4 mb-3 relative bg-[#008753]/5 rounded-lg pb-5 pt-3 md:pb-7 md:pt-6 md:px-4 px-3">
              <div className="relative w-[75px] h-[75px]">
                <div className="relative w-20 h-20 py-1 px-1 rounded-full overflow-hidden shadow-sm bg-[#0087530D]/50">
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
                  className={`absolute bottom-0 right-0 bg-[#008753] text-white p-1 rounded-full shadow-md transition ${
                    uploadingImage ? "opacity-60 cursor-not-allowed" : "hover:bg-green-800"
                  }`}
                >
                  {uploadingImage ? (
                    <span className="text-xs animate-pulse">...</span>
                  ) : (
                    <Camera className="h-3 w-3" />
                  )}
                </button>

              </div>

              <div>
                <div className="">
                  <h1 className="text-xl text-left font-bold text-[#008753]">{profile.full_name}</h1>
                  <div className="flex items-center  text-sm">
                    <p className=" text-sm font-medium text-gray-500">
                    {
                      profile.job ? 
                      `${profile.job}` : 
                      `${profile.username}`
                    }
                    </p>
                     <button
                        onClick={() => {handleCopyProfileLink(profile.username)}}
                        className="flex items-center gap-1 text-xs ml-2 h-auto 0 rounded-md"
                      >
                        <BiLinkAlt size={16} />
                      </button>
                    </div>
                    {profile.bio && (
                      <p className="text-sm text-left md:text-[0.95rem] text-gray-500">{profile.bio}</p>
                    )}
                </div>


                
                </div> 
            </div>

            <div className="text-[0.8rem]  ">
              {/* 🧩 Tabs */}
              <div className="w-[21rem] md:w-full flex flex-nowrap gap-1 border-b mb-3 md:mb-6 overflow-x-auto whitespace-nowrap no-scrollbar">
                <button
                  className={`p-2 text-black font-medium ${activeTab === "about" ? "border-b-2 border-solid border-[#008753]" : ""}`}
                  onClick={() => setActiveTab("about")}
                >
                  About
                </button>
                <button
                  className={`p-2 text-black font-medium ${
                    activeTab === "posts"
                      ? "border-b-2 border-solid border-[#008753]" : ""
                  }`}
                  onClick={() => setActiveTab("posts")}
                >
                  Posts
                </button>
                <button
                  className={`p-2 text-black font-medium 
                    ${activeTab === "bookmarks" ? "border-b-2 border-solid border-[#008753]" : ""}`}
                  onClick={() => setActiveTab("bookmarks")}
                >
                  Bookmarks
                </button>
                <button
                    className={`p-2 flex gap-x-1 font-medium 
                    ${activeTab === "followers" ? "border-b-2 border-solid border-[#008753]" : ""}`}
                    onClick={async () => {
                      setActiveTab("followers");
                      try {
                        document.body.style.cursor = "wait";
                        await fetchMyFollowers();
                      } catch (error) {
                        console.error(error);
                      } finally {
                        document.body.style.cursor = "default";
                      }
                    }}
                    >
                      <p className="font-normal">{profile.followers_count}</p>
                      <p className="">Followers</p>
                    </button>
                <button
                className={`p-2  flex gap-x-1 font-medium 
                    ${activeTab === "following" ? "border-b-2 border-solid border-[#008753]" : ""}`}
                    onClick={async () => {
                      setActiveTab("following");
                      try {
                        document.body.style.cursor = "wait";
                        await fetchMyFollowing();
                      } catch (error) {
                        console.error(error);
                      } finally {
                        document.body.style.cursor = "default";
                      }
                    }}
                    >
                      <p className="font-normal">{profile.following_count}</p>
                      <p className="">Following</p>
                    </button>
              </div>


              {/* 🧩 Tab Content */}
              {activeTab === "about" && (
                <div className="space-y-4 bg-[#008753]/5 rounded-lg p-4">
                  {editing ? (
                    <>
                      {/* Full Name */}
                      <div className="">
                        <label className="block  font-medium text-gray-700">Full Name</label>
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
                        <label className="block  font-medium text-gray-700">Bio</label>
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
                        <label className="block  font-medium text-gray-700">Phone Number</label>
                        <input
                          value={editedData.phone_number || ""}
                          onChange={(e) =>
                            setEditedData({ ...editedData, phone_number: e.target.value })
                          }
                          className="w-full border rounded-lg p-2"
                        />
                      </div>

                      {/* Job */}
                      <div>
                        <label className="block  font-medium text-gray-700">Job</label>
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
                          <label className="block  font-medium text-gray-700">Country</label>
                          <input
                            value={editedData.country || ""}
                            onChange={(e) =>
                              setEditedData({ ...editedData, country: e.target.value })
                            }
                            className="w-full border rounded-lg p-2"
                          />
                        </div>

                        <div>
                          <label className="block  font-medium text-gray-700">State</label>
                          <input
                            value={editedData.state || ""}
                            onChange={(e) =>
                              setEditedData({ ...editedData, state: e.target.value })
                            }
                            className="w-full border rounded-lg p-2"
                          />
                        </div>

                        <div>
                          <label className="block  font-medium text-gray-700">Area</label>
                          <input
                            value={editedData.area || ""}
                            onChange={(e) =>
                              setEditedData({ ...editedData, area: e.target.value })
                            }
                            className="w-full border rounded-lg p-2"
                          />
                        </div>

                        <div>
                          <label className="block  font-medium text-gray-700">Street</label>
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
                      <div className="flex justify-center">
                        <div className=" space-x-4 ">
                          <button
                            onClick={handleSaveProfile}
                            className="bg-[#008753] text-white w-28 py-2 rounded-md text-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditing(false)}
                            className="bg-gray-400 text-white w-28 py-2 rounded-md text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <div className=" divide-gray-400 text-sm">
                        <p className="py-2">
                          <span className="font-medium">Email:</span> {profile.email}
                        </p>

                        {profile.bio && (
                          <p className="py-2">
                            <span className="font-medium">Bio:</span> {profile.bio}
                          </p>
                        )}

                        {profile.phone_number && (
                          <p className="py-2">
                            <span className="font-medium">Phone:</span> {profile.phone_number}
                          </p>
                        )}

                        {profile.role && (
                          <p className="py-2">
                            <span className="font-medium">Role:</span> {profile.role}
                          </p>
                        )}

                        {profile.job && (
                          <p className="py-2">
                            <span className="font-medium">Job:</span> {profile.job}
                          </p>
                        )}

                        {profile.country && (
                          <p className="py-2">
                            <span className="font-medium">Country:</span> {profile.country}
                          </p>
                        )}

                        {profile.state && (
                          <p className="py-2">
                            <span className="font-medium">State:</span> {profile.state}
                          </p>
                        )}

                        {profile.area && (
                          <p className="py-2">
                            <span className="font-medium">Area:</span> {profile.area}
                          </p>
                        )}

                        {profile.street && (
                          <p className="py-2">
                            <span className="font-medium">Street:</span> {profile.street}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-x-4">
                        <button
                          onClick={handleEditProfile}
                          className="mt-4 bg-[#008753] text-white px-4 py-2 rounded-md "
                        >
                          Edit Profile
                        </button>

                        <button
                          onClick={async () => {
                            await logout();
                          }}
                          className="mt-4 bg-red-500 text-white px-4 py-2 rounded-md "
                        >
                          Log Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}


              {activeTab === "posts" && (
                <div className="flex ">
                <MyPostsMain ref={myPostsRef} />

                </div>
              )}


              {activeTab === "bookmarks" && (
                <MyBookmarksMain ref={bookmarksRef} />

              )}

              {activeTab === "followers" && (
                <div className="space-y-2 md:space-y-3 ">
                  {myFollowers.length === 0 ? (
                    <p className="text-gray-600"></p>
                  ) : (
                    myFollowers.map((user) => (
                      <div
                        key={user.user_id}
                        className="flex items-center justify-between gap-3 bg-[#008753]/5 rounded-lg p-4 hover:bg-[#008753]/10"
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
                              <p className="font-medium text-sm">{user.full_name}</p>
                              
                              <p className=" text-gray-500">
                              {
                                user.job ? 
                                `${user.job}` : 
                                `${user.username}`
                              }
                              </p>
                            </div>
                          </div>
                        </Link>

                        {/* Follow/Unfollow Button */}
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          whileHover={{ scale: 1.05 }}
                          onClick={() => handleFollowToggle(user)}
                          className={`px-3 py-1 rounded-full text-sm flex items-center justify-center gap-2 transition-all ${
                            (localFollowing[user.user_id] ?? user.is_following)
                              ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                              : "bg-[#008753] text-white hover:bg-green-700"
                          }`}
                        >
                          {(localFollowing[user.user_id] ?? user.is_following) ? "Following" : "Follow"}
                        </motion.button>

                      </div>
                    ))
                  )}
                </div>
              )}


              {activeTab === "following" && (
                <div className="space-y-2 md:space-y-3">
                  {myFollowing.length === 0 ? (
                    <p className="text-gray-600"></p>
                  ) : (
                    myFollowing.map((user) => (
                      <div
                        key={user.user_id}
                        className="flex items-center justify-between gap-3 bg-[#008753]/5 rounded-lg p-4 hover:bg-[#008753]/10"
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
                              <p className="font-medium text-sm">{user.full_name}</p>
                              
                              <p className=" text-gray-500">
                              {
                                user.job ? 
                                `${user.job}` : 
                                `${user.username}`
                              }
                              </p>
                            </div>
                          </div>
                        </Link>

                        <button
                          onClick={() => handleUnfollow(user)}
                          className={`flex items-center justify-center gap-2 px-3 py-1 rounded-full md:text-sm transition 
                            ${
                              localFollowing[user.user_id] === false
                                ? "bg-[#008753] text-white hover:bg-green-700 pointer-events-none"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }
                          `}
                        >
                          {localFollowing[user.user_id] === false ? "Follow" : "Unfollow"}
                        </button>



                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          
          
          </div>
        </main>
      </section>


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

    </div>
  );
}