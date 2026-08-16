import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

import type { AuthSession } from "../auth/types";
import { colors } from "../design/tokens";
import { getVerification, submitVerification } from "./api";
import type { VerificationFile, VerificationSubmission } from "./types";

type Props = { session: AuthSession; onBackToMarketplace: () => void };
const MAX_FILE = 10 * 1024 * 1024;
const labels: Record<string, string> = { not_submitted: "Not submitted", submitted: "Submitted", in_review: "In review", approved: "Approved", rejected: "Rejected", more_info: "More information needed" };

export function VerificationScreen({ session, onBackToMarketplace }: Props) {
  const [submission, setSubmission] = useState<VerificationSubmission>({ status: "not_submitted" });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [identityType, setIdentityType] = useState("passport");
  const [credentialSummary, setCredentialSummary] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [identityFile, setIdentityFile] = useState<VerificationFile | null>(null);
  const [credentialFile, setCredentialFile] = useState<VerificationFile | null>(null);
  const [addressFile, setAddressFile] = useState<VerificationFile | null>(null);

  const load = useCallback(async () => {
    try { setSubmission(await getVerification(session.access)); }
    catch (error) { Alert.alert("Could not load verification", error instanceof Error ? error.message : "Please try again."); }
    finally { setLoading(false); }
  }, [session.access]);

  useEffect(() => { load(); }, [load]);

  const pick = async (setter: (file: VerificationFile) => void) => {
    const result = await DocumentPicker.getDocumentAsync({ type: ["image/jpeg", "image/png", "image/webp", "application/pdf"], copyToCacheDirectory: true, multiple: false });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (asset.size && asset.size > MAX_FILE) { Alert.alert("File too large", "Verification documents must be 10 MB or smaller."); return; }
    setter({ uri: asset.uri, name: asset.name, type: asset.mimeType || "application/octet-stream" });
  };

  const photographIdentity = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) { Alert.alert("Camera permission required", "Allow camera access to photograph your government ID."); return; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.9 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > MAX_FILE) { Alert.alert("Photo too large", "Verification documents must be 10 MB or smaller."); return; }
    setIdentityFile({ uri: asset.uri, name: asset.fileName || `identity-${Date.now()}.jpg`, type: asset.mimeType || "image/jpeg" });
  };

  const submit = async () => {
    if (!identityFile) { Alert.alert("Government ID required", "Choose a file or photograph your government-issued ID."); return; }
    setSending(true);
    try {
      const next = await submitVerification(session.access, { identityType, credentialSummary, addressLine, city, state, country }, { identity: identityFile, credential: credentialFile, address: addressFile }, ["rejected", "more_info"].includes(submission.status));
      setSubmission(next); setIdentityFile(null); setCredentialFile(null); setAddressFile(null);
      Alert.alert("Submitted", "Your verification evidence is now in the manual review queue.");
    } catch (error) { Alert.alert("Submission failed", error instanceof Error ? error.message : "Please try again."); }
    finally { setSending(false); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.brand} /></View>;
  if (session.user.role !== "professional") return <View style={styles.center}><Text style={styles.title}>Professional verification</Text><Text style={styles.help}>Verification is only required for professional profiles.</Text><Pressable onPress={onBackToMarketplace} style={styles.primary}><Text style={styles.primaryText}>Back to marketplace</Text></Pressable></View>;

  const approved = submission.status === "approved";
  const waiting = ["submitted", "in_review"].includes(submission.status);
  const resubmit = ["rejected", "more_info"].includes(submission.status);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.hero}><Text style={styles.eyebrow}>PROVIDER TRUST</Text><Text style={styles.heroTitle}>Professional verification</Text><Text style={styles.heroText}>Only manually approved professionals receive the verified badge and can receive marketplace bookings.</Text><View style={styles.status}><Text style={styles.statusLabel}>Current status</Text><Text style={styles.statusValue}>{labels[submission.status] || submission.status}</Text></View></View>
      {approved ? <View style={styles.card}><Text style={styles.success}>✓ Verification approved</Text><Text style={styles.help}>Your verification status can now appear across SabiWay. Changes to verified information may require another review.</Text><Pressable onPress={onBackToMarketplace} style={styles.primary}><Text style={styles.primaryText}>Go to marketplace</Text></Pressable></View> : waiting ? <View style={styles.card}><Text style={styles.title}>Manual review in progress</Text><Text style={styles.help}>You can return here at any time to track the decision. No verified badge or booking eligibility is granted before approval.</Text>{submission.sla_due_at ? <Text style={styles.sla}>Internal review target: {new Date(submission.sla_due_at).toLocaleString()}</Text> : null}</View> : <View style={styles.card}>
        <Text style={styles.title}>{resubmit ? "Update your evidence" : "Submit for verification"}</Text>
        {submission.more_info_request ? <Text style={styles.warning}>More information requested: {submission.more_info_request}</Text> : null}
        {submission.decision_reason ? <Text style={styles.warning}>Decision reason: {submission.decision_reason}</Text> : null}
        <Text style={styles.label}>Government ID type</Text><View style={styles.row}>{["passport", "national_id", "drivers_licence", "other"].map((value) => <Pressable key={value} onPress={() => setIdentityType(value)} style={[styles.pill, identityType === value && styles.pillActive]} accessibilityRole="button"><Text style={[styles.pillText, identityType === value && styles.pillTextActive]}>{value.replaceAll("_", " ")}</Text></Pressable>)}</View>
        <Text style={styles.label}>Government ID document</Text><View style={styles.row}><Pressable onPress={() => pick(setIdentityFile)} style={styles.secondary}><Text style={styles.secondaryText}>Choose file</Text></Pressable><Pressable onPress={photographIdentity} style={styles.secondary}><Text style={styles.secondaryText}>Use camera</Text></Pressable></View>{identityFile ? <Text style={styles.file}>{identityFile.name}</Text> : null}
        <Text style={styles.label}>Skill or experience summary</Text><TextInput multiline value={credentialSummary} onChangeText={setCredentialSummary} placeholder="Qualifications or experience relevant to your services" placeholderTextColor="#748078" style={[styles.input, styles.multiline]} />
        <Text style={styles.label}>Credential / experience evidence (where applicable)</Text><Pressable onPress={() => pick(setCredentialFile)} style={styles.secondary}><Text style={styles.secondaryText}>Choose credential file</Text></Pressable>{credentialFile ? <Text style={styles.file}>{credentialFile.name}</Text> : null}
        <View style={styles.optional}><Text style={styles.optionalTitle}>Address evidence is currently optional</Text><Text style={styles.help}>The product specification leaves mandatory address verification subject to owner confirmation.</Text><TextInput value={addressLine} onChangeText={setAddressLine} placeholder="Address line" placeholderTextColor="#748078" style={styles.input}/><TextInput value={city} onChangeText={setCity} placeholder="City" placeholderTextColor="#748078" style={styles.input}/><TextInput value={state} onChangeText={setState} placeholder="State / region" placeholderTextColor="#748078" style={styles.input}/><TextInput value={country} onChangeText={setCountry} placeholder="Country" placeholderTextColor="#748078" style={styles.input}/><Pressable onPress={() => pick(setAddressFile)} style={styles.secondary}><Text style={styles.secondaryText}>Choose address evidence</Text></Pressable>{addressFile ? <Text style={styles.file}>{addressFile.name}</Text> : null}</View>
        <Pressable disabled={sending} onPress={submit} style={[styles.primary, sending && { opacity: 0.6 }]}><Text style={styles.primaryText}>{sending ? "Uploading securely…" : resubmit ? "Resubmit evidence" : "Submit for manual review"}</Text></Pressable>
      </View>}
      <View style={styles.card}><Text style={styles.title}>Submitted evidence</Text>{submission.documents?.length ? submission.documents.map((doc) => <View key={doc.id} style={styles.doc}><Text style={styles.docName}>{doc.filename}</Text><Text style={styles.help}>{doc.kind} · version {doc.submission_version}</Text></View>) : <Text style={styles.help}>No evidence uploaded yet.</Text>}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F7FAF8" }, content: { width: "100%", maxWidth: 820, alignSelf: "center", padding: 12, gap: 12, paddingBottom: 40 }, center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#F7FAF8", gap: 12 },
  hero: { backgroundColor: "#073522", borderRadius: 22, padding: 20 }, eyebrow: { color: "#9DD9BD", fontSize: 10, fontWeight: "900", letterSpacing: 1.3 }, heroTitle: { color: "#FFF", fontSize: 28, fontWeight: "900", marginTop: 5 }, heroText: { color: "#C7D8CF", lineHeight: 21, marginTop: 7 }, status: { backgroundColor: "#FFFFFF18", borderRadius: 14, padding: 12, marginTop: 16 }, statusLabel: { color: "#B9CDC3", fontSize: 10, fontWeight: "800", textTransform: "uppercase" }, statusValue: { color: "#FFF", fontSize: 18, fontWeight: "900", marginTop: 3 },
  card: { backgroundColor: "#FFF", borderWidth: 1, borderColor: "#DCE8E1", borderRadius: 20, padding: 16, gap: 11 }, title: { color: "#173126", fontSize: 20, fontWeight: "900" }, help: { color: "#68776F", lineHeight: 20 }, success: { color: colors.brand, fontSize: 22, fontWeight: "900" }, warning: { backgroundColor: "#FFF5D8", color: "#5C4810", borderRadius: 12, padding: 12, lineHeight: 19 }, sla: { backgroundColor: "#F2F7F4", color: "#365044", borderRadius: 12, padding: 12, fontWeight: "700" },
  label: { color: "#31483B", fontSize: 12, fontWeight: "900", marginTop: 3 }, input: { minHeight: 44, borderWidth: 1, borderColor: "#D5E2DA", borderRadius: 12, paddingHorizontal: 12, color: "#173126", backgroundColor: "#FFF" }, multiline: { minHeight: 100, paddingTop: 12, textAlignVertical: "top" }, row: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, pill: { borderWidth: 1, borderColor: "#CBDAD2", borderRadius: 999, paddingHorizontal: 11, paddingVertical: 8 }, pillActive: { backgroundColor: colors.brand, borderColor: colors.brand }, pillText: { color: "#40564A", fontSize: 11, fontWeight: "800", textTransform: "capitalize" }, pillTextActive: { color: "#FFF" },
  primary: { minHeight: 46, alignItems: "center", justifyContent: "center", backgroundColor: colors.brand, borderRadius: 12, paddingHorizontal: 15 }, primaryText: { color: "#FFF", fontWeight: "900" }, secondary: { minHeight: 42, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#BFD3C8", borderRadius: 11, paddingHorizontal: 13, backgroundColor: "#FFF" }, secondaryText: { color: "#214535", fontWeight: "800", fontSize: 12 }, file: { color: colors.brand, fontSize: 12, fontWeight: "800" }, optional: { backgroundColor: "#F6FAF8", borderRadius: 16, padding: 13, gap: 9 }, optionalTitle: { color: "#173126", fontWeight: "900" }, doc: { backgroundColor: "#F5F9F7", borderRadius: 12, padding: 11 }, docName: { color: "#173126", fontWeight: "800" },
});
