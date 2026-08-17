import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type ViewStyle,
} from "react-native";

import { colors, spacing } from "./tokens";

type Props = {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
  keyboardOffset?: number;
  scrollProps?: Omit<ScrollViewProps, "contentContainerStyle">;
};

/**
 * Shared mobile screen primitive for safe keyboard behaviour and consistent
 * page spacing. App.tsx owns the outer SafeAreaView so nested screens do not
 * create conflicting safe-area padding.
 */
export function ScreenScaffold({
  children,
  scroll = true,
  contentStyle,
  keyboardOffset = 0,
  scrollProps,
}: Props) {
  const content = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.content, contentStyle]}
      {...scrollProps}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, styles.flex, contentStyle]}>{children}</View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={keyboardOffset}
    >
      {content}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    backgroundColor: colors.background,
  },
});
