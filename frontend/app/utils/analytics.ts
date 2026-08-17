import { DJANGO_URL } from "./MyConstants";

export type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

function anonymousId(): string {
  if (typeof window === "undefined") return "";
  const key = "sabiway_anon_measurement_id";
  let value = window.sessionStorage.getItem(key);
  if (!value) {
    value = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    window.sessionStorage.setItem(key, value);
  }
  return value;
}

export async function trackProductEvent(eventName: string, properties: AnalyticsProperties = {}): Promise<void> {
  if (typeof window === "undefined") return;
  const access = window.localStorage.getItem("access");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (access) headers.Authorization = `Bearer ${access}`;
  try {
    await fetch(`${DJANGO_URL}/api/operations/events/`, {
      method: "POST",
      headers,
      keepalive: true,
      body: JSON.stringify({ event_name: eventName, source: "web", anonymous_id: anonymousId(), properties }),
    });
  } catch {
    // Measurement is best-effort and must never break the user journey.
  }
}
