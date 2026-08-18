import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { AuthSession } from "../auth/types";
import { colors, interaction, radius, spacing, typography } from "../design/tokens";

type Props = {
  session: AuthSession;
  onOpenMarketplace: () => void;
  onOpenMessages: () => void;
  onOpenCommunity: () => void;
  onOpenProfile: () => void;
  onOpenVerification: () => void;
  onOpenSabiPay: () => void;
  onOpenNotifications: () => void;
};

const categories = [
  { label: "Cleaning", glyph: "✦" },
  { label: "Plumbing", glyph: "◒" },
  { label: "Tailors", glyph: "✂" },
  { label: "Photography", glyph: "◉" },
  { label: "Electrical", glyph: "ϟ" },
];

export function HomeScreen({
  session,
  onOpenMarketplace,
  onOpenMessages,
  onOpenCommunity,
  onOpenProfile,
  onOpenVerification,
  onOpenSabiPay,
  onOpenNotifications,
}: Props) {
  const firstName = session.user.full_name.trim().split(/\s+/)[0] || "there";
  const isProfessional = session.user.role === "professional";

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen} showsVerticalScrollIndicator={false}>
      <View style={styles.topPanel}>
        <View style={styles.profileRow}>
          <View style={styles.avatarFallback}><Text style={styles.avatarText}>{firstName.slice(0, 1).toUpperCase()}</Text></View>
          <View style={styles.greetingCopy}>
            <Text style={styles.greeting}>Hello, {firstName}</Text>
            <View style={styles.locationPill}><Text style={styles.locationText}>SabiWay {isProfessional ? "Professional" : "Client"}</Text></View>
          </View>
          <View style={styles.headerActions}>
            <Pressable accessibilityRole="button" accessibilityLabel="Messages" onPress={onOpenMessages} style={({ pressed }) => [styles.headerIcon, pressed && styles.pressed]}><Text style={styles.headerIconText}>□</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Notifications" onPress={onOpenNotifications} style={({ pressed }) => [styles.headerIcon, pressed && styles.pressed]}><Text style={styles.headerIconText}>◔</Text><View style={styles.notificationDot} /></Pressable>
          </View>
        </View>

        <Pressable accessibilityRole="search" accessibilityLabel={isProfessional ? "Search for jobs" : "Search for services"} onPress={onOpenMarketplace} style={({ pressed }) => [styles.searchBar, pressed && styles.pressed]}>
          <Text style={styles.searchIcon}>⌕</Text>
          <Text style={styles.searchPlaceholder}>{isProfessional ? "Search for jobs" : "What service do you need?"}</Text>
          <View style={styles.filterButton}><Text style={styles.filterGlyph}>≡</Text></View>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Special Offers</Text>
        <Pressable accessibilityRole="button" onPress={isProfessional ? onOpenMarketplace : onOpenMarketplace} style={({ pressed }) => [styles.offerCard, pressed && styles.pressed]}>
          <View style={styles.offerTag}><Text style={styles.offerTagText}>SPECIAL OFFER</Text></View>
          <Text style={styles.offerTitle}>
            {isProfessional ? "Find more relevant jobs and grow your work on SabiWay." : "Book trusted professionals and manage the work safely in one place."}
          </Text>
          <Text style={styles.offerCopy}>
            {isProfessional ? "Review opportunities, respond quickly and keep your verification ready." : "Search, message, book and use protected SabiPay transactions."}
          </Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeadingRow}>
          <Text style={styles.sectionTitle}>Popular Categories</Text>
          <Pressable accessibilityRole="button" onPress={onOpenMarketplace} style={({ pressed }) => [styles.textAction, pressed && styles.pressed]}><Text style={styles.textActionLabel}>View all</Text></Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {categories.map((category) => (
            <Pressable key={category.label} accessibilityRole="button" accessibilityLabel={`Browse ${category.label}`} onPress={onOpenMarketplace} style={({ pressed }) => [styles.categoryItem, pressed && styles.pressed]}>
              <View style={styles.categoryIcon}><Text style={styles.categoryGlyph}>{category.glyph}</Text></View>
              <Text numberOfLines={1} style={styles.categoryLabel}>{category.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {isProfessional ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended Jobs</Text>
          <Pressable accessibilityRole="button" onPress={onOpenMarketplace} style={({ pressed }) => [styles.jobCard, pressed && styles.pressed]}>
            <View style={styles.rowBetween}><Text style={styles.jobTitle}>Browse open client requests</Text><Text style={styles.chevron}>›</Text></View>
            <Text style={styles.jobCopy}>Find jobs that match your services, location and availability.</Text>
            <Text style={styles.jobMeta}>Open jobs • SabiWay marketplace</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onOpenVerification} style={({ pressed }) => [styles.trustCard, pressed && styles.pressed]}>
            <Text style={styles.trustTitle}>Professional trust status</Text>
            <Text style={styles.trustCopy}>Keep your identity and professional evidence up to date so clients can book with confidence.</Text>
            <Text style={styles.trustAction}>Review verification →</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.section}>
          <View style={styles.sectionHeadingRow}>
            <Text style={styles.sectionTitle}>Services Nearby</Text>
            <Pressable accessibilityRole="button" onPress={onOpenMarketplace} style={({ pressed }) => [styles.postJobButton, pressed && styles.pressed]}><Text style={styles.postJobText}>Post a Job  +</Text></Pressable>
          </View>
          <View style={styles.serviceGrid}>
            <Pressable accessibilityRole="button" onPress={onOpenMarketplace} style={({ pressed }) => [styles.serviceCard, pressed && styles.pressed]}>
              <View style={styles.serviceImagePlaceholder}><Text style={styles.serviceImageGlyph}>⚡</Text></View>
              <Text style={styles.serviceName}>Find an electrician</Text>
              <Text style={styles.serviceMeta}>Verified professionals</Text>
              <Text style={styles.serviceMeta}>Search by location</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onOpenMarketplace} style={({ pressed }) => [styles.serviceCard, pressed && styles.pressed]}>
              <View style={styles.serviceImagePlaceholder}><Text style={styles.serviceImageGlyph}>✦</Text></View>
              <Text style={styles.serviceName}>Book home cleaning</Text>
              <Text style={styles.serviceMeta}>Compare providers</Text>
              <Text style={styles.serviceMeta}>Agree scope first</Text>
            </Pressable>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <View style={styles.quickGrid}>
          <QuickAction label="Messages" caption="Conversations & bookings" onPress={onOpenMessages} />
          <QuickAction label="Community" caption="SabiForum" onPress={onOpenCommunity} />
          <QuickAction label={isProfessional ? "Earnings" : "History"} caption="SabiPay transactions" onPress={onOpenSabiPay} />
          <QuickAction label="Profile" caption="Identity & account" onPress={onOpenProfile} />
        </View>
      </View>
    </ScrollView>
  );
}

