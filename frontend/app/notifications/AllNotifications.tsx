"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";
import { ArrowRight, Bell, CheckCheck, Loader2, RefreshCw } from "lucide-react";

import Button from "@/app/_components/common/Button";
import { Avatar, InlineAlert, StatePanel } from "@/app/_components/common/DesignPrimitives";
import { useAllNotificationsStore, type NotificationItem } from "@/app/store/useAllNotificationsStore";
import { useNotificationStore } from "@/app/store/useNotificationStore";

function safeNotificationLink(notification: NotificationItem) {
  if (notification.target_url?.startsWith("/") && !notification.target_url.startsWith("//")) return notification.target_url;
  if (notification.target?.type === "profile") return `/profile/${notification.target.username.replace("@", "")}`;
  if (notification.target?.type === "post") return `/posts/${notification.target.slug || notification.target.id}`;
  if (notification.target?.type === "reply") return `/posts/${notification.target.post_id}`;
  if (notification.type === "follow") return `/profile/${notification.actor.username.replace("@", "")}`;
  if (notification.type.includes("message")) return "/messages";
  if (notification.type.includes("booking") || notification.type.includes("schedule")) return "/bookings";
  if (notification.type.includes("payment") || notification.type.includes("payout")) return "/sabipay";
  if (notification.type.includes("proposal") || notification.type.includes("job")) return "/jobs";
  return "/notifications";
}

function relativeTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default function AllNotifications() {
  const { notifications, loading, error, hasMore, nextPage, getAllNotifications, markNotificationRead, markAllNotificationsRead } = useAllNotificationsStore();
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);
  const observerRef = useRef<HTMLDivElement | null>(null);

  const refresh = useCallback(() => getAllNotifications(1), [getAllNotifications]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const target = observerRef.current;
    if (!target || !hasMore) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !loading && nextPage) void getAllNotifications(nextPage);
    }, { rootMargin: "200px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loading, nextPage, getAllNotifications]);

  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  const markAll = async () => {
    await markAllNotificationsRead();
    setUnreadCount(0);
  };

  return (
    <section className="mt-7" aria-label="Notification activity">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--sabi-radius-lg)] border border-border bg-card p-4 shadow-[var(--sabi-shadow-sm)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--sabi-surface-selected)] text-primary"><Bell size={18} aria-hidden="true" /></div>
          <div><p className="font-black">{unreadCount ? `${unreadCount} unread` : "You are up to date"}</p><p className="text-xs text-muted-foreground">Reading an alert does not change the underlying job, booking or payment status.</p></div>
        </div>
        <Button variant="ghost" size="sm" leadingIcon={<CheckCheck size={16} aria-hidden="true" />} disabled={unreadCount === 0} onClick={() => void markAll()}>Mark all read</Button>
      </div>

      {error ? <InlineAlert tone="error" className="mt-4"><p className="font-black">{error}</p><Button variant="ghost" size="sm" className="mt-2" leadingIcon={<RefreshCw size={15} aria-hidden="true" />} onClick={() => void refresh()}>Retry</Button></InlineAlert> : null}

      {!loading && !error && notifications.length === 0 ? <div className="mt-5"><StatePanel title="No notifications yet" description="Marketplace, message, booking and SabiForum activity that needs your attention will appear here." tone="empty" /></div> : null}

      <div className="mt-5 grid gap-3">
        {notifications.map((notification) => {
          const href = safeNotificationLink(notification);
          return (
            <article key={notification.id} className={`rounded-[var(--sabi-radius-lg)] border p-4 shadow-[var(--sabi-shadow-sm)] ${notification.is_read ? "border-border bg-card" : "border-primary/20 bg-[var(--sabi-surface-selected)]"}`}>
              <div className="flex items-start gap-3">
                <Avatar src={notification.actor.profile_picture} name={notification.actor.full_name || notification.actor.username || "SabiWay member"} size={42} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm leading-6"><span className="font-black">{notification.actor.full_name || notification.actor.username}</span> {notification.message.replace(/^@\w+\s*/, "")}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{relativeTime(notification.created_at)}</p>
                    </div>
                    {!notification.is_read ? <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" aria-label="Unread notification" /> : null}
                  </div>
                  <Link href={href} onClick={() => { if (!notification.is_read) void markNotificationRead(notification.id); }} className="mt-3 inline-flex min-h-10 items-center gap-1 text-sm font-black text-primary">Open context <ArrowRight size={15} aria-hidden="true" /></Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {loading ? <div className="flex items-center justify-center gap-2 py-6" aria-live="polite"><Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" /><span className="text-sm font-semibold text-muted-foreground">Loading notifications…</span></div> : null}
      {hasMore ? <div ref={observerRef} className="h-10" aria-hidden="true" /> : null}
    </section>
  );
}
