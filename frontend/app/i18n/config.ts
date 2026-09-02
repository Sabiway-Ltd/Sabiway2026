export const supportedLocales = ["en-GB", "en-NG"] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

export const defaultLocale: SupportedLocale = "en-GB";

export function isSupportedLocale(value: string | null | undefined): value is SupportedLocale {
  return Boolean(value && supportedLocales.includes(value as SupportedLocale));
}

export function currencyLocale(currency: string): SupportedLocale {
  return currency.toUpperCase() === "NGN" ? "en-NG" : defaultLocale;
}

export function formatMoney(value: string | number, currency: string, locale: SupportedLocale = currencyLocale(currency)) {
  const amount = typeof value === "number" ? value : Number(value || 0);
  return new Intl.NumberFormat(locale, { style: "currency", currency: currency.toUpperCase(), maximumFractionDigits: 2 }).format(amount);
}

export function formatDateTime(value: string | number | Date, locale: SupportedLocale = defaultLocale) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
