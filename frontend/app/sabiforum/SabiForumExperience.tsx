"use client";

import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { Loader2, Plus, RotateCcw, Search } from "lucide-react";

import { AppShell } from "@/app/_components/v2/AppShell";
import Button from "@/app/_components/common/Button";
import { InlineAlert, StatePanel } from "@/app/_components/common/DesignPrimitives";
import Aside from "@/app/_components/feed/Aside";
import PostBox from "@/app/_components/feed/PostBox";
import PostSkeleton from "@/app/_components/feed/PostSkeleton";
import PeopleYouMayKnow from "@/app/_components/profile/PeopleYouMayKnow";
import { RenderPostList } from "@/app/_components/common/RenderPostList ";
import { usePostStore } from "@/app/store/usePostStore";
import { useProfileStore } from "@/app/store/useProfileStore";
import { useAuthStore } from "@/app/store/useAuthStore";
import { EXPRESS_URL } from "@/app/utils/MyConstants";

export default function SabiForumExperience() {
  const access = useAuthStore((state) => state.access);
  const user = useAuthStore((state) => state.user);
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
    filterBySearch,
    resetFilteredPosts,
    filteredPosts,
  } = usePostStore();
  const { fetchMyFollowing } = useProfileStore();

  useEffect(() => {
    if (!loading && posts.length > 0) setFirstLoad(false);
  }, [loading, posts]);

  useEffect(() => {
    if (!access || !user) return;
    void getAllPosts(1);
    void fetchMyFollowing();
  }, [access, user, getAllPosts, fetchMyFollowing]);

  useEffect(() => {
    if (!refreshFeed || !access) return;
    void getAllPosts(1);
    consumeRefresh();
  }, [refreshFeed, access, getAllPosts, consumeRefresh]);

  useEffect(() => {
    if (!access) return;
    const socket = io(EXPRESS_URL, {
      auth: { token: access },
      transports: ["websocket", "polling"],
      reconnection: true,
    });
    socket.on("new-post", (data) => {
      const { action, post, post_id, repost_id } = data;
      if (action === "create" || action === "repost") {
        usePostStore.setState((state) => ({
          posts: state.posts.some((existing) => existing.id === post.id) ? state.posts : [post, ...state.posts],
        }));
      }
      if (action === "update") {
        usePostStore.setState((state) => ({ posts: state.posts.map((existing) => existing.id === post.id ? post : existing) }));
      }
      if (action === "delete") usePostStore.setState((state) => ({ posts: state.posts.filter((existing) => existing.id !== post_id) }));
      if (action === "unrepost") usePostStore.setState((state) => ({ posts: state.posts.filter((existing) => existing.id !== repost_id) }));
    });
    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [access]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const handleScroll = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 400;
        if (nearBottom && hasMore && !loading && nextPage) void getAllPosts(nextPage);
      }, 200);
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [nextPage, hasMore, loading, getAllPosts]);

  const displayPosts = useMemo(() => filteredPosts?.length ? filteredPosts : posts, [filteredPosts, posts]);
  const runSearch = () => {
    const term = searchQuery.trim();
    if (term) void filterBySearch(term, "posts");
    else resetFilteredPosts();
  };
  const resetSearch = () => {
    setSearchQuery("");
    resetFilteredPosts();
    void getAllPosts(1);
  };

  return (
    <AppShell>
      <main className="min-h-screen bg-background pb-8">
        <section className="border-b border-border bg-card px-4 py-7 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[.16em] text-primary">SabiForum</p>
                <h1 className="mt-1 text-3xl font-black tracking-[-.03em] sm:text-4xl">Ask, share and learn from the SabiWay community.</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Practical local knowledge, service context and useful conversations stay connected to one SabiWay identity.</p>
              </div>
              <Button leadingIcon={<Plus size={17} aria-hidden="true" />} onClick={() => setShowPostBox(true)}>Create post</Button>
            </div>
            <div className="mt-6 flex max-w-2xl gap-2 rounded-[var(--sabi-radius-lg)] border border-border bg-background p-1.5 shadow-[var(--sabi-shadow-sm)]">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Search SabiForum posts</span>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} aria-hidden="true" />
                <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") runSearch(); if (event.key === "Escape") resetSearch(); }} placeholder="Search SabiForum" className="min-h-11 w-full rounded-[var(--sabi-radius-md)] border-0 bg-background pl-10 pr-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </label>
              <Button size="sm" onClick={runSearch}>Search</Button>
            </div>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-7xl gap-5 px-3 py-5 sm:px-6 lg:grid-cols-[230px_minmax(0,680px)_260px] lg:px-8">
          <aside className="hidden lg:block"><div className="sticky top-4 rounded-[var(--sabi-radius-lg)] border border-border bg-card p-2 shadow-[var(--sabi-shadow-sm)]"><PeopleYouMayKnow /></div></aside>
          <section className="min-w-0" aria-label="SabiForum feed">
            <div className="mb-4 flex items-center gap-3 rounded-[var(--sabi-radius-lg)] border border-border bg-card p-3 shadow-[var(--sabi-shadow-sm)]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--sabi-surface-selected)] font-black text-primary">S</div>
              <button onClick={() => setShowPostBox(true)} className="min-h-11 flex-1 rounded-full bg-muted px-4 text-left text-sm font-medium text-muted-foreground">Share something useful with SabiForum…</button>
            </div>
            <PostBox visible={showPostBox} onClose={() => setShowPostBox(false)} />
            {firstLoad && loading ? <div className="space-y-3 pb-6" aria-label="Loading SabiForum posts">{[...Array(5)].map((_, i) => <PostSkeleton key={i} />)}</div> : null}
            {!firstLoad && loading ? <div className="flex items-center justify-center gap-2 py-4" aria-live="polite"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /><p className="text-sm text-muted-foreground">Refreshing posts…</p></div> : null}
            {displayPosts.length > 0 ? <div className="space-y-3"><RenderPostList posts={displayPosts} emptyMessage="No posts match your current search." reloadFn={getAllPosts} clickable /></div> : null}
            {error ? <InlineAlert tone="error" className="my-6"><p className="font-black">{error}</p><Button variant="ghost" size="sm" className="mt-2" onClick={() => void getAllPosts(1)}>Try again</Button></InlineAlert> : null}
            {!loading && !error && posts.length === 0 ? <StatePanel title="No posts yet" description="Be the first to share something useful with the SabiWay community." tone="empty" action={<Button size="sm" onClick={() => setShowPostBox(true)}>Create the first post</Button>} /> : null}
            <div className="mt-3 flex justify-end"><Button variant="ghost" size="sm" leadingIcon={<RotateCcw size={14} aria-hidden="true" />} onClick={resetSearch}>Reset search</Button></div>
          </section>
          <aside className="hidden lg:block"><div className="sticky top-4"><Aside /></div></aside>
        </section>
      </main>
    </AppShell>
  );
}
