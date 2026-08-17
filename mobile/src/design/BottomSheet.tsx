import type { ReactNode } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { colors, interaction, radius, spacing, typography } from "./tokens";

export function BottomSheet({
  visible,
  title,
  children,
  onDismiss,
  dismissLabel = "Close",
}: {
  visible: boolean;
  title: string;
  children: ReactNode;
  onDismiss: () => void;
  dismissLabel?: string;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} accessibilityLabel="Dismiss sheet" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.sheet} accessibilityViewIsModal>
            <View style={styles.handle} accessibilityElementsHidden />
            <View style={styles.header}>
              <Text accessibilityRole="header" style={styles.title}>{title}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={dismissLabel} onPress={onDismiss} style={styles.dismiss}>
                <Text style={styles.dismissText}>{dismissLabel}</Text>
              </Pressable>
            </View>
            <View style={styles.content}>{children}</View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" },
  safeArea: { width: "100%" },
  sheet: {
    maxHeight: "88%",
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: colors.surface,
    paddingTop: spacing[2],
  },
  handle: { alignSelf: "center", width: 42, height: 4, borderRadius: radius.pill, backgroundColor: colors.border, marginBottom: spacing[2] },
  header: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing[3], paddingHorizontal: spacing[4] },
  title: { flex: 1, color: colors.text, fontSize: typography.size.lg, fontWeight: "700" },
  dismiss: { minHeight: interaction.minimumTouchTarget, justifyContent: "center", paddingHorizontal: spacing[2] },
  dismissText: { color: colors.primary, fontSize: typography.size.sm, fontWeight: "700" },
  content: { paddingHorizontal: spacing[4], paddingBottom: spacing[4] },
});
