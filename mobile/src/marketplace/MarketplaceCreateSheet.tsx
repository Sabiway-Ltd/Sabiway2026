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
  const heading = isProfessional ? "Create your service listing" : "Post a job";
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
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>{isProfessional ? "PROFESSIONAL" : "CLIENT"}</Text>
            <Text style={styles.heading}>{heading}</Text>
            <Text style={styles.help}>{isProfessional ? "Listings are reviewed before public discovery." : "Describe the work and let relevant professionals respond."}</Text>
          </View>
          <Pressable onPress={onClose} style={styles.close}><Text style={styles.closeText}>Close</Text></Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
            {categories.map((category) => (
              <Pressable key={category.id} onPress={() => setCategoryId(category.id)} style={[styles.category, category.id === categoryId && styles.categoryActive]}>
                <Text style={[styles.categoryText, category.id === categoryId && styles.categoryTextActive]}>{category.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
          {selectedCategory?.description ? <Text style={styles.categoryDescription}>{selectedCategory.description}</Text> : null}

          <Text style={styles.label}>{isProfessional ? "Service title" : "What do you need done?"}</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder={isProfessional ? "e.g. Home electrical repairs" : "e.g. Fix faulty sockets"} placeholderTextColor="#7B8881" style={styles.input} />

          <Text style={styles.label}>Description</Text>
          <TextInput value={description} onChangeText={setDescription} multiline placeholder={isProfessional ? "Describe what you offer and what is included" : "Describe the problem, scope and expected outcome"} placeholderTextColor="#7B8881" style={[styles.input, styles.multiline]} />

          <Text style={styles.label}>{isProfessional ? "Starting price (NGN)" : "Budget range (NGN)"}</Text>
          <View style={styles.row}>
            <TextInput value={priceOne} onChangeText={setPriceOne} keyboardType="numeric" placeholder={isProfessional ? "Starting price" : "Minimum"} placeholderTextColor="#7B8881" style={[styles.input, styles.flex]} />
            {!isProfessional ? <TextInput value={priceTwo} onChangeText={setPriceTwo} keyboardType="numeric" placeholder="Maximum" placeholderTextColor="#7B8881" style={[styles.input, styles.flex]} /> : null}
          </View>

          {isProfessional ? <><Text style={styles.label}>Availability</Text><TextInput value={availability} onChangeText={setAvailability} placeholder="e.g. Weekdays 9am–6pm" placeholderTextColor="#7B8881" style={styles.input} /></> : null}

          <Text style={styles.label}>Location</Text>
          <View style={styles.row}><TextInput value={country} onChangeText={setCountry} placeholder="Country" placeholderTextColor="#7B8881" style={[styles.input, styles.flex]} /><TextInput value={stateValue} onChangeText={setStateValue} placeholder="State/region" placeholderTextColor="#7B8881" style={[styles.input, styles.flex]} /></View>
          <View style={styles.row}><TextInput value={city} onChangeText={setCity} placeholder="City" placeholderTextColor="#7B8881" style={[styles.input, styles.flex]} /><TextInput value={area} onChangeText={setArea} placeholder="Area" placeholderTextColor="#7B8881" style={[styles.input, styles.flex]} /></View>

          <Pressable disabled={submitting} onPress={submit} style={[styles.submit, submitting && styles.disabled]}>
            <Text style={styles.submitText}>{submitting ? "Submitting..." : "Submit for review"}</Text>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, zIndex: 20, backgroundColor: "rgba(23,49,38,0.42)", alignItems: "center", justifyContent: "flex-end", paddingBottom: 10 },
  sheet: { maxHeight: "92%", backgroundColor: "#FFFFFF", borderRadius: 24, overflow: "hidden", borderWidth: 1, borderColor: "#DDE7E1" },
  header: { flexDirection: "row", gap: 12, padding: 18, borderBottomWidth: 1, borderBottomColor: "#EDF2EF" },
  eyebrow: { color: colors.brand, fontSize: 11, fontWeight: "900", letterSpacing: 1.4 },
  heading: { color: "#173126", fontSize: 22, fontWeight: "900", marginTop: 3 },
  help: { color: "#68776F", lineHeight: 19, marginTop: 4 },
  close: { borderWidth: 1, borderColor: "#DDE7E1", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, alignSelf: "flex-start" },
  closeText: { color: "#173126", fontWeight: "800" },
  form: { padding: 18, gap: 9, paddingBottom: 28 },
  label: { color: "#173126", fontWeight: "800", marginTop: 4 },
  categories: { gap: 8, paddingVertical: 2 },
  category: { borderWidth: 1, borderColor: "#D9E4DD", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#FFFFFF" },
  categoryActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  categoryText: { color: "#53645A", fontWeight: "800", fontSize: 12 },
  categoryTextActive: { color: "#FFFFFF" },
  categoryDescription: { color: "#718078", fontSize: 12, lineHeight: 18 },
  input: { minHeight: 48, borderWidth: 1, borderColor: "#D9E4DD", borderRadius: 12, paddingHorizontal: 13, backgroundColor: "#FFFFFF", color: "#173126" },
  multiline: { minHeight: 105, textAlignVertical: "top", paddingTop: 12 },
  row: { flexDirection: "row", gap: 9 },
  flex: { flex: 1 },
  submit: { minHeight: 50, borderRadius: 12, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center", marginTop: 8 },
  submitText: { color: "#FFFFFF", fontWeight: "900" },
  disabled: { opacity: 0.6 },
});
