import { environment } from "../config/environment";
import type { ForumComment, ForumPost, ForumReply, PostPage } from "./types";

export type ForumMediaAsset = {
  uri: string;
  name?: string | null;
  mimeType?: string | null;
};

function makeMultipart(content: string, image?: ForumMediaAsset | null) {
  const form = new FormData();
  form.append("content", content);
  if (image) {
    form.append("image", {
      uri: image.uri,
      name: image.name || `sabiway-${Date.now()}.jpg`,
      type: image.mimeType || "image/jpeg",
    } as never);
  }
  return form;
}

async function forumRequest<T>(path: string, access: string, init: RequestInit = {}): Promise<T> {
  const multipart = typeof FormData !== "undefined" && init.body instanceof FormData;
  const response = await fetch(`${environment.djangoUrl}/api/posts/${path.replace(/^\//, "")}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${access}`,
      ...(multipart ? {} : { "Content-Type": "application/json" }),
      ...init.headers,
    },
  });

  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body?.detail || body?.error || Object.values(body ?? {}).flat().join(" ") || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return body as T;
}

export async function getPosts(access: string): Promise<ForumPost[]> {
  const page = await forumRequest<PostPage | ForumPost[]>("", access);
  return Array.isArray(page) ? page : page.results ?? [];
}

export function createPost(access: string, content: string, image?: ForumMediaAsset | null) {
  return image
    ? forumRequest<ForumPost>("", access, { method: "POST", body: makeMultipart(content, image) })
    : forumRequest<ForumPost>("", access, { method: "POST", body: JSON.stringify({ content }) });
}

export function updatePost(access: string, id: string, content: string, image?: ForumMediaAsset | null) {
  return image
    ? forumRequest<ForumPost>(`${id}/`, access, { method: "PATCH", body: makeMultipart(content, image) })
    : forumRequest<ForumPost>(`${id}/`, access, { method: "PATCH", body: JSON.stringify({ content }) });
}

export function deletePost(access: string, id: string) {
  return forumRequest<void>(`${id}/`, access, { method: "DELETE" });
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

export function addComment(access: string, id: string, content: string, image?: ForumMediaAsset | null) {
  return image
    ? forumRequest<ForumComment>(`${id}/comments/`, access, { method: "POST", body: makeMultipart(content, image) })
    : forumRequest<ForumComment>(`${id}/comments/`, access, { method: "POST", body: JSON.stringify({ content }) });
}

export function getReplies(access: string, commentId: string) {
  return forumRequest<ForumReply[]>(`comments/${commentId}/replies/`, access);
}

export function addReply(access: string, commentId: string, content: string, parentReply?: string, image?: ForumMediaAsset | null) {
  if (image) {
    const form = makeMultipart(content, image);
    form.append("comment", commentId);
    if (parentReply) form.append("parent_reply", parentReply);
    return forumRequest<ForumReply>("replies/", access, { method: "POST", body: form });
  }
  return forumRequest<ForumReply>("replies/", access, {
    method: "POST",
    body: JSON.stringify({
      comment: commentId,
      content,
      ...(parentReply ? { parent_reply: parentReply } : {}),
    }),
  });
}

export function reportPost(access: string, id: string, reason: string) {
  return forumRequest<{ message: string }>("report/", access, {
    method: "POST",
    body: JSON.stringify({ post_id: id, reason, post_url: `https://www.sabiway.com/posts/${id}` }),
  });
}
