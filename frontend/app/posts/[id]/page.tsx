// app/posts/[id]/page.tsx

"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { usePostStore } from "../../store/usePostStore";
import PostCard from "../../_components/feed/PostCard";
import { Loader2 } from "lucide-react";
import { DEFAULT_PROFILE_PICTURE } from "../../helper";
import CommunityNavbar from "@/app/_components/feed/CommunityNavbar";
import PostSkeleton from "@/app/_components/feed/PostSkeleton";

export default function SinglePostPage() {
  const { id } = useParams();
  const { currentPost, getPostById, loading, error } = usePostStore();

  useEffect(() => {
    if (!id) return;

    const fetchPost = async () => {
      const post = await getPostById(id as string);
      if (!post) {
        console.error("Failed to fetch post:", id);
      }
    };

    fetchPost();
  }, [id, getPostById]);

  const handleReloadPost = async () => {
    if (!currentPost){
      console.log("No Current Post")
      return
    };
    console.log("Reloading single post:", currentPost.id);
    await getPostById(currentPost.id);
  };


  // Loader
  if (loading) {
    return (
      <div>
         <div className="md:px-6 px-1">
          <CommunityNavbar onCreatePost={() => alert("Create Post Clicked")} />
        </div>

        <div className="flex justify-center px-2">
          <div className="space-y-4 pb-6 md:w-[50%] w-full">
            {[...Array(1)].map((_, i) => (
              <PostSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error or missing post
  if (!currentPost || error) {
    return (
      <div className="text-center text-red-500 py-12">
        {/* {error || "Failed to load post."} */}
      </div>
    );
  }

  const post = currentPost;

  return (
    <div>
      <div className="md:px-6 px-1">
        <CommunityNavbar onCreatePost={() => alert("Create Post Clicked")} />
      </div>

      <div className="min-h-screen bg-white flex justify-center px-2 md:px-6">
        <div className="max-w-2xl w-full md:mt-6 ">
          <PostCard
            id={post.id}
            author={{
              user_id: post.author.user_id,
              full_name: post.author.full_name,
              username: post.author.username,
              profile_picture:
                post.author.profile_picture || DEFAULT_PROFILE_PICTURE,
              phone_number: post.author.phone_number || "",
              is_following: post.author.is_following,
              job: post.author.job || "",
            }}
            content={post.content}
            image={post.image || null}
            likes_count={post.likes_count}
            comments_count={post.comments_count}
            impressions_count={post.impressions_count || 0}
            is_liked={post.is_liked ?? false}
            is_bookmarked={post.is_bookmarked ?? false}
            created_at={post.created_at}
            onReloadPosts={handleReloadPost} // reload single post after edit/delete
            alwaysShowComments={true}
          />
        </div>
      </div>
    </div>
  );
}
