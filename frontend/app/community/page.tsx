// app/community/page.tsx

"use client";

import { useState, useEffect } from "react";
import { usePostStore } from "../store/usePostStore";
import { useProfileStore } from "../store/useProfileStore";
import CommunityNavbar from "../_components/feed/CommunityNavbar";
import PostBox from "../_components/feed/PostBox";
import PostCard from "../_components/feed/PostCard";
import Aside from "../_components/feed/Aside";
import { DEFAULT_PROFILE_PICTURE } from "../helper";
import { Loader2 } from "lucide-react";
import { getProfileImage } from "../helper";
import Link from "next/link";
import PeopleYouMayKnow from "../_components/profile/PeopleYouMayKnow";
import { RenderPostList } from "../_components/common/RenderPostList ";
import PostSkeleton from "../_components/feed/PostSkeleton";


export default function Community() {
  const [showPostBox, setShowPostBox] = useState(false);
  const [searchType, setSearchType] = useState<"posts" | "profiles" | "hashtags">("posts");
  const [pendingSearch, setPendingSearch] = useState<string | null>(null);
  const [loadingFollowId, setLoadingFollowId] = useState<number | null>(null);
  const [firstLoad, setFirstLoad] = useState(true);
  

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
    nextPage, 
    hasMore,
    refreshFeed, 
    consumeRefresh,
    resetFilteredResults,
  } = usePostStore();

  useEffect(() => {
    if (!loading && posts.length > 0) {
      setFirstLoad(false);
    }
  }, [loading, posts]);

  const { user, fetchMyFollowing, toggleFollow, followingStatus } = useProfileStore();

 useEffect(() => {
  resetFilteredResults();
  setPendingSearch(null);
  setSearchType("posts");
  getAllPosts(1); // start from page 1
  initSocket();
  fetchMyFollowing();
}, []);

useEffect(() => {
  if (refreshFeed) {
    getAllPosts(1);
    consumeRefresh();
  }
}, [refreshFeed]);

