// app/community/page.tsx

"use client";

import { useState, useEffect } from "react";
import { usePostStore } from "../store/usePostStore";
import { useProfileStore } from "../store/useProfileStore";
import PostBox from "../_components/feed/PostBox";
import { Loader2, Plus, RotateCcw, Search } from "lucide-react";
import PeopleYouMayKnow from "../_components/profile/PeopleYouMayKnow";
import { RenderPostList } from "../_components/common/RenderPostList ";
import PostSkeleton from "../_components/feed/PostSkeleton";
import Aside from "../_components/feed/Aside";

import { io } from "socket.io-client";
import { EXPRESS_URL } from "@/app/utils/MyConstants";

export default function Community() {
  const [showPostBox, setShowPostBox] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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

  const runSearch = () => {
    const term = searchQuery.trim();
    if (term) filterBySearch(term, "posts");
    else resetFilteredPosts();
  };

  const resetSearch = () => {
    setSearchQuery("");
    resetFilteredPosts();
    getAllPosts(1);
  };

  const displayPosts = filteredPosts?.length ? filteredPosts : posts;

  return (
    <div className="min-h-screen px-1 pb-5 md:px-6">
      <section className="mx-auto flex w-full justify-center gap-3 md:px-10 lg:gap-4">
        <div className="mt-4 hidden md:w-[22rem] lg:block">
          <div className="sticky top-4">
            <PeopleYouMayKnow />
          </div>
        </div>

        <main className="w-full flex-[3] md:mt-4">
          <div className="mb-4 rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-4" aria-label="SabiForum controls">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-black text-foreground">SabiForum</h1>
                <p className="text-sm font-medium text-muted-foreground">Ask questions, share local knowledge and learn from the community.</p>
              </div>
              <button type="button" onClick={() => setShowPostBox(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-black text-primary-foreground">
                <Plus size={18} aria-hidden="true" />Create post
              </button>
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Search SabiForum</span>
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} aria-hidden="true" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") runSearch();
                    if (event.key === "Escape") resetSearch();
                  }}
                  placeholder="Search SabiForum"
                  className="min-h-11 w-full rounded-xl border border-border bg-background pl-11 pr-4 text-sm outline-none focus:border-primary"
                />
              </label>
              <button type="button" onClick={runSearch} className="min-h-11 rounded-xl border border-border px-4 text-sm font-black text-foreground hover:bg-muted">Search</button>
              <button type="button" onClick={resetSearch} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-black text-muted-foreground hover:bg-muted hover:text-foreground">
                <RotateCcw size={17} aria-hidden="true" />Reset
              </button>
            </div>
          </div>

          <PostBox visible={showPostBox} onClose={() => setShowPostBox(false)} />

          {firstLoad && loading && (
            <div className="space-y-4 pb-6" aria-label="Loading SabiForum posts">
              {[...Array(5)].map((_, i) => (
                <PostSkeleton key={i} />
              ))}
            </div>
          )}

          {!firstLoad && loading && (
            <div className="flex items-center justify-center gap-2 py-4" aria-live="polite">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Refreshing posts…</p>
            </div>
          )}

          {posts.length > 0 && (
            <div className="space-y-1 md:space-y-4">
              <RenderPostList
                posts={displayPosts}
                emptyMessage="No posts match your current search."
                reloadFn={getAllPosts}
                clickable
              />

              {loading && (
                <div className="flex items-center justify-center gap-2 py-4" aria-live="polite">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Loading more posts…</p>
                </div>
              )}
            </div>
          )}

          {error && (
            <div role="alert" className="my-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-center">
              <p className="font-bold text-destructive">{error}</p>
              <button type="button" onClick={() => getAllPosts(1)} className="mt-3 min-h-11 rounded-xl bg-primary px-4 text-sm font-black text-primary-foreground">Try again</button>
            </div>
          )}

          {!loading && !error && posts.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border py-10 text-center text-muted-foreground">
              No posts yet — be the first to share something.
            </div>
          )}
        </main>

        <aside className="mt-2 hidden md:block md:w-[22rem]">
          <div className="sticky top-4">
            <Aside />
          </div>
        </aside>
      </section>
    </div>
  );
}
