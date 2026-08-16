const normalizeUrl = (value: string) => value.replace(/\/$/, "");

export const environment = {
  djangoUrl: normalizeUrl(process.env.EXPO_PUBLIC_DJANGO_URL ?? "https://backend.sabiway.com"),
  realtimeUrl: normalizeUrl(process.env.EXPO_PUBLIC_REALTIME_URL ?? "https://realtime.sabiway.com"),
} as const;