useEffect(() => {
  let timeout: NodeJS.Timeout;

  const handleScroll = () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      const nearBottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 400;
      if (nearBottom && hasMore && !loading) {
        getAllPosts(nextPage);
      }
    }, 200); // wait 200ms before triggering
  };

  window.addEventListener("scroll", handleScroll);
  return () => {
    clearTimeout(timeout);
    window.removeEventListener("scroll", handleScroll);
  };
}, [nextPage, hasMore, loading]);




  const hasProfiles = filteredProfiles && filteredProfiles.length > 0;
  const hasHashtags = filteredHashtags && filteredHashtags.length > 0;
  const isFiltering = !!activeSearch || !!activeHashtag || !!pendingSearch;

  const displayedPosts =
    searchType === "posts"
      ? (isFiltering ? filteredPosts || [] : posts)
      : posts;

  const handleSearchSubmit = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    setPendingSearch(searchTerm.trim());
    setSearchType("posts");
    resetFilteredResults();
  };

  const handleSearchTypeChange = (type: "posts" | "profiles" | "hashtags") => {
    setSearchType(type);
    if (pendingSearch) {
      if (type === "hashtags") {
        filterBySearch(pendingSearch, "hashtags");
      } else {
        filterBySearch(pendingSearch, type);
      }
      setPendingSearch(null);
    }
  };

  const handleFollowToggle = async (id: number) => {
    setLoadingFollowId(id);
    try {
      await toggleFollow(id);
    } finally {
      setLoadingFollowId(null);
    }
  };

  return (
    <div className="min-h-screen md:px-6 px-1 pb-5">
      <CommunityNavbar
        onCreatePost={() => setShowPostBox(true)}
        onSearch={handleSearchSubmit}
        onReset={() => {
          setSearchType("posts");
          setPendingSearch(null);
        }}
      />

      <section className="flex justify-center gap-3 lg:gap-4 w-full md:px-10  mx-auto">
        
        <div className="md:w-[22rem] hidden lg:block mt-4">
          <div className="sticky top-4">
            <PeopleYouMayKnow />
          </div>
        </div>

        <main className="flex-[3] md:mt-4  w-full">
          <PostBox visible={showPostBox} onClose={() => setShowPostBox(false)} />

          {/* Search type buttons */}
          {pendingSearch && (
            <div className="flex flex-col items-center gap-3 mb-4">
              <p className="text-gray-600 font-medium">
                What do you want to search?
              </p>

              <div className="flex gap-4">
                <button
                  onClick={() => handleSearchTypeChange("posts")}
                  className="px-4 py-2 rounded-full bg-[#008753] text-white font-medium shadow hover:bg-[#007045] active:scale-95 transition"
                >
                  Posts
                </button>

                <button
                  onClick={() => handleSearchTypeChange("profiles")}
                  className="px-4 py-2 rounded-full bg-gray-700 text-white font-medium shadow hover:bg-gray-800 active:scale-95 transition"
                >
                  Profiles
                </button>
              </div>
            </div>
          )}

          {/* Loading states */}
          {/* First load → show skeleton */}
          {firstLoad && loading && !isFiltering && !pendingSearch && (
            <div className="space-y-4 pb-6">
              {[...Array(1)].map((_, i) => (
                <PostSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Subsequent reloads → small loader */}
          {!firstLoad && loading && !isFiltering && !pendingSearch && (
            <div className="flex justify-center items-center gap-2 py-4">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              <p className="text-gray-500 text-sm">Refreshing posts...</p>
            </div>
          )}

          {loadingHashtag && (
            <div className="space-y-4 py-6">
              {/* Optional text */}
              <p className="text-center text-gray-500">
                Searching results for{" "}
                <span className="font-medium">
                  {activeHashtag ? `#${activeHashtag}` : activeSearch ? `"${activeSearch}"` : ""}
                </span>
                ...
              </p>

              {/* Skeleton loaders */}
              {[...Array(4)].map((_, i) => (
                <PostSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Profiles search results with follow/unfollow */}
          {searchType === "profiles" && hasProfiles && (
            <div className="grid gap-3">
              {filteredProfiles.map((profile) => {
                const isFollowing = followingStatus[profile.user_id] || false;

                return (
                  <div
                    key={profile.user_id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition"
                  >
                    <a href={`/profile/${profile.username}`}>
                      <div className="flex items-center gap-3">
                        <img
                          src={getProfileImage(profile.profile_picture) || DEFAULT_PROFILE_PICTURE}
                          alt={profile.full_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium text-gray-800">{profile.full_name}</p>
                          <p className="text-sm text-gray-500">{profile.username}</p>
                        </div>
                      </div>
                    </a>

                    {user?.id !== profile.user_id && (
                      <button
                        onClick={() => handleFollowToggle(profile.user_id)}
                        disabled={loadingFollowId === profile.user_id}
                        className={`px-4 py-1.5 rounded-full text-sm flex items-center justify-center gap-2 ${
                          isFollowing
                            ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            : "bg-[#008753] text-white hover:bg-green-900"
                        }`}
                      >
                        {loadingFollowId === profile.user_id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isFollowing ? (
                          "Following"
                        ) : (
                          "Follow"
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {searchType === "profiles" &&
            !loading &&
            !loadingHashtag &&
            !hasProfiles &&
            pendingSearch === null && (
              <div className="text-center text-gray-400 py-8">
                {activeSearch
                  ? `No profiles found for "${activeSearch}".`
                  : "No matching profiles found."}
              </div>
            )}



          {/* Hashtags search results */}
          {searchType === "hashtags" && hasHashtags && (
            <div className="space-y-2">
              {filteredHashtags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => filterBySearch(tag.tag, "posts")}
                  className="block w-full text-left text-[#008753] hover:underline"
                >
                  #{tag.tag} <span className="text-gray-500 text-sm">({tag.use_count})</span>
                </button>
              ))}
            </div>
          )}

          {/* Posts */}
          {searchType === "posts" && displayedPosts.length > 0 && (
            <div className="md:space-y-4 space-y-1">
               <RenderPostList 
                  posts={displayedPosts}
                  emptyMessage=""
                  reloadFn={getAllPosts}
                  clickable={true}
                />
              {loading && (
                <div className="flex justify-center items-center gap-2 py-4">
                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                  <p className="text-gray-400 text-sm">Loading more posts...</p>
                </div>
              )}
            </div>
          )}

          {/* Error or empty states */}
          {error && <div className="text-center text-red-500 py-8">{error}</div>}

          {!loading &&
            !loadingHashtag &&
            displayedPosts.length === 0 &&
            !hasProfiles &&
            !hasHashtags &&
            !pendingSearch && (
              <div className="text-center text-gray-400 py-8">
                {activeHashtag
                  ? `No posts found for #${activeHashtag}.`
                  : activeSearch
                  ? `No results found for "${activeSearch}".`
                  : "No posts yet — be the first to share something!"}
              </div>
            )}


        </main>

        <aside className="hidden md:block md:w-[22rem] mt-2">
          <div className="sticky top-4">
            <Aside />
          </div>
        </aside>
      </section>
    </div>
  );
}
