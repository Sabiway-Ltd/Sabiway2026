"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePostStore } from "@/app/store/usePostStore";
import { RenderPostList } from "./RenderPostList ";
import { Loader2 } from "lucide-react";

interface InfinitePostListProps {
  clickable?: boolean;
  emptyMessage?: string;
}

export default function InfinitePostList({ clickable = false, emptyMessage = "No posts yet." }: InfinitePostListProps) {
  const {
    posts,
    getAllPosts,
    loading,
    error,
    nextPage,
    hasMore,
  } = usePostStore();

  const observerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (!observerRef.current || loading || !hasMore || !nextPage) return;

    const rect = observerRef.current.getBoundingClientRect();
    if (rect.top - window.innerHeight <= 200) { // trigger 200px before reaching the bottom
      getAllPosts(nextPage);
    }
  }, [loading, hasMore, nextPage, getAllPosts]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <div className="space-y-4">
      <RenderPostList posts={posts} emptyMessage={emptyMessage} reloadFn={getAllPosts} clickable={clickable} />

      {loading && (
        <div className="flex justify-center items-center gap-2 py-4">
          <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          <p className="text-gray-400 text-sm">Loading more posts...</p>
        </div>
      )}

      {error && <div className="text-center text-red-500 py-4">{error}</div>}

      {/* Invisible div to trigger scrolling */}
      <div ref={observerRef}></div>
    </div>
  );
}
