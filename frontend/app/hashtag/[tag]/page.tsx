"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import CommunityNavbar from "@/app/_components/feed/CommunityNavbar";
import HashtagPage from "./HashtagPage";

export default function Page() {
  const [, setShowPostBox] = useState(false);
  const { tag } = useParams();
  const label = Array.isArray(tag) ? tag[0] : tag;

  return (
    <div className="min-h-screen bg-[#f7faf8]">
      <CommunityNavbar onCreatePost={() => setShowPostBox(true)} hideSearch />
      <main className="mx-auto w-full max-w-4xl px-3 py-5 sm:px-5 lg:px-8 lg:py-8">
        <div className="mb-5 rounded-3xl bg-[#008753] px-5 py-5 text-white sm:px-7">
          <p className="text-xs font-black uppercase tracking-[.16em] text-[#c8f1dd]">SabiForum topic</p>
          <h1 className="mt-2 text-2xl font-black sm:text-3xl">#{decodeURIComponent(label || "topic")}</h1>
          <p className="mt-2 text-sm text-white/75">Explore public conversations connected to this topic.</p>
        </div>
        <div className="rounded-3xl border border-[#dce8e1] bg-white p-2 shadow-sm sm:p-4">
          <HashtagPage />
        </div>
      </main>
    </div>
  );
}
