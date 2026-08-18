"use client";

import { useState } from "react";
import CommunityNavbar from "../_components/feed/CommunityNavbar";
import MyProfile from "./MyProfile";

export default function Page() {
  const [, setShowPostBox] = useState(false);
  return <div className="min-h-screen bg-[#f5f6f5]">
    <CommunityNavbar onCreatePost={() => setShowPostBox(true)} hideSearch />
    <section className="bg-[#008753] px-4 pb-20 pt-8 text-white sm:px-6 lg:px-8"><div className="mx-auto max-w-6xl"><p className="text-xs font-black uppercase tracking-[.18em] text-white/65">Your SabiWay identity</p><h1 className="mt-2 text-3xl font-black tracking-[-.02em] sm:text-4xl">Profile, reputation and trust</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">Manage how clients and the community see you, while private contact and location details stay protected.</p></div></section>
    <main className="mx-auto -mt-12 w-full max-w-6xl px-3 pb-10 sm:px-6 lg:px-8"><div className="overflow-hidden rounded-[1.75rem] border border-[#dde5e0] bg-white shadow-[0_18px_45px_rgba(0,70,45,.10)]"><MyProfile /></div></main>
  </div>;
}
