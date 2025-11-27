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
    <div className="min-h-screen  pb-5">
      <main className="flex justify-center w-full  mx-auto">
        <div className="flex-[3] w-full max-w-2xl">
          <h1 className="text-xl font-semibold mb-4 text-gray-800">
            Posts tagged with <span className="text-[#008753]">#{tag}</span>
          </h1>

          {loadingHashtag && (
            <div>
              <div className="flex justify-center px-2">
                <div className="space-y-4 pb-6 w-full">
                  {[...Array(1)].map((_, i) => (
                    <PostSkeleton key={i} />
                  ))}
                </div>
              </div>
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
