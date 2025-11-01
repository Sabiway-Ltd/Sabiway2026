import PostCard from "../feed/PostCard";

export const RenderPostList = ({ posts, emptyMessage, reloadFn }) => (
  <div className="space-y-4 w-full">
    {posts.length === 0 ? (
      <p className="text-gray-600">{emptyMessage}</p>
    ) : (
      <>
        {/* Reposts */}
        {posts.map(
          (post) =>
            post.original_post_data && (
              <PostCard
                key={post.original_post_data.id}
                id={post.original_post_data.id}
                author={post.original_post_data.author}
                original_post_data={post}
                content={post.original_post_data.content}
                image={post.original_post_data.image || null}
                likes_count={post.original_post_data.likes_count}
                comments_count={post.original_post_data.comments_count}
                impressions_count={post.original_post_data.impressions_count || 0}
                reposts_count={post.original_post_data.reposts_count || 0}
                is_liked={post.original_post_data.is_liked ?? false}
                is_bookmarked={post.original_post_data.is_bookmarked ?? false}
                created_at={post.original_post_data.created_at}
                onReloadPosts={reloadFn}
              />
            )
        )}

        {/* Normal posts */}
        {posts.map(
          (post) =>
            !post.original_post_data && (
              <PostCard
                key={post.id}
                id={post.id}
                author={post.author}
                original_post_data={post.original_post_data}
                content={post.content}
                image={post.image || null}
                likes_count={post.likes_count}
                comments_count={post.comments_count}
                impressions_count={post.impressions_count || 0}
                reposts_count={post.reposts_count || 0}
                is_liked={post.is_liked ?? false}
                is_bookmarked={post.is_bookmarked ?? false}
                created_at={post.created_at}
                onReloadPosts={() => reloadFn(post.id)}
              />
            )
        )}
      </>
    )}
  </div>
);
