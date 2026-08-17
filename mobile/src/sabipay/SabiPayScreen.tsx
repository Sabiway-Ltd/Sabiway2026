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

function formatMoney(value: string | number) {
  return Number(value || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function stateLabel(value: string) { return value.replace(/_/g, " "); }
function key() { return `mobile-${Date.now()}-${Math.random().toString(16).slice(2)}`; }

export function SabiPayScreen({ session, onBackToMarketplace }: Props) {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 24, 760);
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
      const [nextBookings, nextTransactions] = await Promise.all([
        getSabiPayBookings(session.access),
        getSabiPayTransactions(session.access),
      ]);
      setBookings(nextBookings);
      setTransactions(nextTransactions);
      if (session.user.role === "professional") {
        const [nextDestinations, nextBanks] = await Promise.all([
          getPayoutDestinations(session.access),
          getNigerianBanks(session.access),
        ]);
        setDestinations(nextDestinations);
        setBanks(nextBanks.filter((bank) => bank.active !== false));
      }
    } catch (error) {
      Alert.alert("SabiPay unavailable", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [session.access, session.user.role]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const handle = async ({ url }: { url: string }) => {
      if (!url.startsWith("sabiway://sabipay")) return;
      const query = url.split("?")[1] || "";
      const reference = new URLSearchParams(query).get("reference") || "";
      if (!reference) { await load(); return; }
      const current = transactions.find((item) => item.latest_attempt?.reference === reference);
      if (!current) { await load(); return; }
      try {
        setBusy(`verify-${current.id}`);
        const verified = await verifySabiPay(session.access, current.id, reference);
        Alert.alert(
          verified.payment_status === "succeeded" ? "Payment verified" : "Payment status updated",
          verified.payment_status === "succeeded" ? "SabiPay is now holding the booking funds securely." : `Current status: ${stateLabel(verified.payment_status)}. You can refresh or retry safely.`,
        );
        await load();
      } catch (error) {
        Alert.alert("Verification pending", error instanceof Error ? error.message : "You can refresh and retry safely.");
      } finally { setBusy(""); }
    };
    const subscription = Linking.addEventListener("url", handle);
    void Linking.getInitialURL().then((url) => { if (url) void handle({ url }); });
    return () => subscription.remove();
  }, [load, session.access, transactions]);

  const transactionByBooking = useMemo(() => new Map(transactions.map((tx) => [tx.booking_id, tx])), [transactions]);
  const readyBookings = bookings.filter((booking) => booking.status === "accepted" && booking.currency === "NGN" && booking.client.user_id === session.user.id);

  const startCheckout = async (booking: SabiPayBooking) => {
    try {
      setBusy(`pay-${booking.id}`);
      const payload = await initializeSabiPay(session.access, booking.id, key());
      if (!payload.checkout_url) throw new Error("Paystack did not return a secure checkout link.");
      await Linking.openURL(payload.checkout_url);
    } catch (error) {
      Alert.alert("Checkout not started", error instanceof Error ? error.message : "Please try again.");
    } finally { setBusy(""); }
  };

  const refreshStatus = async (tx: SabiPayTransaction) => {
    try {
      setBusy(`refresh-${tx.id}`);
      const refreshed = await refreshSabiPayStatus(session.access, tx.id);
      Alert.alert("Payment status checked", `Payment: ${stateLabel(refreshed.payment_status)}. Reconciliation: ${stateLabel(refreshed.reconciliation_status)}.`);
      await load();
    } catch (error) {
      Alert.alert("Status check unavailable", error instanceof Error ? error.message : "Please try again shortly.");
    } finally { setBusy(""); }
  };

  const action = async (tx: SabiPayTransaction, name: "start-service" | "mark-delivered" | "confirm-satisfaction") => {
    try {
      setBusy(`${name}-${tx.id}`);
      await actOnSabiPay(session.access, tx.id, name);
      Alert.alert("SabiPay updated", name === "mark-delivered" ? "The seven-day freeze has started." : name === "confirm-satisfaction" ? "Provider payout has started." : "Service is now in progress.");
      await load();
    } catch (error) {
      Alert.alert("Update not saved", error instanceof Error ? error.message : "Please try again.");
    } finally { setBusy(""); }
  };

  const submitDispute = async (tx: SabiPayTransaction) => {
    if (disputeDetails.trim().length < 10) {
      Alert.alert("Add more detail", "Briefly explain what happened so SabiWay can review the issue.");
      return;
    }
    try {
      setBusy(`dispute-${tx.id}`);
      await openSabiPayDispute(session.access, tx.id, disputeReason, disputeDetails.trim());
      setDisputeTxId(null);
      setDisputeDetails("");
      Alert.alert("Dispute opened", "SabiPay has frozen the transaction while it is reviewed.");
      await load();
    } catch (error) {
      Alert.alert("Dispute not opened", error instanceof Error ? error.message : "Please try again.");
    } finally { setBusy(""); }
  };

  const saveDestination = async () => {
    if (!selectedBank || !/^\d{10}$/.test(accountNumber)) {
      Alert.alert("Check account details", "Choose a Nigerian bank and enter a 10-digit account number."); return;
    }
    try {
      setBusy("destination");
      await savePayoutDestination(session.access, accountNumber, selectedBank.code, selectedBank.name);
      setAccountNumber("");
      Alert.alert("Payout account verified", "SabiWay stores only the Paystack recipient token and final four account digits.");
      await load();
    } catch (error) {
      Alert.alert("Account not verified", error instanceof Error ? error.message : "Please try again.");
    } finally { setBusy(""); }
  };

  if (loading) return <View style={styles.center}><Text style={styles.muted}>Loading SabiPay…</Text></View>;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { width: contentWidth }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />} keyboardShouldPersistTaps="handled">
      <View style={styles.hero}><Text style={styles.eyebrow}>SABIPAY · NIGERIA PILOT</Text><Text style={styles.title}>Pay safely, recover clearly and freeze funds when something goes wrong.</Text><Text style={styles.subtitle}>Backend-confirmed status, duplicate-payment protection, reconciliation, refunds and dispute freezing are part of the same transaction journey.</Text><Pressable onPress={onBackToMarketplace} style={styles.back}><Text style={styles.backText}>Back to Marketplace</Text></Pressable></View>

      {session.user.role === "client" && readyBookings.length > 0 ? <View style={styles.section}><Text style={styles.sectionTitle}>Ready to fund</Text>{readyBookings.map((booking) => {
        const tx = transactionByBooking.get(booking.id); const amount = Number(booking.agreed_price); const fee = amount * 0.10;
        return <View key={booking.id} style={styles.card}><Text style={styles.small}>{booking.professional.full_name}</Text><Text style={styles.cardTitle}>{booking.scope_summary}</Text><View style={styles.moneyRow}><Text style={styles.money}>Service ₦{formatMoney(amount)}</Text><Text style={styles.money}>Fee ₦{formatMoney(fee)}</Text><Text style={styles.money}>Provider ₦{formatMoney(amount - fee)}</Text></View>{tx?.latest_attempt?.authorization_url && tx.state === "pending_payment" ? <View style={styles.actions}><Pressable onPress={() => void Linking.openURL(tx.latest_attempt!.authorization_url)} style={styles.amberButton}><Text style={styles.amberText}>Continue checkout</Text></Pressable><Pressable disabled={busy === `refresh-${tx.id}`} onPress={() => void refreshStatus(tx)} style={styles.secondaryButton}><Text style={styles.secondaryText}>Check status</Text></Pressable></View> : tx ? <Text style={styles.good}>SabiPay: {stateLabel(tx.state)}</Text> : <Pressable disabled={busy === `pay-${booking.id}`} onPress={() => void startCheckout(booking)} style={styles.amberButton}><Text style={styles.amberText}>Pay with SabiPay</Text></Pressable>}</View>;
      })}</View> : null}

      <View style={styles.section}><Text style={styles.sectionTitle}>Transaction history</Text>{transactions.length === 0 ? <View style={styles.empty}><Text style={styles.cardTitle}>No SabiPay activity yet</Text><Text style={styles.muted}>Accepted NGN bookings appear here when payment starts.</Text></View> : transactions.map((tx) => {
        const client = tx.client.user_id === session.user.id; const provider = tx.professional.user_id === session.user.id;
        const activeDispute = tx.disputes.find((item) => item.status === "open" || item.status === "under_review");
        const canDispute = ["funded", "in_progress", "delivered"].includes(tx.state) && !activeDispute;
        return <View key={tx.id} style={styles.card}><View style={styles.rowBetween}><Text style={styles.small}>{tx.receipt_number}</Text><Text style={styles.badge}>{stateLabel(tx.state)}</Text></View><Text style={styles.cardTitle}>{tx.scope_summary}</Text><View style={styles.moneyRow}><Text style={styles.money}>Paid ₦{formatMoney(tx.amount)}</Text><Text style={styles.money}>Fee ₦{formatMoney(tx.commission_amount)}</Text><Text style={styles.money}>Provider ₦{formatMoney(tx.provider_amount)}</Text></View><Text style={styles.muted}>Payment: {stateLabel(tx.payment_status)} · Reconciliation: {stateLabel(tx.reconciliation_status)}</Text>{tx.last_payment_error ? <Text style={styles.warning}>{tx.last_payment_error}</Text> : null}{tx.state === "delivered" ? <Text style={styles.warning}>{Math.max(0, Math.ceil(tx.freeze_seconds_remaining / 86400))} day(s) to automatic release</Text> : null}{tx.payout ? <Text style={styles.muted}>Payout: {stateLabel(tx.payout.status)} · {tx.payout.destination_label}</Text> : null}{activeDispute ? <View style={styles.disputeNotice}><Text style={styles.disputeNoticeTitle}>Dispute {stateLabel(activeDispute.status)}</Text><Text style={styles.disputeNoticeText}>Funds are frozen while SabiWay reviews this transaction.</Text></View> : null}<View style={styles.actions}>{tx.state === "pending_payment" ? <Pressable disabled={busy === `refresh-${tx.id}`} onPress={() => void refreshStatus(tx)} style={styles.secondaryButton}><Text style={styles.secondaryText}>Check payment status</Text></Pressable> : null}{tx.state === "funded" && provider ? <Pressable disabled={busy === `start-service-${tx.id}`} onPress={() => void action(tx, "start-service")} style={styles.greenButton}><Text style={styles.greenText}>Start service</Text></Pressable> : null}{tx.state === "in_progress" && provider ? <Pressable disabled={busy === `mark-delivered-${tx.id}`} onPress={() => void action(tx, "mark-delivered")} style={styles.greenButton}><Text style={styles.greenText}>Mark delivered</Text></Pressable> : null}{tx.state === "delivered" && client ? <Pressable disabled={busy === `confirm-satisfaction-${tx.id}`} onPress={() => void action(tx, "confirm-satisfaction")} style={styles.amberButton}><Text style={styles.amberText}>Confirm & release</Text></Pressable> : null}{canDispute ? <Pressable onPress={() => { setDisputeTxId(disputeTxId === tx.id ? null : tx.id); setDisputeDetails(""); }} style={styles.dangerButton}><Text style={styles.dangerText}>Report transaction problem</Text></Pressable> : null}</View>{disputeTxId === tx.id ? <View style={styles.disputeForm}><Text style={styles.disputeTitle}>Open a dispute</Text><Text style={styles.muted}>Choose the closest reason. Opening the dispute freezes release while it is reviewed.</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.reasonRow}>{[
          ["service_not_provided", "Not provided"],
          ["service_not_as_agreed", "Not as agreed"],
          ["payment_problem", "Payment"],
          ["safety_concern", "Safety"],
          ["duplicate_charge", "Duplicate charge"],
          ["other", "Other"],
        ].map(([value, text]) => <Pressable key={value} onPress={() => setDisputeReason(value)} style={[styles.reasonChip, disputeReason === value && styles.reasonChipActive]}><Text style={[styles.reasonText, disputeReason === value && styles.reasonTextActive]}>{text}</Text></Pressable>)}</ScrollView><TextInput value={disputeDetails} onChangeText={setDisputeDetails} multiline placeholder="Explain what happened and what you need reviewed." placeholderTextColor={colors.muted} style={[styles.input, styles.disputeInput]}/><View style={styles.actions}><Pressable onPress={() => setDisputeTxId(null)} style={styles.secondaryButton}><Text style={styles.secondaryText}>Cancel</Text></Pressable><Pressable disabled={busy === `dispute-${tx.id}`} onPress={() => void submitDispute(tx)} style={styles.dangerFilledButton}><Text style={styles.dangerFilledText}>Open dispute</Text></Pressable></View></View> : null}</View>;
      })}</View>

      {session.user.role === "professional" ? <View style={styles.section}><Text style={styles.sectionTitle}>Payout destination</Text>{destinations[0] ? <View style={styles.card}><Text style={styles.cardTitle}>{destinations[0].account_name}</Text><Text style={styles.muted}>{destinations[0].bank_name || destinations[0].bank_code} · ••••{destinations[0].account_last4}</Text><Text style={styles.good}>Verified with Paystack</Text></View> : <Text style={styles.muted}>Add a Nigerian bank account before SabiPay can release funds.</Text>}<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bankRow}>{banks.slice(0, 30).map((bank) => <Pressable key={`${bank.code}-${bank.name}`} onPress={() => setSelectedBank(bank)} style={[styles.bankChip, selectedBank?.code === bank.code && styles.bankChipActive]}><Text style={[styles.bankText, selectedBank?.code === bank.code && styles.bankTextActive]}>{bank.name}</Text></Pressable>)}</ScrollView><TextInput value={accountNumber} onChangeText={setAccountNumber} keyboardType="number-pad" maxLength={10} placeholder="10-digit account number" placeholderTextColor={colors.muted} style={styles.input}/><Pressable disabled={busy === "destination"} onPress={() => void saveDestination()} style={styles.greenButton}><Text style={styles.greenText}>{destinations[0] ? "Replace payout account" : "Verify payout account"}</Text></Pressable></View> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F7FAF8" }, content: { alignSelf: "center", paddingVertical: 12, gap: 14 }, center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F7FAF8" },
  hero: { backgroundColor: "#073522", borderRadius: 22, padding: 18, gap: 8 }, eyebrow: { color: "#8DD1B3", fontWeight: "900", fontSize: 11, letterSpacing: 1.4 }, title: { color: "#FFFFFF", fontWeight: "900", fontSize: 24, lineHeight: 29 }, subtitle: { color: "#D7EADF", lineHeight: 20 }, back: { alignSelf: "flex-start", marginTop: 4, borderWidth: 1, borderColor: "#618775", borderRadius: 10, paddingHorizontal: 11, paddingVertical: 8 }, backText: { color: "#FFFFFF", fontWeight: "800", fontSize: 12 },
  section: { gap: 10 }, sectionTitle: { color: "#173126", fontSize: 21, fontWeight: "900" }, card: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DCE7E1", borderRadius: 18, padding: 15, gap: 8 }, empty: { borderWidth: 1, borderStyle: "dashed", borderColor: "#BCD0C4", backgroundColor: "#FFFFFF", borderRadius: 18, padding: 24, alignItems: "center", gap: 4 },
  cardTitle: { color: "#173126", fontWeight: "900", fontSize: 17 }, small: { color: "#6C7A72", fontSize: 11, fontWeight: "700" }, muted: { color: "#66756D", lineHeight: 19 }, good: { color: colors.brand, fontWeight: "800" }, warning: { color: "#7A5A00", fontWeight: "800" }, rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }, badge: { textTransform: "capitalize", color: colors.brand, backgroundColor: "#EAF8F1", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, fontWeight: "800", fontSize: 11 }, moneyRow: { flexDirection: "row", flexWrap: "wrap", gap: 7, backgroundColor: "#F4F8F6", borderRadius: 12, padding: 10 }, money: { color: "#173126", fontWeight: "800", fontSize: 11 }, actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  greenButton: { alignSelf: "flex-start", backgroundColor: colors.brand, borderRadius: 11, paddingHorizontal: 14, paddingVertical: 10 }, greenText: { color: "#FFFFFF", fontWeight: "900" }, amberButton: { alignSelf: "flex-start", backgroundColor: "#FFB800", borderRadius: 11, paddingHorizontal: 14, paddingVertical: 10 }, amberText: { color: "#173126", fontWeight: "900" }, secondaryButton: { alignSelf: "flex-start", borderWidth: 1, borderColor: "#C9D8D0", backgroundColor: "#FFFFFF", borderRadius: 11, paddingHorizontal: 14, paddingVertical: 10 }, secondaryText: { color: "#173126", fontWeight: "900" }, dangerButton: { alignSelf: "flex-start", borderWidth: 1, borderColor: "#E8B9BD", backgroundColor: "#FFF9F9", borderRadius: 11, paddingHorizontal: 14, paddingVertical: 10 }, dangerText: { color: "#A5222B", fontWeight: "900" }, dangerFilledButton: { alignSelf: "flex-start", backgroundColor: "#A5222B", borderRadius: 11, paddingHorizontal: 14, paddingVertical: 10 }, dangerFilledText: { color: "#FFFFFF", fontWeight: "900" },
  disputeNotice: { borderWidth: 1, borderColor: "#F0C8CB", backgroundColor: "#FFF4F4", borderRadius: 11, padding: 10, gap: 3 }, disputeNoticeTitle: { color: "#9B1E27", fontWeight: "900", textTransform: "capitalize" }, disputeNoticeText: { color: "#7B4549", fontSize: 11, lineHeight: 17 }, disputeForm: { borderWidth: 1, borderColor: "#F0C8CB", backgroundColor: "#FFF9F9", borderRadius: 13, padding: 11, gap: 9 }, disputeTitle: { color: "#8D1E26", fontWeight: "900", fontSize: 15 }, disputeInput: { minHeight: 90, textAlignVertical: "top", paddingTop: 10 }, reasonRow: { gap: 6, paddingVertical: 2 }, reasonChip: { borderWidth: 1, borderColor: "#E1CCCC", backgroundColor: "#FFFFFF", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 }, reasonChipActive: { backgroundColor: "#A5222B", borderColor: "#A5222B" }, reasonText: { color: "#6F5355", fontWeight: "800", fontSize: 10 }, reasonTextActive: { color: "#FFFFFF" },
  bankRow: { gap: 7, paddingVertical: 4 }, bankChip: { borderWidth: 1, borderColor: "#D5E1DA", backgroundColor: "#FFFFFF", borderRadius: 999, paddingHorizontal: 11, paddingVertical: 8 }, bankChipActive: { backgroundColor: colors.brand, borderColor: colors.brand }, bankText: { color: "#52635A", fontSize: 11, fontWeight: "800" }, bankTextActive: { color: "#FFFFFF" }, input: { minHeight: 48, borderWidth: 1, borderColor: "#D9E4DD", borderRadius: 12, paddingHorizontal: 14, backgroundColor: "#FFFFFF", color: "#173126" },
});
