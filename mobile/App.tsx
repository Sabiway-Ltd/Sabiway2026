import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { AuthFlow } from "./src/auth/AuthFlow";
import type { AuthSession } from "./src/auth/types";
import { colors } from "./src/design/tokens";

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(null);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      {session ? (
        <View style={styles.home}>
          <View style={styles.card}>
            <Text style={styles.brand}>SABIWAY</Text>
            <Text accessibilityRole="header" style={styles.title}>
              Welcome, {session.user.full_name.split(" ")[0] || "there"}.
            </Text>
            <Text style={styles.copy}>
              Your account is connected. Client and professional home experiences will be added in the next onboarding slice.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setSession(null)}
              style={({ pressed }) => [styles.button, pressed && styles.pressed]}
            >
              <Text style={styles.buttonText}>Sign out</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <AuthFlow onAuthenticated={setSession} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  home: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  card: { width: "100%", maxWidth: 520, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 24, padding: 24, gap: 16 },
  brand: { color: colors.brand, fontSize: 13, fontWeight: "800", letterSpacing: 2 },
  title: { color: colors.text, fontSize: 30, fontWeight: "800", lineHeight: 36 },
  copy: { color: colors.muted, fontSize: 16, lineHeight: 24 },
  button: { minHeight: 52, alignItems: "center", justifyContent: "center", borderColor: colors.brand, borderWidth: 1, borderRadius: 12, paddingHorizontal: 18 },
  buttonText: { color: colors.brand, fontSize: 16, fontWeight: "800" },
  pressed: { opacity: 0.78 },
});
