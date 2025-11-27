"use client";


import CommunityNavbar from "@/app/_components/feed/CommunityNavbar";
import PeopleYouMayKnow from "@/app/_components/profile/PeopleYouMayKnow";
import Aside from "@/app/_components/feed/Aside";
import { useState } from "react";
import SinglePostPage from "./SinglePostPage";

export default function page() {
    const [showPostBox, setShowPostBox] = useState(false);


  return (
    <div className="">
      <CommunityNavbar
        onCreatePost={() => setShowPostBox(true)}
        hideSearch={true}
      />

      <section className="flex justify-center gap-3 lg:gap-4 w-full md:px-10 mx-auto">
        {/* Left Sidebar */}
        <div className="md:w-[22rem] hidden lg:block mt-4">
          <div className="sticky top-4">
            <PeopleYouMayKnow />
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 mt-4">
          <SinglePostPage/>
        </main>

        {/* Right Sidebar */}
        <aside className="hidden md:block md:w-[22rem] mt-2">
          <div className="sticky top-4">
            <Aside />
          </div>
        </aside>
      </section>
    </div>
  );
}
