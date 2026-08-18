import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import type { AccountRole } from "../auth/types";
import { colors } from "../design/tokens";
import { createMarketplaceJob, createServiceListing } from "./api";
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
  const [submitting, setSubmitting] = useState(false);

  const isProfessional = role === "professional";
  const heading = isProfessional ? "Offer a service" : "Post a Job";
  const selectedCategory = useMemo(() => categories.find((item) => item.id === categoryId), [categories, categoryId]);

  const submit = async () => {
    if (!categoryId || !title.trim() || !description.trim()) {
      Alert.alert("Missing details", "Choose a category and add a title and description.");
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
          currency: "NGN",
          delivery_mode: "in_person",
          country: country.trim(),
          state: stateValue.trim(),
          city: city.trim(),
          area: area.trim(),
          availability_text: availability.trim(),
        });
        onServiceCreated(created);
        Alert.alert("Submitted for review", "Your service will appear publicly after approval.");
      } else {
        const created = await createMarketplaceJob(access, {
          category_id: categoryId,
          title: title.trim(),
          description: description.trim(),
          budget_min: priceOne.trim() || null,
          budget_max: priceTwo.trim() || null,
          currency: "NGN",
          delivery_mode: "in_person",
          country: country.trim(),
          state: stateValue.trim(),
          city: city.trim(),
          area: area.trim(),
        });
        onJobCreated(created);
        Alert.alert("Submitted for review", "Your job will appear to professionals after approval.");
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
          <View style={styles.progress}><View style={[styles.step, styles.stepActive]} /><View style={[styles.step, styles.stepActive]} /><View style={styles.step} /><View style={styles.step} /></View>
        </View>

        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <FieldLabel>{isProfessional ? "Service Title" : "Job Title"}</FieldLabel>
          <TextInput value={title} onChangeText={setTitle} placeholder={isProfessional ? "e.g. Home electrical repairs" : "e.g. Home cleaning for 2-bedroom apartment"} placeholderTextColor="#8A8A8A" style={styles.input} />

          <FieldLabel>Categories</FieldLabel>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
            {categories.map((category) => (
              <Pressable key={category.id} onPress={() => setCategoryId(category.id)} style={[styles.category, category.id === categoryId && styles.categoryActive]}>
                <Text style={[styles.categoryText, category.id === categoryId && styles.categoryTextActive]}>{category.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
          {selectedCategory?.description ? <Text style={styles.categoryDescription}>{selectedCategory.description}</Text> : null}

          <FieldLabel>Description</FieldLabel>
          <TextInput value={description} onChangeText={setDescription} multiline placeholder={isProfessional ? "Describe what you offer and what is included" : "e.g. Clean living room, bedrooms, kitchen and bathrooms"} placeholderTextColor="#8A8A8A" style={[styles.input, styles.multiline]} />

          <FieldLabel>Location</FieldLabel>
          <TextInput value={area} onChangeText={setArea} placeholder="Area / neighbourhood" placeholderTextColor="#8A8A8A" style={styles.input} />
          <View style={styles.row}><TextInput value={city} onChangeText={setCity} placeholder="City" placeholderTextColor="#8A8A8A" style={[styles.input, styles.flex]} /><TextInput value={stateValue} onChangeText={setStateValue} placeholder="State" placeholderTextColor="#8A8A8A" style={[styles.input, styles.flex]} /></View>
          <TextInput value={country} onChangeText={setCountry} placeholder="Country" placeholderTextColor="#8A8A8A" style={styles.input} />

          {isProfessional ? <><FieldLabel>Availability</FieldLabel><TextInput value={availability} onChangeText={setAvailability} placeholder="e.g. Weekdays 9am–6pm" placeholderTextColor="#8A8A8A" style={styles.input} /></> : null}

          <FieldLabel>{isProfessional ? "Starting Price" : "Price"}</FieldLabel>
          <View style={styles.row}>
            <TextInput value={priceOne} onChangeText={setPriceOne} keyboardType="numeric" placeholder={isProfessional ? "NGN starting price" : "Minimum NGN"} placeholderTextColor="#8A8A8A" style={[styles.input, styles.flex]} />
            {!isProfessional ? <TextInput value={priceTwo} onChangeText={setPriceTwo} keyboardType="numeric" placeholder="Maximum NGN" placeholderTextColor="#8A8A8A" style={[styles.input, styles.flex]} /> : null}
          </View>

          {!isProfessional ? <View style={styles.escrowNote}><Text style={styles.escrowTitle}>▣ ESCROW INFORMATION</Text><Text style={styles.escrowText}>When you agree a booking, SabiPay can hold payment securely until the agreed work is completed or resolved.</Text></View> : null}

          <Pressable disabled={submitting} onPress={submit} style={[styles.submit, submitting && styles.disabled]}>
            <Text style={styles.submitText}>{submitting ? "Submitting…" : "Continue"}</Text>
          </Pressable>
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
  backButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  backText: { color: "#FFFFFF", fontSize: 24, fontWeight: "700" },
  headerSpacer: { width: 42 },
  heading: { color: "#FFFFFF", fontSize: 17, fontWeight: "900" },
  progress: { flexDirection: "row", justifyContent: "center", gap: 10, marginTop: 14 },
  step: { width: 9, height: 9, borderRadius: 5, backgroundColor: "rgba(255,255,255,.38)" },
  stepActive: { backgroundColor: "#FFFFFF" },
  form: { padding: 18, gap: 9, paddingBottom: 30 },
  label: { color: "#444444", fontSize: 12, fontWeight: "800", marginTop: 4 },
  categories: { gap: 8, paddingVertical: 2 },
  category: { minHeight: 38, borderWidth: 1, borderColor: "#E0E0E0", borderRadius: 19, paddingHorizontal: 13, justifyContent: "center", backgroundColor: "#FFFFFF" },
  categoryActive: { backgroundColor: "#E0F5EA", borderColor: colors.brand },
  categoryText: { color: "#686868", fontWeight: "700", fontSize: 11 },
  categoryTextActive: { color: colors.brand, fontWeight: "900" },
  categoryDescription: { color: "#898989", fontSize: 11, lineHeight: 17 },
  input: { minHeight: 48, borderWidth: 1, borderColor: "#E2E2E2", borderRadius: 7, paddingHorizontal: 12, backgroundColor: "#FFFFFF", color: "#222222" },
  multiline: { minHeight: 96, textAlignVertical: "top", paddingTop: 12 },
  row: { flexDirection: "row", gap: 9 },
  flex: { flex: 1 },
  escrowNote: { paddingVertical: 6, gap: 5 },
  escrowTitle: { color: "#4D4D4D", fontSize: 10, fontWeight: "900" },
  escrowText: { color: "#797979", fontSize: 10, lineHeight: 16 },
  submit: { minHeight: 48, borderRadius: 7, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center", marginTop: 10 },
  submitText: { color: "#FFFFFF", fontWeight: "900" },
  disabled: { opacity: 0.6 },
});
