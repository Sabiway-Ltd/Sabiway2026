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
  const [started, setStarted] = useState(false);
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
    try {
      const next = await getVerification(session.access);
      setSubmission(next);
      if (next.status !== "not_submitted") setStarted(true);
    } catch (error) { Alert.alert("Could not load verification", error instanceof Error ? error.message : "Please try again."); }
    finally { setLoading(false); }
  }, [session.access]);

  useEffect(() => { void load(); }, [load]);

  const pick = async (setter: (file: VerificationFile) => void) => {
    const result = await DocumentPicker.getDocumentAsync({ type: ["image/jpeg", "image/png", "image/webp", "application/pdf"], copyToCacheDirectory: true, multiple: false });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (asset.size && asset.size > MAX_FILE) return Alert.alert("File too large", "Verification documents must be 10 MB or smaller.");
    setter({ uri: asset.uri, name: asset.name, type: asset.mimeType || "application/octet-stream" });
  };

  const photographIdentity = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return Alert.alert("Camera permission required", "Allow camera access to photograph your government ID.");
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.9 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > MAX_FILE) return Alert.alert("Photo too large", "Verification documents must be 10 MB or smaller.");
    setIdentityFile({ uri: asset.uri, name: asset.fileName || `identity-${Date.now()}.jpg`, type: asset.mimeType || "image/jpeg" });
  };

  const submit = async () => {
    if (!identityFile) return Alert.alert("Government ID required", "Choose a file or photograph your government-issued ID.");
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

  if (!started && submission.status === "not_submitted") {
    return <View style={styles.introScreen}>
      <View style={styles.introTop}><Pressable onPress={onBackToMarketplace} style={styles.introBack}><Text style={styles.introBackText}>←</Text></Pressable><Pressable style={styles.supportPill}><Text style={styles.supportText}>Support ◉</Text></Pressable></View>
      <View style={styles.introContent}>
        <Text style={styles.introTitle}>Verify Identity</Text>
        <Text style={styles.introCopy}>Build trust with clients by verifying who you are before accepting marketplace bookings.</Text>
        <View style={styles.scanMark}><View style={styles.scanCornerTop}><Text style={styles.scanIcon}>◉</Text></View><View style={styles.scanCheck}><Text style={styles.scanCheckText}>✓</Text></View></View>
        <View style={styles.introStep}><Text style={styles.stepIcon}>▣</Text><View style={{ flex: 1 }}><Text style={styles.stepTitle}>Take a picture of a valid ID</Text><Text style={styles.stepCopy}>Passport, national ID or driving licence supported.</Text></View></View>
        <View style={styles.introStep}><Text style={styles.stepIcon}>◉</Text><View style={{ flex: 1 }}><Text style={styles.stepTitle}>Take a selfie of yourself</Text><Text style={styles.stepCopy}>The current V2 flow uses your submitted ID and manual review; selfie matching remains subject to approved product scope.</Text></View></View>
      </View>
      <View style={styles.introFooter}><Pressable onPress={() => setStarted(true)} style={styles.primary}><Text style={styles.primaryText}>Get Started</Text></Pressable><Pressable onPress={onBackToMarketplace} style={styles.skipButton}><Text style={styles.skipText}>Skip</Text></Pressable></View>
    </View>;
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.hero}>
        <View style={styles.heroRow}><Pressable onPress={onBackToMarketplace} style={styles.heroBack}><Text style={styles.heroBackText}>←</Text></Pressable><Text style={styles.heroTitle}>Verify Identity</Text><View style={{ width: 38 }} /></View>
        <View style={styles.progress}><View style={[styles.dot, styles.dotActive]} /><View style={[styles.dot, submission.status !== "not_submitted" && styles.dotActive]} /><View style={[styles.dot, approved && styles.dotActive]} /></View>
      </View>

      <View style={styles.statusCard}><Text style={styles.statusLabel}>Current status</Text><Text style={styles.statusValue}>{labels[submission.status] || submission.status}</Text></View>

      {approved ? <View style={styles.card}><Text style={styles.success}>✓ Verification approved</Text><Text style={styles.help}>Your verified status can now appear across SabiWay.</Text><Pressable onPress={onBackToMarketplace} style={styles.primary}><Text style={styles.primaryText}>Go to marketplace</Text></Pressable></View> : waiting ? <View style={styles.card}><Text style={styles.title}>Manual review in progress</Text><Text style={styles.help}>Your documents are secure and under review. No verified badge is granted until approval.</Text>{submission.sla_due_at ? <Text style={styles.sla}>Review target: {new Date(submission.sla_due_at).toLocaleString()}</Text> : null}</View> : <View style={styles.card}>
        <Text style={styles.title}>{resubmit ? "Update your evidence" : "Identity details"}</Text>
        {submission.more_info_request ? <Text style={styles.warning}>More information requested: {submission.more_info_request}</Text> : null}
        {submission.decision_reason ? <Text style={styles.warning}>Decision reason: {submission.decision_reason}</Text> : null}
        <Text style={styles.label}>Government ID type</Text><View style={styles.row}>{["passport", "national_id", "drivers_licence", "other"].map((value) => <Pressable key={value} onPress={() => setIdentityType(value)} style={[styles.pill, identityType === value && styles.pillActive]}><Text style={[styles.pillText, identityType === value && styles.pillTextActive]}>{value.replaceAll("_", " ")}</Text></Pressable>)}</View>
        <Text style={styles.label}>Government ID document</Text><View style={styles.row}><Pressable onPress={() => void pick(setIdentityFile)} style={styles.secondary}><Text style={styles.secondaryText}>Choose file</Text></Pressable><Pressable onPress={photographIdentity} style={styles.secondary}><Text style={styles.secondaryText}>Use camera</Text></Pressable></View>{identityFile ? <Text style={styles.file}>✓ {identityFile.name}</Text> : null}
        <Text style={styles.label}>Skill or experience summary</Text><TextInput multiline value={credentialSummary} onChangeText={setCredentialSummary} placeholder="Qualifications or experience relevant to your services" placeholderTextColor="#8A8A8A" style={[styles.input, styles.multiline]} />
        <Text style={styles.label}>Credential evidence</Text><Pressable onPress={() => void pick(setCredentialFile)} style={styles.secondary}><Text style={styles.secondaryText}>Choose credential file</Text></Pressable>{credentialFile ? <Text style={styles.file}>✓ {credentialFile.name}</Text> : null}
        <View style={styles.optional}><Text style={styles.optionalTitle}>Address evidence is optional</Text><Text style={styles.help}>Mandatory address verification is not enabled until product policy is approved.</Text><TextInput value={addressLine} onChangeText={setAddressLine} placeholder="Address line" placeholderTextColor="#8A8A8A" style={styles.input}/><View style={styles.row}><TextInput value={city} onChangeText={setCity} placeholder="City" placeholderTextColor="#8A8A8A" style={[styles.input, styles.flexInput]}/><TextInput value={state} onChangeText={setState} placeholder="State" placeholderTextColor="#8A8A8A" style={[styles.input, styles.flexInput]}/></View><TextInput value={country} onChangeText={setCountry} placeholder="Country" placeholderTextColor="#8A8A8A" style={styles.input}/><Pressable onPress={() => void pick(setAddressFile)} style={styles.secondary}><Text style={styles.secondaryText}>Choose address evidence</Text></Pressable>{addressFile ? <Text style={styles.file}>✓ {addressFile.name}</Text> : null}</View>
        <Pressable disabled={sending} onPress={submit} style={[styles.primary, sending && styles.disabled]}><Text style={styles.primaryText}>{sending ? "Uploading securely…" : resubmit ? "Resubmit evidence" : "Submit for review"}</Text></Pressable>
      </View>}

      <View style={styles.card}><Text style={styles.title}>Submitted evidence</Text>{submission.documents?.length ? submission.documents.map((doc) => <View key={doc.id} style={styles.doc}><Text style={styles.docName}>{doc.filename}</Text><Text style={styles.help}>{doc.kind} · version {doc.submission_version}</Text></View>) : <Text style={styles.help}>No evidence uploaded yet.</Text>}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  introScreen: { flex: 1, backgroundColor: "#F7F7F7", padding: 18, justifyContent: "space-between" },
  introTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  introBack: { width: 40, height: 40, justifyContent: "center" }, introBackText: { fontSize: 24, color: "#222222" },
  supportPill: { backgroundColor: "#222222", borderRadius: 16, paddingHorizontal: 11, paddingVertical: 7 }, supportText: { color: "#FFFFFF", fontSize: 9, fontWeight: "800" },
  introContent: { gap: 16 }, introTitle: { color: "#202020", fontSize: 25, fontWeight: "900" }, introCopy: { color: "#6F6F6F", fontSize: 11, lineHeight: 18 },
  scanMark: { width: 150, height: 150, alignSelf: "center", alignItems: "center", justifyContent: "center", marginVertical: 8 }, scanCornerTop: { width: 116, height: 116, borderWidth: 3, borderColor: "#232323", borderRadius: 20, alignItems: "center", justifyContent: "center" }, scanIcon: { color: "#232323", fontSize: 54 }, scanCheck: { position: "absolute", bottom: 3, width: 48, height: 48, borderRadius: 24, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center", borderWidth: 4, borderColor: "#F7F7F7" }, scanCheckText: { color: "#FFFFFF", fontSize: 25, fontWeight: "900" },
  introStep: { flexDirection: "row", gap: 11, alignItems: "flex-start" }, stepIcon: { color: colors.brand, fontSize: 20, width: 24 }, stepTitle: { color: colors.brand, fontSize: 12, fontWeight: "900" }, stepCopy: { color: "#777777", fontSize: 9, lineHeight: 15, marginTop: 3 },
  introFooter: { gap: 8 }, skipButton: { minHeight: 42, alignItems: "center", justifyContent: "center" }, skipText: { color: "#555555", fontWeight: "800", fontSize: 11 },
  screen: { flex: 1, backgroundColor: "#F7F7F7" }, content: { width: "100%", maxWidth: 820, alignSelf: "center", gap: 12, paddingBottom: 40 }, center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#F7F7F7", gap: 12 },
  hero: { backgroundColor: colors.brand, paddingHorizontal: 16, paddingTop: 15, paddingBottom: 20, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 }, heroRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, heroBack: { width: 38, height: 38, alignItems: "center", justifyContent: "center" }, heroBackText: { color: "#FFFFFF", fontSize: 22 }, heroTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" },
  progress: { flexDirection: "row", justifyContent: "center", gap: 9, marginTop: 12 }, dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: "rgba(255,255,255,.35)" }, dotActive: { backgroundColor: "#FFFFFF" },
  statusCard: { marginHorizontal: 12, marginTop: 4, backgroundColor: "#FFFFFF", borderRadius: 11, padding: 12, borderWidth: 1, borderColor: "#E6E6E6" }, statusLabel: { color: "#8A8A8A", fontSize: 9, fontWeight: "800" }, statusValue: { color: colors.brand, fontSize: 15, fontWeight: "900", marginTop: 2 },
  card: { marginHorizontal: 12, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E6E6E6", borderRadius: 12, padding: 15, gap: 10 }, title: { color: "#222222", fontSize: 17, fontWeight: "900" }, help: { color: "#777777", lineHeight: 17, fontSize: 10 }, success: { color: colors.brand, fontSize: 19, fontWeight: "900" }, warning: { backgroundColor: "#FFF5D8", color: "#5C4810", borderRadius: 8, padding: 10, lineHeight: 16, fontSize: 10 }, sla: { backgroundColor: "#F2F7F4", color: "#365044", borderRadius: 8, padding: 10, fontWeight: "700", fontSize: 10 },
  label: { color: "#555555", fontSize: 10, fontWeight: "900", marginTop: 3 }, input: { minHeight: 46, borderWidth: 1, borderColor: "#E1E1E1", borderRadius: 7, paddingHorizontal: 11, color: "#222222", backgroundColor: "#FAFAFA" }, multiline: { minHeight: 92, paddingTop: 11, textAlignVertical: "top" }, row: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, flexInput: { flex: 1 }, pill: { borderWidth: 1, borderColor: "#D8D8D8", borderRadius: 18, paddingHorizontal: 11, paddingVertical: 8 }, pillActive: { backgroundColor: "#E2F6EC", borderColor: colors.brand }, pillText: { color: "#676767", fontSize: 9, fontWeight: "800", textTransform: "capitalize" }, pillTextActive: { color: colors.brand },
  primary: { minHeight: 46, alignItems: "center", justifyContent: "center", backgroundColor: colors.brand, borderRadius: 7, paddingHorizontal: 15 }, primaryText: { color: "#FFFFFF", fontWeight: "900" }, secondary: { minHeight: 42, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#D7D7D7", borderRadius: 7, paddingHorizontal: 12, backgroundColor: "#FFFFFF" }, secondaryText: { color: colors.brand, fontWeight: "800", fontSize: 10 }, file: { color: colors.brand, fontSize: 10, fontWeight: "800" }, optional: { backgroundColor: "#F7F9F8", borderRadius: 10, padding: 11, gap: 8 }, optionalTitle: { color: "#333333", fontWeight: "900", fontSize: 11 }, doc: { backgroundColor: "#F7F7F7", borderRadius: 8, padding: 9 }, docName: { color: "#333333", fontWeight: "800", fontSize: 10 }, disabled: { opacity: 0.6 },
});
