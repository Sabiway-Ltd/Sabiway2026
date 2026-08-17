import { Component, type ErrorInfo, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "./tokens";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) console.error("SabiWay mobile render error", error, info.componentStack);
  }

  private retry = () => this.setState({ hasError: false });

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.screen} accessibilityRole="alert">
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.body}>Your data has not been submitted again. Try reopening this screen.</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Try again"
          onPress={this.retry}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    padding: spacing[6],
    backgroundColor: colors.background,
  },
  title: {
    color: colors.text,
    fontSize: typography.size["2xl"],
    fontWeight: "700",
    marginBottom: spacing[2],
  },
  body: {
    color: colors.textMuted,
    fontSize: typography.size.md,
    lineHeight: 24,
    marginBottom: spacing[6],
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    borderRadius: radius.md,
    paddingHorizontal: spacing[5],
    backgroundColor: colors.primary,
  },
  buttonText: { color: colors.onPrimary, fontSize: typography.size.md, fontWeight: "700" },
});
