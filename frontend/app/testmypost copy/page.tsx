"use client";


import CommunityNavbar from "../_components/feed/CommunityNavbar";
import PeopleYouMayKnow from "../_components/profile/PeopleYouMayKnow";
import Aside from "../_components/feed/Aside";
import { useState } from "react";
import MyPostsMain from "./MyPostsMain";
import MyBookmarksMain from "./MyBookmarksMain";

export default function page() {
    const [showPostBox, setShowPostBox] = useState(false);


  return (
    <div className="min-h-screen md:px-6 px-1 pb-5">
      <CommunityNavbar
        onCreatePost={() => setShowPostBox(true)}
        hideSearch={true}
      />

      <section className="flex justify-center gap-3 lg:gap-4 w-full md:px-10 mx-auto">
        <div className="md:w-[22rem] hidden lg:block mt-4">
          <div className="sticky top-4">
            <PeopleYouMayKnow />
          </div>
        </div>

        <MyBookmarksMain/>

        <aside className="hidden md:block md:w-[22rem] mt-2">
          <div className="sticky top-4">
            <Aside />
          </div>
        </aside>
      </section>
    </div>
  );
}
