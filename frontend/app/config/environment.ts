export type PublicEnvironment = {
  djangoUrl: string;
  realtimeUrl: string;
  waitlistUrl: string;
};

const normalizeUrl = (value: string) => value.replace(/\/$/, "");

export const environment: PublicEnvironment = {
  djangoUrl: normalizeUrl(process.env.NEXT_PUBLIC_DJANGO_URL ?? "https://backend.sabiway.com"),
  realtimeUrl: normalizeUrl(process.env.NEXT_PUBLIC_REALTIME_URL ?? "https://realtime.sabiway.com"),
  waitlistUrl: normalizeUrl(process.env.NEXT_PUBLIC_WAITLIST_URL ?? "https://waitlist.sabiway.com"),
};
