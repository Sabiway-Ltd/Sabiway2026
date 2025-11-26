"use client"

import { useState, useEffect } from "react";
import { usePostStore } from "../store/usePostStore";
import { useProfileStore } from "../store/useProfileStore";


import PostBox from "../_components/feed/PostBox";

import PostSkeleton from "../_components/feed/PostSkeleton";
import { Loader2 } from "lucide-react";
import { RenderPostList } from "../_components/common/RenderPostList ";

export default function PostMain(){

      const [showPostBox, setShowPostBox] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);

  const {
    posts,
    getAllPosts,
    loading,
    error,
    initSocket,
    nextPage,
    hasMore,
    refreshFeed,
    consumeRefresh,
  } = usePostStore();

  const { fetchMyFollowing } = useProfileStore();

  // First mount
  useEffect(() => {
    getAllPosts(1);
    initSocket();
    fetchMyFollowing();
  }, []);

  // Remove skeleton after first real posts load
  useEffect(() => {
    if (!loading && posts.length > 0) {
      setFirstLoad(false);
    }
  }, [loading, posts]);

  // Handle external refreshes (e.g. after posting)
  useEffect(() => {
    if (refreshFeed) {
      getAllPosts(1);
      consumeRefresh();
    }
  }, [refreshFeed]);

  // Infinite scroll
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const handleScroll = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const nearBottom =
          window.innerHeight + window.scrollY >=
          document.body.offsetHeight - 400;

        if (nearBottom && hasMore && !loading) {
          getAllPosts(nextPage);
        }
      }, 200);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [nextPage, hasMore, loading]);


    return(
        <main className="flex-[3] md:mt-4 w-full">
          <PostBox visible={showPostBox} onClose={() => setShowPostBox(false)} />

          {firstLoad && loading && (
            <div className="space-y-4 pb-6">
              {[...Array(5)].map((_, i) => (
                <PostSkeleton key={i} />
              ))}
            </div>
          )}

          {!firstLoad && loading && (
            <div className="flex justify-center items-center gap-2 py-4">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              <p className="text-gray-500 text-sm">Refreshing posts...</p>
            </div>
          )}

          {posts.length > 0 && (
            <div className="md:space-y-4 space-y-1">
              <RenderPostList
                posts={posts}
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

          {!loading && posts.length === 0 && (
            <div className="text-center text-gray-400 py-8">No posts yet</div>
          )}

          {error && (
            <div className="text-center text-red-500 py-8">{error}</div>
          )}
        </main>
    )
}