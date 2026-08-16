import { useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";

import { AuthFlow } from "./src/auth/AuthFlow";
import type { AuthSession } from "./src/auth/types";
import { CommunityScreen } from "./src/community/CommunityScreen";
import { colors } from "./src/design/tokens";
import { MarketplaceScreen } from "./src/marketplace/MarketplaceScreen";
import { MessagingScreen } from "./src/messaging/MessagingScreen";
import { SabiPayScreen } from "./src/sabipay/SabiPayScreen";
import { TrustScreen } from "./src/trust/TrustScreen";
import { VerificationScreen } from "./src/verification/VerificationScreen";

type AppSection = "community" | "marketplace" | "messages" | "sabipay" | "trust" | "verification";

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [section, setSection] = useState<AppSection>("community");

  const signOut = () => {
    setSession(null);
    setSection("community");
  };

  const nav = [
    ["community", "Forum"], ["marketplace", "Market"], ["messages", "Messages"], ["sabipay", "SabiPay"], ["trust", "Trust"],
  ] as [AppSection, string][];
  if (session?.user.role === "professional") nav.push(["verification", "Verify"]);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      {session ? (
        <View style={styles.authenticated}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navigation}>
            {nav.map(([value, title]) => <Pressable key={value} onPress={() => setSection(value)} style={[styles.navItem, section === value && styles.navItemActive]}><Text style={[styles.navText, section === value && styles.navTextActive]}>{title}</Text></Pressable>)}
          </ScrollView>
          <View style={styles.content}>
            {section === "marketplace" ? (
              <MarketplaceScreen session={session} onBackToCommunity={() => setSection("community")} onSignOut={signOut} />
            ) : section === "messages" ? (
              <MessagingScreen session={session} onBackToMarketplace={() => setSection("marketplace")} onBackToCommunity={() => setSection("community")} />
            ) : section === "sabipay" ? (
              <SabiPayScreen session={session} onBackToMarketplace={() => setSection("marketplace")} />
            ) : section === "trust" ? (
              <TrustScreen session={session} onBackToMarketplace={() => setSection("marketplace")} onOpenSabiPay={() => setSection("sabipay")} />
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
  navigation: { gap: 4, paddingHorizontal: 6, paddingTop: 8, paddingBottom: 4, backgroundColor: colors.background },
  navItem: { minWidth: 74, minHeight: 40, justifyContent: "center", alignItems: "center", borderRadius: 10, paddingHorizontal: 9, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  navItemActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  navText: { color: colors.text, fontWeight: "700", fontSize: 10 },
  navTextActive: { color: "#FFFFFF" },
  content: { flex: 1 },
});
