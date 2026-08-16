import { environment } from "../config/environment";
import type { ForumComment, ForumPost, PostPage } from "./types";

async function forumRequest<T>(path: string, access: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${environment.djangoUrl}/api/posts/${path.replace(/^\//, "")}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${access}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body?.detail || body?.error || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return body as T;
}

export async function getPosts(access: string): Promise<ForumPost[]> {
  const page = await forumRequest<PostPage | ForumPost[]>("", access);
  return Array.isArray(page) ? page : page.results ?? [];
}

export function createPost(access: string, content: string) {
  return forumRequest<ForumPost>("", access, { method: "POST", body: JSON.stringify({ content }) });
}

export function likePost(access: string, id: string) {
  return forumRequest<{ detail: string }>(`${id}/like/`, access, { method: "POST" });
}

export function unlikePost(access: string, id: string) {
  return forumRequest<{ detail: string }>(`${id}/unlike/`, access, { method: "POST" });
}

export function bookmarkPost(access: string, id: string) {
  return forumRequest(`${id}/bookmark/`, access, { method: "POST" });
}

export function unbookmarkPost(access: string, id: string) {
  return forumRequest(`${id}/unbookmark/`, access, { method: "DELETE" });
}

export function repostPost(access: string, id: string) {
  return forumRequest<ForumPost>(`${id}/repost/`, access, { method: "POST" });
}

export function unrepostPost(access: string, id: string) {
  return forumRequest(`${id}/unrepost/`, access, { method: "DELETE" });
}

export function getComments(access: string, id: string) {
  return forumRequest<ForumComment[]>(`${id}/comments/`, access);
}

export function addComment(access: string, id: string, content: string) {
  return forumRequest<ForumComment>(`${id}/comments/`, access, { method: "POST", body: JSON.stringify({ content }) });
}

export function reportPost(access: string, id: string, reason: string) {
  return forumRequest<{ message: string }>("report/", access, {
    method: "POST",
    body: JSON.stringify({ post_id: id, reason, post_url: `https://www.sabiway.com/posts/${id}` }),
  });
}
