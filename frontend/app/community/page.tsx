// app/community/page.tsx
"use client";

import { useEffect, useState } from "react";
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
  const { posts, getAllPosts, loading, error, nextPage, hasMore, refreshFeed, consumeRefresh, filterBySearch, resetFilteredPosts, filteredPosts } = usePostStore();
  const { fetchMyFollowing } = useProfileStore();

  useEffect(() => { if (!loading && posts.length > 0) setFirstLoad(false); }, [loading, posts]);
  useEffect(() => { getAllPosts(1); fetchMyFollowing(); }, [getAllPosts, fetchMyFollowing]);
  useEffect(() => { if (refreshFeed) { getAllPosts(1); consumeRefresh(); } }, [refreshFeed, getAllPosts, consumeRefresh]);
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const handleScroll = () => { clearTimeout(timeout); timeout = setTimeout(() => { const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 400; if (nearBottom && hasMore && !loading) getAllPosts(nextPage); }, 200); };
    window.addEventListener("scroll", handleScroll); return () => { clearTimeout(timeout); window.removeEventListener("scroll", handleScroll); };
  }, [nextPage, hasMore, loading, getAllPosts]);
  useEffect(() => {
    const token = localStorage.getItem("access"); if (!token) return;
    const socket = io(EXPRESS_URL, { auth: { token }, transports: ["websocket", "polling"], reconnection: true });
    socket.on("new-post", (data) => {
      const { action, post, post_id, repost_id } = data;
      if (action === "create" || action === "repost") usePostStore.setState((state) => ({ posts: state.posts.some((existing) => existing.id === post.id) ? state.posts : [post, ...state.posts] }));
      if (action === "update") usePostStore.setState((state) => ({ posts: state.posts.map((existing) => existing.id === post.id ? post : existing) }));
      if (action === "delete") usePostStore.setState((state) => ({ posts: state.posts.filter((existing) => existing.id !== post_id) }));
      if (action === "unrepost") usePostStore.setState((state) => ({ posts: state.posts.filter((existing) => existing.id !== repost_id) }));
    });
    return () => { socket.removeAllListeners(); socket.disconnect(); };
  }, []);

  const runSearch = () => { const term = searchQuery.trim(); if (term) filterBySearch(term, "posts"); else resetFilteredPosts(); };
  const resetSearch = () => { setSearchQuery(""); resetFilteredPosts(); getAllPosts(1); };
  const displayPosts = filteredPosts?.length ? filteredPosts : posts;

  return <div className="min-h-screen bg-[#f5f6f5] pb-8">
    <section className="bg-[#008753] px-4 pb-8 pt-7 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.18em] text-white/65">One SabiWay</p><h1 className="mt-1 text-3xl font-black sm:text-4xl">Community</h1><p className="mt-2 max-w-xl text-sm leading-6 text-white/75">Ask, share, learn and connect with people across SabiForum.</p></div><button type="button" onClick={() => setShowPostBox(true)} className="hidden min-h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-black text-[#008753] sm:inline-flex"><Plus size={17}/>Create Post</button></div>
        <div className="mt-6 flex max-w-2xl gap-2 rounded-xl bg-white p-1.5"><label className="relative min-w-0 flex-1"><span className="sr-only">Search SabiForum</span><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#62736a]" size={18}/><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") runSearch(); if (event.key === "Escape") resetSearch(); }} placeholder="Search" className="min-h-11 w-full rounded-lg border-0 bg-white pl-10 pr-3 text-sm text-[#1f2f26] outline-none"/></label><button onClick={runSearch} className="min-h-11 rounded-lg bg-[#008753] px-4 text-sm font-black text-white">Search</button></div>
      </div>
    </section>

    <section className="mx-auto grid w-full max-w-7xl gap-5 px-3 py-5 sm:px-6 lg:grid-cols-[230px_minmax(0,680px)_260px] lg:px-8">
      <aside className="hidden lg:block"><div className="sticky top-4 rounded-2xl bg-white p-2 shadow-sm"><PeopleYouMayKnow /></div></aside>
      <main className="min-w-0">
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-[#e3e7e4] bg-white p-3 shadow-sm"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#dff7eb] font-black text-[#008753]">S</div><button onClick={() => setShowPostBox(true)} className="min-h-11 flex-1 rounded-full bg-[#f4f5f4] px-4 text-left text-sm font-medium text-[#7a837e]">Share something with SabiForum…</button><button onClick={() => setShowPostBox(true)} className="min-h-10 rounded-full bg-[#008753] px-4 text-xs font-black text-white sm:hidden">Post +</button></div>
        <PostBox visible={showPostBox} onClose={() => setShowPostBox(false)} />
        {firstLoad && loading && <div className="space-y-3 pb-6" aria-label="Loading SabiForum posts">{[...Array(5)].map((_, i) => <PostSkeleton key={i}/>)}</div>}
        {!firstLoad && loading && <div className="flex items-center justify-center gap-2 py-4" aria-live="polite"><Loader2 className="h-4 w-4 animate-spin text-[#758079]"/><p className="text-sm text-[#758079]">Refreshing posts…</p></div>}
        {posts.length > 0 && <div className="space-y-3"><RenderPostList posts={displayPosts} emptyMessage="No posts match your current search." reloadFn={getAllPosts} clickable/>{loading && <div className="flex items-center justify-center gap-2 py-4"><Loader2 className="h-4 w-4 animate-spin text-[#758079]"/><p className="text-sm text-[#758079]">Loading more posts…</p></div>}</div>}
        {error && <div role="alert" className="my-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-center"><p className="font-bold text-red-700">{error}</p><button onClick={() => getAllPosts(1)} className="mt-3 min-h-11 rounded-xl bg-[#008753] px-4 text-sm font-black text-white">Try again</button></div>}
        {!loading && !error && posts.length === 0 && <div className="rounded-2xl border border-dashed border-[#d8dedb] bg-white py-10 text-center text-[#77817b]">No posts yet — be the first to share something.</div>}
        <div className="mt-3 flex justify-end"><button onClick={resetSearch} className="inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-xs font-bold text-[#707a74]"><RotateCcw size={14}/>Reset search</button></div>
      </main>
      <aside className="hidden lg:block"><div className="sticky top-4"><Aside /></div></aside>
    </section>
  </div>;
}
