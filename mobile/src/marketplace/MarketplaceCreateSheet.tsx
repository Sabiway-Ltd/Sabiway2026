import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import type { AccountRole } from "../auth/types";
import { colors } from "../design/tokens";
import { createMarketplaceJob, createServiceListing } from "./api";
import type { MarketplaceCategory, MarketplaceJob, MarketplaceListing } from "./types";

type Props = { access: string; role: AccountRole; categories: MarketplaceCategory[]; width: number; onClose: () => void; onServiceCreated: (listing: MarketplaceListing) => void; onJobCreated: (job: MarketplaceJob) => void };

const COUNTRY_CURRENCIES: Record<string, string> = { NG: "NGN", GB: "GBP", US: "USD", CA: "CAD", GH: "GHS", ZA: "ZAR", KE: "KES", AE: "AED", AU: "AUD", IE: "EUR", FR: "EUR", DE: "EUR" };
const COUNTRIES = [{ code: "NG", label: "Nigeria" }, { code: "GB", label: "United Kingdom" }, { code: "US", label: "United States" }, { code: "CA", label: "Canada" }, { code: "GH", label: "Ghana" }, { code: "ZA", label: "South Africa" }, { code: "KE", label: "Kenya" }, { code: "AE", label: "UAE" }, { code: "AU", label: "Australia" }];

