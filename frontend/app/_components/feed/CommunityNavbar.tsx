"use client";

import { useState } from "react";
import { Home, Menu, Plus, Search, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useProfileStore } from "@/app/store/useProfileStore";
import { usePostStore } from "@/app/store/usePostStore";
import NotificationDropdown from "../common/NotificationDropdown";
import ProfileDropdown from "../profile/ProfileDropdown";

interface CommunityNavbarProps {
  onCreatePost: () => void;
  onSearch?: (searchTerm: string) => void;
  hideSearch?: boolean;
  onReset?: () => void;
}

export default function CommunityNavbar({ onCreatePost, onSearch, onReset, hideSearch = false }: CommunityNavbarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { profile } = useProfileStore();
  const { triggerRefresh } = usePostStore.getState();
  const showSearch = pathname === "/community" && !hideSearch;

  const submitSearch = () => {
    const term = searchQuery.trim();
    if (term) onSearch?.(term);
    else onReset?.();
  };

  const goCommunity = () => {
    triggerRefresh();
    window.location.href = "/community";
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#dce8e1] bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-3 px-3 sm:px-5 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-black text-[#173126]" aria-label="SabiWay home">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#008753] text-xs font-black text-white">SW</span>
          <span className="hidden text-xl sm:block">SabiWay</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <button onClick={goCommunity} className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-extrabold ${pathname === "/community" ? "bg-[#e8f7f0] text-[#008753]" : "text-[#55685d] hover:bg-[#f1f6f3]"}`}><Home size={17}/> SabiForum</button>
          <Link href="/marketplace" className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-extrabold ${pathname?.startsWith("/marketplace") ? "bg-[#e8f7f0] text-[#008753]" : "text-[#55685d] hover:bg-[#f1f6f3]"}`}><ShoppingBag size={17}/> Marketplace</Link>
        </div>

        {showSearch ? (
          <div className="mx-auto hidden w-full max-w-md md:block">
            <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7b8981]" size={17}/><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submitSearch(); if (event.key === "Escape") { setSearchQuery(""); onReset?.(); } }} placeholder="Search SabiForum" className="min-h-11 w-full rounded-xl border border-[#dce8e1] bg-[#f7faf8] pl-11 pr-4 text-sm outline-none focus:border-[#008753]"/></div>
          </div>
        ) : <div className="flex-1"/>}

        <div className="ml-auto flex items-center gap-2">
          {pathname === "/community" ? (
            <button onClick={onCreatePost} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#008753] px-3 text-sm font-black text-white shadow-sm sm:px-4"><span className="hidden sm:inline">Ask question</span><Plus size={17}/></button>
          ) : null}
          <div className="rounded-xl border border-[#e0eae4] bg-white p-0.5"><NotificationDropdown /></div>
          <div className="rounded-xl border border-[#e0eae4] bg-white p-0.5"><ProfileDropdown /></div>
          <button onClick={() => setMobileOpen((value) => !value)} className="rounded-xl border border-[#dce8e1] p-2 text-[#173126] md:hidden" aria-label="Open product navigation">{mobileOpen ? <X size={20}/> : <Menu size={20}/>}</button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-[#e6eee9] bg-white px-3 py-3 md:hidden">
          <div className="mx-auto grid max-w-7xl gap-2">
            <button onClick={goCommunity} className="flex items-center gap-2 rounded-xl bg-[#f4f8f6] px-4 py-3 text-left font-extrabold text-[#173126]"><Home size={18}/> SabiForum</button>
            <Link href="/marketplace" className="flex items-center gap-2 rounded-xl bg-[#f4f8f6] px-4 py-3 font-extrabold text-[#173126]"><ShoppingBag size={18}/> Marketplace</Link>
            {showSearch ? <div className="relative mt-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7b8981]" size={17}/><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && submitSearch()} placeholder="Search SabiForum" className="min-h-11 w-full rounded-xl border border-[#dce8e1] bg-[#f7faf8] pl-11 pr-4 text-sm outline-none"/></div> : null}
            {profile ? <p className="px-1 pt-1 text-xs font-semibold text-[#748179]">Signed in as {profile.full_name}</p> : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}
