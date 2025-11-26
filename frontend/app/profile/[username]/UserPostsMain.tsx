"use client";

import { useState, useEffect } from "react";
import { usePostStore } from "@/app/store/usePostStore";

import PostBox from "../../_components/feed/PostBox";
import PostSkeleton from "../../_components/feed/PostSkeleton";
import { Loader2 } from "lucide-react";
import { RenderPostList } from "@/app/_components/common/RenderPostList ";

interface UserPostsMainProps {
  username: string;
}

export default function UserPostsMain({ username }: UserPostsMainProps) {
  const [firstLoad, setFirstLoad] = useState(true);
  const [showPostBox, setShowPostBox] = useState(false);

  const {
    userPosts,
    getPostsByUsername,
    loading,
    error,
    userNextPage,
    userHasMore,
  } = usePostStore();

  // First load
  useEffect(() => {
    getPostsByUsername(username, 1);
  }, [username]);

  // Remove skeleton after first real posts load
  useEffect(() => {
    if (!loading && userPosts.length > 0) setFirstLoad(false);
  }, [loading, userPosts]);

  // Infinite scroll
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const handleScroll = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const nearBottom =
          window.innerHeight + window.scrollY >=
          document.body.offsetHeight - 400;

        if (nearBottom && userHasMore && !loading) {
          getPostsByUsername(username, userNextPage);
        }
      }, 200);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [username, userNextPage, userHasMore, loading]);

  return (
    <main className="flex-[3] md:mt-4 w-full">
      <PostBox visible={showPostBox} onClose={() => setShowPostBox(false)} />

      {firstLoad && loading && (
        <div className="space-y-4 pb-6">
          {[...Array(5)].map((_, i) => (
            <PostSkeleton key={i} />
          ))}
        </div>
      )}

      {userPosts.length > 0 && (
        <div className="md:space-y-4 space-y-1">
          <RenderPostList
            posts={userPosts}
            emptyMessage="No posts yet"
            reloadFn={() => getPostsByUsername(username, 1)}
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

      {!loading && userPosts.length === 0 && (
        <div className="text-center text-gray-400 py-8">No posts yet</div>
      )}

      {error && (
        <div className="text-center text-red-500 py-8">{error}</div>
      )}
    </main>
  );
}
