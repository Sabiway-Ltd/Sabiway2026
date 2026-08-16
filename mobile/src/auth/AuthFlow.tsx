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

type AuthFlowProps = {
  onAuthenticated: (session: AuthSession) => void;
};

const emptySignIn: SignInInput = { email: "", password: "" };
const emptySignUp: SignUpInput = { fullName: "", email: "", password: "", role: "client" };

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

  const cardWidth = useMemo(() => Math.min(width - 32, 520), [width]);

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
      const session = await authApi.signIn({
        email: signIn.email.trim().toLowerCase(),
        password: signIn.password,
      });
      onAuthenticated(session);
    } catch (error) {
      setRequestError(authErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function submitSignUp() {
    const payload = { ...signUp, role: selectedRole };
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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.flex}
    >
      <ScrollView
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { width: cardWidth }]}>
          <Text style={styles.brand}>SABIWAY</Text>
          {screen === "welcome" && (
            <>
              <Text accessibilityRole="header" style={styles.title}>
                Trusted help, wherever you are.
              </Text>
              <Text style={styles.copy}>
                Find skilled professionals, manage your services, and stay connected from one account.
              </Text>
              <PrimaryButton label="Create an account" onPress={() => navigate("role")} />
              <SecondaryButton label="Sign in" onPress={() => navigate("sign-in")} />
            </>
          )}

          {screen === "role" && (
            <>
              <BackButton onPress={() => navigate("welcome")} />
              <Text accessibilityRole="header" style={styles.title}>How will you use SabiWay?</Text>
              <Text style={styles.copy}>Choose a starting role. Your permissions will still be enforced by the shared backend.</Text>
              <RoleCard
                active={selectedRole === "client"}
                description="Find, book, and manage trusted services."
                label="I need a service"
                onPress={() => setSelectedRole("client")}
              />
              <RoleCard
                active={selectedRole === "professional"}
                description="Build your profile and offer verified services."
                label="I provide services"
                onPress={() => setSelectedRole("professional")}
              />
              <PrimaryButton
                label="Continue"
                onPress={() => {
                  setSignUp((current) => ({ ...current, role: selectedRole }));
                  navigate("sign-up");
                }}
              />
            </>
          )}

          {screen === "sign-in" && (
            <>
              <BackButton onPress={() => navigate("welcome")} />
              <Text accessibilityRole="header" style={styles.title}>Welcome back</Text>
              <Text style={styles.copy}>Sign in with the same SabiWay account you use on the web.</Text>
              <Field
                autoComplete="email"
                error={errors.email}
                keyboardType="email-address"
                label="Email address"
                onChangeText={(email) => setSignIn((current) => ({ ...current, email }))}
                value={signIn.email}
              />
              <Field
                autoComplete="current-password"
                error={errors.password}
                label="Password"
                onChangeText={(password) => setSignIn((current) => ({ ...current, password }))}
                secureTextEntry
                value={signIn.password}
              />
              <RequestError message={requestError} />
              <PrimaryButton label="Sign in" loading={loading} onPress={submitSignIn} />
              <TextButton label="Forgot password?" onPress={() => navigate("forgot-password")} />
              <TextButton label="Create an account" onPress={() => navigate("role")} />
            </>
          )}

          {screen === "sign-up" && (
            <>
              <BackButton onPress={() => navigate("role")} />
              <Text accessibilityRole="header" style={styles.title}>Create your account</Text>
              <Text style={styles.copy}>
                Starting as {selectedRole === "client" ? "a client" : "a professional"}. You can complete your profile after verification.
              </Text>
              <Field
                autoComplete="name"
                error={errors.fullName}
                label="Full name"
                onChangeText={(fullName) => setSignUp((current) => ({ ...current, fullName }))}
                value={signUp.fullName}
              />
              <Field
                autoComplete="email"
                error={errors.email}
                keyboardType="email-address"
                label="Email address"
                onChangeText={(email) => setSignUp((current) => ({ ...current, email }))}
                value={signUp.email}
              />
              <Field
                autoComplete="new-password"
                error={errors.password}
                label="Password"
                onChangeText={(password) => setSignUp((current) => ({ ...current, password }))}
                secureTextEntry
                value={signUp.password}
              />
              <RequestError message={requestError} />
              <PrimaryButton label="Create account" loading={loading} onPress={submitSignUp} />
              <TextButton label="Already have an account? Sign in" onPress={() => navigate("sign-in")} />
            </>
          )}

          {screen === "check-email" && (
            <>
              <Text accessibilityRole="header" style={styles.title}>Check your email</Text>
              <Text style={styles.copy}>
                We sent a confirmation link and code to {signUp.email.trim().toLowerCase()}. Confirm your account before signing in.
              </Text>
              <PrimaryButton label="Go to sign in" onPress={() => navigate("sign-in")} />
            </>
          )}
        {screen === "forgot-password" && (
          <>
            <BackButton onPress={() => navigate("sign-in")} />
            <Text accessibilityRole="header" style={styles.title}>Reset your password</Text>
            <Text style={styles.copy}>Enter your account email. We will send instructions if an account exists.</Text>
            <Field autoComplete="email" error={errors.email} keyboardType="email-address" label="Email address" onChangeText={setRecoveryEmail} value={recoveryEmail} />
            <RequestError message={requestError} />
            <PrimaryButton label="Send reset instructions" loading={loading} onPress={submitForgotPassword} />
          </>
        )}

        {screen === "reset-code" && (
          <>
            <BackButton onPress={() => navigate("forgot-password")} />
            <Text accessibilityRole="header" style={styles.title}>Enter your reset code</Text>
            <Text style={styles.copy}>Use the 4-digit code sent to {recoveryEmail.trim().toLowerCase()}.</Text>
            <Field error={errors.code} keyboardType="number-pad" label="Reset code" onChangeText={setResetCode} value={resetCode} />
            <RequestError message={requestError} />
            <PrimaryButton label="Confirm code" loading={loading} onPress={submitResetCode} />
          </>
        )}

        {screen === "new-password" && (
          <>
            <BackButton onPress={() => navigate("reset-code")} />
            <Text accessibilityRole="header" style={styles.title}>Choose a new password</Text>
            <Text style={styles.copy}>Use a strong password you do not use elsewhere.</Text>
            <Field autoComplete="new-password" error={errors.newPassword} label="New password" onChangeText={setNewPassword} secureTextEntry value={newPassword} />
            <Field autoComplete="new-password" error={errors.confirmPassword} label="Confirm password" onChangeText={setConfirmPassword} secureTextEntry value={confirmPassword} />
            <RequestError message={requestError} />
            <PrimaryButton label="Reset password" loading={loading} onPress={submitNewPassword} />
          </>
        )}

        {screen === "password-reset" && (
          <>
            <Text accessibilityRole="header" style={styles.title}>Password updated</Text>
            <Text style={styles.copy}>Your new password is ready. Sign in to continue.</Text>
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
    if (error.status === 401) return "The email or password is incorrect.";
    if (error.status === 400) return "Review your details and try again.";
  }
  return "We could not complete that request. Check your connection and try again.";
}