export function MarketplaceCreateSheet({ access, role, categories, width, onClose, onServiceCreated, onJobCreated }: Props) {
  const [categoryId, setCategoryId] = useState<number | null>(categories[0]?.id ?? null);
  const [title, setTitle] = useState(""); const [description, setDescription] = useState("");
  const [priceOne, setPriceOne] = useState(""); const [priceTwo, setPriceTwo] = useState("");
  const [countryCode, setCountryCode] = useState("NG"); const [stateValue, setStateValue] = useState(""); const [city, setCity] = useState(""); const [area, setArea] = useState(""); const [postcode, setPostcode] = useState("");
  const [deliveryMode, setDeliveryMode] = useState<"in_person" | "remote" | "both">("in_person");
  const [currency, setCurrency] = useState("NGN"); const [radiusKm, setRadiusKm] = useState(""); const [availability, setAvailability] = useState(""); const [submitting, setSubmitting] = useState(false);

  const isProfessional = role === "professional";
  const heading = isProfessional ? "Offer a service" : "Post a Job";
  const selectedCategory = useMemo(() => categories.find((item) => item.id === categoryId), [categories, categoryId]);
  const countryName = COUNTRIES.find((item) => item.code === countryCode)?.label || "";

  const chooseCountry = (code: string) => { setCountryCode(code); setCurrency(COUNTRY_CURRENCIES[code] || currency); };

  const submit = async () => {
    if (!categoryId || !title.trim() || !description.trim()) { Alert.alert("Missing details", "Choose a category and add a title and description."); return; }
    if (isProfessional && !priceOne.trim()) { Alert.alert("Starting price required", "Add the starting price for your service."); return; }
    if (deliveryMode !== "remote" && !countryCode) { Alert.alert("Service location required", "Choose the country where the work will happen."); return; }
    if (!/^[A-Za-z]{3}$/.test(currency.trim())) { Alert.alert("Currency required", "Use a three-letter currency such as NGN, GBP or USD."); return; }

    setSubmitting(true);
    try {
      const common = { category_id: categoryId, title: title.trim(), description: description.trim(), currency: currency.trim().toUpperCase(), delivery_mode: deliveryMode, country_code: countryCode, country: countryName, state: stateValue.trim(), city: city.trim(), area: area.trim(), postcode: postcode.trim() };
      if (isProfessional) {
        const created = await createServiceListing(access, { ...common, price_from: priceOne.trim(), service_radius_km: radiusKm.trim() || null, availability_text: availability.trim() });
        onServiceCreated(created); Alert.alert("Submitted for review", "Your service will appear publicly after approval.");
      } else {
        const created = await createMarketplaceJob(access, { ...common, budget_min: priceOne.trim() || null, budget_max: priceTwo.trim() || null, search_radius_km: radiusKm.trim() || null });
        onJobCreated(created); Alert.alert("Submitted for review", "Your job will appear to professionals after approval.");
      }
      onClose();
    } catch (error) { Alert.alert("Could not submit", error instanceof Error ? error.message : "Please try again."); } finally { setSubmitting(false); }
  };

  return <View style={styles.overlay}><View style={[styles.sheet, { width }]}><View style={styles.header}><View style={styles.headerTop}><Pressable accessibilityRole="button" onPress={onClose} style={styles.backButton}><Text style={styles.backText}>←</Text></Pressable><Text style={styles.heading}>{heading}</Text><View style={styles.headerSpacer}/></View><Text style={styles.headerCopy}>Choose where the service happens. Your account country does not limit where you can search or work.</Text></View>
    <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
      <FieldLabel>{isProfessional ? "Service title" : "Job title"}</FieldLabel><TextInput value={title} onChangeText={setTitle} placeholder={isProfessional ? "e.g. Home electrical repairs" : "e.g. Home cleaning for a 2-bedroom flat"} placeholderTextColor="#8A8A8A" style={styles.input}/>
      <FieldLabel>Category</FieldLabel><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>{categories.map((category)=><Pressable key={category.id} onPress={()=>setCategoryId(category.id)} style={[styles.category,category.id===categoryId&&styles.categoryActive]}><Text style={[styles.categoryText,category.id===categoryId&&styles.categoryTextActive]}>{category.name}</Text></Pressable>)}</ScrollView>{selectedCategory?.description?<Text style={styles.categoryDescription}>{selectedCategory.description}</Text>:null}
      <FieldLabel>Description</FieldLabel><TextInput value={description} onChangeText={setDescription} multiline placeholder="Describe the work clearly" placeholderTextColor="#8A8A8A" style={[styles.input,styles.multiline]}/>
      <FieldLabel>Delivery</FieldLabel><View style={styles.chips}>{(["in_person","remote","both"] as const).map((mode)=><Pressable key={mode} onPress={()=>setDeliveryMode(mode)} style={[styles.chip,deliveryMode===mode&&styles.chipActive]}><Text style={[styles.chipText,deliveryMode===mode&&styles.chipTextActive]}>{mode==="in_person"?"In person":mode==="remote"?"Remote":"Both"}</Text></Pressable>)}</View>
      <FieldLabel>Service country</FieldLabel><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>{COUNTRIES.map((item)=><Pressable key={item.code} onPress={()=>chooseCountry(item.code)} style={[styles.category,countryCode===item.code&&styles.categoryActive]}><Text style={[styles.categoryText,countryCode===item.code&&styles.categoryTextActive]}>{item.label}</Text></Pressable>)}</ScrollView>
      {deliveryMode!=="remote"?<><TextInput value={area} onChangeText={setArea} placeholder="Area / neighbourhood" placeholderTextColor="#8A8A8A" style={styles.input}/><View style={styles.row}><TextInput value={city} onChangeText={setCity} placeholder="City" placeholderTextColor="#8A8A8A" style={[styles.input,styles.flex]}/><TextInput value={stateValue} onChangeText={setStateValue} placeholder="State / region" placeholderTextColor="#8A8A8A" style={[styles.input,styles.flex]}/></View><View style={styles.row}><TextInput value={postcode} onChangeText={setPostcode} placeholder="Postcode" placeholderTextColor="#8A8A8A" style={[styles.input,styles.flex]}/><TextInput value={radiusKm} onChangeText={setRadiusKm} keyboardType="numeric" placeholder="Radius (km)" placeholderTextColor="#8A8A8A" style={[styles.input,styles.flex]}/></View></>:<Text style={styles.helper}>Remote services can be discovered across markets; your profile still shows where you are based.</Text>}
      {isProfessional?<><FieldLabel>Availability</FieldLabel><TextInput value={availability} onChangeText={setAvailability} placeholder="e.g. Weekdays 9am–6pm" placeholderTextColor="#8A8A8A" style={styles.input}/></>:null}
      <FieldLabel>Currency</FieldLabel><View style={styles.row}><TextInput value={currency} onChangeText={(value)=>setCurrency(value.toUpperCase())} autoCapitalize="characters" maxLength={3} placeholder="GBP" placeholderTextColor="#8A8A8A" style={[styles.input,styles.currency]}/><TextInput value={priceOne} onChangeText={setPriceOne} keyboardType="numeric" placeholder={isProfessional?`Starting price (${currency})`:`Minimum (${currency})`} placeholderTextColor="#8A8A8A" style={[styles.input,styles.flex]}/>{!isProfessional?<TextInput value={priceTwo} onChangeText={setPriceTwo} keyboardType="numeric" placeholder={`Maximum (${currency})`} placeholderTextColor="#8A8A8A" style={[styles.input,styles.flex]}/>:null}</View>
      <View style={styles.note}><Text style={styles.noteTitle}>MULTI-COUNTRY MARKETPLACE</Text><Text style={styles.noteText}>Nigeria and the UK are the first priority markets. Professionals in other countries can still be discovered where they operate. SabiPay availability is confirmed separately because payment and payout rails are market-specific.</Text></View>
      <Pressable disabled={submitting} onPress={submit} style={[styles.submit,submitting&&styles.disabled]}><Text style={styles.submitText}>{submitting?"Submitting…":"Continue"}</Text></Pressable>
    </ScrollView></View></View>;
}

