import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { AuthSession } from "../auth/types";
import { colors } from "../design/tokens";
import { getMyProfile, updateMyProfile } from "./api";
import type { Profile, ProfileUpdate } from "./types";

type Props = { session: AuthSession; onOpenVerification: () => void };

const EMPTY: ProfileUpdate = { full_name: "", username: "", phone_number: "", country: "", state: "", area: "", street: "", job: "", bio: "" };

export function ProfileScreen({ session, onOpenVerification }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<ProfileUpdate>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try {
      const next = await getMyProfile(session.access);
      setProfile(next);
      setForm({ full_name: next.full_name || "", username: next.username || "", phone_number: next.phone_number || "", country: next.country || "", state: next.state || "", area: next.area || "", street: next.street || "", job: next.job || "", bio: next.bio || "" });
    } catch (e) { setError(e instanceof Error ? e.message : "We could not load your profile."); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [session.access]);

  const dirty = useMemo(() => {
    if (!profile) return false;
    return form.full_name !== (profile.full_name || "") || form.username !== (profile.username || "") || form.phone_number !== (profile.phone_number || "") || form.country !== (profile.country || "") || form.state !== (profile.state || "") || form.area !== (profile.area || "") || form.street !== (profile.street || "") || form.job !== (profile.job || "") || form.bio !== (profile.bio || "");
  }, [form, profile]);

  const setField = (field: keyof ProfileUpdate, value: string) => { setForm((current) => ({ ...current, [field]: value })); setSuccess(""); };

  const save = async () => {
    if (!form.full_name.trim() || !form.username.trim()) return setError("Full name and username are required.");
    setSaving(true); setError(""); setSuccess("");
    try {
      const next = await updateMyProfile(session.access, { ...form, full_name: form.full_name.trim(), username: form.username.trim() });
      setProfile(next); setForm((current) => ({ ...current, full_name: next.full_name, username: next.username })); setSuccess("Profile updated.");
    } catch (e) { setError(e instanceof Error ? e.message : "We could not save your profile."); }
    finally { setSaving(false); }
  };

  if (loading) return <View style={styles.centerState}><ActivityIndicator color={colors.primary} /><Text style={styles.muted}>Loading your profile…</Text></View>;
  if (!profile) return <View style={styles.centerState}><Text style={styles.title}>Profile unavailable</Text><Text style={styles.muted}>{error || "We could not load your profile."}</Text><Pressable onPress={() => void load()} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Try again</Text></Pressable></View>;

  const professional = profile.role === "professional";

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View style={styles.heroTop}><Text style={styles.heroTitle}>Profile</Text><Text style={styles.heroMenu}>⋮</Text></View>
          <View style={styles.identityRow}>
            {profile.profile_picture ? <Image source={{ uri: profile.profile_picture }} style={styles.avatarImage} /> : <View style={styles.avatar}><Text style={styles.avatarText}>{profile.initials || "SW"}</Text></View>}
            <View style={styles.identityCopy}><View style={styles.nameRow}><Text style={styles.name}>{profile.full_name}</Text>{profile.is_verified ? <Text style={styles.verified}>✓</Text> : null}</View><Text style={styles.handle}>@{profile.username}</Text><Text style={styles.profession}>{profile.job || (professional ? "SabiWay professional" : "SabiWay client")}</Text></View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <Stat value={profile.posts_count} label="Posts" />
          <Stat value={profile.followers_count} label="Followers" />
          <Stat value={profile.following_count} label="Following" />
        </View>

        {professional ? <View style={styles.trustCard}><View style={styles.trustCopy}><Text style={styles.sectionEyebrow}>TRUST & REPUTATION</Text><Text style={styles.trustTitle}>{profile.is_verified ? "Verified Professional" : "Complete verification"}</Text><Text style={styles.muted}>{profile.is_verified ? "Your verified status is visible to clients across SabiWay." : `Current status: ${profile.verification_status.replaceAll("_", " ")}`}</Text></View>{!profile.is_verified ? <Pressable onPress={onOpenVerification} style={styles.verifyButton}><Text style={styles.verifyButtonText}>Verify Identity</Text></Pressable> : <View style={styles.verifiedPill}><Text style={styles.verifiedPillText}>Verified ✓</Text></View>}</View> : null}

        <View style={styles.profileCard}>
          <Text style={styles.sectionEyebrow}>ABOUT</Text>
          <Text style={styles.bioText}>{profile.bio || "Add a short description so people understand who you are and what you do."}</Text>
          <Text style={styles.locationText}>{[profile.area, profile.state, profile.country].filter(Boolean).join(", ") || "Location not added"}</Text>
        </View>

        <View style={styles.editCard}>
          <Text style={styles.sectionTitle}>Edit profile</Text>
          <Field label="Full name" value={form.full_name} onChangeText={(v) => setField("full_name", v)} autoCapitalize="words" />
          <Field label="Username" value={form.username} onChangeText={(v) => setField("username", v)} autoCapitalize="none" />
          <Field label="Phone number" value={form.phone_number} onChangeText={(v) => setField("phone_number", v)} keyboardType="phone-pad" />
          <Field label="Job / profession" value={form.job} onChangeText={(v) => setField("job", v)} />
          <Field label="Bio" value={form.bio} onChangeText={(v) => setField("bio", v)} multiline />
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.row}><Field compact label="Country" value={form.country} onChangeText={(v) => setField("country", v)} /><Field compact label="State" value={form.state} onChangeText={(v) => setField("state", v)} /></View>
          <View style={styles.row}><Field compact label="Area" value={form.area} onChangeText={(v) => setField("area", v)} /><Field compact label="Street" value={form.street} onChangeText={(v) => setField("street", v)} /></View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {success ? <Text style={styles.success}>{success}</Text> : null}
          <Pressable disabled={!dirty || saving} onPress={() => void save()} style={[styles.primaryButton, (!dirty || saving) && styles.disabled]}>{saving ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.primaryButtonText}>Save changes</Text>}</Pressable>
        </View>

        <Text style={styles.privacyNote}>Contact and precise location details remain private except where the product explicitly requires authorised access.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Stat({ value, label }: { value: number; label: string }) { return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }

