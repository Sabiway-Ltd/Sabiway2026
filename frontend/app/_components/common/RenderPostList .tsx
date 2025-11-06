import PostCard from "../feed/PostCard";

export const RenderPostList = ({ posts, emptyMessage, reloadFn, clickable=false }) => (
  <div className="space-y-4 w-full">
    {posts.length === 0 ? (
  <p className="text-gray-600">{emptyMessage}</p>
    ) : (
      posts.map((post, index) => (
        <PostCard
          key={post.id || `${post.original_post_data.id}-repost-${index}`}
          id={post.original_post_data ? post.original_post_data.id : post.id}
          author={post.original_post_data ? post.original_post_data.author : post.author}
          original_post_data={post.original_post_data}
          repost_post_data={post}
          content={post.original_post_data ? post.original_post_data.content : post.content}
          image={
            post.original_post_data
              ? post.original_post_data.image || null
              : post.image || null
          }
          likes_count={
            post.original_post_data
              ? post.original_post_data.likes_count
              : post.likes_count
          }
          comments_count={
            post.original_post_data
              ? post.original_post_data.comments_count
              : post.comments_count
          }
          impressions_count={
            post.original_post_data
              ? post.original_post_data.impressions_count || 0
              : post.impressions_count || 0
          }
          reposts_count={
            post.original_post_data
              ? post.original_post_data.reposts_count || 0
              : post.reposts_count || 0
          }
          is_liked={
            post.original_post_data ? post.original_post_data.is_liked : post.is_liked
          }
          is_bookmarked={
            post.original_post_data
              ? post.original_post_data.is_bookmarked
              : post.is_bookmarked
          }
          created_at={
            post.original_post_data
              ? post.original_post_data.created_at
              : post.created_at
          }
          onReloadPosts={() => reloadFn(post.id)}
          clickable={clickable}
        />
      ))
    )}

  </div>
);
