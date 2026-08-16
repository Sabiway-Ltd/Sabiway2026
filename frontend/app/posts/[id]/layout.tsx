import type { Metadata } from "next";
import type { ReactNode } from "react";
import { environment } from "@/app/config/environment";

type PublicPost = {
  id: string;
  content: string;
  author?: { full_name?: string; username?: string };
};

async function getPublicPost(id: string): Promise<PublicPost | null> {
  try {
    const response = await fetch(`${environment.djangoUrl}/api/posts/${id}/`, {
      next: { revalidate: 120 },
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const post = await getPublicPost(id);
  if (!post) {
    return {
      title: "SabiForum | SabiWay",
      robots: { index: false, follow: false },
    };
  }

  const author = post.author?.full_name || post.author?.username || "SabiWay community";
  const summary = post.content.replace(/\s+/g, " ").trim().slice(0, 155) || "A SabiForum community discussion.";
  return {
    title: `${author} on SabiForum | SabiWay`,
    description: summary,
    alternates: { canonical: `/posts/${post.id}` },
    openGraph: {
      type: "article",
      title: `${author} on SabiForum`,
      description: summary,
      url: `/posts/${post.id}`,
      siteName: "SabiWay",
    },
    robots: { index: true, follow: true },
  };
}

export default function PostLayout({ children }: { children: ReactNode }) {
  return children;
}
