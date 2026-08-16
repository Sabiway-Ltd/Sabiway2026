"use client";

import { useParams } from "next/navigation";
import CommunityNavbar from "@/app/_components/feed/CommunityNavbar";
import UserProfile from "@/app/profile/[username]/UserProfile";

export default function ProfilePage() {
  const { username } = useParams();

  return (
    <div className="min-h-screen bg-[#f7faf8]">
      <CommunityNavbar onCreatePost={() => undefined} hideSearch />
      <main className="mx-auto w-full max-w-5xl px-3 py-5 sm:px-5 lg:px-8 lg:py-8">
        <div className="mb-5 rounded-3xl border border-[#dce8e1] bg-white px-5 py-5 shadow-sm sm:px-7">
          <p className="text-xs font-black uppercase tracking-[.16em] text-[#008753]">SabiWay profile</p>
          <h1 className="mt-2 text-2xl font-black text-[#173126] sm:text-3xl">Professional and community identity</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68776f]">View public profile information and SabiForum activity without exposing private contact details.</p>
        </div>
        <div className="rounded-3xl border border-[#dce8e1] bg-white p-2 shadow-sm sm:p-4">
          <UserProfile username={username as string} />
        </div>
      </main>
    </div>
  );
}
