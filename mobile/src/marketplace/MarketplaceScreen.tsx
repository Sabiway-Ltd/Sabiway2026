import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import type { AuthSession } from "../auth/types";
import { colors } from "../design/tokens";
import { createBooking, getMarketplaceListings } from "./api";
import type { MarketplaceListing } from "./types";

type Props = {
  session: AuthSession;
  onBackToCommunity: () => void;
  onSignOut: () => void;
};

export function MarketplaceScreen({ session, onBackToCommunity, onSignOut }: Props) {
  const { width } = useWindowDimensions();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MarketplaceListing | null>(null);
  const [message, setMessage] = useState("");
  const contentWidth = Math.min(width - 24, 760);

  const load = useCallback(async () => {
    try {
      setListings(await getMarketplaceListings());
    } catch (error) {
      Alert.alert("Could not load marketplace", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return listings;
    return listings.filter((item) => [item.title, item.description, item.category.name, item.state, item.area, item.provider.full_name]
      .some((value) => value?.toLowerCase().includes(needle)));
  }, [listings, query]);

  const requestBooking = async () => {
    if (!selected) return;
    try {
      await createBooking(session.access, selected.id, message.trim());
      Alert.alert("Request sent", `Your booking request was sent to ${selected.provider.full_name}.`);
      setSelected(null);
      setMessage("");
    } catch (error) {
      Alert.alert("Booking not sent", error instanceof Error ? error.message : "Please try again.");
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.brand} /></View>;
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { width: contentWidth }]}> 
        <View>
          <Text style={styles.eyebrow}>SABIWAY MARKETPLACE</Text>
          <Text style={styles.title}>Find trusted services</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={onBackToCommunity} style={styles.secondaryButton}><Text style={styles.secondaryText}>SabiForum</Text></Pressable>
          <Pressable onPress={onSignOut} style={styles.secondaryButton}><Text style={styles.secondaryText}>Sign out</Text></Pressable>
        </View>
      </View>

      <View style={{ width: contentWidth }}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search services, providers or location"
          placeholderTextColor={colors.muted}
          style={styles.search}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { width: contentWidth }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={<Text style={styles.empty}>No active services match your search yet.</Text>}
        renderItem={({ item }) => (
          <Pressable onPress={() => setSelected(item)} style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.badge}>{item.category.name}</Text>
              <Text style={styles.muted}>{item.delivery_mode.replaceAll("_", " ")}</Text>
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text numberOfLines={3} style={styles.description}>{item.description}</Text>
            <Text style={styles.provider}>{item.provider.full_name}</Text>
            <Text style={styles.muted}>{[item.area, item.state].filter(Boolean).join(", ") || "Location flexible"}</Text>
            <View style={styles.rowBetween}>
              <Text style={styles.price}>{item.currency} {Number(item.price_from).toLocaleString()}+</Text>
              <Text style={styles.actionText}>Request booking</Text>
            </View>
          </Pressable>
        )}
      />

      {selected ? (
        <View style={styles.sheetWrap}>
          <View style={[styles.sheet, { width: contentWidth }]}> 
            <Text style={styles.cardTitle}>Request {selected.title}</Text>
            <Text style={styles.description}>Tell {selected.provider.full_name} what you need. They can accept or decline the request.</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              multiline
              placeholder="Describe the job, timing or anything useful"
              placeholderTextColor={colors.muted}
              style={[styles.search, styles.message]}
            />
            <View style={styles.sheetActions}>
              <Pressable onPress={() => setSelected(null)} style={styles.secondaryButton}><Text style={styles.secondaryText}>Cancel</Text></Pressable>
              <Pressable onPress={requestBooking} style={styles.primaryButton}><Text style={styles.primaryText}>Send request</Text></Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: "center", backgroundColor: colors.background, paddingTop: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  header: { gap: 12, marginBottom: 12 },
  headerActions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  eyebrow: { color: colors.brand, fontWeight: "800", fontSize: 12, letterSpacing: 1.6 },
  title: { color: colors.text, fontWeight: "800", fontSize: 28, marginTop: 2 },
  search: { minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 14, backgroundColor: colors.surface, color: colors.text },
  list: { alignSelf: "center", paddingVertical: 14, gap: 12 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 16, gap: 8 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 6 },
  badge: { alignSelf: "flex-start", backgroundColor: "#E8F5EF", color: colors.brandStrong, fontWeight: "700", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, fontSize: 12 },
  cardTitle: { color: colors.text, fontWeight: "800", fontSize: 18 },
  description: { color: colors.muted, lineHeight: 20 },
  provider: { color: colors.text, fontWeight: "700", marginTop: 4 },
  muted: { color: colors.muted, fontSize: 12 },
  price: { color: colors.text, fontWeight: "800", fontSize: 17 },
  actionText: { color: colors.brand, fontWeight: "700" },
  empty: { color: colors.muted, textAlign: "center", padding: 32 },
  secondaryButton: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: colors.surface },
  secondaryText: { color: colors.text, fontWeight: "700" },
  primaryButton: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 11, backgroundColor: colors.brand },
  primaryText: { color: "#FFFFFF", fontWeight: "800" },
  sheetWrap: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(23,33,27,0.32)", alignItems: "center", justifyContent: "flex-end", paddingBottom: 12 },
  sheet: { backgroundColor: colors.surface, borderRadius: 24, padding: 18, gap: 12, borderWidth: 1, borderColor: colors.border },
  message: { minHeight: 100, textAlignVertical: "top", paddingTop: 12 },
  sheetActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
});