type FieldProps = {
  autoComplete?: "email" | "name" | "current-password" | "new-password";
  error?: string;
  keyboardType?: "default" | "email-address" | "number-pad";
  label: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  value: string;
};

function Field({ error, label, ...inputProps }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...inputProps}
        accessibilityLabel={label}
        autoCapitalize="none"
        style={[styles.input, error ? styles.inputError : undefined]}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function PrimaryButton({ label, loading = false, onPress }: { label: string; loading?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, loading && styles.disabled]}
    >
      {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{label}</Text>}
    </Pressable>
  );
}

function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function TextButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.textButton}>
      <Text style={styles.textButtonLabel}>{label}</Text>
    </Pressable>
  );
}

function BackButton({ onPress }: { onPress: () => void }) {
  return <TextButton label="Back" onPress={onPress} />;
}

function RoleCard({ active, description, label, onPress }: { active: boolean; description: string; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.roleCard, active && styles.roleCardActive, pressed && styles.pressed]}
    >
      <Text style={styles.roleTitle}>{label}</Text>
      <Text style={styles.roleDescription}>{description}</Text>
    </Pressable>
  );
}

function RequestError({ message }: { message: string }) {
  return message ? <Text accessibilityRole="alert" style={styles.requestError}>{message}</Text> : null;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  page: { flexGrow: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 16, paddingVertical: 32 },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 24, padding: 24, gap: 16 },
  brand: { color: colors.brand, fontSize: 13, fontWeight: "800", letterSpacing: 2 },
  title: { color: colors.text, fontSize: 30, fontWeight: "800", lineHeight: 36 },
  copy: { color: colors.muted, fontSize: 16, lineHeight: 24 },
  field: { gap: 6 },
  label: { color: colors.text, fontSize: 14, fontWeight: "700" },
  input: { minHeight: 52, borderColor: colors.border, borderWidth: 1, borderRadius: 12, color: colors.text, fontSize: 16, paddingHorizontal: 14 },
  inputError: { borderColor: "#B42318" },
  errorText: { color: "#B42318", fontSize: 13 },
  requestError: { color: "#B42318", backgroundColor: "#FEF3F2", borderRadius: 10, padding: 12, fontSize: 14, lineHeight: 20 },
  primaryButton: { minHeight: 52, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: colors.brand, paddingHorizontal: 18 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  secondaryButton: { minHeight: 52, alignItems: "center", justifyContent: "center", borderColor: colors.brand, borderWidth: 1, borderRadius: 12, paddingHorizontal: 18 },
  secondaryButtonText: { color: colors.brand, fontSize: 16, fontWeight: "800" },
  textButton: { alignSelf: "flex-start", minHeight: 44, justifyContent: "center", paddingHorizontal: 2 },
  textButtonLabel: { color: colors.brand, fontSize: 14, fontWeight: "700" },
  roleCard: { minHeight: 88, justifyContent: "center", borderColor: colors.border, borderWidth: 1, borderRadius: 14, padding: 16, gap: 4 },
  roleCardActive: { borderColor: colors.brand, backgroundColor: "#EFFAF4", borderWidth: 2 },
  roleTitle: { color: colors.text, fontSize: 16, fontWeight: "800" },
  roleDescription: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  pressed: { opacity: 0.78 },
  disabled: { opacity: 0.6 },
});
