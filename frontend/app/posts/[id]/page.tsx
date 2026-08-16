"use client";

import { useState } from "react";
import CommunityNavbar from "@/app/_components/feed/CommunityNavbar";
import SinglePostPage from "./SinglePostPage";

export default function Page() {
  const [, setShowPostBox] = useState(false);

  return (
    <div className="min-h-screen bg-[#f7faf8]">
      <CommunityNavbar onCreatePost={() => setShowPostBox(true)} hideSearch />
      <main className="mx-auto w-full max-w-4xl px-3 py-5 sm:px-5 lg:px-8 lg:py-8">
        <div className="mb-5 rounded-3xl bg-[#073522] px-5 py-5 text-white sm:px-7">
          <p className="text-xs font-black uppercase tracking-[.16em] text-[#8dd1b3]">SabiForum discussion</p>
          <h1 className="mt-2 text-2xl font-black sm:text-3xl">Post and conversation</h1>
        </div>
        <div className="rounded-3xl border border-[#dce8e1] bg-white p-2 shadow-sm sm:p-4">
          <SinglePostPage />
        </div>
      </main>
    </div>
  );
}
