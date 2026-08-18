import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";

import type { AuthSession } from "../auth/types";
import { colors } from "../design/tokens";
import {
  actOnSabiPay,
  getNigerianBanks,
  getPayoutDestinations,
  getSabiPayBookings,
  getSabiPayTransactions,
  initializeSabiPay,
  openSabiPayDispute,
  refreshSabiPayStatus,
  savePayoutDestination,
  verifySabiPay,
} from "./api";
import type { NigerianBank, PayoutDestination, SabiPayBooking, SabiPayTransaction } from "./types";

type Props = { session: AuthSession; onBackToMarketplace: () => void };
type ViewMode = "history" | "withdraw";

function formatMoney(value: string | number) { return Number(value || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function stateLabel(value: string) { return value.replace(/_/g, " "); }
function key() { return `mobile-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
const disputeReasons: Array<[string, string]> = [["service_not_provided", "Not provided"], ["service_not_as_agreed", "Not as agreed"], ["payment_problem", "Payment"], ["safety_concern", "Safety"], ["duplicate_charge", "Duplicate charge"], ["other", "Other"]];

export function SabiPayScreen({ session, onBackToMarketplace }: Props) {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 24, 760);
  const [view, setView] = useState<ViewMode>("history");
  const [bookings, setBookings] = useState<SabiPayBooking[]>([]);
  const [transactions, setTransactions] = useState<SabiPayTransaction[]>([]);
  const [destinations, setDestinations] = useState<PayoutDestination[]>([]);
  const [banks, setBanks] = useState<NigerianBank[]>([]);
  const [selectedBank, setSelectedBank] = useState<NigerianBank | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState("");
  const [disputeTxId, setDisputeTxId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState("service_not_as_agreed");
  const [disputeDetails, setDisputeDetails] = useState("");

  const load = useCallback(async () => {
    try {
      const [nextBookings, nextTransactions] = await Promise.all([getSabiPayBookings(session.access), getSabiPayTransactions(session.access)]);
      setBookings(nextBookings); setTransactions(nextTransactions);
      if (session.user.role === "professional") {
        const [nextDestinations, nextBanks] = await Promise.all([getPayoutDestinations(session.access), getNigerianBanks(session.access)]);
        setDestinations(nextDestinations); setBanks(nextBanks.filter((bank) => bank.active !== false));
      }
    } catch (error) { Alert.alert("SabiPay unavailable", error instanceof Error ? error.message : "Please try again."); }
    finally { setLoading(false); setRefreshing(false); }
  }, [session.access, session.user.role]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const handle = async ({ url }: { url: string }) => {
      if (!url.startsWith("sabiway://sabipay")) return;
      const reference = new URLSearchParams(url.split("?")[1] || "").get("reference") || "";
      if (!reference) return void load();
      const current = transactions.find((item) => item.latest_attempt?.reference === reference);
      if (!current) return void load();
      try {
        setBusy(`verify-${current.id}`);
        const verified = await verifySabiPay(session.access, current.id, reference);
        Alert.alert(verified.payment_status === "succeeded" ? "Payment verified" : "Payment status updated", verified.payment_status === "succeeded" ? "SabiPay is holding the booking funds securely." : `Current status: ${stateLabel(verified.payment_status)}.`);
        await load();
      } catch (error) { Alert.alert("Verification pending", error instanceof Error ? error.message : "You can refresh and retry safely."); }
      finally { setBusy(""); }
    };
    const subscription = Linking.addEventListener("url", handle);
    void Linking.getInitialURL().then((url) => { if (url) void handle({ url }); });
    return () => subscription.remove();
  }, [load, session.access, transactions]);

  const transactionByBooking = useMemo(() => new Map(transactions.map((tx) => [tx.booking_id, tx])), [transactions]);
  const readyBookings = bookings.filter((booking) => booking.status === "accepted" && booking.currency === "NGN" && booking.client.user_id === session.user.id);
  const providerBalance = useMemo(() => transactions.filter((tx) => tx.professional.user_id === session.user.id && ["released", "payout_pending", "payout_processing"].includes(tx.state)).reduce((sum, tx) => sum + Number(tx.provider_amount || 0), 0), [session.user.id, transactions]);

  const startCheckout = async (booking: SabiPayBooking) => {
    try {
      setBusy(`pay-${booking.id}`);
      const payload = await initializeSabiPay(session.access, booking.id, key());
      if (!payload.checkout_url) throw new Error("Paystack did not return a secure checkout link.");
      await Linking.openURL(payload.checkout_url);
    } catch (error) { Alert.alert("Checkout not started", error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(""); }
  };

  const refreshStatus = async (tx: SabiPayTransaction) => {
    try { setBusy(`refresh-${tx.id}`); const refreshed = await refreshSabiPayStatus(session.access, tx.id); Alert.alert("Payment status checked", `Payment: ${stateLabel(refreshed.payment_status)}. Reconciliation: ${stateLabel(refreshed.reconciliation_status)}.`); await load(); }
    catch (error) { Alert.alert("Status check unavailable", error instanceof Error ? error.message : "Please try again shortly."); }
    finally { setBusy(""); }
  };

  const action = async (tx: SabiPayTransaction, name: "start-service" | "mark-delivered" | "confirm-satisfaction") => {
    try { setBusy(`${name}-${tx.id}`); await actOnSabiPay(session.access, tx.id, name); Alert.alert("SabiPay updated", name === "mark-delivered" ? "The seven-day freeze has started." : name === "confirm-satisfaction" ? "Provider payout has started." : "Service is now in progress."); await load(); }
    catch (error) { Alert.alert("Update not saved", error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(""); }
  };

  const submitDispute = async (tx: SabiPayTransaction) => {
    if (disputeDetails.trim().length < 10) return Alert.alert("Add more detail", "Briefly explain what happened so SabiWay can review the issue.");
    try { setBusy(`dispute-${tx.id}`); await openSabiPayDispute(session.access, tx.id, disputeReason, disputeDetails.trim()); setDisputeTxId(null); setDisputeDetails(""); Alert.alert("Dispute opened", "SabiPay has frozen the transaction while it is reviewed."); await load(); }
    catch (error) { Alert.alert("Dispute not opened", error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(""); }
  };

  const saveDestination = async () => {
    if (!selectedBank || !/^\d{10}$/.test(accountNumber)) return Alert.alert("Check account details", "Choose a Nigerian bank and enter a 10-digit account number.");
    try { setBusy("destination"); await savePayoutDestination(session.access, accountNumber, selectedBank.code, selectedBank.name); setAccountNumber(""); Alert.alert("Payout account verified", "SabiWay stores only the Paystack recipient token and final four account digits."); await load(); }
    catch (error) { Alert.alert("Account not verified", error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(""); }
  };

  if (loading) return <View style={styles.center}><Text style={styles.muted}>Loading SabiPay…</Text></View>;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { width: contentWidth }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />} keyboardShouldPersistTaps="handled">
      <View style={styles.hero}>
        <View style={styles.heroRow}><Pressable onPress={onBackToMarketplace} style={styles.backButton}><Text style={styles.backText}>←</Text></Pressable><Text style={styles.heroTitle}>SabiPay</Text><View style={{ width: 38 }} /></View>
        {session.user.role === "professional" ? <View style={styles.balanceCard}><View><Text style={styles.balanceLabel}>Business Balance</Text><Text style={styles.balanceValue}>₦{formatMoney(providerBalance)}</Text></View><Pressable onPress={() => setView("withdraw")} style={styles.withdrawPill}><Text style={styles.withdrawPillText}>Withdraw</Text></Pressable></View> : <Text style={styles.heroCopy}>Protected payments for agreed SabiWay bookings.</Text>}
      </View>

      {session.user.role === "professional" ? <View style={styles.tabs}><Pressable onPress={() => setView("history")} style={[styles.tab, view === "history" && styles.tabActive]}><Text style={[styles.tabText, view === "history" && styles.tabTextActive]}>Payment History</Text></Pressable><Pressable onPress={() => setView("withdraw")} style={[styles.tab, view === "withdraw" && styles.tabActive]}><Text style={[styles.tabText, view === "withdraw" && styles.tabTextActive]}>Withdraw</Text></Pressable></View> : null}

      {session.user.role === "client" && readyBookings.length > 0 ? <View style={styles.section}><Text style={styles.sectionTitle}>Ready to pay</Text>{readyBookings.map((booking) => {
        const tx = transactionByBooking.get(booking.id); const amount = Number(booking.agreed_price); const fee = amount * 0.10;
        return <View key={booking.id} style={styles.summaryCard}><Text style={styles.summaryEyebrow}>JOB SUMMARY</Text><Text style={styles.cardTitle}>{booking.scope_summary}</Text><Text style={styles.providerName}>{booking.professional.full_name}</Text><View style={styles.summaryRows}><SummaryRow label="Service" value={`₦${formatMoney(amount)}`} /><SummaryRow label="SabiWay fee" value={`₦${formatMoney(fee)}`} /><SummaryRow label="Provider receives" value={`₦${formatMoney(amount - fee)}`} /></View><Text style={styles.escrowNote}>▣ Funds are held securely until the service is completed or a dispute is resolved.</Text>{tx?.latest_attempt?.authorization_url && tx.state === "pending_payment" ? <View style={styles.actions}><Pressable onPress={() => void Linking.openURL(tx.latest_attempt!.authorization_url)} style={styles.primaryButton}><Text style={styles.primaryText}>Continue checkout</Text></Pressable><Pressable disabled={busy === `refresh-${tx.id}`} onPress={() => void refreshStatus(tx)} style={styles.secondaryButton}><Text style={styles.secondaryText}>Check status</Text></Pressable></View> : tx ? <Text style={styles.good}>SabiPay: {stateLabel(tx.state)}</Text> : <Pressable disabled={busy === `pay-${booking.id}`} onPress={() => void startCheckout(booking)} style={styles.primaryButton}><Text style={styles.primaryText}>Use Paystack</Text></Pressable>}</View>;
      })}</View> : null}

      {view === "history" ? <View style={styles.section}><View style={styles.sectionHeader}><Text style={styles.sectionTitle}>All History</Text><Text style={styles.filterCircle}>≡</Text></View>{transactions.length === 0 ? <View style={styles.empty}><Text style={styles.cardTitle}>No SabiPay activity yet</Text><Text style={styles.muted}>Accepted NGN bookings appear here when payment starts.</Text></View> : transactions.map((tx) => <TransactionCard key={tx.id} tx={tx} session={session} busy={busy} disputeTxId={disputeTxId} disputeReason={disputeReason} disputeDetails={disputeDetails} setDisputeTxId={setDisputeTxId} setDisputeReason={setDisputeReason} setDisputeDetails={setDisputeDetails} onRefresh={refreshStatus} onAction={action} onSubmitDispute={submitDispute} />)}</View> : null}

      {session.user.role === "professional" && view === "withdraw" ? <View style={styles.withdrawCard}>
        <View style={styles.withdrawHeader}><Pressable onPress={() => setView("history")}><Text style={styles.withdrawBack}>←</Text></Pressable><Text style={styles.withdrawTitle}>Withdraw</Text><View style={{ width: 26 }} /></View>
        {destinations[0] ? <View style={styles.accountCard}><Text style={styles.accountName}>{destinations[0].account_name}</Text><Text style={styles.muted}>{destinations[0].bank_name || destinations[0].bank_code} · ••••{destinations[0].account_last4}</Text><Text style={styles.good}>Verified with Paystack</Text></View> : null}
        <Text style={styles.formLabel}>Bank Name</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bankRow}>{banks.slice(0, 30).map((bank) => <Pressable key={`${bank.code}-${bank.name}`} onPress={() => setSelectedBank(bank)} style={[styles.bankChip, selectedBank?.code === bank.code && styles.bankChipActive]}><Text style={[styles.bankText, selectedBank?.code === bank.code && styles.bankTextActive]}>{bank.name}</Text></Pressable>)}</ScrollView>
        <Text style={styles.formLabel}>Account Number</Text><TextInput value={accountNumber} onChangeText={setAccountNumber} keyboardType="number-pad" maxLength={10} placeholder="10-digit account number" placeholderTextColor="#8A8A8A" style={styles.input}/>
        <Text style={styles.formLabel}>Amount</Text><View style={styles.amountField}><Text style={styles.amountFieldText}>Available balance ₦{formatMoney(providerBalance)}</Text></View>
        <Text style={styles.withdrawNote}>Once a payout is requested, Paystack processes the verified recipient transfer. SabiWay does not store full bank-account details.</Text>
        <Pressable disabled={busy === "destination"} onPress={() => void saveDestination()} style={styles.primaryButton}><Text style={styles.primaryText}>{destinations[0] ? "Replace payout account" : "Continue"}</Text></Pressable>
      </View> : null}
    </ScrollView>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) { return <View style={styles.summaryRow}><Text style={styles.summaryLabel}>{label}</Text><Text style={styles.summaryValue}>{value}</Text></View>; }

function TransactionCard({ tx, session, busy, disputeTxId, disputeReason, disputeDetails, setDisputeTxId, setDisputeReason, setDisputeDetails, onRefresh, onAction, onSubmitDispute }: {
  tx: SabiPayTransaction; session: AuthSession; busy: string; disputeTxId: string | null; disputeReason: string; disputeDetails: string; setDisputeTxId: (value: string | null) => void; setDisputeReason: (value: string) => void; setDisputeDetails: (value: string) => void; onRefresh: (tx: SabiPayTransaction) => Promise<void>; onAction: (tx: SabiPayTransaction, name: "start-service" | "mark-delivered" | "confirm-satisfaction") => Promise<void>; onSubmitDispute: (tx: SabiPayTransaction) => Promise<void>;
}) {
  const client = tx.client.user_id === session.user.id; const provider = tx.professional.user_id === session.user.id;
  const activeDispute = tx.disputes.find((item) => item.status === "open" || item.status === "under_review");
  const canDispute = ["funded", "in_progress", "delivered"].includes(tx.state) && !activeDispute;
  return <View style={styles.transactionCard}>
    <View style={styles.transactionTop}><View><Text style={styles.transactionTitle}>{tx.scope_summary}</Text><Text style={styles.transactionProvider}>{provider ? tx.client.full_name : tx.professional.full_name}</Text></View><View style={[styles.statusBadge, tx.state === "released" && styles.statusDone]}><Text style={styles.statusText}>{stateLabel(tx.state)}</Text></View></View>
    <View style={styles.transactionMeta}><Text style={styles.transactionAmount}>₦{formatMoney(tx.amount)}</Text><Text style={styles.receipt}>{tx.receipt_number}</Text></View>
    <Text style={styles.muted}>Payment: {stateLabel(tx.payment_status)} · Reconciliation: {stateLabel(tx.reconciliation_status)}</Text>
    {tx.last_payment_error ? <Text style={styles.warning}>{tx.last_payment_error}</Text> : null}
    {tx.state === "delivered" ? <Text style={styles.warning}>{Math.max(0, Math.ceil(tx.freeze_seconds_remaining / 86400))} day(s) to automatic release</Text> : null}
    {tx.payout ? <Text style={styles.muted}>Payout: {stateLabel(tx.payout.status)} · {tx.payout.destination_label}</Text> : null}
    {activeDispute ? <View style={styles.disputeNotice}><Text style={styles.disputeNoticeTitle}>Dispute {stateLabel(activeDispute.status)}</Text><Text style={styles.disputeNoticeText}>Funds are frozen during review.</Text></View> : null}
    <View style={styles.actions}>{tx.state === "pending_payment" ? <Pressable disabled={busy === `refresh-${tx.id}`} onPress={() => void onRefresh(tx)} style={styles.secondaryButton}><Text style={styles.secondaryText}>Check status</Text></Pressable> : null}{tx.state === "funded" && provider ? <Pressable onPress={() => void onAction(tx, "start-service")} style={styles.primaryButton}><Text style={styles.primaryText}>Start service</Text></Pressable> : null}{tx.state === "in_progress" && provider ? <Pressable onPress={() => void onAction(tx, "mark-delivered")} style={styles.primaryButton}><Text style={styles.primaryText}>Mark delivered</Text></Pressable> : null}{tx.state === "delivered" && client ? <Pressable onPress={() => void onAction(tx, "confirm-satisfaction")} style={styles.primaryButton}><Text style={styles.primaryText}>Confirm & release</Text></Pressable> : null}{canDispute ? <Pressable onPress={() => { setDisputeTxId(disputeTxId === tx.id ? null : tx.id); setDisputeDetails(""); }} style={styles.dangerButton}><Text style={styles.dangerText}>Report problem</Text></Pressable> : null}</View>
    {disputeTxId === tx.id ? <View style={styles.disputeForm}><Text style={styles.formLabel}>Open a dispute</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.reasonRow}>{disputeReasons.map(([value, text]) => <Pressable key={value} onPress={() => setDisputeReason(value)} style={[styles.reasonChip, disputeReason === value && styles.reasonChipActive]}><Text style={[styles.reasonText, disputeReason === value && styles.reasonTextActive]}>{text}</Text></Pressable>)}</ScrollView><TextInput value={disputeDetails} onChangeText={setDisputeDetails} multiline placeholder="Explain what happened" placeholderTextColor="#8A8A8A" style={[styles.input, styles.disputeInput]}/><View style={styles.actions}><Pressable onPress={() => setDisputeTxId(null)} style={styles.secondaryButton}><Text style={styles.secondaryText}>Cancel</Text></Pressable><Pressable disabled={busy === `dispute-${tx.id}`} onPress={() => void onSubmitDispute(tx)} style={styles.dangerFilledButton}><Text style={styles.dangerFilledText}>Open dispute</Text></Pressable></View></View> : null}
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F6F6F6" }, content: { alignSelf: "center", gap: 12, paddingBottom: 40 }, center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F6F6F6" },
  hero: { backgroundColor: colors.brand, paddingHorizontal: 16, paddingTop: 15, paddingBottom: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }, heroRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, backButton: { width: 38, height: 38, justifyContent: "center" }, backText: { color: "#FFFFFF", fontSize: 22 }, heroTitle: { color: "#FFFFFF", fontSize: 19, fontWeight: "900" }, heroCopy: { color: "#DDF6E9", fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: 8 },
  balanceCard: { marginTop: 15, backgroundColor: "#FFFFFF", borderRadius: 26, paddingHorizontal: 14, paddingVertical: 9, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, balanceLabel: { color: "#6F7D76", fontSize: 9, fontWeight: "800" }, balanceValue: { color: colors.brand, fontSize: 17, fontWeight: "900", marginTop: 2 }, withdrawPill: { backgroundColor: "#E5F6ED", borderRadius: 16, paddingHorizontal: 13, paddingVertical: 7 }, withdrawPillText: { color: colors.brand, fontSize: 10, fontWeight: "900" },
  tabs: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#E5E5E5", marginHorizontal: 12 }, tab: { flex: 1, alignItems: "center", paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: "transparent" }, tabActive: { borderBottomColor: colors.brand }, tabText: { color: "#8A8A8A", fontSize: 10, fontWeight: "700" }, tabTextActive: { color: colors.brand, fontWeight: "900" },
  section: { marginHorizontal: 12, gap: 9 }, sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, sectionTitle: { color: "#222222", fontSize: 15, fontWeight: "900" }, filterCircle: { color: colors.brand, fontSize: 18 },
  summaryCard: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#E5E5E5", gap: 9 }, summaryEyebrow: { color: colors.brand, fontSize: 9, fontWeight: "900", letterSpacing: 1 }, cardTitle: { color: "#222222", fontSize: 15, fontWeight: "900" }, providerName: { color: "#777777", fontSize: 10 }, summaryRows: { borderTopWidth: 1, borderTopColor: "#EEEEEE", borderBottomWidth: 1, borderBottomColor: "#EEEEEE", paddingVertical: 6, gap: 4 }, summaryRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 }, summaryLabel: { color: "#777777", fontSize: 10 }, summaryValue: { color: "#222222", fontSize: 10, fontWeight: "900" }, escrowNote: { color: "#6A6A6A", fontSize: 9, lineHeight: 15 },
  transactionCard: { backgroundColor: "#FFFFFF", borderRadius: 10, borderWidth: 1, borderColor: "#E8E8E8", padding: 12, gap: 7 }, transactionTop: { flexDirection: "row", justifyContent: "space-between", gap: 8 }, transactionTitle: { color: "#333333", fontSize: 11, fontWeight: "900", maxWidth: 230 }, transactionProvider: { color: "#8A8A8A", fontSize: 9, marginTop: 2 }, statusBadge: { backgroundColor: "#FFF1D6", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: "flex-start" }, statusDone: { backgroundColor: "#E5F6ED" }, statusText: { color: colors.brand, fontSize: 8, fontWeight: "900", textTransform: "capitalize" }, transactionMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, transactionAmount: { color: colors.brand, fontSize: 12, fontWeight: "900" }, receipt: { color: "#999999", fontSize: 8 },
  muted: { color: "#777777", lineHeight: 16, fontSize: 9 }, good: { color: colors.brand, fontWeight: "800", fontSize: 10 }, warning: { color: "#7A5A00", fontWeight: "800", fontSize: 9 }, empty: { backgroundColor: "#FFFFFF", borderRadius: 10, borderWidth: 1, borderStyle: "dashed", borderColor: "#D4D4D4", padding: 22, alignItems: "center", gap: 4 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, primaryButton: { alignSelf: "flex-start", minHeight: 42, backgroundColor: colors.brand, borderRadius: 7, paddingHorizontal: 13, justifyContent: "center", alignItems: "center" }, primaryText: { color: "#FFFFFF", fontWeight: "900", fontSize: 10 }, secondaryButton: { alignSelf: "flex-start", minHeight: 42, borderWidth: 1, borderColor: "#D5D5D5", borderRadius: 7, paddingHorizontal: 13, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF" }, secondaryText: { color: colors.brand, fontWeight: "900", fontSize: 10 }, dangerButton: { alignSelf: "flex-start", minHeight: 40, borderWidth: 1, borderColor: "#E5BFC2", borderRadius: 7, paddingHorizontal: 12, justifyContent: "center" }, dangerText: { color: "#A5222B", fontWeight: "900", fontSize: 9 }, dangerFilledButton: { alignSelf: "flex-start", minHeight: 40, backgroundColor: "#A5222B", borderRadius: 7, paddingHorizontal: 12, justifyContent: "center" }, dangerFilledText: { color: "#FFFFFF", fontWeight: "900", fontSize: 9 },
  disputeNotice: { backgroundColor: "#FFF4F4", borderRadius: 8, padding: 9 }, disputeNoticeTitle: { color: "#9B1E27", fontWeight: "900", fontSize: 9, textTransform: "capitalize" }, disputeNoticeText: { color: "#7B4549", fontSize: 8, marginTop: 2 }, disputeForm: { backgroundColor: "#FFF9F9", borderRadius: 8, padding: 9, gap: 7 }, reasonRow: { gap: 5 }, reasonChip: { borderWidth: 1, borderColor: "#E2CCCC", borderRadius: 14, paddingHorizontal: 9, paddingVertical: 6 }, reasonChipActive: { backgroundColor: "#A5222B", borderColor: "#A5222B" }, reasonText: { color: "#6F5355", fontSize: 8, fontWeight: "800" }, reasonTextActive: { color: "#FFFFFF" }, disputeInput: { minHeight: 80, textAlignVertical: "top", paddingTop: 9 },
  withdrawCard: { marginHorizontal: 12, backgroundColor: "#FFFFFF", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#E5E5E5", gap: 10 }, withdrawHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, withdrawBack: { fontSize: 20, color: "#333333" }, withdrawTitle: { color: "#222222", fontSize: 16, fontWeight: "900" }, accountCard: { backgroundColor: "#F7F9F8", borderRadius: 9, padding: 10, gap: 3 }, accountName: { color: "#333333", fontSize: 11, fontWeight: "900" }, formLabel: { color: "#555555", fontSize: 9, fontWeight: "900" }, bankRow: { gap: 6, paddingVertical: 2 }, bankChip: { borderWidth: 1, borderColor: "#DEDEDE", borderRadius: 15, paddingHorizontal: 10, paddingVertical: 7 }, bankChipActive: { backgroundColor: "#E4F8EE", borderColor: colors.brand }, bankText: { color: "#666666", fontSize: 8, fontWeight: "700" }, bankTextActive: { color: colors.brand, fontWeight: "900" }, input: { minHeight: 44, borderWidth: 1, borderColor: "#E0E0E0", borderRadius: 7, paddingHorizontal: 11, color: "#222222", backgroundColor: "#FAFAFA" }, amountField: { minHeight: 44, borderRadius: 7, backgroundColor: "#F7F7F7", justifyContent: "center", paddingHorizontal: 11 }, amountFieldText: { color: "#666666", fontSize: 10 }, withdrawNote: { color: "#777777", fontSize: 9, lineHeight: 15 },
});
