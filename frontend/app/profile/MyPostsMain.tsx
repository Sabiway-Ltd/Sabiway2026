"use client";

import {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { usePostStore } from "../store/usePostStore";

import PostBox from "../_components/feed/PostBox";
import PostSkeleton from "../_components/feed/PostSkeleton";
import { Loader2 } from "lucide-react";
import { RenderPostList } from "../_components/common/RenderPostList ";

export type MyPostsMainRef = {
  fetchMyPosts: () => void;
};

const MyPostsMain = forwardRef<MyPostsMainRef>((props, ref) => {
  const [showPostBox, setShowPostBox] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);

  const {
    myPosts,
    getMyPosts,
    loadingMyPosts,
    myPostsError,
    nextMyPostsPage,
    hasMoreMyPosts,
    refreshFeed,
    consumeRefresh,
  } = usePostStore();

  const handleFetchMyPosts = () => {
    setFirstLoad(true);
    getMyPosts(1);
  };

  // 👇 Expose it to parent
  useImperativeHandle(ref, () => ({
    fetchMyPosts: handleFetchMyPosts,
  }));

  // Remove skeleton after first real load
  useEffect(() => {
    if (!loadingMyPosts && myPosts.length > 0) {
      setFirstLoad(false);
    }
  }, [loadingMyPosts, myPosts]);

  useEffect(() => {
    if (refreshFeed) {
      getMyPosts(1);
      consumeRefresh();
    }
  }, [refreshFeed]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const handleScroll = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const nearBottom =
          window.innerHeight + window.scrollY >=
          document.body.offsetHeight - 400;

        if (nearBottom && hasMoreMyPosts && !loadingMyPosts) {
          getMyPosts(nextMyPostsPage);
        }
      }, 200);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [nextMyPostsPage, hasMoreMyPosts, loadingMyPosts]);

  return (
    <main className="flex-[3] md:mt-4 w-full">
      <PostBox visible={showPostBox} onClose={() => setShowPostBox(false)} />

      {firstLoad && loadingMyPosts && (
        <div className="space-y-4 pb-6">
          {[...Array(1)].map((_, i) => (
            <PostSkeleton key={i} />
          ))}
        </div>
      )}

      {!firstLoad && loadingMyPosts && (
        <div className="flex justify-center items-center gap-2 py-4">
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          <p className="text-gray-500 text-sm">Refreshing posts...</p>
        </div>
      )}

      {myPosts.length > 0 && (
        <div className="md:space-y-4 space-y-1">
          <RenderPostList
            posts={myPosts}
            emptyMessage=""
            reloadFn={getMyPosts}
            clickable={true}
          />

          {loadingMyPosts && (
            <div className="flex justify-center items-center gap-2 py-4">
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
              <p className="text-gray-400 text-sm">Loading more posts...</p>
            </div>
          )}
        </div>
      )}

      {!loadingMyPosts && myPosts.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          You haven’t posted anything yet.
        </div>
      )}

      {myPostsError && (
        <div className="text-center text-red-500 py-8">
          {myPostsError}
        </div>
      )}
    </main>
  );
});

MyPostsMain.displayName = "MyPostsMain";


export default MyPostsMain;
