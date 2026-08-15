import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { colors } from "./src/design/tokens";

export default function App() {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.card}>
        <Text style={styles.eyebrow}>SABIWAY</Text>
        <Text style={styles.title}>One community, one trusted platform.</Text>
        <Text style={styles.body}>
          The Phase 1 mobile foundation is connected to the shared SabiWay API contract.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, justifyContent: "center", padding: 24 },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 22, padding: 24, gap: 12 },
  eyebrow: { color: colors.brand, fontSize: 13, fontWeight: "800", letterSpacing: 2 },
  title: { color: colors.text, fontSize: 30, fontWeight: "800", lineHeight: 36 },
  body: { color: colors.muted, fontSize: 16, lineHeight: 24 },
});
