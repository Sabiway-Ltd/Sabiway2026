export type NotificationActor = {
  user_id: number;
  username: string;
  full_name: string;
  profile_picture: string | null;
};

export type NotificationTarget = {
  type: string;
  id: string | number;
  username?: string;
  full_name?: string;
  post_id?: string;
  post_slug?: string | null;
  comment_id?: string;
  slug?: string | null;
  content_preview?: string;
  text_preview?: string;
} | null;

export type NotificationItem = {
  id: number;
  type: string;
  actor: NotificationActor;
  target: NotificationTarget;
  message: string;
  is_read: boolean;
  created_at: string;
};

export type NotificationFeed = {
  notifications: NotificationItem[];
  unreadCount: number;
};
