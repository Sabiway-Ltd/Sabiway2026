"use client"

import Aside from "../_components/feed/Aside";
import CommunityNavbar from "../_components/feed/CommunityNavbar";
import MyProfile from "../_components/profile/MyProfile";
import PeopleYouMayKnow from "../_components/profile/PeopleYouMayKnow";

export default function page(){
  return(
    <div>
      <CommunityNavbar onCreatePost={() => alert("Create Post Clicked")} />
      
        <section className="flex justify-center gap-3 lg:gap-4 w-full md:px-10 mx-auto">
          {/* Left Sidebar */}
          <div className="md:w-[22rem] hidden lg:block mt-4">
            <div className="sticky top-4">
              <PeopleYouMayKnow />
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1 mt-4">
            <MyProfile/>
          </main>

          {/* Right Sidebar */}
          <aside className="hidden md:block md:w-[22rem] mt-2">
            <div className="sticky top-4">
              <Aside />
            </div>
          </aside>
        </section>
      
    </div>
  )
}