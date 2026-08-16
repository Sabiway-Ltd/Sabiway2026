import { useCallback, useEffect, useMemo, useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Switch, Text, TextInput, useWindowDimensions, View } from "react-native";

import type { AuthSession } from "../auth/types";
import { colors } from "../design/tokens";
import {
  createReview,
  getDisputes,
  getNotificationPreferences,
  getReviews,
  getSupportCases,
  getTrustProfile,
  getTrustTransactions,
  openDispute,
  openSupportCase,
  saveNotificationPreferences,
} from "./api";
import type { DisputeCase, NotificationPreferences, SupportCase, TrustProfile, TrustReview, TrustTransaction } from "./types";

type Props = { session: AuthSession; onBackToMarketplace: () => void; onOpenSabiPay: () => void };
type Tab = "disputes" | "reviews" | "support" | "notifications";
type Evidence = { uri: string; name: string; mimeType: string } | null;

const label = (value: string) => value.replace(/_/g, " ");

export function TrustScreen({ session, onBackToMarketplace, onOpenSabiPay }: Props) {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 24, 760);
  const [tab, setTab] = useState<Tab>("disputes");
  const [profile, setProfile] = useState<TrustProfile | null>(null);
  const [transactions, setTransactions] = useState<TrustTransaction[]>([]);
  const [disputes, setDisputes] = useState<DisputeCase[]>([]);
  const [reviews, setReviews] = useState<TrustReview[]>([]);
  const [supportCases, setSupportCases] = useState<SupportCase[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState("");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [evidence, setEvidence] = useState<Evidence>(null);
  const [reviewTransaction, setReviewTransaction] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewBody, setReviewBody] = useState("");
  const [supportCategory, setSupportCategory] = useState("");
  const [supportSummary, setSupportSummary] = useState("");
  const [supportDetails, setSupportDetails] = useState("");
  const [supportTransaction, setSupportTransaction] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [me, txs, cases, support, prefs] = await Promise.all([
        getTrustProfile(session.access),
        getTrustTransactions(session.access),
        getDisputes(session.access),
        getSupportCases(session.access),
        getNotificationPreferences(session.access),
      ]);
      const nextReviews = await getReviews(session.access, me.role === "professional" ? me.username : undefined);
      setProfile(me); setTransactions(txs); setDisputes(cases); setSupportCases(support); setPreferences(prefs); setReviews(nextReviews);
    } catch (error) {
      Alert.alert("Trust Centre unavailable", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [session.access]);

  useEffect(() => { load(); }, [load]);

  const disputeEligible = useMemo(() => transactions.filter((tx) => tx.state === "delivered"), [transactions]);
  const reviewEligible = useMemo(() => transactions.filter((tx) => tx.state === "released" && tx.client.user_id === session.user.id && !reviews.some((review) => review.transaction === tx.id)), [reviews, session.user.id, transactions]);

  const pickEvidence = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ["image/jpeg", "image/png", "image/webp", "application/pdf", "text/plain"], copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setEvidence({ uri: asset.uri, name: asset.name || "dispute-evidence", mimeType: asset.mimeType || "application/octet-stream" });
  };

  const submitDispute = async () => {
    if (!selectedTransaction || !reason.trim()) { Alert.alert("Missing information", "Choose a delivered transaction and add a dispute reason."); return; }
    try {
      setBusy(true);
      await openDispute(session.access, { transactionId: selectedTransaction, reason: reason.trim(), details: details.trim(), evidence });
      setSelectedTransaction(""); setReason(""); setDetails(""); setEvidence(null);
      Alert.alert("Dispute opened", "SabiPay release is frozen while the case is reviewed."); await load();
    } catch (error) { Alert.alert("Dispute not opened", error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); }
  };

  const submitReview = async () => {
    if (!reviewTransaction) { Alert.alert("Choose a transaction", "Only released completed transactions can be reviewed."); return; }
    try {
      setBusy(true);
      await createReview(session.access, { transactionId: reviewTransaction, rating, title: reviewTitle.trim(), body: reviewBody.trim() });
      setReviewTransaction(""); setRating(5); setReviewTitle(""); setReviewBody("");
      Alert.alert("Review published", "Your rating is tied to the completed booking."); await load();
    } catch (error) { Alert.alert("Review not published", error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); }
  };

  const submitSupport = async () => {
    if (!supportCategory.trim() || !supportSummary.trim()) { Alert.alert("Missing information", "Add a category and short summary."); return; }
    try {
      setBusy(true);
      await openSupportCase(session.access, { category: supportCategory.trim(), summary: supportSummary.trim(), details: supportDetails.trim(), transactionId: supportTransaction || undefined });
      setSupportCategory(""); setSupportSummary(""); setSupportDetails(""); setSupportTransaction("");
      Alert.alert("Support case opened", "Your support history remains available in the app."); await load();
    } catch (error) { Alert.alert("Support case not opened", error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return;
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    try { setPreferences(await saveNotificationPreferences(session.access, next)); }
    catch (error) { setPreferences(preferences); Alert.alert("Preference not saved", error instanceof Error ? error.message : "Please try again."); }
  };

  if (loading) return <View style={styles.center}><Text style={styles.muted}>Loading Trust Centre…</Text></View>;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { width: contentWidth }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />} keyboardShouldPersistTaps="handled">
      <View style={styles.hero}><Text style={styles.eyebrow}>TRUST CENTRE</Text><Text style={styles.title}>Protection after the booking</Text><Text style={styles.subtitle}>Disputes, verified reviews, support escalation and notification recovery in one auditable journey.</Text><View style={styles.heroActions}><Pressable onPress={onBackToMarketplace} style={styles.heroButton}><Text style={styles.heroButtonText}>Marketplace</Text></Pressable><Pressable onPress={onOpenSabiPay} style={styles.heroButton}><Text style={styles.heroButtonText}>SabiPay</Text></Pressable></View></View>
      <View style={styles.tabs}>{(["disputes", "reviews", "support", "notifications"] as Tab[]).map((value) => <Pressable key={value} onPress={() => setTab(value)} style={[styles.tab, tab === value && styles.tabActive]}><Text style={[styles.tabText, tab === value && styles.tabTextActive]}>{value === "notifications" ? "Alerts" : value[0].toUpperCase() + value.slice(1)}</Text></Pressable>)}</View>

      {tab === "disputes" ? <View style={styles.section}><Text style={styles.sectionTitle}>Your disputes</Text>{disputes.length === 0 ? <Text style={styles.muted}>No disputes have been raised.</Text> : disputes.map((item) => <View key={item.id} style={styles.card}><View style={styles.rowBetween}><Text style={styles.cardTitle}>{item.receipt_number}</Text><Text style={styles.badge}>{label(item.dispute_status)}</Text></View><Text style={styles.bodyStrong}>{item.reason}</Text><Text style={styles.muted}>{item.details}</Text>{item.decision ? <Text style={styles.good}>Decision: {label(item.decision)}</Text> : null}</View>)}<Text style={styles.sectionTitle}>Raise a dispute</Text><Text style={styles.muted}>Only delivered services still inside the SabiPay freeze window are eligible.</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{disputeEligible.map((tx) => <Pressable key={tx.id} onPress={() => setSelectedTransaction(tx.id)} style={[styles.chip, selectedTransaction === tx.id && styles.chipActive]}><Text style={[styles.chipText, selectedTransaction === tx.id && styles.chipTextActive]}>{tx.receipt_number}</Text></Pressable>)}</ScrollView><TextInput value={reason} onChangeText={setReason} placeholder="Dispute reason" placeholderTextColor={colors.muted} style={styles.input}/><TextInput value={details} onChangeText={setDetails} placeholder="What happened and what outcome are you seeking?" placeholderTextColor={colors.muted} multiline style={[styles.input, styles.multiline]}/><Pressable onPress={pickEvidence} style={styles.outlineButton}><Text style={styles.outlineText}>{evidence ? `Evidence: ${evidence.name}` : "Attach evidence (optional)"}</Text></Pressable><Pressable disabled={busy || disputeEligible.length === 0} onPress={submitDispute} style={[styles.amberButton, (busy || disputeEligible.length === 0) && styles.disabled]}><Text style={styles.amberText}>Open dispute</Text></Pressable></View> : null}

      {tab === "reviews" ? <View style={styles.section}><Text style={styles.sectionTitle}>Verified service reviews</Text>{reviews.length === 0 ? <Text style={styles.muted}>No eligible reviews yet.</Text> : reviews.map((item) => <View key={item.id} style={styles.card}><View style={styles.rowBetween}><Text style={styles.cardTitle}>{item.professional.full_name}</Text><Text style={styles.stars}>{"★".repeat(item.rating)}</Text></View><Text style={styles.bodyStrong}>{item.title}</Text><Text style={styles.muted}>{item.body}</Text></View>)}{profile?.role === "client" ? <><Text style={styles.sectionTitle}>Review completed service</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{reviewEligible.map((tx) => <Pressable key={tx.id} onPress={() => setReviewTransaction(tx.id)} style={[styles.chip, reviewTransaction === tx.id && styles.chipActive]}><Text style={[styles.chipText, reviewTransaction === tx.id && styles.chipTextActive]}>{tx.professional.full_name}</Text></Pressable>)}</ScrollView><View style={styles.chips}>{[1,2,3,4,5].map((value) => <Pressable key={value} onPress={() => setRating(value)} style={[styles.ratingChip, rating === value && styles.ratingChipActive]}><Text style={styles.ratingText}>{value}★</Text></Pressable>)}</View><TextInput value={reviewTitle} onChangeText={setReviewTitle} placeholder="Short summary" placeholderTextColor={colors.muted} style={styles.input}/><TextInput value={reviewBody} onChangeText={setReviewBody} placeholder="Useful service feedback" placeholderTextColor={colors.muted} multiline style={[styles.input, styles.multiline]}/><Pressable disabled={busy || reviewEligible.length === 0} onPress={submitReview} style={[styles.greenButton, (busy || reviewEligible.length === 0) && styles.disabled]}><Text style={styles.greenText}>Publish verified review</Text></Pressable></> : <View style={styles.card}><Text style={styles.cardTitle}>Your reputation</Text><Text style={styles.ratingHero}>{profile?.rating_average ?? "0.00"}</Text><Text style={styles.muted}>{profile?.rating_count ?? 0} eligible completed-booking reviews</Text></View>}</View> : null}

      {tab === "support" ? <View style={styles.section}><Text style={styles.sectionTitle}>Support history</Text>{supportCases.length === 0 ? <Text style={styles.muted}>No support cases yet.</Text> : supportCases.map((item) => <View key={item.id} style={styles.card}><View style={styles.rowBetween}><Text style={styles.cardTitle}>{item.summary}</Text><Text style={styles.badge}>{label(item.status)}</Text></View><Text style={styles.muted}>{item.details}</Text><Text style={styles.small}>Priority: {item.priority}</Text></View>)}<Text style={styles.sectionTitle}>Open support case</Text><TextInput value={supportCategory} onChangeText={setSupportCategory} placeholder="Category e.g. payment, booking, safety" placeholderTextColor={colors.muted} style={styles.input}/><TextInput value={supportSummary} onChangeText={setSupportSummary} placeholder="Short summary" placeholderTextColor={colors.muted} style={styles.input}/><TextInput value={supportDetails} onChangeText={setSupportDetails} placeholder="Tell support what you need" placeholderTextColor={colors.muted} multiline style={[styles.input, styles.multiline]}/><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}><Pressable onPress={() => setSupportTransaction("")} style={[styles.chip, !supportTransaction && styles.chipActive]}><Text style={[styles.chipText, !supportTransaction && styles.chipTextActive]}>No transaction</Text></Pressable>{transactions.map((tx) => <Pressable key={tx.id} onPress={() => setSupportTransaction(tx.id)} style={[styles.chip, supportTransaction === tx.id && styles.chipActive]}><Text style={[styles.chipText, supportTransaction === tx.id && styles.chipTextActive]}>{tx.receipt_number}</Text></Pressable>)}</ScrollView><Pressable disabled={busy} onPress={submitSupport} style={[styles.greenButton, busy && styles.disabled]}><Text style={styles.greenText}>Open support case</Text></Pressable></View> : null}

      {tab === "notifications" && preferences ? <View style={styles.section}><Text style={styles.sectionTitle}>Notification recovery</Text><Text style={styles.muted}>In-app history is authoritative. Push and email are secondary delivery channels and can be changed here.</Text>{([
        ["push_enabled", "Push notifications"], ["email_enabled", "Email notifications"], ["payment_email_enabled", "Payment emails"], ["dispute_email_enabled", "Dispute emails"],
      ] as [keyof NotificationPreferences, string][]).map(([keyName, title]) => <View key={keyName} style={styles.switchRow}><Text style={styles.bodyStrong}>{title}</Text><Switch value={preferences[keyName]} onValueChange={(value) => updatePreference(keyName, value)} trackColor={{ true: colors.brand }}/></View>)}</View> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F7FAF8" }, content: { alignSelf: "center", paddingVertical: 12, gap: 14 }, center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F7FAF8" }, hero: { backgroundColor: "#073522", borderRadius: 22, padding: 18, gap: 8 }, eyebrow: { color: "#8DD1B3", fontWeight: "900", fontSize: 11, letterSpacing: 1.4 }, title: { color: "#FFFFFF", fontWeight: "900", fontSize: 24, lineHeight: 29 }, subtitle: { color: "#D7EADF", lineHeight: 20 }, heroActions: { flexDirection: "row", gap: 8, marginTop: 4 }, heroButton: { borderWidth: 1, borderColor: "#618775", borderRadius: 10, paddingHorizontal: 11, paddingVertical: 8 }, heroButtonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 12 }, tabs: { flexDirection: "row", gap: 5 }, tab: { flex: 1, minHeight: 42, justifyContent: "center", alignItems: "center", borderRadius: 11, borderWidth: 1, borderColor: "#DCE7E1", backgroundColor: "#FFFFFF" }, tabActive: { backgroundColor: colors.brand, borderColor: colors.brand }, tabText: { color: "#52635A", fontWeight: "800", fontSize: 10 }, tabTextActive: { color: "#FFFFFF" }, section: { gap: 10 }, sectionTitle: { color: "#173126", fontSize: 20, fontWeight: "900", marginTop: 2 }, card: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DCE7E1", borderRadius: 17, padding: 14, gap: 7 }, rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }, cardTitle: { flex: 1, color: "#173126", fontWeight: "900", fontSize: 16 }, bodyStrong: { color: "#173126", fontWeight: "800" }, muted: { color: "#66756D", lineHeight: 19 }, small: { color: "#75837B", fontSize: 11, fontWeight: "700" }, badge: { textTransform: "capitalize", color: colors.brand, backgroundColor: "#EAF8F1", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, fontWeight: "800", fontSize: 10 }, good: { color: colors.brand, fontWeight: "800" }, stars: { color: "#B77B00", fontWeight: "900" }, ratingHero: { color: "#173126", fontSize: 38, fontWeight: "900" }, input: { minHeight: 48, borderWidth: 1, borderColor: "#D9E4DD", borderRadius: 12, paddingHorizontal: 14, backgroundColor: "#FFFFFF", color: "#173126" }, multiline: { minHeight: 100, paddingTop: 12, textAlignVertical: "top" }, chips: { flexDirection: "row", gap: 7, paddingVertical: 2 }, chip: { borderWidth: 1, borderColor: "#D5E1DA", backgroundColor: "#FFFFFF", borderRadius: 999, paddingHorizontal: 11, paddingVertical: 8 }, chipActive: { backgroundColor: colors.brand, borderColor: colors.brand }, chipText: { color: "#52635A", fontSize: 11, fontWeight: "800" }, chipTextActive: { color: "#FFFFFF" }, ratingChip: { borderWidth: 1, borderColor: "#D5E1DA", borderRadius: 10, paddingHorizontal: 11, paddingVertical: 8 }, ratingChipActive: { backgroundColor: "#FFF2BE", borderColor: "#FFB800" }, ratingText: { color: "#4B3A00", fontWeight: "900" }, greenButton: { alignSelf: "flex-start", backgroundColor: colors.brand, borderRadius: 11, paddingHorizontal: 14, paddingVertical: 11 }, greenText: { color: "#FFFFFF", fontWeight: "900" }, amberButton: { alignSelf: "flex-start", backgroundColor: "#FFB800", borderRadius: 11, paddingHorizontal: 14, paddingVertical: 11 }, amberText: { color: "#173126", fontWeight: "900" }, outlineButton: { alignSelf: "flex-start", borderWidth: 1, borderColor: colors.brand, borderRadius: 11, paddingHorizontal: 14, paddingVertical: 10 }, outlineText: { color: colors.brand, fontWeight: "800" }, disabled: { opacity: 0.5 }, switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DCE7E1", borderRadius: 14, padding: 14 },
});
