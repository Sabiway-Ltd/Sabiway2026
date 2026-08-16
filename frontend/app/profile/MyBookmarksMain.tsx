"use client";

import {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { usePostStore } from "../store/usePostStore";
import PostSkeleton from "../_components/feed/PostSkeleton";
import { Loader2 } from "lucide-react";
import { RenderPostList } from "../_components/common/RenderPostList ";

export type MyBookmarksMainRef = {
  fetchBookmarks: () => void;
};

const MyBookmarksMain = forwardRef<MyBookmarksMainRef>((props, ref) => {
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

  const handleFetchBookmarks = () => {
    setFirstLoad(true);
    getBookmarks(1);
  };

  // 👇 Expose function to parent
  useImperativeHandle(ref, () => ({
    fetchBookmarks: handleFetchBookmarks,
  }));

  // Remove skeleton after first load
  useEffect(() => {
    if (!loadingBookmarks && bookmarks.length > 0) {
      setFirstLoad(false);
    }
  }, [loadingBookmarks, bookmarks]);

  // Handle external refresh
  useEffect(() => {
    if (refreshBookmarks) {
      getBookmarks(1);
      consumeBookmarksRefresh();
    }
  }, [refreshBookmarks]);

  // Infinite scroll
  useEffect(() => {
    let timeout: NodeJS.Timeout;

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
      {/* First load skeleton */}
      {firstLoad && loadingBookmarks && (
        <div className="space-y-4 pb-6">
          {[...Array(1)].map((_, i) => (
            <PostSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Refresh loader */}
      {!firstLoad && loadingBookmarks && (
        <div className="flex justify-center items-center gap-2 py-4">
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          <p className="text-gray-500 text-sm">Loading bookmarks...</p>
        </div>
      )}

      {/* Bookmarks list */}
      {bookmarks.length > 0 && (
        <div className="md:space-y-4 space-y-1">
          <RenderPostList
            posts={bookmarks.map((bookmark) => bookmark.post ?? bookmark)}
            emptyMessage=""
            reloadFn={getBookmarks}
            clickable={true}
          />

          {/* Infinite loader */}
          {loadingBookmarks && (
            <div className="flex justify-center items-center gap-2 py-4">
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
              <p className="text-gray-400 text-sm">
                Loading more bookmarks...
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loadingBookmarks && bookmarks.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          No bookmarks yet
        </div>
      )}

      {/* Error */}
      {bookmarksError && (
        <div className="text-center text-red-500 py-8">
          {bookmarksError}
        </div>
      )}
    </main>
  );
});

MyBookmarksMain.displayName = "MyBookmarksMain";

export default MyBookmarksMain;
