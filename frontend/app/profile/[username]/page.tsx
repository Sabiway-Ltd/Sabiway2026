// app/profile/[username]/page.tsx

"use client";

import UserProfile from "@/app/profile/[username]/UserProfile";
import CommunityNavbar from "@/app/_components/feed/CommunityNavbar";
import { useParams } from "next/navigation";
import { useAuthStore } from "@/app/store/useAuthStore";
import Aside from "@/app/_components/feed/Aside";
import PeopleYouMayKnow from "@/app/_components/profile/PeopleYouMayKnow";

export default function ProfilePage() {
  const { username } = useParams();
  const { user } = useAuthStore();

  return (
    <div className="px-1">
      <CommunityNavbar onCreatePost={() => alert("Create Post Clicked")} />

      <section className="flex justify-center gap-3 lg:gap-4 w-full md:px-10 mx-auto">
        {/* Left Sidebar */}
        <div className="md:w-[22rem] hidden lg:block mt-4">
          <div className="sticky top-4">
            <PeopleYouMayKnow />
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-[1_1_0%] min-w-0 mt-4">
          <UserProfile username={username as string} currentUserId={user?.user_id} />
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
