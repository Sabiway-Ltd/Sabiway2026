import { Platform } from "react-native";
import { apiRequest } from "./client";

export type MobileAnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

export async function trackMobileEvent(access: string | undefined, eventName: string, properties: MobileAnalyticsProperties = {}): Promise<void> {
  try {
    await apiRequest<{ accepted: boolean }>("operations/events/", {
      method: "POST",
      headers: access ? { Authorization: `Bearer ${access}` } : {},
      body: JSON.stringify({ event_name: eventName, source: Platform.OS === "ios" ? "ios" : "android", properties }),
    });
  } catch {
    // Best-effort only: analytics can never block the product journey.
  }
}
