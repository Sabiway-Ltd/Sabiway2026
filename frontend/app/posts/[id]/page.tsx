// app/posts/[id]/page.tsx

"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { usePostStore } from "../../store/usePostStore";
import PostCard from "../../_components/feed/PostCard";
import { Loader2 } from "lucide-react";
import { DEFAULT_PROFILE_PICTURE } from "../../helper";
import CommunityNavbar from "@/app/_components/feed/CommunityNavbar";

export default function SinglePostPage() {
  const { id } = useParams();
  const { currentPost, getPostById, loading, error } = usePostStore();

  useEffect(() => {
    if (id) {
        usePostStore.getState().getPostById(id as string);
    }
    }, [id]);


  if (loading || !currentPost) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading post...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-12">
        {error || "Failed to load post."}
      </div>
    );
  }

  const post = currentPost;

  return (
    <div>
        <div className="md:px-6 px-3">
            <CommunityNavbar onCreatePost={() => alert("Create Post Clicked")} />
        </div>
        <div className="min-h-screen bg-gray-50 flex justify-center px-3 md:px-6">
        <div className="max-w-2xl w-full mt-6">
            <PostCard
            id={post.id}
            author={{
                user_id: post.author.user_id,
                full_name: post.author.full_name,
                username: post.author.username,
                profile_picture:
                post.author.profile_picture || DEFAULT_PROFILE_PICTURE,
                whatsapp_number: post.author.whatsapp_number || "",
                is_following: post.author.is_following,
            }}
            content={post.content}
            image={post.image || null}
            likes_count={post.likes_count}
            comments_count={post.comments_count}
            impressions_count={post.impressions_count || 0}
            is_liked={post.is_liked ?? false}
            is_bookmarked={post.is_bookmarked ?? false}
            created_at={post.created_at}
            onReloadPosts={() => getPostById(post.id)} // reload single post after edit/delete
            alwaysShowComments={true}
            />
        </div>
        </div>
    </div>
  );
}
