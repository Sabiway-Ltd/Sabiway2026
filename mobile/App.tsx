import { useState } from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";

import { AuthFlow } from "./src/auth/AuthFlow";
import type { AuthSession } from "./src/auth/types";
import { CommunityScreen } from "./src/community/CommunityScreen";
import { colors } from "./src/design/tokens";

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(null);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      {session ? (
        <CommunityScreen session={session} onSignOut={() => setSession(null)} />
      ) : (
        <AuthFlow onAuthenticated={setSession} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
});
