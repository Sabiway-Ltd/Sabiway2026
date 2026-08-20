export type MarketOption = { code: string; name: string; currency: string };

export const marketOptions: MarketOption[] = [
  { code: "NG", name: "Nigeria", currency: "NGN" },
  { code: "GB", name: "United Kingdom", currency: "GBP" },
  { code: "US", name: "United States", currency: "USD" },
  { code: "CA", name: "Canada", currency: "CAD" },
  { code: "IE", name: "Ireland", currency: "EUR" },
  { code: "DE", name: "Germany", currency: "EUR" },
  { code: "FR", name: "France", currency: "EUR" },
  { code: "AU", name: "Australia", currency: "AUD" },
  { code: "ZA", name: "South Africa", currency: "ZAR" },
  { code: "GH", name: "Ghana", currency: "GHS" },
  { code: "KE", name: "Kenya", currency: "KES" },
];

export function marketForCountry(country: string) {
  const value = country.trim().toLowerCase();
  return marketOptions.find((market) => market.name.toLowerCase() === value || market.code.toLowerCase() === value || (market.code === "GB" && value === "uk"));
}

export function currencyForCountry(country: string, fallback = "NGN") {
  return marketForCountry(country)?.currency ?? fallback;
}
