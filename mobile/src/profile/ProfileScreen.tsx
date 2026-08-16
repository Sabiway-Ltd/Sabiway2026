import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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

type Props = {
  session: AuthSession;
  onOpenVerification: () => void;
};

const EMPTY: ProfileUpdate = {
  full_name: "",
  username: "",
  phone_number: "",
  country: "",
  state: "",
  area: "",
  street: "",
  job: "",
  bio: "",
};

export function ProfileScreen({ session, onOpenVerification }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<ProfileUpdate>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const next = await getMyProfile(session.access);
      setProfile(next);
      setForm({
        full_name: next.full_name || "",
        username: next.username || "",
        phone_number: next.phone_number || "",
        country: next.country || "",
        state: next.state || "",
        area: next.area || "",
        street: next.street || "",
        job: next.job || "",
        bio: next.bio || "",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "We could not load your profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [session.access]);

  const dirty = useMemo(() => {
    if (!profile) return false;
    return (
      form.full_name !== (profile.full_name || "") ||
      form.username !== (profile.username || "") ||
      form.phone_number !== (profile.phone_number || "") ||
      form.country !== (profile.country || "") ||
      form.state !== (profile.state || "") ||
      form.area !== (profile.area || "") ||
      form.street !== (profile.street || "") ||
      form.job !== (profile.job || "") ||
      form.bio !== (profile.bio || "")
    );
  }, [form, profile]);

  const setField = (field: keyof ProfileUpdate, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setSuccess("");
  };

  const save = async () => {
    if (!form.full_name.trim() || !form.username.trim()) {
      setError("Full name and username are required.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const next = await updateMyProfile(session.access, {
        ...form,
        full_name: form.full_name.trim(),
        username: form.username.trim(),
      });
      setProfile(next);
      setForm((current) => ({ ...current, username: next.username }));
      setSuccess("Profile updated.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "We could not save your profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerState} accessibilityRole="progressbar">
        <ActivityIndicator />
        <Text style={styles.muted}>Loading your profile…</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.title}>Profile unavailable</Text>
        <Text style={styles.muted}>{error || "We could not load your profile."}</Text>
        <Pressable accessibilityRole="button" onPress={() => void load()} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.avatar} accessibilityLabel={`${profile.full_name} profile initials`}>
            <Text style={styles.avatarText}>{profile.initials || "SW"}</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Your profile</Text>
            <Text style={styles.muted}>{profile.email}</Text>
            <Text style={styles.role}>{profile.role === "professional" ? "Professional" : "Client"}</Text>
          </View>
        </View>

        {profile.role === "professional" ? (
          <View style={styles.verificationCard}>
            <View style={styles.flex}>
              <Text style={styles.sectionTitle}>Trust & verification</Text>
              <Text style={styles.muted}>
                {profile.is_verified ? "Verified professional" : `Status: ${profile.verification_status.replaceAll("_", " ")}`}
              </Text>
            </View>
            {!profile.is_verified ? (
              <Pressable accessibilityRole="button" onPress={onOpenVerification} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Open verification</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Basic information</Text>
        <Field label="Full name" value={form.full_name} onChangeText={(v) => setField("full_name", v)} autoCapitalize="words" />
        <Field label="Username" value={form.username} onChangeText={(v) => setField("username", v)} autoCapitalize="none" />
        <Field label="Phone number" value={form.phone_number} onChangeText={(v) => setField("phone_number", v)} keyboardType="phone-pad" />
        <Field label="Job / profession" value={form.job} onChangeText={(v) => setField("job", v)} />
        <Field label="Bio" value={form.bio} onChangeText={(v) => setField("bio", v)} multiline />

        <Text style={styles.sectionTitle}>Location</Text>
        <Field label="Country" value={form.country} onChangeText={(v) => setField("country", v)} />
        <Field label="State" value={form.state} onChangeText={(v) => setField("state", v)} />
        <Field label="Area" value={form.area} onChangeText={(v) => setField("area", v)} />
        <Field label="Street" value={form.street} onChangeText={(v) => setField("street", v)} />

        {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}
        {success ? <Text style={styles.success} accessibilityRole="alert">{success}</Text> : null}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !dirty || saving }}
          disabled={!dirty || saving}
          onPress={() => void save()}
          style={[styles.primaryButton, (!dirty || saving) && styles.disabled]}
        >
          {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Save changes</Text>}
        </Pressable>

        <Text style={styles.privacyNote}>Your contact and precise location details are private to you and authorised staff.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  keyboardType?: "default" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
};

function Field({ label, value, onChangeText, multiline = false, keyboardType = "default", autoCapitalize = "sentences" }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={[styles.input, multiline && styles.textarea]}
        placeholderTextColor={colors.muted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: 16, paddingBottom: 40, gap: 12, maxWidth: 720, width: "100%", alignSelf: "center" },
  centerState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
  headerText: { flex: 1 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFFFFF", fontWeight: "800", fontSize: 18 },
  title: { color: colors.text, fontSize: 24, fontWeight: "800" },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: "800", marginTop: 6 },
  muted: { color: colors.muted, lineHeight: 20 },
  role: { color: colors.brandStrong, fontWeight: "700", marginTop: 2 },
  verificationCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.surface },
  field: { gap: 6 },
  label: { color: colors.text, fontWeight: "700" },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface, color: colors.text, paddingHorizontal: 12, paddingVertical: 10 },
  textarea: { minHeight: 96, textAlignVertical: "top" },
  primaryButton: { minHeight: 48, borderRadius: 12, backgroundColor: colors.brand, justifyContent: "center", alignItems: "center", paddingHorizontal: 16 },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "800" },
  secondaryButton: { minHeight: 44, borderRadius: 10, borderWidth: 1, borderColor: colors.brand, justifyContent: "center", paddingHorizontal: 12 },
  secondaryButtonText: { color: colors.brandStrong, fontWeight: "800" },
  disabled: { opacity: 0.5 },
  error: { color: "#B42318", fontWeight: "600" },
  success: { color: colors.brandStrong, fontWeight: "700" },
  privacyNote: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
});
