import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { io, type Socket } from "socket.io-client";

import type { AuthSession } from "../auth/types";
import { environment } from "../config/environment";
import { colors } from "../design/tokens";
import {
  blockThread,
  createBooking,
  decideSchedule,
  getBookings,
  getMessages,
  getThreads,
  markThreadRead,
  proposeSchedule,
  reportThread,
  sendAttachment,
  sendTextMessage,
  unblockThread,
  updateBookingStatus,
} from "./api";
import type { Booking, MarketplaceMessage, MessageThread, PickedAttachment } from "./types";

type Props = {
  session: AuthSession;
  onBackToMarketplace: () => void;
  onBackToCommunity: () => void;
};

type Panel = "conversation" | "agreement";
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

export function MessagingScreen({ session, onBackToMarketplace, onBackToCommunity }: Props) {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 20, 920);
  const compact = width < 700;
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MarketplaceMessage[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [messageText, setMessageText] = useState("");
  const [attachment, setAttachment] = useState<PickedAttachment | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [inboxError, setInboxError] = useState("");
  const [conversationError, setConversationError] = useState("");
  const [sending, setSending] = useState(false);
  const [panel, setPanel] = useState<Panel>("conversation");
  const [scope, setScope] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [scheduleText, setScheduleText] = useState("");
  const [scheduleNote, setScheduleNote] = useState("");
  const [inboxQuery, setInboxQuery] = useState("");
  const threadRequestInFlight = useRef(false);
  const conversationRequestInFlight = useRef<string | null>(null);

  const activeThread = useMemo(() => threads.find((item) => item.id === activeId) ?? null, [threads, activeId]);
  const activeBooking = useMemo(() => bookings.find((item) => item.thread === activeId) ?? null, [bookings, activeId]);
  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", []);
  const isProfessional = session.user.role === "professional";
  const messagingBlocked = Boolean(activeThread?.is_blocked_by_me || activeThread?.is_blocked_by_other);
  const visibleThreads = useMemo(() => {
    const q = inboxQuery.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((item) => {
      const person = isProfessional ? item.client : item.professional;
      return `${person.full_name} ${person.job ?? ""}`.toLowerCase().includes(q);
    });
  }, [inboxQuery, isProfessional, threads]);

  const loadThreads = useCallback(async () => {
    if (threadRequestInFlight.current) return;
    threadRequestInFlight.current = true;
    setInboxError("");
    try {
      const [nextThreads, nextBookings] = await Promise.all([getThreads(session.access), getBookings(session.access)]);
      setThreads(nextThreads);
      setBookings(nextBookings);
      if (!compact) setActiveId((current) => current ?? nextThreads[0]?.id ?? null);
    } catch (error) {
      setInboxError(error instanceof Error ? error.message : "Could not load conversations. Please try again.");
    } finally {
      threadRequestInFlight.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, [compact, session.access]);

  const loadConversation = useCallback(async (threadId: string) => {
    if (conversationRequestInFlight.current === threadId) return;
    conversationRequestInFlight.current = threadId;
    setConversationError("");
    setConversationLoading(true);
    try {
      const nextMessages = await getMessages(session.access, threadId);
      setMessages(nextMessages);
      await markThreadRead(session.access, threadId);
      setThreads((current) => current.map((item) => item.id === threadId ? { ...item, unread_count: 0 } : item));
    } catch (error) {
      setConversationError(error instanceof Error ? error.message : "Could not load this conversation. Please try again.");
    } finally {
      if (conversationRequestInFlight.current === threadId) conversationRequestInFlight.current = null;
      setConversationLoading(false);
    }
  }, [session.access]);

  useEffect(() => { void loadThreads(); }, [loadThreads]);
  useEffect(() => {
    if (activeId) void loadConversation(activeId);
    else setMessages([]);
  }, [activeId, loadConversation]);

  useEffect(() => {
    const socket: Socket = io(environment.realtimeUrl, {
      auth: { token: session.access },
      transports: ["websocket", "polling"],
      reconnection: true,
    });
    const refresh = () => {
      void loadThreads();
      if (activeId) void loadConversation(activeId);
    };
    socket.on("new-message", refresh);
    socket.on("booking-updated", refresh);
    socket.on("schedule-updated", refresh);
    socket.on("connect", refresh);
    return () => {
      socket.off("new-message", refresh);
      socket.off("booking-updated", refresh);
      socket.off("schedule-updated", refresh);
      socket.off("connect", refresh);
      socket.disconnect();
    };
  }, [activeId, loadConversation, loadThreads, session.access]);

  const pickDocument = async () => {
    if (messagingBlocked) return;
    const result = await DocumentPicker.getDocumentAsync({ type: ["image/jpeg", "image/png", "image/webp", "application/pdf", "text/plain"], copyToCacheDirectory: true, multiple: false });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset) return;
    if (asset.size && asset.size > MAX_ATTACHMENT_SIZE) return Alert.alert("File too large", "Attachments must be 10 MB or smaller.");
    setAttachment({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType || "application/octet-stream" });
  };

  const takePhoto = async () => {
    if (messagingBlocked) return;
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return Alert.alert("Camera permission required", "Allow camera access to attach a new photo.");
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset) return;
    if (asset.fileSize && asset.fileSize > MAX_ATTACHMENT_SIZE) return Alert.alert("Photo too large", "Attachments must be 10 MB or smaller.");
    setAttachment({ uri: asset.uri, name: asset.fileName || `photo-${Date.now()}.jpg`, mimeType: asset.mimeType || "image/jpeg" });
  };

  const send = async () => {
    if (!activeId || messagingBlocked || (!messageText.trim() && !attachment)) return;
    setSending(true);
    try {
      const created = attachment
        ? await sendAttachment(session.access, activeId, messageText.trim(), attachment)
        : await sendTextMessage(session.access, activeId, messageText.trim());
      setMessages((current) => [...current, created]);
      setMessageText("");
      setAttachment(null);
    } catch (error) {
      Alert.alert("Message not sent", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setSending(false);
    }
  };

  const createAgreement = async () => {
    if (!activeId || !scope.trim() || !price.trim()) return Alert.alert("Agreement details required", "Add the agreed scope and price before creating the booking summary.");
    try {
      const created = await createBooking(session.access, activeId, scope.trim(), price.trim(), currency.trim().toUpperCase(), timezone);
      setBookings((current) => [created, ...current.filter((item) => item.id !== created.id)]);
      Alert.alert("Booking summary sent", "The professional can now accept or decline the agreement.");
    } catch (error) {
      Alert.alert("Booking not created", error instanceof Error ? error.message : "Please try again.");
    }
  };

  const changeBooking = async (status: Booking["status"]) => {
    if (!activeBooking) return;
    try {
      const updated = await updateBookingStatus(session.access, activeBooking.id, status);
      setBookings((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (error) {
      Alert.alert("Booking not updated", error instanceof Error ? error.message : "This transition is not allowed.");
    }
  };

  const submitSchedule = async () => {
    if (!activeBooking || !scheduleText.trim()) return;
    const parsed = new Date(scheduleText.trim());
    if (Number.isNaN(parsed.getTime())) return Alert.alert("Check date and time", "Use a format such as 2026-08-20 10:30.");
    try {
      await proposeSchedule(session.access, activeBooking.id, parsed.toISOString(), timezone, scheduleNote.trim());
      setScheduleText("");
      setScheduleNote("");
      await loadThreads();
      Alert.alert("Schedule proposed", "The other participant can accept it or request a change.");
    } catch (error) {
      Alert.alert("Schedule not sent", error instanceof Error ? error.message : "Please try again.");
    }
  };

  const scheduleDecision = async (proposalId: string, status: "accepted" | "declined") => {
    try {
      await decideSchedule(session.access, proposalId, status);
      await loadThreads();
    } catch (error) {
      Alert.alert("Schedule not updated", error instanceof Error ? error.message : "Please try again.");
    }
  };

  const safety = (action: "block" | "unblock" | "report") => {
    if (!activeId) return;
    Alert.alert(action === "report" ? "Report this conversation?" : action === "block" ? "Block this user?" : "Unblock this user?", "SabiWay will keep the conversation history and audit trail.", [
      { text: "Cancel", style: "cancel" },
      { text: action === "report" ? "Report" : action === "block" ? "Block" : "Unblock", style: action === "block" ? "destructive" : "default", onPress: async () => {
        try {
          if (action === "block") await blockThread(session.access, activeId);
          else if (action === "unblock") await unblockThread(session.access, activeId);
          else await reportThread(session.access, activeId);
          await loadThreads();
        } catch (error) {
          Alert.alert("Action failed", error instanceof Error ? error.message : "Please try again.");
        }
      } },
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.brand} /></View>;

  const inbox = (
    <View style={[styles.inboxPane, compact ? { width: "100%" } : { width: 300 }]}>
      <View style={styles.inboxHeader}>
        <View style={styles.headerRow}><Pressable onPress={onBackToMarketplace} style={styles.backButton}><Text style={styles.backText}>←</Text></Pressable><Text style={styles.inboxTitle}>Messages</Text><Pressable onPress={onBackToCommunity} style={styles.headerRound}><Text style={styles.headerRoundText}>◉</Text></Pressable></View>
        <View style={styles.searchRow}><Text style={styles.searchGlyph}>⌕</Text><TextInput value={inboxQuery} onChangeText={setInboxQuery} placeholder="Search" placeholderTextColor="#6F8078" style={styles.searchInput} /><Text style={styles.filterGlyph}>≡</Text></View>
      </View>
      {inboxError ? <View style={styles.errorCard}><Text style={styles.errorText}>{inboxError}</Text><Pressable onPress={() => void loadThreads()}><Text style={styles.retryText}>Retry</Text></Pressable></View> : null}
      <FlatList
        data={visibleThreads}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void loadThreads(); }} />}
        ListEmptyComponent={!inboxError ? <Text style={styles.empty}>No conversations yet.</Text> : null}
        renderItem={({ item }) => {
          const person = isProfessional ? item.client : item.professional;
          const active = item.id === activeId;
          return (
            <Pressable onPress={() => { setActiveId(item.id); setPanel("conversation"); }} style={[styles.threadRow, active && !compact && styles.threadRowActive]}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{person.full_name.slice(0, 1).toUpperCase()}</Text></View>
              <View style={styles.threadCopy}><View style={styles.rowBetween}><Text style={styles.threadName}>{person.full_name}</Text><Text style={styles.threadTime}>{item.last_message_at ? new Date(item.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</Text></View><View style={styles.rowBetween}><Text style={styles.threadPreview} numberOfLines={1}>{item.is_blocked_by_me ? "You blocked this user" : item.is_blocked_by_other ? "Messaging restricted" : person.job || (isProfessional ? "Client" : "SabiWay professional")}</Text>{item.unread_count > 0 ? <View style={styles.unread}><Text style={styles.unreadText}>{item.unread_count}</Text></View> : null}</View></View>
            </Pressable>
          );
        }}
      />
    </View>
  );

  const conversation = activeThread ? (
    <View style={[styles.conversationPane, compact ? { width: "100%" } : { flex: 1 }]}>
      <View style={styles.conversationHeader}>
        <View style={styles.headerRow}><Pressable onPress={() => compact ? setActiveId(null) : onBackToMarketplace()} style={styles.backButton}><Text style={styles.backText}>←</Text></Pressable><View style={styles.avatarSmall}><Text style={styles.avatarText}>{(isProfessional ? activeThread.client.full_name : activeThread.professional.full_name).slice(0, 1).toUpperCase()}</Text></View><View style={{ flex: 1 }}><Text style={styles.conversationName}>{isProfessional ? activeThread.client.full_name : activeThread.professional.full_name}</Text><Text style={styles.presence}>SabiWay conversation</Text></View><Pressable onPress={() => safety("report")} style={styles.menuButton}><Text style={styles.menuText}>⋮</Text></Pressable></View>
        <View style={styles.panelTabs}><Pressable onPress={() => setPanel("conversation")} style={[styles.panelTab, panel === "conversation" && styles.panelTabActive]}><Text style={[styles.panelTabText, panel === "conversation" && styles.panelTabTextActive]}>Chat</Text></Pressable><Pressable onPress={() => setPanel("agreement")} style={[styles.panelTab, panel === "agreement" && styles.panelTabActive]}><Text style={[styles.panelTabText, panel === "agreement" && styles.panelTabTextActive]}>Booking</Text></Pressable></View>
      </View>

      {panel === "conversation" ? <>
        {conversationError ? <View style={styles.errorCard}><Text style={styles.errorText}>{conversationError}</Text></View> : null}
        {conversationLoading && messages.length === 0 ? <View style={styles.center}><ActivityIndicator color={colors.brand} /></View> : <FlatList data={messages} keyExtractor={(item) => item.id} contentContainerStyle={styles.messageList} ListEmptyComponent={<Text style={styles.empty}>Start the conversation about the work, price or availability.</Text>} renderItem={({ item }) => { const mine = item.sender.user_id === session.user.id; return <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>{!mine ? <Text style={styles.sender}>{item.sender.full_name}</Text> : null}{item.body ? <Text style={styles.messageText}>{item.body}</Text> : null}{item.attachment_name ? <Text style={styles.attachmentText}>▣ {item.attachment_name}</Text> : null}<Text style={styles.timestamp}>{new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text></View>; }} />}
        {messagingBlocked ? <View style={styles.blockNotice}><Text style={styles.blockText}>Messaging is restricted in this conversation.</Text><Pressable onPress={() => safety(activeThread.is_blocked_by_me ? "unblock" : "report")}><Text style={styles.link}>{activeThread.is_blocked_by_me ? "Unblock" : "Report"}</Text></Pressable></View> : null}
        <View style={styles.composer}>
          {attachment ? <View style={styles.attachmentChip}><Text numberOfLines={1} style={styles.attachmentChipText}>{attachment.name}</Text><Pressable onPress={() => setAttachment(null)}><Text style={styles.link}>Remove</Text></Pressable></View> : null}
          <View style={styles.composerRow}><Pressable disabled={messagingBlocked} onPress={pickDocument} style={styles.composerIcon}><Text style={styles.composerIconText}>＋</Text></Pressable><Pressable disabled={messagingBlocked} onPress={takePhoto} style={styles.composerIcon}><Text style={styles.composerIconText}>◉</Text></Pressable><TextInput editable={!messagingBlocked} value={messageText} onChangeText={setMessageText} multiline placeholder={messagingBlocked ? "Messaging restricted" : "Leave a comment"} placeholderTextColor="#8A8A8A" style={styles.messageInput} /><Pressable disabled={sending || messagingBlocked || (!messageText.trim() && !attachment)} onPress={send} style={[styles.sendButton, (sending || messagingBlocked) && styles.disabledButton]}><Text style={styles.sendText}>➤</Text></Pressable></View>
        </View>
      </> : <BookingPanel session={session} booking={activeBooking} scope={scope} setScope={setScope} price={price} setPrice={setPrice} currency={currency} setCurrency={setCurrency} scheduleText={scheduleText} setScheduleText={setScheduleText} scheduleNote={scheduleNote} setScheduleNote={setScheduleNote} timezone={timezone} onCreate={createAgreement} onChangeStatus={changeBooking} onSchedule={submitSchedule} onScheduleDecision={scheduleDecision} />}
    </View>
  ) : null;

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.body, { width: contentWidth, flexDirection: compact ? "column" : "row" }]}>
        {compact ? (activeThread ? conversation : inbox) : <>{inbox}{conversation ?? <View style={styles.emptyPane}><Text style={styles.emptyTitle}>Select a conversation</Text><Text style={styles.empty}>Your messages and booking context will appear here.</Text></View>}</>}
      </View>
    </KeyboardAvoidingView>
  );
}

function BookingPanel({ session, booking, scope, setScope, price, setPrice, currency, setCurrency, scheduleText, setScheduleText, scheduleNote, setScheduleNote, timezone, onCreate, onChangeStatus, onSchedule, onScheduleDecision }: {
  session: AuthSession; booking: Booking | null; scope: string; setScope: (value: string) => void; price: string; setPrice: (value: string) => void; currency: string; setCurrency: (value: string) => void; scheduleText: string; setScheduleText: (value: string) => void; scheduleNote: string; setScheduleNote: (value: string) => void; timezone: string; onCreate: () => void; onChangeStatus: (status: Booking["status"]) => void; onSchedule: () => void; onScheduleDecision: (id: string, status: "accepted" | "declined") => void;
}) {
  const isProfessional = session.user.role === "professional";
  return <ScrollView contentContainerStyle={styles.bookingContent} keyboardShouldPersistTaps="handled">
    <Text style={styles.bookingEyebrow}>JOB SUMMARY</Text>
    {booking ? <>
      <View style={styles.summaryCard}><Text style={styles.summaryTitle}>{booking.scope_summary}</Text><View style={styles.summaryRow}><Text style={styles.summaryLabel}>Agreed Price</Text><Text style={styles.summaryValue}>{booking.currency} {Number(booking.agreed_price || 0).toLocaleString()}</Text></View><View style={styles.summaryRow}><Text style={styles.summaryLabel}>Status</Text><Text style={styles.statusPill}>{booking.status.replace("_", " ")}</Text></View>{booking.requested_for ? <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Schedule</Text><Text style={styles.summaryValueSmall}>{new Date(booking.requested_for).toLocaleString()}</Text></View> : null}</View>
      {booking.status === "pending" && isProfessional ? <View style={styles.actionRow}><Pressable onPress={() => onChangeStatus("accepted")} style={styles.primaryAction}><Text style={styles.primaryActionText}>Accept</Text></Pressable><Pressable onPress={() => onChangeStatus("declined")} style={styles.secondaryAction}><Text style={styles.secondaryActionText}>Decline</Text></Pressable></View> : null}
      {booking.status === "accepted" ? <View style={styles.actionRow}><Pressable onPress={() => onChangeStatus("in_progress")} style={styles.primaryAction}><Text style={styles.primaryActionText}>Start work</Text></Pressable><Pressable onPress={() => onChangeStatus("cancelled")} style={styles.secondaryAction}><Text style={styles.secondaryActionText}>Cancel</Text></Pressable></View> : null}
      {booking.status === "in_progress" ? <Pressable onPress={() => onChangeStatus("completed")} style={styles.primaryAction}><Text style={styles.primaryActionText}>Mark completed</Text></Pressable> : null}
      <Text style={styles.formLabel}>Propose schedule</Text><TextInput value={scheduleText} onChangeText={setScheduleText} placeholder="2026-08-20 10:30" placeholderTextColor="#8A8A8A" style={styles.formInput} /><Text style={styles.timezone}>Times use {timezone}</Text><TextInput value={scheduleNote} onChangeText={setScheduleNote} placeholder="Optional note" placeholderTextColor="#8A8A8A" style={styles.formInput} /><Pressable onPress={onSchedule} style={styles.secondaryAction}><Text style={styles.secondaryActionText}>Send proposal</Text></Pressable>
      {booking.schedule_proposals.filter((item) => item.status === "proposed").map((proposal) => { const mine = proposal.proposer.user_id === session.user.id; return <View key={proposal.id} style={styles.proposalCard}><Text style={styles.summaryValue}>{new Date(proposal.proposed_for).toLocaleString()}</Text><Text style={styles.timezone}>{proposal.timezone} · {mine ? "proposed by you" : proposal.proposer.full_name}</Text>{!mine ? <View style={styles.actionRow}><Pressable onPress={() => onScheduleDecision(proposal.id, "accepted")} style={styles.primaryAction}><Text style={styles.primaryActionText}>Accept</Text></Pressable><Pressable onPress={() => onScheduleDecision(proposal.id, "declined")} style={styles.secondaryAction}><Text style={styles.secondaryActionText}>Change</Text></Pressable></View> : null}</View>; })}
    </> : session.user.role === "client" ? <>
      <Text style={styles.bookingHelp}>Create the booking summary after you and the professional agree the scope and price.</Text><Text style={styles.formLabel}>Agreed scope</Text><TextInput value={scope} onChangeText={setScope} multiline placeholder="Describe the agreed service outcome" placeholderTextColor="#8A8A8A" style={[styles.formInput, styles.scopeInput]} /><Text style={styles.formLabel}>Price</Text><TextInput value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="18000" placeholderTextColor="#8A8A8A" style={styles.formInput} /><Text style={styles.formLabel}>Currency</Text><TextInput value={currency} onChangeText={setCurrency} autoCapitalize="characters" maxLength={3} style={styles.formInput} /><Pressable onPress={onCreate} style={styles.primaryAction}><Text style={styles.primaryActionText}>Create booking summary</Text></Pressable>
    </> : <Text style={styles.bookingHelp}>The client creates the booking summary once the scope and price are agreed.</Text>}
  </ScrollView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: "center", backgroundColor: "#F5F5F5" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  body: { flex: 1, gap: 10, paddingVertical: 8 },
  inboxPane: { flex: 1, backgroundColor: "#FFFFFF", overflow: "hidden", borderRadius: 14 },
  inboxHeader: { backgroundColor: colors.brand, padding: 14, paddingBottom: 18, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  backButton: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  backText: { color: "#FFFFFF", fontSize: 22, fontWeight: "700" },
  inboxTitle: { flex: 1, color: "#FFFFFF", fontSize: 20, fontWeight: "900" },
  headerRound: { width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(255,255,255,.16)", alignItems: "center", justifyContent: "center" },
  headerRoundText: { color: "#FFFFFF", fontWeight: "900" },
  searchRow: { marginTop: 12, minHeight: 44, backgroundColor: "#FFFFFF", borderRadius: 10, flexDirection: "row", alignItems: "center", paddingHorizontal: 11 },
  searchGlyph: { fontSize: 18, marginRight: 7, color: "#404040" },
  searchInput: { flex: 1, minHeight: 44, color: "#222222" },
  filterGlyph: { color: colors.brand, fontWeight: "900", fontSize: 20 },
  threadRow: { flexDirection: "row", gap: 11, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#EEEEEE" },
  threadRowActive: { backgroundColor: "#EFF9F4" },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#D9E4DD", alignItems: "center", justifyContent: "center" },
  avatarSmall: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#DDF6E9", alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.brand, fontWeight: "900", fontSize: 16 },
  threadCopy: { flex: 1, gap: 4 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  threadName: { color: "#222222", fontWeight: "900", fontSize: 13 },
  threadTime: { color: "#8A8A8A", fontSize: 9 },
  threadPreview: { flex: 1, color: "#777777", fontSize: 10 },
  unread: { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
  unreadText: { color: "#FFFFFF", fontSize: 9, fontWeight: "900" },
  conversationPane: { backgroundColor: "#F7F7F7", borderRadius: 14, overflow: "hidden" },
  conversationHeader: { backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#ECECEC", paddingHorizontal: 12, paddingTop: 8 },
  conversationName: { color: "#222222", fontSize: 14, fontWeight: "900" },
  presence: { color: "#8A8A8A", fontSize: 9, marginTop: 2 },
  menuButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  menuText: { color: "#333333", fontSize: 22 },
  panelTabs: { flexDirection: "row", marginTop: 8 },
  panelTab: { flex: 1, alignItems: "center", paddingVertical: 8, borderBottomWidth: 2, borderBottomColor: "transparent" },
  panelTabActive: { borderBottomColor: colors.brand },
  panelTabText: { color: "#888888", fontSize: 11, fontWeight: "700" },
  panelTabTextActive: { color: colors.brand, fontWeight: "900" },
  messageList: { padding: 14, gap: 9, flexGrow: 1, justifyContent: "flex-end" },
  bubble: { maxWidth: "78%", paddingHorizontal: 12, paddingVertical: 9, borderRadius: 14, gap: 4 },
  bubbleMine: { alignSelf: "flex-end", backgroundColor: "#DFF4E9", borderBottomRightRadius: 4 },
  bubbleOther: { alignSelf: "flex-start", backgroundColor: "#FFFFFF", borderBottomLeftRadius: 4 },
  sender: { color: colors.brand, fontSize: 9, fontWeight: "900" },
  messageText: { color: "#333333", fontSize: 12, lineHeight: 18 },
  attachmentText: { color: colors.brand, fontSize: 10, fontWeight: "800" },
  timestamp: { alignSelf: "flex-end", color: "#999999", fontSize: 8 },
  composer: { backgroundColor: "#FFFFFF", borderTopWidth: 1, borderTopColor: "#ECECEC", padding: 9, gap: 7 },
  composerRow: { flexDirection: "row", alignItems: "flex-end", gap: 6 },
  composerIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  composerIconText: { color: "#666666", fontSize: 18, fontWeight: "800" },
  messageInput: { flex: 1, minHeight: 40, maxHeight: 96, borderRadius: 20, borderWidth: 1, borderColor: "#E4E4E4", backgroundColor: "#FAFAFA", paddingHorizontal: 13, paddingVertical: 9, color: "#222222" },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
  sendText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  attachmentChip: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, backgroundColor: "#EEF8F3", borderRadius: 8, padding: 8 },
  attachmentChipText: { flex: 1, color: "#53645A", fontSize: 10 },
  blockNotice: { flexDirection: "row", justifyContent: "space-between", gap: 10, padding: 10, backgroundColor: "#FFF4D8" },
  blockText: { flex: 1, color: "#6B5A2C", fontSize: 10 },
  link: { color: colors.brand, fontWeight: "900", fontSize: 10 },
  errorCard: { margin: 10, padding: 10, borderRadius: 10, backgroundColor: "#FFF1F0" },
  errorText: { color: "#8F2119", fontWeight: "700", fontSize: 11 },
  retryText: { color: "#8F2119", fontWeight: "900", marginTop: 5 },
  empty: { color: "#8A8A8A", textAlign: "center", padding: 20, lineHeight: 18, fontSize: 11 },
  emptyPane: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 14, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyTitle: { color: "#333333", fontSize: 18, fontWeight: "900" },
  bookingContent: { padding: 16, gap: 10, paddingBottom: 30 },
  bookingEyebrow: { color: colors.brand, fontSize: 10, fontWeight: "900", letterSpacing: 1.1 },
  summaryCard: { backgroundColor: "#FFFFFF", borderRadius: 12, borderWidth: 1, borderColor: "#E6E6E6", padding: 14, gap: 10 },
  summaryTitle: { color: "#222222", fontSize: 16, fontWeight: "900" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", gap: 10, alignItems: "center" },
  summaryLabel: { color: "#777777", fontSize: 10, fontWeight: "700" },
  summaryValue: { color: "#222222", fontSize: 12, fontWeight: "900" },
  summaryValueSmall: { color: "#222222", fontSize: 10, fontWeight: "800", textAlign: "right", flex: 1 },
  statusPill: { color: colors.brand, backgroundColor: "#E4F8EE", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, fontSize: 9, fontWeight: "900", textTransform: "capitalize" },
  actionRow: { flexDirection: "row", gap: 8 },
  primaryAction: { flex: 1, minHeight: 46, borderRadius: 7, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center", paddingHorizontal: 14 },
  primaryActionText: { color: "#FFFFFF", fontWeight: "900" },
  secondaryAction: { flex: 1, minHeight: 46, borderRadius: 7, borderWidth: 1, borderColor: "#C9D3CD", backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", paddingHorizontal: 14 },
  secondaryActionText: { color: colors.brand, fontWeight: "900" },
  formLabel: { color: "#555555", fontSize: 10, fontWeight: "800", marginTop: 3 },
  formInput: { minHeight: 46, borderRadius: 7, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E4E4E4", paddingHorizontal: 12, color: "#222222" },
  scopeInput: { minHeight: 96, textAlignVertical: "top", paddingTop: 11 },
  timezone: { color: "#8A8A8A", fontSize: 9 },
  proposalCard: { backgroundColor: "#FFFFFF", borderRadius: 10, padding: 10, gap: 7, borderWidth: 1, borderColor: "#E7E7E7" },
  bookingHelp: { color: "#757575", fontSize: 11, lineHeight: 18 },
  disabledButton: { opacity: 0.5 },
});
