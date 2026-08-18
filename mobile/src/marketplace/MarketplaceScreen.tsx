import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import type { AuthSession } from "../auth/types";
import { colors } from "../design/tokens";
import {
  getMarketplaceCategories,
  getMarketplaceJobs,
  getMarketplaceListings,
  respondToMarketplaceJob,
  startJobResponseConversation,
  startServiceConversation,
} from "./api";
import { MarketplaceCreateSheet } from "./MarketplaceCreateSheet";
import type { MarketplaceCategory, MarketplaceJob, MarketplaceListing } from "./types";

type Props = {
  session: AuthSession;
  onBackToCommunity: () => void;
  onOpenMessages: () => void;
  onSignOut: () => void;
};

type Tab = "services" | "jobs";
type FeedItem = { kind: "service"; data: MarketplaceListing } | { kind: "job"; data: MarketplaceJob };

const categoryGlyphs = ["⚡", "🔧", "🧹", "✂", "💄", "📚", "💻", "🛠"];

export function MarketplaceScreen({ session, onBackToCommunity, onOpenMessages, onSignOut }: Props) {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 24, 760);
  const [tab, setTab] = useState<Tab>(session.user.role === "professional" ? "jobs" : "services");
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [jobs, setJobs] = useState<MarketplaceJob[]>([]);
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [availableNow, setAvailableNow] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<"in_person" | "remote" | "both" | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedService, setSelectedService] = useState<MarketplaceListing | null>(null);
  const [selectedJob, setSelectedJob] = useState<MarketplaceJob | null>(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [proposedPrice, setProposedPrice] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [starting, setStarting] = useState(false);

  const load = useCallback(async () => {
    setLoadError("");
    try {
      const filters = {
        q: query.trim() || undefined,
        location: location.trim() || undefined,
        category: selectedCategory,
        availableNow: availableNow || undefined,
        deliveryMode,
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
  }, [availableNow, deliveryMode, location, query, selectedCategory]);

  useEffect(() => { void load(); }, [load]);

  const feed: FeedItem[] = tab === "services"
    ? listings.map((data) => ({ kind: "service" as const, data }))
    : jobs.map((data) => ({ kind: "job" as const, data }));

  const activeFilterCount = [selectedCategory, availableNow ? "yes" : undefined, deliveryMode, location.trim() || undefined].filter(Boolean).length;
  const roleAction = session.user.role === "professional" ? "Offer a service" : "Post a job";
  const heading = session.user.role === "professional" ? "Find jobs that fit your skills" : "What service do you need?";
  const helper = session.user.role === "professional" ? "Search client requests, compare details and respond from one place." : "Browse trusted professionals by service, location and availability.";

  const runSearch = () => { setRefreshing(true); void load(); };
  const resetFilters = () => {
    setSelectedCategory(undefined);
    setAvailableNow(false);
    setDeliveryMode(undefined);
    setLocation("");
  };

  const openServiceConversation = async () => {
    if (!selectedService || session.user.role === "professional") return;
    setStarting(true);
    try {
      await startServiceConversation(session.access, selectedService.id);
      setSelectedService(null);
      onOpenMessages();
    } catch (error) {
      Alert.alert("Conversation not started", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setStarting(false);
    }
  };

  const sendJobResponse = async () => {
    if (!selectedJob || !responseMessage.trim()) return;
    setStarting(true);
    try {
      const response = await respondToMarketplaceJob(session.access, selectedJob.id, responseMessage.trim(), proposedPrice.trim() || undefined);
      await startJobResponseConversation(session.access, response.id);
      setSelectedJob(null);
      setResponseMessage("");
      setProposedPrice("");
      onOpenMessages();
    } catch (error) {
      Alert.alert("Response not sent", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setStarting(false);
    }
  };

  const categoryItems = useMemo(() => categories.slice(0, 8), [categories]);

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.brand} /></View>;

  return (
    <View style={styles.screen}>
      <FlatList
        data={feed}
        keyExtractor={(item) => `${item.kind}-${item.data.id}`}
        style={{ width: "100%" }}
        contentContainerStyle={[styles.list, { width: contentWidth }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={runSearch} />}
        ListHeaderComponent={(
          <>
            <View style={styles.hero}>
              <View style={styles.heroTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.greeting}>{heading}</Text>
                  <Text style={styles.helper}>{helper}</Text>
                </View>
                <Pressable accessibilityRole="button" onPress={onOpenMessages} style={styles.headerIcon}><Text style={styles.headerIconText}>✉</Text></Pressable>
                <Pressable accessibilityRole="button" onPress={onBackToCommunity} style={styles.headerIcon}><Text style={styles.headerIconText}>◉</Text></Pressable>
              </View>
              <View style={styles.searchRow}>
                <Text style={styles.searchGlyph}>⌕</Text>
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  onSubmitEditing={runSearch}
                  returnKeyType="search"
                  placeholder={session.user.role === "professional" ? "Search for jobs" : "Search services"}
                  placeholderTextColor="#6B6B6B"
                  style={styles.searchInput}
                  accessibilityLabel="Search marketplace"
                />
                <Pressable accessibilityRole="button" accessibilityLabel="Open filters" onPress={() => setShowFilters(true)} style={styles.filterButton}>
                  <Text style={styles.filterGlyph}>≡</Text>
                  {activeFilterCount ? <View style={styles.filterBadge}><Text style={styles.filterBadgeText}>{activeFilterCount}</Text></View> : null}
                </Pressable>
              </View>
            </View>

            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Popular Categories</Text><Pressable onPress={() => setSelectedCategory(undefined)}><Text style={styles.seeAll}>See all</Text></Pressable></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRail}>
              <Pressable onPress={() => setSelectedCategory(undefined)} style={styles.categoryItem}><View style={[styles.categoryCircle, !selectedCategory && styles.categoryCircleActive]}><Text style={styles.categoryGlyph}>⌂</Text></View><Text style={styles.categoryLabel}>All</Text></Pressable>
              {categoryItems.map((category, index) => {
                const active = selectedCategory === category.slug;
                return (
                  <Pressable key={category.id} onPress={() => setSelectedCategory(active ? undefined : category.slug)} style={styles.categoryItem}>
                    <View style={[styles.categoryCircle, active && styles.categoryCircleActive]}><Text style={styles.categoryGlyph}>{categoryGlyphs[index % categoryGlyphs.length]}</Text></View>
                    <Text numberOfLines={1} style={[styles.categoryLabel, active && styles.categoryLabelActive]}>{category.name}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.modeTabs} accessibilityRole="tablist">
              <Pressable accessibilityRole="tab" accessibilityState={{ selected: tab === "services" }} onPress={() => setTab("services")} style={[styles.modeTab, tab === "services" && styles.modeTabActive]}><Text style={[styles.modeText, tab === "services" && styles.modeTextActive]}>Services</Text></Pressable>
              <Pressable accessibilityRole="tab" accessibilityState={{ selected: tab === "jobs" }} onPress={() => setTab("jobs")} style={[styles.modeTab, tab === "jobs" && styles.modeTabActive]}><Text style={[styles.modeText, tab === "jobs" && styles.modeTextActive]}>{session.user.role === "professional" ? "Recommended Jobs" : "Job Requests"}</Text></Pressable>
            </View>

            <View style={styles.primaryActions}>
              <Pressable onPress={() => setShowCreate(true)} style={styles.postButton}><Text style={styles.postButtonText}>＋ {roleAction}</Text></Pressable>
              <Pressable onPress={runSearch} style={styles.refreshButton}><Text style={styles.refreshText}>Refresh</Text></Pressable>
            </View>

            {loadError ? <View style={styles.errorCard} accessibilityRole="alert"><Text style={styles.errorText}>{loadError}</Text><Pressable onPress={runSearch}><Text style={styles.retryText}>Try again</Text></Pressable></View> : null}
            <View style={styles.resultsHeader}><Text style={styles.resultsTitle}>{tab === "services" ? "Professionals & Services" : "Jobs"}</Text><Text style={styles.resultCount}>{feed.length} results</Text></View>
          </>
        )}
        ListEmptyComponent={!loadError ? <View style={styles.emptyCard}><Text style={styles.emptyTitle}>Nothing matches yet</Text><Text style={styles.empty}>Try another category, location or search term.</Text></View> : null}
        renderItem={({ item }) => item.kind === "service" ? (
          <Pressable accessibilityRole="button" onPress={() => setSelectedService(item.data)} style={styles.card}>
            <View style={styles.cardAvatar}><Text style={styles.cardAvatarText}>{item.data.provider.full_name.slice(0, 1).toUpperCase()}</Text></View>
            <View style={styles.cardBody}>
              <View style={styles.rowBetween}><Text numberOfLines={1} style={styles.cardTitle}>{item.data.provider.full_name}</Text>{item.data.available_now ? <Text style={styles.available}>Available</Text> : null}</View>
              <Text style={styles.serviceName}>{item.data.title}</Text>
              <Text style={styles.meta}>{item.data.category.name} · {[item.data.area, item.data.city, item.data.state].filter(Boolean).join(", ") || "Flexible location"}</Text>
              <View style={styles.rowBetween}><Text style={styles.price}>{item.data.currency} {Number(item.data.price_from).toLocaleString()}+</Text><Text style={styles.actionText}>View profile ›</Text></View>
            </View>
          </Pressable>
        ) : (
          <Pressable accessibilityRole="button" onPress={() => session.user.role === "professional" ? setSelectedJob(item.data) : Alert.alert("Job request", "Professional profiles can respond to this job.")} style={styles.jobCard}>
            <View style={styles.jobHeader}><View style={styles.jobIcon}><Text style={styles.jobIconText}>⌂</Text></View><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{item.data.title}</Text><Text style={styles.meta}>{item.data.category.name} · {[item.data.city, item.data.state].filter(Boolean).join(", ") || "Flexible location"}</Text></View></View>
            <Text numberOfLines={2} style={styles.description}>{item.data.description}</Text>
            <View style={styles.rowBetween}><Text style={styles.price}>{item.data.budget_min || item.data.budget_max ? `${item.data.currency} ${Number(item.data.budget_min || 0).toLocaleString()}–${Number(item.data.budget_max || item.data.budget_min || 0).toLocaleString()}` : "Open to quote"}</Text><Text style={styles.responseCount}>{item.data.response_count} responses</Text></View>
            <Text style={styles.actionText}>{session.user.role === "professional" ? "View & respond ›" : "View job ›"}</Text>
          </Pressable>
        )}
        ListFooterComponent={<Pressable onPress={onSignOut} style={styles.signOut}><Text style={styles.signOutText}>Sign out</Text></Pressable>}
      />

      <Modal visible={showFilters} transparent animationType="slide" onRequestClose={() => setShowFilters(false)}>
        <View style={styles.modalBackdrop}><View style={[styles.filterSheet, { width: contentWidth }]}> 
          <View style={styles.rowBetween}><Text style={styles.filterTitle}>Filters</Text><Pressable onPress={resetFilters}><Text style={styles.resetText}>Reset all</Text></Pressable></View>
          <Text style={styles.filterLabel}>Location</Text>
          <TextInput value={location} onChangeText={setLocation} placeholder="City, state or area" placeholderTextColor="#777" style={styles.sheetInput} />
          <Text style={styles.filterLabel}>Type</Text>
          <View style={styles.choiceRow}>{([undefined, "in_person", "remote", "both"] as const).map((value) => <Pressable key={value ?? "all"} onPress={() => setDeliveryMode(value)} style={[styles.choice, deliveryMode === value && styles.choiceActive]}><Text style={[styles.choiceText, deliveryMode === value && styles.choiceTextActive]}>{value === undefined ? "All" : value === "in_person" ? "In person" : value === "remote" ? "Remote" : "Both"}</Text></Pressable>)}</View>
          <Text style={styles.filterLabel}>Availability</Text>
          <Pressable onPress={() => setAvailableNow((current) => !current)} style={[styles.choice, availableNow && styles.choiceActive]}><Text style={[styles.choiceText, availableNow && styles.choiceTextActive]}>Available now</Text></Pressable>
          <Pressable onPress={() => { setShowFilters(false); runSearch(); }} style={styles.applyButton}><Text style={styles.applyText}>Apply Filter</Text></Pressable>
        </View></View>
      </Modal>

      {selectedService ? <Modal visible transparent animationType="slide" onRequestClose={() => setSelectedService(null)}><View style={styles.modalBackdrop}><View style={[styles.detailSheet, { width: contentWidth }]}><Text style={styles.detailEyebrow}>{selectedService.category.name}</Text><Text style={styles.detailTitle}>{selectedService.title}</Text><Text style={styles.provider}>{selectedService.provider.full_name}</Text><Text style={styles.description}>{selectedService.description}</Text><Text style={styles.meta}>{[selectedService.area, selectedService.city, selectedService.state, selectedService.country].filter(Boolean).join(", ") || "Flexible location"}</Text><Text style={styles.detailPrice}>{selectedService.currency} {Number(selectedService.price_from).toLocaleString()}+</Text><View style={styles.sheetActions}><Pressable onPress={() => setSelectedService(null)} style={styles.secondaryButton}><Text style={styles.secondaryText}>Close</Text></Pressable>{session.user.role === "client" ? <Pressable disabled={starting} onPress={openServiceConversation} style={[styles.primaryButton, starting && styles.disabled]}><Text style={styles.primaryText}>{starting ? "Opening…" : "Message professional"}</Text></Pressable> : null}</View></View></View></Modal> : null}

      {selectedJob ? <Modal visible transparent animationType="slide" onRequestClose={() => setSelectedJob(null)}><View style={styles.modalBackdrop}><View style={[styles.detailSheet, { width: contentWidth }]}><Text style={styles.detailEyebrow}>Job information</Text><Text style={styles.detailTitle}>{selectedJob.title}</Text><Text style={styles.description}>{selectedJob.description}</Text><Text style={styles.meta}>{[selectedJob.city, selectedJob.state, selectedJob.country].filter(Boolean).join(", ") || "Flexible location"}</Text><Text style={styles.detailPrice}>{selectedJob.budget_min || selectedJob.budget_max ? `${selectedJob.currency} ${Number(selectedJob.budget_min || 0).toLocaleString()}–${Number(selectedJob.budget_max || selectedJob.budget_min || 0).toLocaleString()}` : "Open to quote"}</Text><TextInput value={responseMessage} onChangeText={setResponseMessage} multiline placeholder="Explain how you can help and your availability" placeholderTextColor={colors.muted} style={[styles.sheetInput, styles.message]} /><TextInput value={proposedPrice} onChangeText={setProposedPrice} keyboardType="numeric" placeholder="Your price in NGN (optional)" placeholderTextColor={colors.muted} style={styles.sheetInput} /><View style={styles.sheetActions}><Pressable onPress={() => setSelectedJob(null)} style={styles.secondaryButton}><Text style={styles.secondaryText}>Cancel</Text></Pressable><Pressable disabled={starting || !responseMessage.trim()} onPress={sendJobResponse} style={[styles.primaryButton, (starting || !responseMessage.trim()) && styles.disabled]}><Text style={styles.primaryText}>{starting ? "Opening…" : "Send response"}</Text></Pressable></View></View></View></Modal> : null}

      {showCreate ? <MarketplaceCreateSheet access={session.access} role={session.user.role} categories={categories} width={contentWidth} onClose={() => setShowCreate(false)} onServiceCreated={(listing) => setListings((current) => [listing, ...current])} onJobCreated={(job) => setJobs((current) => [job, ...current])} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: "center", backgroundColor: "#F6F6F6" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F6F6F6" },
  list: { alignSelf: "center", paddingBottom: 28 },
  hero: { backgroundColor: colors.brand, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 22, gap: 16 },
  heroTop: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  greeting: { color: "#FFFFFF", fontWeight: "900", fontSize: 24, lineHeight: 30 },
  helper: { color: "#DDF6E9", marginTop: 5, lineHeight: 19, fontSize: 13 },
  headerIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,.15)", alignItems: "center", justifyContent: "center" },
  headerIconText: { color: "#FFFFFF", fontWeight: "900", fontSize: 17 },
  searchRow: { minHeight: 48, borderRadius: 12, backgroundColor: "#FFFFFF", flexDirection: "row", alignItems: "center", paddingLeft: 12 },
  searchGlyph: { color: "#353535", fontSize: 20, marginRight: 8 },
  searchInput: { flex: 1, minHeight: 48, color: "#1D1D1D", fontSize: 15 },
  filterButton: { width: 48, minHeight: 48, alignItems: "center", justifyContent: "center", position: "relative" },
  filterGlyph: { color: colors.brand, fontSize: 22, fontWeight: "900" },
  filterBadge: { position: "absolute", top: 6, right: 5, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: "#FFB800", alignItems: "center", justifyContent: "center" },
  filterBadgeText: { fontSize: 9, fontWeight: "900", color: "#173126" },
  sectionHeader: { marginTop: 20, paddingHorizontal: 4, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { color: "#202020", fontSize: 18, fontWeight: "900" },
  seeAll: { color: colors.brand, fontSize: 13, fontWeight: "800" },
  categoryRail: { gap: 14, paddingVertical: 14, paddingHorizontal: 2 },
  categoryItem: { width: 66, alignItems: "center", gap: 6 },
  categoryCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DDE6E1", alignItems: "center", justifyContent: "center" },
  categoryCircleActive: { backgroundColor: "#DDF6E9", borderColor: colors.brand },
  categoryGlyph: { fontSize: 18 },
  categoryLabel: { color: "#4E5A54", fontSize: 10, fontWeight: "700", textAlign: "center" },
  categoryLabelActive: { color: colors.brand, fontWeight: "900" },
  modeTabs: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#E2E2E2", marginTop: 4 },
  modeTab: { flex: 1, alignItems: "center", paddingVertical: 11, borderBottomWidth: 2, borderBottomColor: "transparent" },
  modeTabActive: { borderBottomColor: colors.brand },
  modeText: { color: "#747474", fontSize: 13, fontWeight: "700" },
  modeTextActive: { color: colors.brand, fontWeight: "900" },
  primaryActions: { flexDirection: "row", gap: 8, marginTop: 12 },
  postButton: { flex: 1, minHeight: 46, borderRadius: 23, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
  postButtonText: { color: "#FFFFFF", fontWeight: "900" },
  refreshButton: { minWidth: 92, minHeight: 46, borderRadius: 23, borderWidth: 1, borderColor: "#C8D4CD", alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  refreshText: { color: colors.brand, fontWeight: "800" },
  errorCard: { marginTop: 12, borderRadius: 12, padding: 12, backgroundColor: "#FFF1F0", borderWidth: 1, borderColor: "#F0B7B1" },
  errorText: { color: "#8F2119", fontWeight: "700" },
  retryText: { color: "#8F2119", fontWeight: "900", marginTop: 8 },
  resultsHeader: { marginTop: 18, marginBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  resultsTitle: { color: "#202020", fontSize: 17, fontWeight: "900" },
  resultCount: { color: "#7D7D7D", fontSize: 11, fontWeight: "700" },
  card: { flexDirection: "row", gap: 12, padding: 12, marginBottom: 10, borderRadius: 13, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E6E6E6" },
  cardAvatar: { width: 64, height: 72, borderRadius: 10, backgroundColor: "#E0E6E2", alignItems: "center", justifyContent: "center" },
  cardAvatarText: { color: colors.brand, fontSize: 24, fontWeight: "900" },
  cardBody: { flex: 1, gap: 4 },
  jobCard: { gap: 9, padding: 13, marginBottom: 10, borderRadius: 13, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E6E6E6" },
  jobHeader: { flexDirection: "row", gap: 10, alignItems: "center" },
  jobIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#E8F7F0", alignItems: "center", justifyContent: "center" },
  jobIconText: { color: colors.brand, fontWeight: "900" },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  cardTitle: { color: "#222222", fontSize: 15, fontWeight: "900", flexShrink: 1 },
  serviceName: { color: "#4D4D4D", fontSize: 12, fontWeight: "700" },
  description: { color: "#666666", lineHeight: 19, fontSize: 13 },
  meta: { color: "#888888", fontSize: 10, lineHeight: 15 },
  price: { color: "#242424", fontWeight: "900", fontSize: 12 },
  actionText: { color: colors.brand, fontSize: 11, fontWeight: "900" },
  available: { color: colors.brand, backgroundColor: "#E4F8EE", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, fontSize: 9, fontWeight: "900" },
  responseCount: { color: "#777777", fontSize: 10, fontWeight: "700" },
  emptyCard: { marginTop: 14, backgroundColor: "#FFFFFF", borderRadius: 14, padding: 22, alignItems: "center" },
  emptyTitle: { fontSize: 16, fontWeight: "900", color: "#2A2A2A" },
  empty: { color: "#767676", textAlign: "center", lineHeight: 20, marginTop: 5 },
  signOut: { minHeight: 44, marginTop: 18, alignItems: "center", justifyContent: "center" },
  signOutText: { color: "#808080", fontWeight: "700" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,.28)", justifyContent: "flex-end", alignItems: "center" },
  filterSheet: { backgroundColor: "#F7F7F7", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 12, maxHeight: "84%" },
  filterTitle: { fontSize: 21, fontWeight: "900", color: "#202020" },
  resetText: { color: colors.brand, fontWeight: "800" },
  filterLabel: { color: "#4B4B4B", fontSize: 12, fontWeight: "800", marginTop: 4 },
  sheetInput: { minHeight: 48, borderRadius: 10, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E3E3E3", paddingHorizontal: 13, color: "#222222" },
  choiceRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: { minHeight: 38, paddingHorizontal: 13, borderRadius: 19, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E3E3E3", alignItems: "center", justifyContent: "center" },
  choiceActive: { backgroundColor: "#E2F6EC", borderColor: colors.brand },
  choiceText: { color: "#666666", fontWeight: "700", fontSize: 11 },
  choiceTextActive: { color: colors.brand, fontWeight: "900" },
  applyButton: { minHeight: 48, borderRadius: 7, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center", marginTop: 8 },
  applyText: { color: "#FFFFFF", fontWeight: "900" },
  detailSheet: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 11, maxHeight: "88%" },
  detailEyebrow: { color: colors.brand, fontWeight: "900", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 },
  detailTitle: { color: "#1F1F1F", fontSize: 22, lineHeight: 28, fontWeight: "900" },
  provider: { color: "#333333", fontWeight: "800" },
  detailPrice: { color: colors.brand, fontSize: 18, fontWeight: "900" },
  message: { minHeight: 100, textAlignVertical: "top", paddingTop: 12 },
  sheetActions: { flexDirection: "row", gap: 9, marginTop: 8 },
  secondaryButton: { flex: 1, minHeight: 48, borderWidth: 1, borderColor: "#C8D4CD", borderRadius: 8, alignItems: "center", justifyContent: "center" },
  secondaryText: { color: "#4E5A54", fontWeight: "900" },
  primaryButton: { flex: 1.35, minHeight: 48, borderRadius: 8, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
  primaryText: { color: "#FFFFFF", fontWeight: "900" },
  disabled: { opacity: 0.55 },
});
