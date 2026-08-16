import { useCallback, useEffect, useMemo, useState } from "react";
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
  const [sending, setSending] = useState(false);
  const [panel, setPanel] = useState<Panel>("conversation");
  const [scope, setScope] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [scheduleText, setScheduleText] = useState("");
  const [scheduleNote, setScheduleNote] = useState("");

  const activeThread = useMemo(() => threads.find((item) => item.id === activeId) ?? null, [threads, activeId]);
  const activeBooking = useMemo(() => bookings.find((item) => item.thread === activeId) ?? null, [bookings, activeId]);
  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", []);
  const isProfessional = session.user.role === "professional";

  const loadThreads = useCallback(async () => {
    try {
      const [nextThreads, nextBookings] = await Promise.all([getThreads(session.access), getBookings(session.access)]);
      setThreads(nextThreads);
      setBookings(nextBookings);
      setActiveId((current) => current ?? nextThreads[0]?.id ?? null);
    } catch (error) {
      Alert.alert("Could not load messages", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session.access]);

  const loadConversation = useCallback(async (threadId: string) => {
    try {
      const nextMessages = await getMessages(session.access, threadId);
      setMessages(nextMessages);
      await markThreadRead(session.access, threadId);
      setThreads((current) => current.map((item) => item.id === threadId ? { ...item, unread_count: 0 } : item));
    } catch (error) {
      Alert.alert("Could not load conversation", error instanceof Error ? error.message : "Please try again.");
    }
  }, [session.access]);

  useEffect(() => { loadThreads(); }, [loadThreads]);
  useEffect(() => { if (activeId) loadConversation(activeId); else setMessages([]); }, [activeId, loadConversation]);

  useEffect(() => {
    const socket: Socket = io(environment.realtimeUrl, {
      auth: { token: session.access },
      transports: ["websocket", "polling"],
      reconnection: true,
    });
    const refresh = () => {
      loadThreads();
      if (activeId) loadConversation(activeId);
    };
    socket.on("new-message", refresh);
    socket.on("booking-updated", refresh);
    socket.on("schedule-updated", refresh);
    return () => {
      socket.off("new-message", refresh);
      socket.off("booking-updated", refresh);
      socket.off("schedule-updated", refresh);
      socket.disconnect();
    };
  }, [activeId, loadConversation, loadThreads, session.access]);

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/jpeg", "image/png", "image/webp", "application/pdf", "text/plain"],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset.size && asset.size > MAX_ATTACHMENT_SIZE) {
      Alert.alert("File too large", "Attachments must be 10 MB or smaller.");
      return;
    }
    setAttachment({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType || "application/octet-stream" });
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera permission required", "Allow camera access to attach a new photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > MAX_ATTACHMENT_SIZE) {
      Alert.alert("Photo too large", "Attachments must be 10 MB or smaller.");
      return;
    }
    setAttachment({ uri: asset.uri, name: asset.fileName || `photo-${Date.now()}.jpg`, mimeType: asset.mimeType || "image/jpeg" });
  };

  const send = async () => {
    if (!activeId || (!messageText.trim() && !attachment)) return;
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
    if (!activeId || !scope.trim() || !price.trim()) {
      Alert.alert("Agreement details required", "Add the agreed scope and price before creating the booking summary.");
      return;
    }
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
    if (Number.isNaN(parsed.getTime())) {
      Alert.alert("Check date and time", "Use a format such as 2026-08-20 10:30.");
      return;
    }
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

  const safety = (action: "block" | "report") => {
    if (!activeId) return;
    Alert.alert(
      action === "block" ? "Block this user?" : "Report this conversation?",
      action === "block" ? "Neither participant will be able to send new messages until you unblock them." : "SabiWay support will receive the report metadata for review.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: action === "block" ? "Block" : "Report",
          style: action === "block" ? "destructive" : "default",
          onPress: async () => {
            try {
              if (action === "block") await blockThread(session.access, activeId);
              else await reportThread(session.access, activeId);
              Alert.alert(action === "block" ? "User blocked" : "Report submitted");
            } catch (error) {
              Alert.alert("Action failed", error instanceof Error ? error.message : "Please try again.");
            }
          },
        },
      ],
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.brand} /></View>;

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.header, { width: contentWidth }]}>
        <Pressable onPress={onBackToMarketplace} style={styles.headerButton}><Text style={styles.headerButtonText}>Marketplace</Text></Pressable>
        <View style={{ flex: 1 }}><Text style={styles.eyebrow}>PRIVATE & AUDITABLE</Text><Text style={styles.title}>Messages & bookings</Text></View>
        <Pressable onPress={onBackToCommunity} style={styles.headerButton}><Text style={styles.headerButtonText}>SabiForum</Text></Pressable>
      </View>

      {compact && activeThread ? (
        <View style={[styles.mobileTabs, { width: contentWidth }]}>
          <Pressable onPress={() => setPanel("conversation")} style={[styles.mobileTab, panel === "conversation" && styles.mobileTabActive]}><Text style={[styles.mobileTabText, panel === "conversation" && styles.mobileTabTextActive]}>Conversation</Text></Pressable>
          <Pressable onPress={() => setPanel("agreement")} style={[styles.mobileTab, panel === "agreement" && styles.mobileTabActive]}><Text style={[styles.mobileTabText, panel === "agreement" && styles.mobileTabTextActive]}>Booking</Text></Pressable>
        </View>
      ) : null}

      <View style={[styles.body, { width: contentWidth, flexDirection: compact ? "column" : "row" }]}>
        <View style={[styles.threadPane, compact && activeThread ? styles.hidden : null, !compact ? { width: 270 } : { width: "100%" }]}>
          <View style={styles.paneHeader}><Text style={styles.paneTitle}>Inbox</Text><Text style={styles.muted}>{threads.length} conversations</Text></View>
          <FlatList
            data={threads}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadThreads(); }} />}
            ListEmptyComponent={<Text style={styles.empty}>No conversations yet. Open a service or respond to a job from Marketplace.</Text>}
            renderItem={({ item }) => (
              <Pressable onPress={() => { setActiveId(item.id); setPanel("conversation"); }} style={[styles.threadRow, item.id === activeId && styles.threadRowActive]}>
                <View style={styles.rowBetween}><Text style={styles.threadName}>{isProfessional ? item.client.full_name : item.professional.full_name}</Text>{item.unread_count > 0 ? <Text style={styles.unread}>{item.unread_count}</Text> : null}</View>
                <Text style={styles.muted} numberOfLines={1}>{isProfessional ? "Client conversation" : item.professional.job || "SabiWay professional"}</Text>
              </Pressable>
            )}
          />
        </View>

        {activeThread && (!compact || panel === "conversation") ? (
          <View style={[styles.conversationPane, !compact ? { flex: 1 } : { width: "100%" }]}>
            <View style={styles.paneHeader}>
              <View style={styles.rowBetween}><View style={{ flex: 1 }}><Text style={styles.paneTitle}>{isProfessional ? activeThread.client.full_name : activeThread.professional.full_name}</Text><Text style={styles.muted}>Private SabiWay conversation</Text></View><Pressable onPress={() => safety("report")} style={styles.safetyButton}><Text style={styles.safetyText}>Report</Text></Pressable><Pressable onPress={() => safety("block")} style={styles.safetyButton}><Text style={styles.dangerText}>Block</Text></Pressable></View>
              {compact ? <Pressable onPress={() => setActiveId(null)}><Text style={styles.link}>← All conversations</Text></Pressable> : null}
            </View>
            <FlatList
              data={messages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messageList}
              ListEmptyComponent={<Text style={styles.empty}>Describe the work, expected outcome, budget or availability to start the conversation.</Text>}
              renderItem={({ item }) => {
                const mine = item.sender.user_id === session.user.id;
                return <View style={[styles.messageBubble, mine ? styles.mine : styles.theirs]}><Text style={styles.sender}>{mine ? "You" : item.sender.full_name}</Text>{item.body ? <Text style={styles.messageText}>{item.body}</Text> : null}{item.attachment_name ? <Text style={styles.attachmentText}>Attachment: {item.attachment_name}</Text> : null}<Text style={styles.timestamp}>{new Date(item.created_at).toLocaleString()}</Text></View>;
              }}
            />
            <View style={styles.composer}>
              <TextInput value={messageText} onChangeText={setMessageText} multiline placeholder="Message securely. Contact details unlock after booking acceptance." placeholderTextColor="#7A8880" style={[styles.input, styles.messageInput]} />
              {attachment ? <View style={styles.attachmentChip}><Text style={styles.attachmentChipText} numberOfLines={1}>{attachment.name}</Text><Pressable onPress={() => setAttachment(null)}><Text style={styles.link}>Remove</Text></Pressable></View> : null}
              <View style={styles.composerActions}><Pressable onPress={pickDocument} style={styles.secondaryButton}><Text style={styles.secondaryText}>Attach file</Text></Pressable><Pressable onPress={takePhoto} style={styles.secondaryButton}><Text style={styles.secondaryText}>Camera</Text></Pressable><Pressable disabled={sending} onPress={send} style={styles.primaryButton}><Text style={styles.primaryText}>{sending ? "Sending…" : "Send"}</Text></Pressable></View>
            </View>
          </View>
        ) : null}

        {activeThread && (!compact || panel === "agreement") ? (
          <ScrollView style={[styles.bookingPane, !compact ? { width: 300 } : { width: "100%" }]} contentContainerStyle={styles.bookingContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.eyebrowDark}>AGREEMENT</Text><Text style={styles.paneTitle}>Booking & schedule</Text>
            {activeBooking ? (
              <>
                <View style={styles.summaryCard}><Text style={styles.label}>Scope</Text><Text style={styles.summaryText}>{activeBooking.scope_summary}</Text><Text style={styles.label}>Agreed price</Text><Text style={styles.price}>{activeBooking.currency} {Number(activeBooking.agreed_price || 0).toLocaleString()}</Text><Text style={styles.status}>Status: {activeBooking.status.replace("_", " ")}</Text>{activeBooking.requested_for ? <Text style={styles.status}>Schedule: {new Date(activeBooking.requested_for).toLocaleString()} ({activeBooking.timezone})</Text> : null}</View>
                {activeBooking.status === "pending" && isProfessional ? <View style={styles.row}><Pressable onPress={() => changeBooking("accepted")} style={[styles.primaryButton, styles.flex]}><Text style={styles.primaryText}>Accept</Text></Pressable><Pressable onPress={() => changeBooking("declined")} style={[styles.secondaryButton, styles.flex]}><Text style={styles.secondaryText}>Decline</Text></Pressable></View> : null}
                {activeBooking.status === "accepted" ? <View style={styles.row}><Pressable onPress={() => changeBooking("in_progress")} style={[styles.primaryButton, styles.flex]}><Text style={styles.primaryText}>Start work</Text></Pressable><Pressable onPress={() => changeBooking("cancelled")} style={[styles.secondaryButton, styles.flex]}><Text style={styles.secondaryText}>Cancel</Text></Pressable></View> : null}
                {activeBooking.status === "in_progress" ? <Pressable onPress={() => changeBooking("completed")} style={styles.primaryButton}><Text style={styles.primaryText}>Mark completed</Text></Pressable> : null}
                <Text style={styles.sectionTitle}>Propose a schedule</Text><TextInput value={scheduleText} onChangeText={setScheduleText} placeholder="2026-08-20 10:30" placeholderTextColor="#7A8880" style={styles.input}/><Text style={styles.muted}>Displayed using {timezone}</Text><TextInput value={scheduleNote} onChangeText={setScheduleNote} placeholder="Optional note" placeholderTextColor="#7A8880" style={styles.input}/><Pressable onPress={submitSchedule} style={styles.secondaryButton}><Text style={styles.secondaryText}>Send proposal</Text></Pressable>
                {activeBooking.schedule_proposals.filter((item) => item.status === "proposed").map((proposal) => {
                  const mine = proposal.proposer.user_id === session.user.id;
                  return <View key={proposal.id} style={styles.proposal}><Text style={styles.summaryText}>{new Date(proposal.proposed_for).toLocaleString()}</Text><Text style={styles.muted}>{proposal.timezone} · {mine ? "proposed by you" : `proposed by ${proposal.proposer.full_name}`}</Text>{!mine ? <View style={styles.row}><Pressable onPress={() => scheduleDecision(proposal.id, "accepted")} style={[styles.primaryButton, styles.flex]}><Text style={styles.primaryText}>Accept</Text></Pressable><Pressable onPress={() => scheduleDecision(proposal.id, "declined")} style={[styles.secondaryButton, styles.flex]}><Text style={styles.secondaryText}>Change</Text></Pressable></View> : null}</View>;
                })}
              </>
            ) : session.user.role === "client" ? (
              <><Text style={styles.help}>Create this summary only after the scope and price have been agreed in the conversation.</Text><Text style={styles.label}>Agreed scope</Text><TextInput value={scope} onChangeText={setScope} multiline placeholder="Describe the agreed service outcome" placeholderTextColor="#7A8880" style={[styles.input, styles.scopeInput]}/><Text style={styles.label}>Agreed price</Text><TextInput value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="18000" placeholderTextColor="#7A8880" style={styles.input}/><Text style={styles.label}>Currency</Text><TextInput value={currency} onChangeText={setCurrency} autoCapitalize="characters" maxLength={3} style={styles.input}/><Pressable onPress={createAgreement} style={styles.amberButton}><Text style={styles.amberText}>Create booking summary</Text></Pressable></>
            ) : <Text style={styles.help}>The client creates the booking summary after you agree the scope and price in chat.</Text>}
          </ScrollView>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: "center", backgroundColor: "#F7FAF8" }, center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F7FAF8" },
  header: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.brand, borderRadius: 18, padding: 13, marginTop: 8 }, headerButton: { backgroundColor: "#FFB800", borderRadius: 9, paddingHorizontal: 9, paddingVertical: 7 }, headerButtonText: { color: "#173126", fontSize: 11, fontWeight: "900" }, eyebrow: { color: "#D7F6E7", fontSize: 10, fontWeight: "900", letterSpacing: 1.2 }, title: { color: "#FFFFFF", fontSize: 21, fontWeight: "900" },
  body: { flex: 1, gap: 10, paddingVertical: 10 }, threadPane: { flex: 1, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DDE7E1", borderRadius: 16, overflow: "hidden" }, conversationPane: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DDE7E1", borderRadius: 16, overflow: "hidden" }, bookingPane: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DDE7E1", borderRadius: 16 }, bookingContent: { padding: 14, gap: 10 }, hidden: { display: "none" },
  paneHeader: { borderBottomWidth: 1, borderBottomColor: "#EDF2EF", padding: 13, gap: 5 }, paneTitle: { color: "#173126", fontWeight: "900", fontSize: 18 }, muted: { color: "#718078", fontSize: 11, lineHeight: 16 }, empty: { color: "#718078", padding: 20, textAlign: "center", lineHeight: 20 }, threadRow: { padding: 13, borderBottomWidth: 1, borderBottomColor: "#EDF2EF" }, threadRowActive: { backgroundColor: "#EEF8F3" }, threadName: { color: "#173126", fontWeight: "900", flex: 1 }, unread: { backgroundColor: colors.brand, color: "#FFFFFF", borderRadius: 999, minWidth: 22, textAlign: "center", paddingHorizontal: 6, paddingVertical: 2, fontSize: 10, fontWeight: "900" }, rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6 },
  safetyButton: { borderWidth: 1, borderColor: "#DDE7E1", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 5 }, safetyText: { color: "#58675F", fontSize: 10, fontWeight: "800" }, dangerText: { color: "#A51D25", fontSize: 10, fontWeight: "900" }, link: { color: colors.brand, fontWeight: "900", fontSize: 11 },
  messageList: { flexGrow: 1, padding: 12, gap: 8, backgroundColor: "#F9FBFA" }, messageBubble: { maxWidth: "84%", borderRadius: 15, padding: 10, borderWidth: 1 }, mine: { alignSelf: "flex-end", backgroundColor: "#E8F7F0", borderColor: "#CBE8D9" }, theirs: { alignSelf: "flex-start", backgroundColor: "#FFFFFF", borderColor: "#DDE7E1" }, sender: { color: colors.brand, fontSize: 10, fontWeight: "900" }, messageText: { color: "#263B31", lineHeight: 19, marginTop: 2 }, timestamp: { color: "#819087", fontSize: 9, marginTop: 5 }, attachmentText: { color: colors.brand, fontWeight: "800", fontSize: 11, marginTop: 5 },
  composer: { padding: 10, borderTopWidth: 1, borderTopColor: "#EDF2EF", gap: 7 }, input: { minHeight: 44, borderWidth: 1, borderColor: "#D9E4DD", borderRadius: 11, paddingHorizontal: 11, backgroundColor: "#FFFFFF", color: "#173126" }, messageInput: { minHeight: 70, textAlignVertical: "top", paddingTop: 10 }, composerActions: { flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "flex-end" }, attachmentChip: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderRadius: 10, backgroundColor: "#EEF8F3", padding: 8 }, attachmentChipText: { color: "#40544A", fontSize: 11, flex: 1 },
  primaryButton: { backgroundColor: colors.brand, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, alignItems: "center" }, primaryText: { color: "#FFFFFF", fontWeight: "900", fontSize: 11 }, secondaryButton: { borderWidth: 1, borderColor: "#CAD8D0", backgroundColor: "#FFFFFF", borderRadius: 10, paddingHorizontal: 11, paddingVertical: 9, alignItems: "center" }, secondaryText: { color: "#173126", fontWeight: "900", fontSize: 11 }, amberButton: { backgroundColor: "#FFB800", borderRadius: 10, padding: 12, alignItems: "center" }, amberText: { color: "#173126", fontWeight: "900" },
  eyebrowDark: { color: colors.brand, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 }, summaryCard: { backgroundColor: "#F3F8F5", borderRadius: 12, padding: 11, gap: 4 }, label: { color: "#65756C", fontSize: 10, fontWeight: "900", marginTop: 4 }, summaryText: { color: "#263B31", fontSize: 12, fontWeight: "700", lineHeight: 18 }, price: { color: "#173126", fontWeight: "900", fontSize: 17 }, status: { color: "#5D6E64", fontSize: 11, marginTop: 3 }, sectionTitle: { color: "#173126", fontWeight: "900", marginTop: 5 }, proposal: { borderWidth: 1, borderColor: "#DDE7E1", borderRadius: 11, padding: 10, gap: 6 }, help: { color: "#68776F", fontSize: 12, lineHeight: 18 }, scopeInput: { minHeight: 85, textAlignVertical: "top", paddingTop: 9 }, row: { flexDirection: "row", gap: 7 }, flex: { flex: 1 },
  mobileTabs: { flexDirection: "row", backgroundColor: "#EAF4EF", borderRadius: 11, padding: 3, marginTop: 8 }, mobileTab: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 8 }, mobileTabActive: { backgroundColor: "#FFFFFF" }, mobileTabText: { color: "#607168", fontSize: 11, fontWeight: "900" }, mobileTabTextActive: { color: colors.brand },
});
