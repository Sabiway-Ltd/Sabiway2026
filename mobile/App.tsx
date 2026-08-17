import { useEffect, useState } from "react";
import { Linking, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";

import { trackMobileEvent } from "./src/api/analytics";
import { AuthFlow } from "./src/auth/AuthFlow";
import type { AuthSession } from "./src/auth/types";
import { CommunityScreen } from "./src/community/CommunityScreen";
import { AppErrorBoundary } from "./src/design/AppErrorBoundary";
import { colors, radius, spacing } from "./src/design/tokens";
import { HomeScreen } from "./src/home/HomeScreen";
import { MarketplaceScreen } from "./src/marketplace/MarketplaceScreen";
import { MessagingScreen } from "./src/messaging/MessagingScreen";
import { NotificationsScreen } from "./src/notifications/NotificationsScreen";
import { ProfileScreen } from "./src/profile/ProfileScreen";
import { SabiPayScreen } from "./src/sabipay/SabiPayScreen";
import { VerificationScreen } from "./src/verification/VerificationScreen";

type AppSection = "home" | "community" | "marketplace" | "messages" | "notifications" | "sabipay" | "profile" | "verification";
type PrimarySection = "marketplace" | "community" | "home" | "sabipay" | "profile";
type NavItem = { key: PrimarySection; label: string; glyph: string };

function sectionFromUrl(url: string): AppSection | null {
  const normalised = url.toLowerCase();
  if (normalised.includes("/messages") || normalised.includes("//messages")) return "messages";
  if (normalised.includes("/notifications") || normalised.includes("//notifications")) return "notifications";
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

  useEffect(() => {
    if (!session) return;
    void trackMobileEvent(session.access, "screen_viewed", { screen: section, role: session.user.role });
  }, [section, session]);

  const signOut = () => { setSession(null); setSection("home"); };
  const navItems: NavItem[] = [
    { key: "marketplace", label: "My Jobs", glyph: "▣" },
    { key: "community", label: "Community", glyph: "◎" },
    { key: "home", label: "Home", glyph: "⌂" },
    { key: "sabipay", label: session?.user.role === "professional" ? "Earning" : "History", glyph: "▤" },
    { key: "profile", label: "Profile", glyph: "◉" },
  ];

  const selectedPrimarySection: PrimarySection =
    section === "messages" || section === "notifications" ? "home" :
    section === "verification" ? "profile" :
    section;

  return (
    <AppErrorBoundary>
      <SafeAreaView style={styles.screen}>
        <StatusBar style="dark" />
        {session ? (
          <View style={styles.authenticated}>
            <View style={styles.content}>
              {section === "home" ? (
                <HomeScreen session={session} onOpenMarketplace={() => setSection("marketplace")} onOpenMessages={() => setSection("messages")} onOpenCommunity={() => setSection("community")} onOpenProfile={() => setSection("profile")} onOpenVerification={() => session.user.role === "professional" && setSection("verification")} onOpenSabiPay={() => setSection("sabipay")} onOpenNotifications={() => setSection("notifications")} />
              ) : section === "marketplace" ? (
                <MarketplaceScreen session={session} onBackToCommunity={() => setSection("community")} onOpenMessages={() => setSection("messages")} onSignOut={signOut} />
              ) : section === "messages" ? (
                <MessagingScreen session={session} onBackToMarketplace={() => setSection("marketplace")} onBackToCommunity={() => setSection("community")} />
              ) : section === "notifications" ? (
                <NotificationsScreen session={session} onBackHome={() => setSection("home")} onOpenCommunity={() => setSection("community")} onOpenProfile={() => setSection("profile")} />
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
                const isHome = item.key === "home";
                return (
                  <Pressable
                    key={item.key}
                    accessibilityRole="tab"
                    accessibilityLabel={item.label}
                    accessibilityState={{ selected: active }}
                    onPress={() => setSection(item.key)}
                    style={({ pressed }) => [styles.navItem, isHome && styles.homeNavItem, pressed && styles.navItemPressed]}
                  >
                    <View style={[styles.navGlyphWrap, active && !isHome && styles.navGlyphWrapActive, isHome && styles.homeGlyphWrap]} accessible={false}>
                      <Text style={[styles.navGlyph, active && !isHome && styles.navGlyphActive, isHome && styles.homeGlyph]}>{item.glyph}</Text>
                    </View>
                    <Text numberOfLines={1} style={[styles.navText, active && !isHome && styles.navTextActive, isHome && styles.homeNavText]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : <AuthFlow onAuthenticated={(next) => { setSession(next); setSection("home"); }} />}
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
    alignItems: "flex-end",
    gap: spacing[1],
    minHeight: 76,
    paddingHorizontal: spacing[2],
    paddingTop: spacing[2],
    paddingBottom: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  navItem: {
    flex: 1,
    minHeight: 58,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius.md,
    paddingHorizontal: spacing[1],
    gap: 3,
  },
  homeNavItem: { marginTop: -20, minHeight: 74 },
  navGlyphWrap: {
    minWidth: 30,
    height: 28,
    paddingHorizontal: spacing[2],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
  },
  navGlyphWrapActive: { backgroundColor: "#DFF7EB" },
  homeGlyphWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  navGlyph: { color: colors.text, fontSize: 18, lineHeight: 20, fontWeight: "700" },
  navGlyphActive: { color: colors.primary },
  homeGlyph: { color: colors.onPrimary, fontSize: 24, lineHeight: 28 },
  navItemPressed: { opacity: 0.62 },
  navText: { color: colors.text, fontWeight: "600", fontSize: 10 },
  navTextActive: { color: colors.primary, fontWeight: "800" },
  homeNavText: { color: colors.primary, fontWeight: "800" },
});
