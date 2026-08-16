import { useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";

import { AuthFlow } from "./src/auth/AuthFlow";
import type { AuthSession } from "./src/auth/types";
import { CommunityScreen } from "./src/community/CommunityScreen";
import { colors } from "./src/design/tokens";
import { MarketplaceScreen } from "./src/marketplace/MarketplaceScreen";
import { MessagingScreen } from "./src/messaging/MessagingScreen";
import { VerificationScreen } from "./src/verification/VerificationScreen";

type AppSection = "community" | "marketplace" | "messages" | "verification";

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [section, setSection] = useState<AppSection>("community");

  const signOut = () => {
    setSession(null);
    setSection("community");
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      {session ? (
        <View style={styles.authenticated}>
          <View style={styles.navigation}>
            <Pressable onPress={() => setSection("community")} style={[styles.navItem, section === "community" && styles.navItemActive]}>
              <Text style={[styles.navText, section === "community" && styles.navTextActive]}>SabiForum</Text>
            </Pressable>
            <Pressable onPress={() => setSection("marketplace")} style={[styles.navItem, section === "marketplace" && styles.navItemActive]}>
              <Text style={[styles.navText, section === "marketplace" && styles.navTextActive]}>Marketplace</Text>
            </Pressable>
            <Pressable onPress={() => setSection("messages")} style={[styles.navItem, section === "messages" && styles.navItemActive]}>
              <Text style={[styles.navText, section === "messages" && styles.navTextActive]}>Messages</Text>
            </Pressable>
            {session.user.role === "professional" ? <Pressable onPress={() => setSection("verification")} style={[styles.navItem, section === "verification" && styles.navItemActive]}>
              <Text style={[styles.navText, section === "verification" && styles.navTextActive]}>Verify</Text>
            </Pressable> : null}
          </View>
          <View style={styles.content}>
            {section === "marketplace" ? (
              <MarketplaceScreen session={session} onBackToCommunity={() => setSection("community")} onSignOut={signOut} />
            ) : section === "messages" ? (
              <MessagingScreen session={session} onBackToMarketplace={() => setSection("marketplace")} onBackToCommunity={() => setSection("community")} />
            ) : section === "verification" ? (
              <VerificationScreen session={session} onBackToMarketplace={() => setSection("marketplace")} />
            ) : (
              <CommunityScreen session={session} onSignOut={signOut} />
            )}
          </View>
        </View>
      ) : (
        <AuthFlow onAuthenticated={(next) => { setSession(next); setSection("community"); }} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  authenticated: { flex: 1 },
  navigation: { flexDirection: "row", gap: 5, paddingHorizontal: 8, paddingTop: 8, paddingBottom: 4, backgroundColor: colors.background },
  navItem: { flex: 1, minHeight: 40, justifyContent: "center", alignItems: "center", borderRadius: 12, paddingHorizontal: 5, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  navItemActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  navText: { color: colors.text, fontWeight: "700", fontSize: 11 },
  navTextActive: { color: "#FFFFFF" },
  content: { flex: 1 },
});