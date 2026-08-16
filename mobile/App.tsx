import { useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";

import { AuthFlow } from "./src/auth/AuthFlow";
import type { AuthSession } from "./src/auth/types";
import { CommunityScreen } from "./src/community/CommunityScreen";
import { colors } from "./src/design/tokens";
import { MarketplaceScreen } from "./src/marketplace/MarketplaceScreen";
import { MessagingScreen } from "./src/messaging/MessagingScreen";
import { ProfileScreen } from "./src/profile/ProfileScreen";
import { SabiPayScreen } from "./src/sabipay/SabiPayScreen";
import { VerificationScreen } from "./src/verification/VerificationScreen";

type AppSection = "community" | "marketplace" | "messages" | "sabipay" | "profile" | "verification";

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
            <Pressable accessibilityRole="button" onPress={() => setSection("community")} style={[styles.navItem, section === "community" && styles.navItemActive]}>
              <Text style={[styles.navText, section === "community" && styles.navTextActive]}>SabiForum</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setSection("marketplace")} style={[styles.navItem, section === "marketplace" && styles.navItemActive]}>
              <Text style={[styles.navText, section === "marketplace" && styles.navTextActive]}>Market</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setSection("messages")} style={[styles.navItem, section === "messages" && styles.navItemActive]}>
              <Text style={[styles.navText, section === "messages" && styles.navTextActive]}>Messages</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setSection("sabipay")} style={[styles.navItem, section === "sabipay" && styles.navItemActive]}>
              <Text style={[styles.navText, section === "sabipay" && styles.navTextActive]}>SabiPay</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setSection("profile")} style={[styles.navItem, section === "profile" && styles.navItemActive]}>
              <Text style={[styles.navText, section === "profile" && styles.navTextActive]}>Profile</Text>
            </Pressable>
          </View>
          <View style={styles.content}>
            {section === "marketplace" ? (
              <MarketplaceScreen session={session} onBackToCommunity={() => setSection("community")} onSignOut={signOut} />
            ) : section === "messages" ? (
              <MessagingScreen session={session} onBackToMarketplace={() => setSection("marketplace")} onBackToCommunity={() => setSection("community")} />
            ) : section === "sabipay" ? (
              <SabiPayScreen session={session} onBackToMarketplace={() => setSection("marketplace")} />
            ) : section === "profile" ? (
              <ProfileScreen session={session} onOpenVerification={() => setSection("verification")} />
            ) : section === "verification" && session.user.role === "professional" ? (
              <VerificationScreen session={session} onBackToMarketplace={() => setSection("profile")} />
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
  navigation: { flexDirection: "row", gap: 4, paddingHorizontal: 6, paddingTop: 8, paddingBottom: 4, backgroundColor: colors.background },
  navItem: { flex: 1, minHeight: 44, justifyContent: "center", alignItems: "center", borderRadius: 10, paddingHorizontal: 3, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  navItemActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  navText: { color: colors.text, fontWeight: "700", fontSize: 10 },
  navTextActive: { color: "#FFFFFF" },
  content: { flex: 1 },
});
