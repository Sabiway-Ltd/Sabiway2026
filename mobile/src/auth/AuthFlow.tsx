import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { ApiError } from "../api/client";
import { authApi } from "../api/auth";
import { colors } from "../design/tokens";
import type { AccountRole, AuthScreen, AuthSession, SignInInput, SignUpInput } from "./types";
import { validateSignIn, validateSignUp } from "./validation";

type AuthFlowProps = { onAuthenticated: (session: AuthSession) => void };

const emptySignIn: SignInInput = { email: "", password: "" };
const emptySignUp: SignUpInput = {
  fullName: "",
  email: "",
  password: "",
  role: "client",
  phoneNumber: "",
  termsAccepted: false,
};

export function AuthFlow({ onAuthenticated }: AuthFlowProps) {
  const { width } = useWindowDimensions();
  const [screen, setScreen] = useState<AuthScreen>("welcome");
  const [selectedRole, setSelectedRole] = useState<AccountRole>("client");
  const [signIn, setSignIn] = useState(emptySignIn);
  const [signUp, setSignUp] = useState(emptySignUp);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [requestError, setRequestError] = useState("");
  const [loading, setLoading] = useState(false);

  const panelWidth = useMemo(() => Math.min(width - 32, 520), [width]);

  function navigate(next: AuthScreen) {
    setErrors({});
    setRequestError("");
    setScreen(next);
  }

  async function submitSignIn() {
    const nextErrors = validateSignIn(signIn);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setLoading(true);
    setRequestError("");
    try {
      const session = await authApi.signIn({ email: signIn.email.trim().toLowerCase(), password: signIn.password });
      onAuthenticated(session);
    } catch (error) {
      setRequestError(authErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function submitSignUp() {
    const payload: SignUpInput = { ...signUp, role: selectedRole };
    const nextErrors = validateSignUp(payload);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setLoading(true);
    setRequestError("");
    try {
      await authApi.signUp(payload);
      navigate("check-email");
    } catch (error) {
      setRequestError(authErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function submitForgotPassword() {
    if (!/^\S+@\S+\.\S+$/.test(recoveryEmail.trim())) {
      setErrors({ email: "Enter a valid email address." });
      return;
    }
    setLoading(true);
    setRequestError("");
    try {
      await authApi.forgotPassword(recoveryEmail);
      navigate("reset-code");
    } catch (error) {
      setRequestError(authErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function submitResetCode() {
    if (!/^\d{4}$/.test(resetCode.trim())) {
      setErrors({ code: "Enter the 4-digit code from your email." });
      return;
    }
    setLoading(true);
    setRequestError("");
    try {
      const response = await authApi.confirmResetCode(recoveryEmail, resetCode);
      setResetToken(response.reset_token);
      navigate("new-password");
    } catch (error) {
      setRequestError(authErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function submitNewPassword() {
    const nextErrors: Record<string, string> = {};
    if (newPassword.length < 8) nextErrors.newPassword = "Use at least 8 characters.";
    if (newPassword !== confirmPassword) nextErrors.confirmPassword = "Passwords do not match.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setLoading(true);
    setRequestError("");
    try {
      await authApi.resetPassword(resetToken, newPassword, confirmPassword);
      navigate("password-reset");
    } catch (error) {
      setRequestError(authErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[styles.panel, { width: panelWidth }]}> 
          <Text style={styles.brand}>Sabiway</Text>

          {screen === "welcome" && (
            <>
              <Text accessibilityRole="header" style={styles.heroTitle}>Welcome to SabiWay</Text>
              <Text style={styles.centerCopy}>Trusted services, real opportunities and useful community in one place.</Text>
              <PrimaryButton label="Create an account" onPress={() => navigate("role")} />
              <TextButton label="I already have an account" onPress={() => navigate("sign-in")} centered />
            </>
          )}

          {screen === "role" && (
            <>
              <BackButton onPress={() => navigate("welcome")} />
              <Text accessibilityRole="header" style={styles.heroTitle}>Select Your Role</Text>
              <Text style={styles.centerCopy}>Choose how you want to use SabiWay. You can still use the shared community from either role.</Text>
              <View style={styles.roleRow}>
                <RoleCard active={selectedRole === "professional"} glyph="▣" label="Professional" onPress={() => setSelectedRole("professional")} />
                <RoleCard active={selectedRole === "client"} glyph="◉" label="Client" onPress={() => setSelectedRole("client")} />
              </View>
              <PrimaryButton label="Continue" onPress={() => { setSignUp((current) => ({ ...current, role: selectedRole })); navigate("sign-up"); }} />
            </>
          )}

          {screen === "sign-in" && (
            <>
              <BackButton onPress={() => navigate("welcome")} />
              <Text accessibilityRole="header" style={styles.authTitle}><Text style={styles.authTitleStrong}>Sign in</Text> and continue your journey with Sabiway.</Text>
              <Field autoComplete="email" error={errors.email} keyboardType="email-address" label="Email Address" onChangeText={(email) => setSignIn((current) => ({ ...current, email }))} value={signIn.email} />
              <Field autoComplete="current-password" error={errors.password} label="Password" onChangeText={(password) => setSignIn((current) => ({ ...current, password }))} secureTextEntry value={signIn.password} />
              <TextButton label="Forgot your password?" onPress={() => navigate("forgot-password")} />
              <RequestError message={requestError} />
              <PrimaryButton label="Sign in" loading={loading} onPress={submitSignIn} />
              <TextButton label="I don’t have an account" onPress={() => navigate("role")} centered />
            </>
          )}

          {screen === "sign-up" && (
            <>
              <BackButton onPress={() => navigate("role")} />
              <Text accessibilityRole="header" style={styles.authTitle}><Text style={styles.authTitleStrong}>Sign up</Text> and start your journey with Sabiway.</Text>
              <Field autoComplete="name" error={errors.fullName} label="Full Name" onChangeText={(fullName) => setSignUp((current) => ({ ...current, fullName }))} value={signUp.fullName} />
              <Field autoComplete="email" error={errors.email} keyboardType="email-address" label="Email Address" onChangeText={(email) => setSignUp((current) => ({ ...current, email }))} value={signUp.email} />
              <Field error={errors.phoneNumber} keyboardType="phone-pad" label="Phone Number (optional)" onChangeText={(phoneNumber) => setSignUp((current) => ({ ...current, phoneNumber }))} value={signUp.phoneNumber} />
              <Field autoComplete="new-password" error={errors.password} label="Password" onChangeText={(password) => setSignUp((current) => ({ ...current, password }))} secureTextEntry value={signUp.password} />
              <Text style={styles.help}>Nigerian mobile formats such as 08012345678 and +2348012345678 are accepted.</Text>
              <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: signUp.termsAccepted }} onPress={() => setSignUp((current) => ({ ...current, termsAccepted: !current.termsAccepted }))} style={styles.checkboxRow}>
                <View style={[styles.checkbox, signUp.termsAccepted && styles.checkboxChecked]}><Text style={styles.checkboxMark}>{signUp.termsAccepted ? "✓" : ""}</Text></View>
                <Text style={styles.checkboxText}>I acknowledge that I have read and agree to the <Text style={styles.agreementText}>SabiWay Agreements</Text>.</Text>
              </Pressable>
              {errors.termsAccepted ? <Text style={styles.errorText}>{errors.termsAccepted}</Text> : null}
              <RequestError message={requestError} />
              <PrimaryButton label="Sign Up" loading={loading} onPress={submitSignUp} />
              <TextButton label="I already have an account" onPress={() => navigate("sign-in")} centered />
            </>
          )}

          {screen === "check-email" && (
            <>
              <Text accessibilityRole="header" style={styles.heroTitle}>Check your email</Text>
              <Text style={styles.centerCopy}>We sent a confirmation link and code to {signUp.email.trim().toLowerCase()}. Confirm your account before signing in.</Text>
              <PrimaryButton label="Go to sign in" onPress={() => navigate("sign-in")} />
            </>
          )}

          {screen === "forgot-password" && (
            <>
              <BackButton onPress={() => navigate("sign-in")} />
              <Text accessibilityRole="header" style={styles.heroTitle}>Reset your password</Text>
              <Text style={styles.centerCopy}>Enter your account email. We will send instructions if an account exists.</Text>
              <Field autoComplete="email" error={errors.email} keyboardType="email-address" label="Email Address" onChangeText={setRecoveryEmail} value={recoveryEmail} />
              <RequestError message={requestError} />
              <PrimaryButton label="Send reset instructions" loading={loading} onPress={submitForgotPassword} />
            </>
          )}

          {screen === "reset-code" && (
            <>
              <BackButton onPress={() => navigate("forgot-password")} />
              <Text accessibilityRole="header" style={styles.heroTitle}>Enter your reset code</Text>
              <Text style={styles.centerCopy}>Use the 4-digit code sent to {recoveryEmail.trim().toLowerCase()}.</Text>
              <Field error={errors.code} keyboardType="number-pad" label="Reset Code" onChangeText={setResetCode} value={resetCode} />
              <RequestError message={requestError} />
              <PrimaryButton label="Confirm code" loading={loading} onPress={submitResetCode} />
            </>
          )}

          {screen === "new-password" && (
            <>
              <BackButton onPress={() => navigate("reset-code")} />
              <Text accessibilityRole="header" style={styles.heroTitle}>Choose a new password</Text>
              <Text style={styles.centerCopy}>Use a strong password you do not use elsewhere.</Text>
              <Field autoComplete="new-password" error={errors.newPassword} label="New Password" onChangeText={setNewPassword} secureTextEntry value={newPassword} />
              <Field autoComplete="new-password" error={errors.confirmPassword} label="Confirm Password" onChangeText={setConfirmPassword} secureTextEntry value={confirmPassword} />
              <RequestError message={requestError} />
              <PrimaryButton label="Reset password" loading={loading} onPress={submitNewPassword} />
            </>
          )}

          {screen === "password-reset" && (
            <>
              <Text accessibilityRole="header" style={styles.heroTitle}>Password updated</Text>
              <Text style={styles.centerCopy}>Your new password is ready. Sign in to continue.</Text>
              <PrimaryButton label="Go to sign in" onPress={() => navigate("sign-in")} />
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function authErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 403) return "This account is suspended. Contact SabiWay support if you need help.";
    if (error.status === 409) return "Complete account onboarding before signing in.";
    if (error.status === 401) return "The email or password is incorrect.";
    if (error.status === 400) return "Review your details and try again.";
  }
  return "We could not complete that request. Check your connection and try again.";
}

type FieldProps = {
  autoComplete?: "email" | "name" | "current-password" | "new-password";
  error?: string;
  keyboardType?: "default" | "email-address" | "number-pad" | "phone-pad";
  label: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  value: string;
};

function Field({ error, label, ...inputProps }: FieldProps) {
  return <View style={styles.field}><TextInput {...inputProps} accessibilityLabel={label} autoCapitalize="none" placeholder={label} placeholderTextColor="#4F4F4F" style={[styles.input, error ? styles.inputError : undefined]} />{error ? <Text style={styles.errorText}>{error}</Text> : null}</View>;
}

function PrimaryButton({ label, loading = false, onPress }: { label: string; loading?: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: loading }} disabled={loading} onPress={onPress} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, loading && styles.disabled]}>{loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{label}</Text>}</Pressable>;
}

function TextButton({ label, onPress, centered = false }: { label: string; onPress: () => void; centered?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.textButton, centered && styles.textButtonCentered]}><Text style={[styles.textButtonLabel, centered && styles.textButtonLabelCentered]}>{label}</Text></Pressable>;
}

function BackButton({ onPress }: { onPress: () => void }) { return <TextButton label="← Back" onPress={onPress} />; }

function RoleCard({ active, glyph, label, onPress }: { active: boolean; glyph: string; label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: active }} onPress={onPress} style={({ pressed }) => [styles.roleCard, active && styles.roleCardActive, pressed && styles.pressed]}><Text style={[styles.roleGlyph, active && styles.roleGlyphActive]}>{glyph}</Text><Text style={[styles.roleTitle, active && styles.roleTitleActive]}>{label}</Text></Pressable>;
}

function RequestError({ message }: { message: string }) { return message ? <Text accessibilityRole="alert" style={styles.requestError}>{message}</Text> : null; }

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#F4F4F4" },
  page: { flexGrow: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 16, paddingVertical: 36, backgroundColor: "#F4F4F4" },
  panel: { paddingHorizontal: 10, gap: 20 },
  brand: { color: colors.brand, fontSize: 42, lineHeight: 48, fontWeight: "900", letterSpacing: -2, textAlign: "center", marginBottom: 18 },
  heroTitle: { color: colors.text, fontSize: 30, lineHeight: 36, fontWeight: "900", textAlign: "center" },
  authTitle: { color: colors.text, fontSize: 27, lineHeight: 36, fontWeight: "400", textAlign: "center", marginBottom: 16 },
  authTitleStrong: { fontWeight: "900" },
  centerCopy: { color: colors.muted, fontSize: 16, lineHeight: 24, textAlign: "center", marginBottom: 10 },
  help: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: -8 },
  field: { gap: 6 },
  input: { minHeight: 64, borderColor: "transparent", borderWidth: 1.5, borderRadius: 14, backgroundColor: colors.surface, color: colors.text, fontSize: 17, paddingHorizontal: 18 },
  inputError: { borderColor: colors.danger },
  errorText: { color: colors.danger, fontSize: 13, paddingHorizontal: 4 },
  requestError: { color: colors.danger, backgroundColor: "#FEF3F2", borderRadius: 10, padding: 12, fontSize: 14, lineHeight: 20 },
  primaryButton: { minHeight: 58, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: colors.brand, paddingHorizontal: 18, marginTop: 8 },
  primaryButtonText: { color: colors.onPrimary, fontSize: 18, fontWeight: "800" },
  textButton: { alignSelf: "flex-start", minHeight: 44, justifyContent: "center", paddingHorizontal: 2 },
  textButtonCentered: { alignSelf: "stretch", alignItems: "center" },
  textButtonLabel: { color: colors.brand, fontSize: 15, fontWeight: "800" },
  textButtonLabelCentered: { color: colors.text, fontSize: 16, fontWeight: "500" },
  roleRow: { flexDirection: "row", gap: 14, marginVertical: 8 },
  roleCard: { flex: 1, minHeight: 130, justifyContent: "center", alignItems: "center", borderColor: "transparent", borderWidth: 2, borderRadius: 8, backgroundColor: colors.surface, gap: 10 },
  roleCardActive: { borderColor: colors.brand, backgroundColor: colors.brand },
  roleGlyph: { color: colors.brand, fontSize: 30, lineHeight: 34, fontWeight: "800" },
  roleGlyphActive: { color: colors.onPrimary },
  roleTitle: { color: colors.text, fontSize: 15, fontWeight: "700" },
  roleTitleActive: { color: colors.onPrimary },
  checkboxRow: { minHeight: 48, flexDirection: "row", alignItems: "flex-start", gap: 10 },
  checkbox: { width: 26, height: 26, borderWidth: 2, borderColor: colors.text, borderRadius: 3, alignItems: "center", justifyContent: "center", marginTop: 1 },
  checkboxChecked: { backgroundColor: colors.brand, borderColor: colors.brand },
  checkboxMark: { color: colors.onPrimary, fontWeight: "900" },
  checkboxText: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 21 },
  agreementText: { color: colors.brand, textDecorationLine: "underline", fontWeight: "800" },
  pressed: { opacity: 0.74 },
  disabled: { opacity: 0.55 },
});
