export type ForumAuthor = {
  user_id: number;
  full_name: string;
  username: string;
  profile_picture?: string | null;
  job?: string | null;
};

export type ForumPost = {
  id: string;
  author: ForumAuthor;
  content: string;
  image?: string | null;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  impressions_count?: number;
  is_liked: boolean;
  is_bookmarked: boolean;
  created_at: string;
  original_post?: string | null;
};

export type PostPage = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: ForumPost[];
};

export type ForumComment = {
  id: string;
  user: ForumAuthor;
  content: string;
  likes_count: number;
  reply_count?: number;
  created_at: string;
};
