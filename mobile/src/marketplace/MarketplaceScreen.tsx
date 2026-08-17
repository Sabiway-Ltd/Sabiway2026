import { useCallback, useEffect, useState } from "react";
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
import { getMarketplaceCategories, getMarketplaceJobs, getMarketplaceListings, respondToMarketplaceJob } from "./api";
import { MarketplaceCreateSheet } from "./MarketplaceCreateSheet";
import type { MarketplaceCategory, MarketplaceJob, MarketplaceListing } from "./types";

type Props = {
  session: AuthSession;
  onBackToCommunity: () => void;
  onSignOut: () => void;
};

type Tab = "services" | "jobs";

type FeedItem =
  | { kind: "service"; data: MarketplaceListing }
  | { kind: "job"; data: MarketplaceJob };

export function MarketplaceScreen({ session, onBackToCommunity, onSignOut }: Props) {
  const { width } = useWindowDimensions();
  const [tab, setTab] = useState<Tab>("services");
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [jobs, setJobs] = useState<MarketplaceJob[]>([]);
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [selectedService, setSelectedService] = useState<MarketplaceListing | null>(null);
  const [selectedJob, setSelectedJob] = useState<MarketplaceJob | null>(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [proposedPrice, setProposedPrice] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const contentWidth = Math.min(width - 24, 760);

  const load = useCallback(async (searchQuery = "", searchLocation = "") => {
    setLoadError("");
    try {
      const filters = {
        q: searchQuery.trim() || undefined,
        location: searchLocation.trim() || undefined,
      };
      const [nextListings, nextJobs, nextCategories] = await Promise.all([
        getMarketplaceListings(filters),
        getMarketplaceJobs(filters),
        getMarketplaceCategories(),
      ]);
      setListings(nextListings);
      setJobs(nextJobs);
      setCategories(nextCategories);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load the marketplace. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const feed: FeedItem[] = tab === "services"
    ? listings.map((data) => ({ kind: "service" as const, data }))
    : jobs.map((data) => ({ kind: "job" as const, data }));

  const runSearch = () => {
    setRefreshing(true);
    void load(query, location);
  };

  const sendJobResponse = async () => {
    if (!selectedJob || !responseMessage.trim()) return;
    try {
      await respondToMarketplaceJob(session.access, selectedJob.id, responseMessage.trim(), proposedPrice.trim() || undefined);
      Alert.alert("Response sent", "The client can now review your response.");
      setSelectedJob(null);
      setResponseMessage("");
      setProposedPrice("");
    } catch (error) {
      Alert.alert("Response not sent", error instanceof Error ? error.message : "Please try again.");
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.brand} /></View>;
  }

  const roleAction = session.user.role === "professional" ? "Offer a service" : "Post a job";

  return (
    <View style={styles.screen}>
      <View style={[styles.hero, { width: contentWidth }]}>
        <View style={styles.heroTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>SABIWAY MARKETPLACE</Text>
            <Text style={styles.title}>Find trusted Nigerian professionals</Text>
            <Text style={styles.subtitle}>Search what you need, filter by location, or browse open jobs.</Text>
          </View>
          <Pressable onPress={onBackToCommunity} style={styles.heroButton}><Text style={styles.heroButtonText}>SabiForum</Text></Pressable>
        </View>
        <TextInput value={query} onChangeText={setQuery} onSubmitEditing={runSearch} returnKeyType="search" placeholder="What service or problem do you have?" placeholderTextColor={colors.muted} style={styles.search} accessibilityLabel="Search services and jobs" />
        <TextInput value={location} onChangeText={setLocation} onSubmitEditing={runSearch} returnKeyType="search" placeholder="City, state, area or country" placeholderTextColor={colors.muted} style={styles.search} accessibilityLabel="Search marketplace by location" />
        <Pressable onPress={runSearch} disabled={refreshing} accessibilityRole="button" accessibilityLabel="Search marketplace" style={[styles.searchButton, refreshing && styles.buttonDisabled]}>
          <Text style={styles.searchButtonText}>{refreshing ? "Searching…" : "Search"}</Text>
        </Pressable>
      </View>

      {loadError ? (
        <View style={[styles.errorCard, { width: contentWidth }]} accessibilityRole="alert">
          <Text style={styles.errorText}>{loadError}</Text>
          <Pressable onPress={runSearch} accessibilityRole="button" style={styles.retryButton}><Text style={styles.retryText}>Try again</Text></Pressable>
        </View>
      ) : null}

      <View style={[styles.tabs, { width: contentWidth }]} accessibilityRole="tablist">
        <Pressable accessibilityRole="tab" accessibilityState={{ selected: tab === "services" }} onPress={() => setTab("services")} style={[styles.tab, tab === "services" && styles.tabActive]}><Text style={[styles.tabText, tab === "services" && styles.tabTextActive]}>Find services</Text></Pressable>
        <Pressable accessibilityRole="tab" accessibilityState={{ selected: tab === "jobs" }} onPress={() => setTab("jobs")} style={[styles.tab, tab === "jobs" && styles.tabActive]}><Text style={[styles.tabText, tab === "jobs" && styles.tabTextActive]}>Open jobs</Text></Pressable>
      </View>

      <Pressable onPress={() => setShowCreate(true)} style={[styles.createButton, { width: contentWidth }]}>
        <Text style={styles.createButtonText}>{roleAction}</Text>
        <Text style={styles.createButtonHint}>{session.user.role === "professional" ? "Publish your expertise for clients to discover" : "Describe the work and receive professional responses"}</Text>
      </Pressable>

      <FlatList
        data={feed}
        keyExtractor={(item) => `${item.kind}-${item.data.id}`}
        contentContainerStyle={[styles.list, { width: contentWidth }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(query, location); }} />}
        ListEmptyComponent={!loadError ? <Text accessibilityRole="text" style={styles.empty}>No marketplace results match your search yet. Try another service or location.</Text> : null}
        renderItem={({ item }) => item.kind === "service" ? (
          <Pressable onPress={() => setSelectedService(item.data)} style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.badge}>{item.data.category.name}</Text>
              {item.data.available_now ? <Text style={styles.available}>Available now</Text> : null}
            </View>
            <Text style={styles.cardTitle}>{item.data.title}</Text>
            <Text numberOfLines={3} style={styles.description}>{item.data.description}</Text>
            <Text style={styles.provider}>{item.data.provider.full_name}</Text>
            <Text style={styles.muted}>{item.data.provider.job || "SabiWay professional"}</Text>
            <Text style={styles.locationText}>{[item.data.area, item.data.city, item.data.state, item.data.country].filter(Boolean).join(", ") || "Location flexible"}</Text>
            <View style={styles.rowBetween}>
              <Text style={styles.price}>{item.data.currency} {Number(item.data.price_from).toLocaleString()}+</Text>
              <Text style={styles.actionText}>View provider</Text>
            </View>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => session.user.role === "professional" ? setSelectedJob(item.data) : Alert.alert("Open job", "Professional profiles can respond to this job.")}
            style={styles.card}
          >
            <View style={styles.rowBetween}>
              <Text style={styles.badge}>{item.data.category.name}</Text>
              <Text style={styles.muted}>{item.data.response_count} responses</Text>
            </View>
            <Text style={styles.cardTitle}>{item.data.title}</Text>
            <Text numberOfLines={3} style={styles.description}>{item.data.description}</Text>
            <Text style={styles.locationText}>{[item.data.city, item.data.state, item.data.country].filter(Boolean).join(", ") || "Location flexible"}</Text>
            <View style={styles.rowBetween}>
              <Text style={styles.price}>{item.data.budget_min || item.data.budget_max ? `${item.data.currency} ${Number(item.data.budget_min || 0).toLocaleString()}–${Number(item.data.budget_max || item.data.budget_min || 0).toLocaleString()}` : "Open to quote"}</Text>
              <Text style={styles.actionText}>{session.user.role === "professional" ? "Respond" : "View job"}</Text>
            </View>
          </Pressable>
        )}
      />

      <Pressable onPress={onSignOut} style={[styles.signOut, { width: contentWidth }]}><Text style={styles.secondaryText}>Sign out</Text></Pressable>

      {selectedService ? (
        <View style={styles.sheetWrap}>
          <View style={[styles.sheet, { width: contentWidth }]}>
            <Text style={styles.badge}>{selectedService.category.name}</Text>
            <Text style={styles.cardTitle}>{selectedService.title}</Text>
            <Text style={styles.description}>{selectedService.description}</Text>
            <Text style={styles.provider}>{selectedService.provider.full_name}</Text>
            <Text style={styles.locationText}>{[selectedService.area, selectedService.city, selectedService.state, selectedService.country].filter(Boolean).join(", ") || "Location flexible"}</Text>
            {selectedService.availability_text ? <Text style={styles.muted}>{selectedService.availability_text}</Text> : null}
            <Text style={styles.phaseNote}>Messaging, negotiation and booking are delivered in Phase 5.</Text>
            <Pressable onPress={() => setSelectedService(null)} style={styles.primaryButton}><Text style={styles.primaryText}>Close</Text></Pressable>
          </View>
        </View>
      ) : null}

      {selectedJob ? (
        <View style={styles.sheetWrap}>
          <View style={[styles.sheet, { width: contentWidth }]}>
            <Text style={styles.badge}>Professional response</Text>
            <Text style={styles.cardTitle}>{selectedJob.title}</Text>
            <TextInput value={responseMessage} onChangeText={setResponseMessage} multiline placeholder="Explain how you can help and your availability" placeholderTextColor={colors.muted} style={[styles.search, styles.message]} />
            <TextInput value={proposedPrice} onChangeText={setProposedPrice} keyboardType="numeric" placeholder="Proposed price in NGN (optional)" placeholderTextColor={colors.muted} style={styles.search} />
            <View style={styles.sheetActions}>
              <Pressable onPress={() => setSelectedJob(null)} style={styles.secondaryButton}><Text style={styles.secondaryText}>Cancel</Text></Pressable>
              <Pressable onPress={sendJobResponse} style={styles.primaryButton}><Text style={styles.primaryText}>Send response</Text></Pressable>
            </View>
          </View>
        </View>
      ) : null}

      {showCreate ? (
        <MarketplaceCreateSheet
          access={session.access}
          role={session.user.role}
          categories={categories}
          width={contentWidth}
          onClose={() => setShowCreate(false)}
          onServiceCreated={(listing) => setListings((current) => [listing, ...current])}
          onJobCreated={(job) => setJobs((current) => [job, ...current])}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: "center", backgroundColor: "#F7FAF8" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F7FAF8" },
  hero: { backgroundColor: colors.brand, borderRadius: 22, padding: 16, gap: 10, marginTop: 10 },
  heroTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  heroButton: { backgroundColor: "#FFB800", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  heroButtonText: { color: "#173126", fontWeight: "800", fontSize: 12 },
  eyebrow: { color: "#D9FFEA", fontWeight: "800", fontSize: 11, letterSpacing: 1.4 },
  title: { color: "#FFFFFF", fontWeight: "900", fontSize: 27, lineHeight: 32, marginTop: 3 },
  subtitle: { color: "#E7F7EF", lineHeight: 20, marginTop: 5 },
  search: { minHeight: 48, borderWidth: 1, borderColor: "#D9E4DD", borderRadius: 12, paddingHorizontal: 14, backgroundColor: "#FFFFFF", color: "#173126" },
  searchButton: { minHeight: 48, borderRadius: 12, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  searchButtonText: { color: colors.onAccent, fontWeight: "900" },
  buttonDisabled: { opacity: 0.62 },
  errorCard: { marginTop: 10, borderWidth: 1, borderColor: "#F0B7B1", backgroundColor: "#FFF1F0", borderRadius: 12, padding: 12, gap: 10 },
  errorText: { color: "#8F2119", fontWeight: "700", lineHeight: 20 },
  retryButton: { minHeight: 44, alignSelf: "flex-start", justifyContent: "center", borderRadius: 10, borderWidth: 1, borderColor: "#D99891", paddingHorizontal: 14 },
  retryText: { color: "#8F2119", fontWeight: "900" },
  tabs: { flexDirection: "row", backgroundColor: "#EAF4EF", borderRadius: 12, padding: 4, marginTop: 12 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 9 },
  tabActive: { backgroundColor: "#FFFFFF" },
  tabText: { color: "#607168", fontWeight: "800" },
  tabTextActive: { color: colors.brand },
  createButton: { borderRadius: 14, backgroundColor: "#FFB800", paddingHorizontal: 15, paddingVertical: 11, marginTop: 10 },
  createButtonText: { color: "#173126", fontWeight: "900", fontSize: 15 },
  createButtonHint: { color: "#604D0C", fontSize: 11, marginTop: 2 },
  list: { alignSelf: "center", paddingVertical: 12, gap: 12 },
  card: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DDE7E1", borderRadius: 18, padding: 16, gap: 7 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  badge: { alignSelf: "flex-start", backgroundColor: "#FFF5D6", color: "#775700", fontWeight: "800", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, fontSize: 12 },
  available: { color: colors.brand, backgroundColor: "#E8F7F0", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, fontWeight: "800", fontSize: 11 },
  cardTitle: { color: "#173126", fontWeight: "900", fontSize: 19 },
  description: { color: "#66756D", lineHeight: 20 },
  provider: { color: "#173126", fontWeight: "800", marginTop: 4 },
  muted: { color: "#6C7A72", fontSize: 12 },
  locationText: { color: "#5F6E66", fontSize: 13 },
  price: { color: "#173126", fontWeight: "900", fontSize: 16 },
  actionText: { color: colors.brand, fontWeight: "800" },
  empty: { color: "#6C7A72", textAlign: "center", padding: 32 },
  signOut: { borderWidth: 1, borderColor: "#DDE7E1", borderRadius: 12, padding: 12, alignItems: "center", marginBottom: 10, backgroundColor: "#FFFFFF" },
  secondaryButton: { borderWidth: 1, borderColor: "#DDE7E1", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, backgroundColor: "#FFFFFF" },
  secondaryText: { color: "#173126", fontWeight: "800" },
  primaryButton: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.brand, alignItems: "center" },
  primaryText: { color: "#FFFFFF", fontWeight: "900" },
  sheetWrap: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(23,49,38,0.38)", alignItems: "center", justifyContent: "flex-end", paddingBottom: 12 },
  sheet: { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 18, gap: 12, borderWidth: 1, borderColor: "#DDE7E1" },
  message: { minHeight: 110, textAlignVertical: "top", paddingTop: 12 },
  sheetActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
  phaseNote: { backgroundColor: "#FFF7DC", color: "#5F4A00", borderRadius: 10, padding: 10, fontSize: 12, lineHeight: 18, fontWeight: "700" },
});