type FieldProps = { label: string; value: string; onChangeText: (value: string) => void; multiline?: boolean; keyboardType?: "default" | "phone-pad"; autoCapitalize?: "none" | "sentences" | "words" | "characters"; compact?: boolean };
function Field({ label, value, onChangeText, multiline = false, keyboardType = "default", autoCapitalize = "sentences", compact = false }: FieldProps) {
  return <View style={[styles.field, compact && styles.fieldCompact]}><Text style={styles.label}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} multiline={multiline} keyboardType={keyboardType} autoCapitalize={autoCapitalize} style={[styles.input, multiline && styles.textarea]} placeholderTextColor={colors.textMuted} /></View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { paddingBottom: 40, gap: 12, maxWidth: 720, width: "100%", alignSelf: "center", backgroundColor: "#F6F6F6" },
  centerState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  hero: { backgroundColor: colors.primary, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 26, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  heroTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "900" },
  heroMenu: { color: "#FFFFFF", fontSize: 22 },
  identityRow: { flexDirection: "row", gap: 13, alignItems: "center", marginTop: 18 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  avatarImage: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#FFFFFF" },
  avatarText: { color: colors.primary, fontWeight: "900", fontSize: 23 },
  identityCopy: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { color: "#FFFFFF", fontSize: 19, fontWeight: "900" },
  verified: { color: "#FFFFFF", backgroundColor: "rgba(255,255,255,.2)", width: 20, height: 20, borderRadius: 10, textAlign: "center", lineHeight: 20, fontWeight: "900" },
  handle: { color: "#DDF6E9", fontSize: 11, marginTop: 2 },
  profession: { color: "#FFFFFF", fontSize: 11, fontWeight: "700", marginTop: 5 },
  statsRow: { flexDirection: "row", backgroundColor: "#FFFFFF", marginHorizontal: 12, marginTop: -6, borderRadius: 12, borderWidth: 1, borderColor: "#E6E6E6", overflow: "hidden" },
  stat: { flex: 1, alignItems: "center", paddingVertical: 12, borderRightWidth: 1, borderRightColor: "#EEEEEE" },
  statValue: { color: "#222222", fontWeight: "900", fontSize: 16 },
  statLabel: { color: "#8A8A8A", fontSize: 9, marginTop: 2 },
  trustCard: { marginHorizontal: 12, backgroundColor: "#FFFFFF", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#E6E6E6", gap: 12 },
  trustCopy: { gap: 5 },
  sectionEyebrow: { color: colors.primary, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  trustTitle: { color: "#222222", fontSize: 16, fontWeight: "900" },
  muted: { color: "#7A7A7A", lineHeight: 18, fontSize: 10 },
  verifyButton: { minHeight: 44, borderRadius: 7, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  verifyButtonText: { color: "#FFFFFF", fontWeight: "900" },
  verifiedPill: { alignSelf: "flex-start", backgroundColor: "#E4F8EE", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 },
  verifiedPillText: { color: colors.primary, fontSize: 10, fontWeight: "900" },
  profileCard: { marginHorizontal: 12, backgroundColor: "#FFFFFF", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#E6E6E6", gap: 7 },
  bioText: { color: "#444444", fontSize: 11, lineHeight: 18 },
  locationText: { color: "#8A8A8A", fontSize: 10 },
  editCard: { marginHorizontal: 12, backgroundColor: "#FFFFFF", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#E6E6E6", gap: 10 },
  sectionTitle: { color: "#222222", fontSize: 14, fontWeight: "900", marginTop: 3 },
  field: { gap: 5 },
  fieldCompact: { flex: 1 },
  label: { color: "#555555", fontSize: 10, fontWeight: "800" },
  input: { minHeight: 46, borderWidth: 1, borderColor: "#E3E3E3", borderRadius: 7, backgroundColor: "#FAFAFA", color: "#222222", paddingHorizontal: 11, paddingVertical: 9 },
  textarea: { minHeight: 90, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 8 },
  primaryButton: { minHeight: 46, borderRadius: 7, backgroundColor: colors.primary, justifyContent: "center", alignItems: "center", paddingHorizontal: 16, marginTop: 5 },
  primaryButtonText: { color: colors.onPrimary, fontWeight: "900" },
  disabled: { opacity: 0.5 },
  error: { color: colors.danger, fontWeight: "700", fontSize: 10 },
  success: { color: colors.success, fontWeight: "800", fontSize: 10 },
  privacyNote: { color: colors.textMuted, fontSize: 9, lineHeight: 15, marginHorizontal: 14 },
  title: { color: colors.text, fontSize: 24, fontWeight: "800" },
});
