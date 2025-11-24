"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { usePostStore } from "@/app/store/usePostStore";
import { Loader2 } from "lucide-react";
import CommunityNavbar from "@/app/_components/feed/CommunityNavbar";
import PostBox from "@/app/_components/feed/PostBox";
import { RenderPostList } from "@/app/_components/common/RenderPostList ";
import PostSkeleton from "@/app/_components/feed/PostSkeleton";

export default function HashtagPage() {
  const { tag } = useParams();
  const { filteredPosts, filterBySearch, loadingHashtag, error } = usePostStore();

  useEffect(() => {
    if (tag) {
      filterBySearch(tag as string, "posts"); // fetch posts under hashtag
    }
  }, [tag]);

  // ✅ ensure filteredPosts is always an array
  const posts = Array.isArray(filteredPosts) ? filteredPosts : [];

  return (
    <div className="min-h-screen md:px-6 px-1 pb-5">
      <CommunityNavbar />
      <main className="flex justify-center md:mt-5 w-full md:px-10 px-1 mx-auto">
        <div className="flex-[3] w-full max-w-2xl">
          <h1 className="text-xl font-semibold mb-4 text-gray-800">
            Posts tagged with <span className="text-[#008753]">#{tag}</span>
          </h1>

          {loadingHashtag && (
            <div className="flex flex-col items-center justify-center py-10 text-gray-500">
              <Loader2 className="animate-spin h-6 w-6 mb-2 text-[#008753]" />
              <p>Loading posts for #{tag}...</p>
            </div>
          )}

          {error && (
            <div className="text-center text-red-500 py-6">
              Error: {error}
            </div>
          )}

          {!loadingHashtag && posts.length === 0 && (
            <div className="text-center text-gray-400 py-10">
              No posts found for #{tag}.
            </div>
          )}

          {!loadingHashtag && posts.length > 0 && (
            <RenderPostList
              posts={posts}
              emptyMessage=""
              reloadFn={() => filterBySearch(tag as string, "posts")}
              clickable={true}
            />
          )}
        </div>
      </main>
    </div>
  );
}
