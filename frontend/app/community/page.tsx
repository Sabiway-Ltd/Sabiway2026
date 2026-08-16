// app/community/page.tsx

"use client";

import { useState, useEffect } from "react";
import { usePostStore } from "../store/usePostStore";
import { useProfileStore } from "../store/useProfileStore";
import CommunityNavbar from "../_components/feed/CommunityNavbar";
import PostBox from "../_components/feed/PostBox";
import { Loader2 } from "lucide-react";
import PeopleYouMayKnow from "../_components/profile/PeopleYouMayKnow";
import { RenderPostList } from "../_components/common/RenderPostList ";
import PostSkeleton from "../_components/feed/PostSkeleton";
import Aside from "../_components/feed/Aside";

import { io } from "socket.io-client";
import { EXPRESS_URL } from "@/app/utils/MyConstants";

export default function Community() {
  const [showPostBox, setShowPostBox] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);

  const {
    posts,
    getAllPosts,
    loading,
    error,
    nextPage,
    hasMore,
    refreshFeed,
    consumeRefresh,
  } = usePostStore();

  const { fetchMyFollowing } = useProfileStore();

  useEffect(() => {
    if (!loading && posts.length > 0) {
      setFirstLoad(false);
    }
  }, [loading, posts]);

  useEffect(() => {
    getAllPosts(1);
    fetchMyFollowing();
  }, [getAllPosts, fetchMyFollowing]);

  useEffect(() => {
    if (refreshFeed) {
      getAllPosts(1);
      consumeRefresh();
    }
  }, [refreshFeed, getAllPosts, consumeRefresh]);

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
      }, 200);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [nextPage, hasMore, loading, getAllPosts]);

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) return;

    const socket = io(EXPRESS_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    socket.on("new-post", (data) => {
      const { action, post, post_id, repost_id } = data;

      switch (action) {
        case "create":
          usePostStore.setState((state) => ({
            posts: state.posts.some((existing) => existing.id === post.id)
              ? state.posts
              : [post, ...state.posts],
          }));
          break;

        case "update":
          usePostStore.setState((state) => ({
            posts: state.posts.map((existing) =>
              existing.id === post.id ? post : existing
            ),
          }));
          break;

        case "delete":
          usePostStore.setState((state) => ({
            posts: state.posts.filter((existing) => existing.id !== post_id),
          }));
          break;

        case "repost":
          usePostStore.setState((state) => ({
            posts: state.posts.some((existing) => existing.id === post.id)
              ? state.posts
              : [post, ...state.posts],
          }));
          break;

        case "unrepost":
          usePostStore.setState((state) => ({
            posts: state.posts.filter((existing) => existing.id !== repost_id),
          }));
          break;

        default:
          break;
      }
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, []);

  const { filterBySearch, resetFilteredPosts, filteredPosts } = usePostStore();

  const handleSearch = (query: string) => {
    filterBySearch(query, "posts");
  };

  const handleReset = () => {
    resetFilteredPosts();
    getAllPosts(1);
  };

  const displayPosts = filteredPosts?.length ? filteredPosts : posts;

  return (
    <div className="min-h-screen md:px-6 px-1 pb-5">
      <CommunityNavbar
        onCreatePost={() => setShowPostBox(true)}
        onSearch={handleSearch}
        onReset={handleReset}
      />

      <section className="flex justify-center gap-3 lg:gap-4 w-full md:px-10 mx-auto">
        <div className="md:w-[22rem] hidden lg:block mt-4">
          <div className="sticky top-4">
            <PeopleYouMayKnow />
          </div>
        </div>

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
                posts={displayPosts}
                emptyMessage=""
                reloadFn={getAllPosts}
                clickable
              />

              {loading && (
                <div className="flex justify-center items-center gap-2 py-4">
                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                  <p className="text-gray-400 text-sm">Loading more posts...</p>
                </div>
              )}
            </div>
          )}

          {error && <div className="text-center text-red-500 py-8">{error}</div>}

          {!loading && posts.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              No posts yet — be the first to share something!
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
