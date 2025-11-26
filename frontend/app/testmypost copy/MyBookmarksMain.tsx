"use client";

import { useState, useEffect } from "react";
import { usePostStore } from "../store/usePostStore";
import PostSkeleton from "../_components/feed/PostSkeleton";
import { Loader2 } from "lucide-react";
import { RenderPostList } from "../_components/common/RenderPostList ";

export default function MyBookmarksMain() {
  const [firstLoad, setFirstLoad] = useState(true);

  const {
    bookmarks,
    getBookmarks,
    loadingBookmarks,
    bookmarksError,
    nextBookmarksPage,
    hasMoreBookmarks,
    refreshBookmarks,
    consumeBookmarksRefresh,
  } = usePostStore();

  // First mount
  useEffect(() => {
    getBookmarks(1);
  }, []);

  // Remove skeleton after first load
  useEffect(() => {
    if (!loadingBookmarks && bookmarks.length > 0) {
      setFirstLoad(false);
    }
  }, [loadingBookmarks, bookmarks]);

  // Handle external refresh (if implemented)
  useEffect(() => {
    if (refreshBookmarks) {
      getBookmarks(1);
      consumeBookmarksRefresh();
    }
  }, [refreshBookmarks]);

  // Infinite scroll
  useEffect(() => {
    let timeout;

    const handleScroll = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const nearBottom =
          window.innerHeight + window.scrollY >=
          document.body.offsetHeight - 400;

        if (nearBottom && hasMoreBookmarks && !loadingBookmarks) {
          getBookmarks(nextBookmarksPage);
        }
      }, 200);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [nextBookmarksPage, hasMoreBookmarks, loadingBookmarks]);

  return (
    <main className="flex-[3] md:mt-4 w-full">
      {firstLoad && loadingBookmarks && (
        <div className="space-y-4 pb-6">
          {[...Array(5)].map((_, i) => (
            <PostSkeleton key={i} />
          ))}
        </div>
      )}

      {!firstLoad && loadingBookmarks && (
        <div className="flex justify-center items-center gap-2 py-4">
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          <p className="text-gray-500 text-sm">Loading bookmarks...</p>
        </div>
      )}

      {bookmarks.length > 0 && (
        <div className="md:space-y-4 space-y-1">
          <RenderPostList
            posts={bookmarks.map((b) => b.post)}
            emptyMessage=""
            reloadFn={getBookmarks}
            clickable={true}
          />

          {loadingBookmarks && (
            <div className="flex justify-center items-center gap-2 py-4">
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
              <p className="text-gray-400 text-sm">Loading more bookmarks...</p>
            </div>
          )}
        </div>
      )}

      {!loadingBookmarks && bookmarks.length === 0 && (
        <div className="text-center text-gray-400 py-8">No bookmarks yet</div>
      )}

      {bookmarksError && (
        <div className="text-center text-red-500 py-8">{bookmarksError}</div>
      )}
    </main>
  );
}