function FieldLabel({children}:{children:string}) { return <Text style={styles.label}>{children}</Text>; }

const styles=StyleSheet.create({
  overlay:{position:"absolute",top:0,right:0,bottom:0,left:0,zIndex:20,backgroundColor:"rgba(0,0,0,.28)",alignItems:"center",justifyContent:"flex-end"},sheet:{maxHeight:"95%",backgroundColor:"#F7F7F7",borderTopLeftRadius:24,borderTopRightRadius:24,overflow:"hidden"},header:{backgroundColor:colors.brand,paddingHorizontal:18,paddingTop:15,paddingBottom:18,borderBottomLeftRadius:24,borderBottomRightRadius:24},headerTop:{flexDirection:"row",alignItems:"center",justifyContent:"space-between"},backButton:{width:42,height:42,alignItems:"center",justifyContent:"center"},backText:{color:"#FFFFFF",fontSize:24,fontWeight:"700"},headerSpacer:{width:42},heading:{color:"#FFFFFF",fontSize:17,fontWeight:"900"},headerCopy:{color:"rgba(255,255,255,.78)",fontSize:11,lineHeight:17,marginTop:4,textAlign:"center"},form:{padding:18,gap:9,paddingBottom:30},label:{color:"#444444",fontSize:12,fontWeight:"800",marginTop:4},categories:{gap:8,paddingVertical:2},category:{minHeight:38,borderWidth:1,borderColor:"#E0E0E0",borderRadius:19,paddingHorizontal:13,justifyContent:"center",backgroundColor:"#FFFFFF"},categoryActive:{backgroundColor:"#E0F5EA",borderColor:colors.brand},categoryText:{color:"#686868",fontWeight:"700",fontSize:11},categoryTextActive:{color:colors.brand,fontWeight:"900"},categoryDescription:{color:"#898989",fontSize:11,lineHeight:17},input:{minHeight:48,borderWidth:1,borderColor:"#E2E2E2",borderRadius:7,paddingHorizontal:12,backgroundColor:"#FFFFFF",color:"#222222"},multiline:{minHeight:96,textAlignVertical:"top",paddingTop:12},row:{flexDirection:"row",gap:9},flex:{flex:1},currency:{width:70},chips:{flexDirection:"row",gap:8},chip:{minHeight:40,borderWidth:1,borderColor:"#E0E0E0",borderRadius:20,paddingHorizontal:14,alignItems:"center",justifyContent:"center",backgroundColor:"#FFFFFF"},chipActive:{borderColor:colors.brand,backgroundColor:"#E0F5EA"},chipText:{fontSize:11,fontWeight:"800",color:"#686868"},chipTextActive:{color:colors.brand},helper:{fontSize:11,lineHeight:17,color:"#7A7A7A"},note:{backgroundColor:"#EFF8F3",borderRadius:10,padding:12,gap:5},noteTitle:{fontSize:10,fontWeight:"900",color:colors.brand},noteText:{fontSize:10,lineHeight:16,color:"#66736C"},submit:{minHeight:48,borderRadius:7,backgroundColor:colors.brand,alignItems:"center",justifyContent:"center",marginTop:10},submitText:{color:"#FFFFFF",fontWeight:"900"},disabled:{opacity:.6}
});
