import { useEffect, useState } from "react";
import { Linking, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";

import { AuthFlow } from "./src/auth/AuthFlow";
import type { AuthSession } from "./src/auth/types";
import { CommunityScreen } from "./src/community/CommunityScreen";
import { AppErrorBoundary } from "./src/design/AppErrorBoundary";
import { colors, interaction, radius, spacing, typography } from "./src/design/tokens";
import { HomeScreen } from "./src/home/HomeScreen";
import { MarketplaceScreen } from "./src/marketplace/MarketplaceScreen";
import { MessagingScreen } from "./src/messaging/MessagingScreen";
import { ProfileScreen } from "./src/profile/ProfileScreen";
import { SabiPayScreen } from "./src/sabipay/SabiPayScreen";
import { VerificationScreen } from "./src/verification/VerificationScreen";

type AppSection = "home" | "community" | "marketplace" | "messages" | "sabipay" | "profile" | "verification";
type PrimarySection = "home" | "marketplace" | "messages" | "community" | "profile";

function sectionFromUrl(url: string): AppSection | null {
  const normalised = url.toLowerCase();
  if (normalised.includes("/messages") || normalised.includes("//messages")) return "messages";
  if (normalised.includes("/marketplace") || normalised.includes("//marketplace")) return "marketplace";
  if (normalised.includes("/sabipay") || normalised.includes("//sabipay")) return "sabipay";
  if (normalised.includes("/profile") || normalised.includes("//profile")) return "profile";
  if (normalised.includes("/verification") || normalised.includes("//verification")) return "verification";
  if (normalised.includes("/community") || normalised.includes("//community")) return "community";
  if (normalised.includes("/home") || normalised.includes("//home")) return "home";
  return null;
}

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [section, setSection] = useState<AppSection>("home");

  useEffect(() => {
    if (!session) return;

    const applyUrl = (url: string | null) => {
      if (!url) return;
      const next = sectionFromUrl(url);
      if (!next) return;
      if (next === "verification" && session.user.role !== "professional") return;
      setSection(next);
    };

    void Linking.getInitialURL().then(applyUrl);
    const subscription = Linking.addEventListener("url", ({ url }) => applyUrl(url));
    return () => subscription.remove();
  }, [session]);

  const signOut = () => {
    setSession(null);
    setSection("home");
  };

  const navItems: Array<{ key: PrimarySection; label: string }> = [
    { key: "home", label: "Home" },
    { key: "marketplace", label: "Market" },
    { key: "messages", label: "Messages" },
    { key: "community", label: "SabiForum" },
    { key: "profile", label: "Profile" },
  ];

  const selectedPrimarySection: PrimarySection = section === "sabipay" || section === "verification" ? "profile" : section;

  return (
    <AppErrorBoundary>
      <SafeAreaView style={styles.screen}>
        <StatusBar style="dark" />
        {session ? (
          <View style={styles.authenticated}>
            <View style={styles.content}>
              {section === "home" ? (
                <HomeScreen
                  session={session}
                  onOpenMarketplace={() => setSection("marketplace")}
                  onOpenMessages={() => setSection("messages")}
                  onOpenCommunity={() => setSection("community")}
                  onOpenProfile={() => setSection("profile")}
                  onOpenVerification={() => session.user.role === "professional" && setSection("verification")}
                  onOpenSabiPay={() => setSection("sabipay")}
                />
              ) : section === "marketplace" ? (
                <MarketplaceScreen session={session} onBackToCommunity={() => setSection("community")} onSignOut={signOut} />
              ) : section === "messages" ? (
                <MessagingScreen session={session} onBackToMarketplace={() => setSection("marketplace")} onBackToCommunity={() => setSection("community")} />
              ) : section === "sabipay" ? (
                <SabiPayScreen session={session} onBackToMarketplace={() => setSection("marketplace")} />
              ) : section === "profile" ? (
                <ProfileScreen session={session} onOpenVerification={() => setSection("verification")} />
              ) : section === "verification" && session.user.role === "professional" ? (
                <VerificationScreen session={session} onBackToMarketplace={() => setSection("marketplace")} />
              ) : (
                <CommunityScreen session={session} onSignOut={signOut} />
              )}
            </View>

            <View style={styles.navigation} accessibilityRole="tablist">
              {navItems.map((item) => {
                const active = selectedPrimarySection === item.key;
                return (
                  <Pressable
                    key={item.key}
                    accessibilityRole="tab"
                    accessibilityLabel={item.label}
                    accessibilityState={{ selected: active }}
                    onPress={() => setSection(item.key)}
                    style={({ pressed }) => [styles.navItem, active && styles.navItemActive, pressed && styles.navItemPressed]}
                  >
                    <Text numberOfLines={1} style={[styles.navText, active && styles.navTextActive]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : (
          <AuthFlow onAuthenticated={(next) => { setSession(next); setSection("home"); }} />
        )}
      </SafeAreaView>
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  authenticated: { flex: 1 },
  content: { flex: 1 },
  navigation: {
    flexDirection: "row",
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingTop: spacing[1],
    paddingBottom: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  navItem: {
    flex: 1,
    minHeight: interaction.minimumTouchTarget,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius.md,
    paddingHorizontal: spacing[1],
  },
  navItemActive: { backgroundColor: colors.primary },
  navItemPressed: { opacity: 0.72 },
  navText: { color: colors.textMuted, fontWeight: "600", fontSize: typography.size.xs },
  navTextActive: { color: colors.onPrimary },
});
