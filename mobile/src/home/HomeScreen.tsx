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

type Action = {
  title: string;
  description: string;
  onPress: () => void;
  emphasis?: "primary" | "accent";
};

const popularNeeds = ["Cleaning", "Electrical", "Plumbing", "Beauty", "Tutoring", "Tech support"];

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

  const primaryActions: Action[] = isProfessional
    ? [
        {
          title: "Find open jobs",
          description: "Browse client requests that match the work you offer.",
          onPress: onOpenMarketplace,
          emphasis: "primary",
        },
        {
          title: "Check your messages",
          description: "Continue conversations and move agreed work forward.",
          onPress: onOpenMessages,
          emphasis: "accent",
        },
        {
          title: "Build trust",
          description: "Review your profile and professional verification status.",
          onPress: onOpenVerification,
        },
      ]
    : [
        {
          title: "Find a professional",
          description: "Search trusted services by need, category and location.",
          onPress: onOpenMarketplace,
          emphasis: "primary",
        },
        {
          title: "Post a job",
          description: "Describe what you need and let relevant professionals respond.",
          onPress: onOpenMarketplace,
          emphasis: "accent",
        },
        {
          title: "Continue conversations",
          description: "Return to professionals you are already speaking with.",
          onPress: onOpenMessages,
        },
      ];

  const secondaryActions: Action[] = [
    {
      title: "Notifications",
      description: "Updates that need your attention.",
      onPress: onOpenNotifications,
    },
    {
      title: "SabiForum",
      description: "Community knowledge and useful people.",
      onPress: onOpenCommunity,
    },
    {
      title: "Profile",
      description: "Identity, details and trust signals.",
      onPress: onOpenProfile,
    },
    {
      title: "SabiPay",
      description: "Payments and transaction status.",
      onPress: onOpenSabiPay,
    },
  ];

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>{isProfessional ? "PROFESSIONAL HOME" : "CLIENT HOME"}</Text>
        <Text style={styles.title}>Good to see you, {firstName}.</Text>
        <Text style={styles.subtitle}>
          {isProfessional
            ? "Find opportunities, respond faster and keep your SabiWay trust profile ready for clients."
            : "Find the right professional, post work and keep every conversation in one place."}
        </Text>
      </View>

      {!isProfessional ? (
        <View style={styles.section}>
          <View style={styles.sectionHeadingRow}>
            <View style={styles.sectionHeadingCopy}>
              <Text style={styles.sectionEyebrow}>POPULAR NEEDS</Text>
              <Text style={styles.sectionTitle}>Start with what you need</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onOpenMarketplace} style={({ pressed }) => [styles.textAction, pressed && styles.pressed]}>
              <Text style={styles.textActionLabel}>See all</Text>
            </Pressable>
          </View>
          <View style={styles.needGrid}>
            {popularNeeds.map((need) => (
              <Pressable key={need} accessibilityRole="button" accessibilityLabel={`Browse ${need}`} onPress={onOpenMarketplace} style={({ pressed }) => [styles.needChip, pressed && styles.pressed]}>
                <Text style={styles.needChipText}>{need}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionEyebrow}>YOUR NEXT MOVE</Text>
        <Text style={styles.sectionTitle}>{isProfessional ? "Grow your work on SabiWay" : "What do you need today?"}</Text>
        <View style={styles.stack}>
          {primaryActions.map((action) => (
            <Pressable
              key={action.title}
              accessibilityRole="button"
              onPress={action.onPress}
              style={({ pressed }) => [
                styles.actionCard,
                action.emphasis === "primary" && styles.actionCardPrimary,
                action.emphasis === "accent" && styles.actionCardAccent,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.actionTitle, action.emphasis === "primary" && styles.actionTitlePrimary]}>{action.title}</Text>
              <Text style={[styles.actionDescription, action.emphasis === "primary" && styles.actionDescriptionPrimary]}>{action.description}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionEyebrow}>ONE SABIWAY</Text>
        <Text style={styles.sectionTitle}>Everything else stays close</Text>
        <View style={styles.grid}>
          {secondaryActions.map((action) => (
            <Pressable
              key={action.title}
              accessibilityRole="button"
              onPress={action.onPress}
              style={({ pressed }) => [styles.secondaryCard, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryTitle}>{action.title}</Text>
              <Text style={styles.secondaryDescription}>{action.description}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing[3], paddingBottom: spacing[8], gap: spacing[5] },
  hero: {
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    padding: spacing[5],
    gap: spacing[2],
  },
  eyebrow: {
    color: "#DFF7EB",
    fontSize: typography.size.xs,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  title: {
    color: colors.onPrimary,
    fontSize: typography.size["3xl"],
    lineHeight: 36,
    fontWeight: "900",
  },
  subtitle: {
    color: "#E8F7F0",
    fontSize: typography.size.sm,
    lineHeight: 21,
  },
  section: { gap: spacing[3] },
  sectionHeadingRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: spacing[3] },
  sectionHeadingCopy: { flex: 1, gap: spacing[1] },
  sectionEyebrow: {
    color: colors.primary,
    fontSize: typography.size.xs,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.size.xl,
    fontWeight: "900",
  },
  textAction: { minHeight: interaction.minimumTouchTarget, justifyContent: "center", paddingHorizontal: spacing[2] },
  textActionLabel: { color: colors.primary, fontSize: typography.size.sm, fontWeight: "800" },
  needGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  needChip: {
    minHeight: interaction.minimumTouchTarget,
    justifyContent: "center",
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[3],
  },
  needChipText: { color: colors.text, fontSize: typography.size.sm, fontWeight: "700" },
  stack: { gap: spacing[3] },
  actionCard: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing[4],
    justifyContent: "center",
    gap: spacing[2],
  },
  actionCardPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  actionCardAccent: { backgroundColor: colors.accent, borderColor: colors.accent },
  actionTitle: { color: colors.text, fontSize: typography.size.lg, fontWeight: "900" },
  actionTitlePrimary: { color: colors.onPrimary },
  actionDescription: { color: colors.textMuted, fontSize: typography.size.sm, lineHeight: 20 },
  actionDescriptionPrimary: { color: "#E8F7F0" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing[3] },
  secondaryCard: {
    width: "48%",
    minHeight: interaction.minimumTouchTarget * 2.4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing[4],
    justifyContent: "center",
    gap: spacing[1],
  },
  secondaryTitle: { color: colors.text, fontSize: typography.size.md, fontWeight: "900" },
  secondaryDescription: { color: colors.textMuted, fontSize: typography.size.xs, lineHeight: 18 },
  pressed: { opacity: 0.72 },
});
