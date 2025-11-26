import { useEffect, useRef } from "react";
import { usePostStore } from "@/app/store/usePostStore";
import PostCard from "@/app/_components/feed/PostCard";

export default function MyPostsTab() {
  const {
    myPosts,
    fetchMyPosts,
    myPostsHasMore,
    loadingMyPosts,
  } = usePostStore();

  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMyPosts();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && myPostsHasMore) {
        fetchMyPosts();
      }
    });

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [myPostsHasMore]);

  return (
    <div>
      {myPosts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {loadingMyPosts && <p className="text-center py-4">Loading...</p>}

      {/* Trigger point */}
      <div ref={loaderRef} className="h-10" />
    </div>
  );
}
