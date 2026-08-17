import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ImageSourcePropType,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

import { colors, interaction, radius, spacing, typography } from "./tokens";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type SabiButtonProps = Omit<PressableProps, "style" | "children"> & {
  children: ReactNode;
  variant?: ButtonVariant;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function SabiButton({ children, variant = "primary", loading = false, disabled, style, ...props }: SabiButtonProps) {
  const isDisabled = Boolean(disabled || loading);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        buttonVariant[variant],
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {loading ? <ActivityIndicator color={variant === "primary" || variant === "danger" ? colors.onPrimary : colors.text} /> : null}
      <Text style={[styles.buttonText, buttonTextVariant[variant]]}>{children}</Text>
    </Pressable>
  );
}

type SabiFieldProps = TextInputProps & {
  label: string;
  hint?: string;
  error?: string;
};

export function SabiField({ label, hint, error, style, ...props }: SabiFieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={error ?? hint}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, error && styles.inputError, style]}
        {...props}
      />
      {error ? <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export function SabiCard({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

type StatusTone = "neutral" | "success" | "warning" | "danger" | "info";
export function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: StatusTone }) {
  return (
    <View style={[styles.badge, badgeVariant[tone]]} accessibilityLabel={label}>
      <Text style={[styles.badgeText, badgeTextVariant[tone]]}>{label}</Text>
    </View>
  );
}

type StateTone = "empty" | "info" | "warning" | "error" | "success";
export function StatePanel({
  title,
  description,
  action,
  tone = "empty",
}: {
  title: string;
  description: string;
  action?: ReactNode;
  tone?: StateTone;
}) {
  return (
    <View style={[styles.statePanel, stateVariant[tone]]} accessibilityRole={tone === "error" ? "alert" : undefined}>
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateDescription}>{description}</Text>
      {action ? <View style={styles.stateAction}>{action}</View> : null}
    </View>
  );
}

export function Avatar({ source, name, size = 40 }: { source?: ImageSourcePropType; name: string; size?: number }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "SW";
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]} accessibilityElementsHidden>
      {source ? <Image source={source} style={{ width: size, height: size }} /> : <Text style={styles.avatarText}>{initials}</Text>}
    </View>
  );
}

export function SkeletonBlock({ width = "100%", height = 16, style }: { width?: ViewStyle["width"]; height?: number; style?: StyleProp<ViewStyle> }) {
  return <View accessibilityElementsHidden style={[styles.skeleton, { width, height }, style]} />;
}

export function SegmentedTabs<T extends string>({
  items,
  value,
  onChange,
}: {
  items: ReadonlyArray<{ key: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.tabs} accessibilityRole="tablist">
      {items.map((item) => {
        const selected = item.key === value;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(item.key)}
            style={[styles.tab, selected && styles.tabSelected]}
          >
            <Text numberOfLines={1} style={[styles.tabText, selected && styles.tabTextSelected]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const buttonVariant = StyleSheet.create({
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: "#E8F7F0", borderWidth: 1, borderColor: colors.border },
  danger: { backgroundColor: colors.danger },
  ghost: { backgroundColor: "transparent" },
});
const buttonTextVariant = StyleSheet.create({
  primary: { color: colors.onPrimary },
  secondary: { color: colors.primaryStrong },
  danger: { color: colors.onPrimary },
  ghost: { color: colors.text },
});
const badgeVariant = StyleSheet.create({
  neutral: { backgroundColor: colors.surfaceSubtle },
  success: { backgroundColor: "#E8F7F0" },
  warning: { backgroundColor: "#FFF3C4" },
  danger: { backgroundColor: "#FCE8E6" },
  info: { backgroundColor: "#EAF1FF" },
});
const badgeTextVariant = StyleSheet.create({
  neutral: { color: colors.text },
  success: { color: colors.primaryStrong },
  warning: { color: colors.text },
  danger: { color: colors.danger },
  info: { color: colors.info },
});
const stateVariant = StyleSheet.create({
  empty: { borderColor: colors.border },
  info: { borderColor: colors.info },
  warning: { borderColor: colors.warning },
  error: { borderColor: colors.danger },
  success: { borderColor: colors.success },
});
const styles = StyleSheet.create({
  button: {
    minHeight: interaction.minimumTouchTarget,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.pill,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
  },
  buttonText: { fontSize: typography.size.md, fontWeight: "600" },
  pressed: { opacity: 0.78 },
  disabled: { opacity: 0.5 },
  fieldGroup: { gap: spacing[1] },
  label: { color: colors.text, fontSize: typography.size.sm, fontWeight: "600" },
  hint: { color: colors.textMuted, fontSize: typography.size.xs, lineHeight: 18 },
  input: {
    minHeight: interaction.minimumTouchTarget,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: typography.size.md,
  },
  inputError: { borderColor: colors.danger },
  errorText: { color: colors.danger, fontSize: typography.size.sm, fontWeight: "500" },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing[4],
  },
  badge: { alignSelf: "flex-start", minHeight: 24, justifyContent: "center", borderRadius: radius.pill, paddingHorizontal: spacing[2] },
  badgeText: { fontSize: typography.size.xs, fontWeight: "600" },
  statePanel: { borderWidth: 1, borderRadius: radius.lg, backgroundColor: colors.surface, padding: spacing[4] },
  stateTitle: { color: colors.text, fontSize: typography.size.md, fontWeight: "700" },
  stateDescription: { marginTop: spacing[1], color: colors.textMuted, fontSize: typography.size.sm, lineHeight: 21 },
  stateAction: { marginTop: spacing[4] },
  avatar: { overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: "#E8F7F0" },
  avatarText: { color: colors.primaryStrong, fontWeight: "700" },
  skeleton: { borderRadius: radius.sm, backgroundColor: colors.surfaceSubtle },
  tabs: { flexDirection: "row", gap: spacing[1], borderRadius: radius.md, backgroundColor: colors.surfaceSubtle, padding: spacing[1] },
  tab: { flex: 1, minHeight: interaction.minimumTouchTarget, alignItems: "center", justifyContent: "center", borderRadius: radius.sm, paddingHorizontal: spacing[2] },
  tabSelected: { backgroundColor: colors.primary },
  tabText: { color: colors.textMuted, fontSize: typography.size.sm, fontWeight: "600" },
  tabTextSelected: { color: colors.onPrimary },
});