function QuickAction({ label, caption, onPress }: { label: string; caption: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.quickCard, pressed && styles.pressed]}>
      <Text style={styles.quickTitle}>{label}</Text>
      <Text style={styles.quickCaption}>{caption}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F7F7F7" },
  content: { paddingBottom: spacing[8], gap: spacing[5] },
  topPanel: {
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[5],
    paddingBottom: spacing[5],
    gap: spacing[4],
  },
  profileRow: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
  avatarFallback: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface, borderWidth: 3, borderColor: "#FFFFFF" },
  avatarText: { color: colors.primary, fontSize: typography.size.xl, fontWeight: "900" },
  greetingCopy: { flex: 1, gap: 4 },
  greeting: { color: colors.onPrimary, fontSize: typography.size.lg, fontWeight: "900" },
  locationPill: { alignSelf: "flex-start", borderRadius: radius.pill, backgroundColor: "#FFFFFF", paddingHorizontal: spacing[3], paddingVertical: 5 },
  locationText: { color: colors.primaryStrong, fontSize: typography.size.xs, fontWeight: "700" },
  headerActions: { flexDirection: "row", gap: spacing[2] },
  headerIcon: { width: interaction.minimumTouchTarget, height: interaction.minimumTouchTarget, alignItems: "center", justifyContent: "center", position: "relative" },
  headerIconText: { color: colors.onPrimary, fontSize: 26, lineHeight: 28, fontWeight: "600" },
  notificationDot: { position: "absolute", right: 5, top: 5, width: 9, height: 9, borderRadius: 5, backgroundColor: "#FF3B30", borderWidth: 1, borderColor: colors.primary },
  searchBar: { minHeight: 56, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.28)", flexDirection: "row", alignItems: "center", gap: spacing[2], paddingLeft: spacing[4], paddingRight: spacing[2] },
  searchIcon: { color: colors.onPrimary, fontSize: 28, lineHeight: 30 },
  searchPlaceholder: { flex: 1, color: "#FFFFFF", fontSize: typography.size.md },
  filterButton: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.25)" },
  filterGlyph: { color: colors.onPrimary, fontSize: 26, lineHeight: 28 },
  section: { paddingHorizontal: spacing[4], gap: spacing[3] },
  sectionHeadingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing[3] },
  sectionTitle: { color: "#111111", fontSize: 22, lineHeight: 28, fontWeight: "800" },
  textAction: { minHeight: interaction.minimumTouchTarget, justifyContent: "center", paddingHorizontal: spacing[2] },
  textActionLabel: { color: "#111111", fontSize: typography.size.sm, fontWeight: "700" },
  offerCard: { minHeight: 150, borderRadius: radius.lg, backgroundColor: colors.primary, padding: spacing[5], overflow: "hidden", justifyContent: "center" },
  offerTag: { alignSelf: "flex-start", borderRadius: 4, backgroundColor: colors.accent, paddingHorizontal: spacing[3], paddingVertical: 5, transform: [{ rotate: "-4deg" }] },
  offerTagText: { color: "#FFFFFF", fontSize: typography.size.xs, fontWeight: "900" },
  offerTitle: { marginTop: spacing[3], maxWidth: 290, color: colors.onPrimary, fontSize: 22, lineHeight: 27, fontWeight: "900" },
  offerCopy: { marginTop: spacing[2], maxWidth: 300, color: "#E8F7F0", fontSize: typography.size.sm, lineHeight: 20 },
  categoryRow: { gap: spacing[3], paddingRight: spacing[4] },
  categoryItem: { width: 82, alignItems: "center", gap: spacing[2] },
  categoryIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  categoryGlyph: { color: colors.primary, fontSize: 25, lineHeight: 28, fontWeight: "800" },
  categoryLabel: { color: "#111111", fontSize: 12, textAlign: "center" },
  serviceGrid: { flexDirection: "row", gap: spacing[3] },
  serviceCard: { flex: 1, minWidth: 0, borderRadius: radius.md, backgroundColor: colors.surface, overflow: "hidden", paddingBottom: spacing[3] },
  serviceImagePlaceholder: { height: 132, backgroundColor: "#E7F7EF", alignItems: "center", justifyContent: "center" },
  serviceImageGlyph: { color: colors.primary, fontSize: 36, lineHeight: 40 },
  serviceName: { color: "#111111", fontSize: typography.size.sm, fontWeight: "800", paddingHorizontal: spacing[3], marginTop: spacing[3] },
  serviceMeta: { color: colors.textMuted, fontSize: typography.size.xs, paddingHorizontal: spacing[3], marginTop: 3 },
  postJobButton: { minHeight: 44, borderRadius: radius.pill, backgroundColor: colors.primary, justifyContent: "center", paddingHorizontal: spacing[4] },
  postJobText: { color: colors.onPrimary, fontSize: typography.size.sm, fontWeight: "800" },
  jobCard: { borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: spacing[4], gap: spacing[2] },
  rowBetween: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing[3] },
  jobTitle: { flex: 1, color: "#111111", fontSize: typography.size.lg, fontWeight: "900" },
  chevron: { color: colors.textMuted, fontSize: 28, lineHeight: 28 },
  jobCopy: { color: colors.textMuted, fontSize: typography.size.sm, lineHeight: 20 },
  jobMeta: { color: colors.primary, fontSize: typography.size.xs, fontWeight: "700" },
  trustCard: { borderRadius: radius.md, backgroundColor: "#FFF8E0", borderWidth: 1, borderColor: "#F2D878", padding: spacing[4], gap: spacing[2] },
  trustTitle: { color: colors.text, fontSize: typography.size.md, fontWeight: "900" },
  trustCopy: { color: colors.textMuted, fontSize: typography.size.sm, lineHeight: 20 },
  trustAction: { color: colors.primary, fontSize: typography.size.sm, fontWeight: "800" },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing[3] },
  quickCard: { width: "48%", minHeight: 86, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: spacing[4], justifyContent: "center", gap: 4 },
  quickTitle: { color: colors.text, fontSize: typography.size.md, fontWeight: "900" },
  quickCaption: { color: colors.textMuted, fontSize: typography.size.xs, lineHeight: 17 },
  pressed: { opacity: 0.7 },
});
