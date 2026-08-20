import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import type { AccountRole } from "../auth/types";
import { colors } from "../design/tokens";
import { createMarketplaceJob, createServiceListing } from "./api";
import { currencyForCountry, marketOptions } from "./markets";
import type { MarketplaceCategory, MarketplaceJob, MarketplaceListing } from "./types";

type Props = {
  access: string;
  role: AccountRole;
  categories: MarketplaceCategory[];
  width: number;
  onClose: () => void;
  onServiceCreated: (listing: MarketplaceListing) => void;
  onJobCreated: (job: MarketplaceJob) => void;
};

type DeliveryMode = "in_person" | "remote" | "both";

export function MarketplaceCreateSheet({ access, role, categories, width, onClose, onServiceCreated, onJobCreated }: Props) {
  const [categoryId, setCategoryId] = useState<number | null>(categories[0]?.id ?? null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceOne, setPriceOne] = useState("");
  const [priceTwo, setPriceTwo] = useState("");
  const [country, setCountry] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [availability, setAvailability] = useState("");
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("in_person");
  const [submitting, setSubmitting] = useState(false);

  const isProfessional = role === "professional";
  const heading = isProfessional ? "Offer a service" : "Post a Job";
  const selectedCategory = useMemo(() => categories.find((item) => item.id === categoryId), [categories, categoryId]);
  const currency = currencyForCountry(country, "NGN");

  const selectMarket = (name: string) => {
    setCountry(name);
  };

  const submit = async () => {
    if (!categoryId || !title.trim() || !description.trim()) {
      Alert.alert("Missing details", "Choose a category and add a title and description.");
      return;
    }
    if (!country.trim()) {
      Alert.alert("Service country required", "Tell us where this service is based or where the job needs to happen.");
      return;
    }
    if (deliveryMode !== "remote" && !city.trim() && !stateValue.trim()) {
      Alert.alert("Service location required", "Add a city or region for an in-person service.");
      return;
    }
    if (isProfessional && !priceOne.trim()) {
      Alert.alert("Starting price required", "Add the starting price for your service.");
      return;
    }

    setSubmitting(true);
    try {
      if (isProfessional) {
        const created = await createServiceListing(access, {
          category_id: categoryId,
          title: title.trim(),
          description: description.trim(),
          price_from: priceOne.trim(),
          currency,
          delivery_mode: deliveryMode,
          country: country.trim(),
          state: stateValue.trim(),
          city: city.trim(),
          area: area.trim(),
          availability_text: availability.trim(),
        });
        onServiceCreated(created);
        Alert.alert("Submitted for review", `Your ${currency} service will appear publicly after approval.`);
      } else {
        const created = await createMarketplaceJob(access, {
          category_id: categoryId,
          title: title.trim(),
          description: description.trim(),
          budget_min: priceOne.trim() || null,
          budget_max: priceTwo.trim() || null,
          currency,
          delivery_mode: deliveryMode,
          country: country.trim(),
          state: stateValue.trim(),
          city: city.trim(),
          area: area.trim(),
        });
        onJobCreated(created);
        Alert.alert("Submitted for review", `Your ${currency} job will appear to relevant Professionals after approval.`);
      }
      onClose();
    } catch (error) {
      Alert.alert("Could not submit", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={[styles.sheet, { width }]}> 
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.backButton}><Text style={styles.backText}>←</Text></Pressable>
            <Text style={styles.heading}>{heading}</Text>
            <View style={styles.headerSpacer} />
          </View>
          <Text style={styles.headerHint}>Account location does not restrict where you can offer or request a service.</Text>
        </View>

        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <FieldLabel>{isProfessional ? "Service Title" : "Job Title"}</FieldLabel>
          <TextInput value={title} onChangeText={setTitle} placeholder={isProfessional ? "e.g. Home electrical repairs" : "e.g. Home cleaning for 2-bedroom apartment"} placeholderTextColor="#8A8A8A" style={styles.input} />

          <FieldLabel>Category</FieldLabel>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
            {categories.map((category) => (
              <Pressable key={category.id} onPress={() => setCategoryId(category.id)} style={[styles.category, category.id === categoryId && styles.categoryActive]}>
                <Text style={[styles.categoryText, category.id === categoryId && styles.categoryTextActive]}>{category.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
          {selectedCategory?.description ? <Text style={styles.categoryDescription}>{selectedCategory.description}</Text> : null}

          <FieldLabel>Description</FieldLabel>
          <TextInput value={description} onChangeText={setDescription} multiline placeholder={isProfessional ? "Describe what you offer and what is included" : "Describe the work, expected outcome and anything the Professional should know"} placeholderTextColor="#8A8A8A" style={[styles.input, styles.multiline]} />

          <FieldLabel>How is the service delivered?</FieldLabel>
          <View style={styles.modeRow}>
            {([['in_person', 'In person'], ['remote', 'Remote'], ['both', 'Both']] as [DeliveryMode, string][]).map(([value, label]) => (
              <Pressable key={value} onPress={() => setDeliveryMode(value)} style={[styles.modeButton, deliveryMode === value && styles.modeButtonActive]}><Text style={[styles.modeText, deliveryMode === value && styles.modeTextActive]}>{label}</Text></Pressable>
            ))}
          </View>

          <FieldLabel>{deliveryMode === "remote" ? "Base country" : "Where is the service needed / offered?"}</FieldLabel>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.markets}>
            {marketOptions.slice(0, 6).map((market) => (
              <Pressable key={market.code} onPress={() => selectMarket(market.name)} style={[styles.marketChip, country === market.name && styles.marketChipActive]}><Text style={[styles.marketText, country === market.name && styles.marketTextActive]}>{market.name}</Text></Pressable>
            ))}
          </ScrollView>
          <TextInput value={country} onChangeText={setCountry} placeholder="Country (e.g. United Kingdom, Nigeria, United States)" placeholderTextColor="#8A8A8A" style={styles.input} />
          {deliveryMode !== "remote" ? <><TextInput value={area} onChangeText={setArea} placeholder="Area / neighbourhood" placeholderTextColor="#8A8A8A" style={styles.input} /><View style={styles.row}><TextInput value={city} onChangeText={setCity} placeholder="City" placeholderTextColor="#8A8A8A" style={[styles.input, styles.flex]} /><TextInput value={stateValue} onChangeText={setStateValue} placeholder="State / region" placeholderTextColor="#8A8A8A" style={[styles.input, styles.flex]} /></View></> : null}

          <View style={styles.currencyNote}><Text style={styles.currencyTitle}>Service currency: {currency}</Text><Text style={styles.currencyText}>For our first optimised markets, Nigeria uses NGN and the UK uses GBP. Cross-border payment currency can differ later at checkout where supported.</Text></View>

          {isProfessional ? <><FieldLabel>Availability</FieldLabel><TextInput value={availability} onChangeText={setAvailability} placeholder="e.g. Weekdays 9am–6pm" placeholderTextColor="#8A8A8A" style={styles.input} /></> : null}

          <FieldLabel>{isProfessional ? `Starting Price (${currency})` : `Budget (${currency})`}</FieldLabel>
          <View style={styles.row}>
            <TextInput value={priceOne} onChangeText={setPriceOne} keyboardType="numeric" placeholder={isProfessional ? `${currency} starting price` : `Minimum ${currency}`} placeholderTextColor="#8A8A8A" style={[styles.input, styles.flex]} />
            {!isProfessional ? <TextInput value={priceTwo} onChangeText={setPriceTwo} keyboardType="numeric" placeholder={`Maximum ${currency}`} placeholderTextColor="#8A8A8A" style={[styles.input, styles.flex]} /> : null}
          </View>

          {!isProfessional ? <View style={styles.escrowNote}><Text style={styles.escrowTitle}>SABIPAY AVAILABILITY</Text><Text style={styles.escrowText}>Marketplace discovery can be available before payments are enabled in a country. SabiWay will only offer checkout where the service/payment market is supported.</Text></View> : null}

          <Pressable disabled={submitting} onPress={submit} style={[styles.submit, submitting && styles.disabled]}><Text style={styles.submitText}>{submitting ? "Submitting…" : "Continue"}</Text></Pressable>
        </ScrollView>
      </View>
    </View>
  );
}

function FieldLabel({ children }: { children: string }) { return <Text style={styles.label}>{children}</Text>; }

const styles = StyleSheet.create({
  overlay: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, zIndex: 20, backgroundColor: "rgba(0,0,0,.28)", alignItems: "center", justifyContent: "flex-end" },
  sheet: { maxHeight: "95%", backgroundColor: "#F7F7F7", borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden" },
  header: { backgroundColor: colors.brand, paddingHorizontal: 18, paddingTop: 15, paddingBottom: 18, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerHint: { color: "rgba(255,255,255,.78)", fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: 5 },
  backButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center" }, backText: { color: "#FFFFFF", fontSize: 24, fontWeight: "700" }, headerSpacer: { width: 42 }, heading: { color: "#FFFFFF", fontSize: 17, fontWeight: "900" },
  form: { padding: 18, gap: 9, paddingBottom: 30 }, label: { color: "#444444", fontSize: 12, fontWeight: "800", marginTop: 4 },
  categories: { gap: 8, paddingVertical: 2 }, category: { minHeight: 38, borderWidth: 1, borderColor: "#E0E0E0", borderRadius: 19, paddingHorizontal: 13, justifyContent: "center", backgroundColor: "#FFFFFF" }, categoryActive: { backgroundColor: "#E0F5EA", borderColor: colors.brand }, categoryText: { color: "#686868", fontWeight: "700", fontSize: 11 }, categoryTextActive: { color: colors.brand, fontWeight: "900" }, categoryDescription: { color: "#898989", fontSize: 11, lineHeight: 17 },
  modeRow: { flexDirection: "row", gap: 8 }, modeButton: { flex: 1, minHeight: 42, borderRadius: 10, borderWidth: 1, borderColor: "#DADADA", alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" }, modeButtonActive: { borderColor: colors.brand, backgroundColor: "#E5F6ED" }, modeText: { color: "#676767", fontSize: 11, fontWeight: "800" }, modeTextActive: { color: colors.brand },
  markets: { gap: 8, paddingVertical: 2 }, marketChip: { minHeight: 36, borderRadius: 18, borderWidth: 1, borderColor: "#E0E0E0", paddingHorizontal: 12, justifyContent: "center", backgroundColor: "#FFFFFF" }, marketChipActive: { borderColor: colors.brand, backgroundColor: "#E5F6ED" }, marketText: { color: "#686868", fontSize: 11, fontWeight: "700" }, marketTextActive: { color: colors.brand, fontWeight: "900" },
  input: { minHeight: 48, borderWidth: 1, borderColor: "#E2E2E2", borderRadius: 7, paddingHorizontal: 12, backgroundColor: "#FFFFFF", color: "#222222" }, multiline: { minHeight: 96, textAlignVertical: "top", paddingTop: 12 }, row: { flexDirection: "row", gap: 9 }, flex: { flex: 1 },
  currencyNote: { borderRadius: 12, backgroundColor: "#EAF7F0", padding: 12, gap: 4 }, currencyTitle: { color: colors.brand, fontWeight: "900", fontSize: 12 }, currencyText: { color: "#5F7468", fontSize: 10, lineHeight: 16 },
  escrowNote: { paddingVertical: 6, gap: 5 }, escrowTitle: { color: "#4D4D4D", fontSize: 10, fontWeight: "900" }, escrowText: { color: "#797979", fontSize: 10, lineHeight: 16 },
  submit: { minHeight: 48, borderRadius: 7, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center", marginTop: 10 }, submitText: { color: "#FFFFFF", fontWeight: "900" }, disabled: { opacity: 0.6 },
});