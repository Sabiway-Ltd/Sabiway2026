import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { io, type Socket } from "socket.io-client";

import type { AuthSession } from "../auth/types";
import { environment } from "../config/environment";
import { colors, interaction, radius, spacing, typography } from "../design/tokens";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "./api";
import type { NotificationItem } from "./types";

type Props = {
  session: AuthSession;
  onBackHome: () => void;
  onOpenCommunity: () => void;
  onOpenProfile: () => void;
};

export function NotificationsScreen({ session, onBackHome, onOpenCommunity, onOpenProfile }: Props) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const feed = await getNotifications(session.access);
      setItems(feed.notifications);
      setUnreadCount(feed.unreadCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load notifications.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session.access]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const socket: Socket = io(environment.realtimeUrl, {
      auth: { token: session.access },
      transports: ["websocket", "polling"],
      reconnection: true,
    });
    const refresh = () => { void load(); };
    socket.on("new-notification", refresh);
    return () => {
      socket.off("new-notification", refresh);
      socket.disconnect();
    };
  }, [load, session.access]);

  const openNotification = async (item: NotificationItem) => {
    if (!item.is_read) {
      try {
        const nextUnread = await markNotificationRead(session.access, item.id);
        setUnreadCount(nextUnread);
        setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, is_read: true } : entry));
      } catch {
        // Navigation remains available; persisted read state will reconcile on retry/refresh.
      }
    }
    if (item.target?.type === "profile") onOpenProfile();
    else onOpenCommunity();
  };

  const markAll = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsRead(session.access);
      setUnreadCount(0);
      setItems((current) => current.map((item) => ({ ...item, is_read: true })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not mark notifications as read.");
    } finally {
      setMarkingAll(false);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} /><Text style={styles.muted}>Loading notifications…</Text></View>;
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={onBackHome} style={styles.secondaryButton}><Text style={styles.secondaryText}>Home</Text></Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>NOTIFICATIONS</Text>
          <Text style={styles.title}>{unreadCount > 0 ? `${unreadCount} unread` : "You’re all caught up"}</Text>
        </View>
        <Pressable accessibilityRole="button" disabled={markingAll || unreadCount === 0} onPress={markAll} style={[styles.secondaryButton, (markingAll || unreadCount === 0) && styles.disabled]}><Text style={styles.secondaryText}>{markingAll ? "Saving…" : "Read all"}</Text></Pressable>
      </View>

      {error ? (
        <View style={styles.errorCard} accessibilityRole="alert">
          <Text style={styles.errorTitle}>Could not refresh notifications</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable accessibilityRole="button" onPress={() => void load()} style={styles.retryButton}><Text style={styles.retryText}>Retry</Text></Pressable>
        </View>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
        contentContainerStyle={items.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={<View style={styles.emptyCard}><Text style={styles.emptyTitle}>No notifications yet</Text><Text style={styles.muted}>Activity from SabiForum and your SabiWay connections will appear here.</Text></View>}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${item.is_read ? "Read" : "Unread"} notification: ${item.message}`}
            onPress={() => void openNotification(item)}
            style={({ pressed }) => [styles.card, !item.is_read && styles.cardUnread, pressed && styles.pressed]}
          >
            <View style={styles.rowBetween}>
              <Text style={styles.actor}>{item.actor?.full_name || "SabiWay"}</Text>
              {!item.is_read ? <View style={styles.unreadDot} accessibilityLabel="Unread" /> : null}
            </View>
            <Text style={styles.message}>{item.message}</Text>
            <Text style={styles.timestamp}>{new Date(item.created_at).toLocaleString()}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: spacing[3], gap: spacing[3] },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing[2], backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  headerCopy: { flex: 1 },
  eyebrow: { color: colors.primary, fontSize: typography.size.xs, fontWeight: "900", letterSpacing: 1.2 },
  title: { color: colors.text, fontSize: typography.size.xl, fontWeight: "900" },
  secondaryButton: { minHeight: interaction.minimumTouchTarget, justifyContent: "center", borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing[3], backgroundColor: colors.surface },
  secondaryText: { color: colors.text, fontSize: typography.size.xs, fontWeight: "900" },
  disabled: { opacity: 0.45 },
  list: { gap: spacing[2], paddingBottom: spacing[6] },
  emptyList: { flexGrow: 1, justifyContent: "center" },
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface, padding: spacing[4], gap: spacing[2] },
  cardUnread: { borderColor: colors.primary, backgroundColor: "#EEF8F3" },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing[2] },
  actor: { flex: 1, color: colors.text, fontSize: typography.size.sm, fontWeight: "900" },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  message: { color: colors.text, fontSize: typography.size.sm, lineHeight: 20 },
  timestamp: { color: colors.textMuted, fontSize: typography.size.xs },
  muted: { color: colors.textMuted, fontSize: typography.size.sm, lineHeight: 20, textAlign: "center" },
  emptyCard: { alignItems: "center", gap: spacing[2], padding: spacing[5] },
  emptyTitle: { color: colors.text, fontSize: typography.size.lg, fontWeight: "900" },
  errorCard: { borderWidth: 1, borderColor: "#E9B8BC", borderRadius: radius.lg, backgroundColor: "#FFF3F4", padding: spacing[3], gap: spacing[2] },
  errorTitle: { color: "#8F1F28", fontWeight: "900" },
  errorText: { color: "#8F1F28", fontSize: typography.size.sm },
  retryButton: { alignSelf: "flex-start", minHeight: interaction.minimumTouchTarget, justifyContent: "center", borderRadius: radius.md, borderWidth: 1, borderColor: "#D88B92", paddingHorizontal: spacing[3] },
  retryText: { color: "#8F1F28", fontWeight: "900" },
  pressed: { opacity: 0.72 },
});
