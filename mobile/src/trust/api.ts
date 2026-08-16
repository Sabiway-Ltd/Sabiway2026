import { environment } from "../config/environment";
import type { DisputeCase, NotificationPreferences, SupportCase, TrustProfile, TrustReview, TrustTransaction } from "./types";

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
function unwrap<T>(payload: T[] | { results: T[] }): T[] { return Array.isArray(payload) ? payload : payload.results; }
async function jsonOrThrow(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.detail || payload.non_field_errors?.[0] || Object.values(payload)[0] || "SabiWay request failed.");
  return payload;
}

export async function getTrustProfile(token: string): Promise<TrustProfile> {
  return jsonOrThrow(await fetch(`${environment.djangoUrl}/api/profiles/me/`, { headers: auth(token) }));
}
export async function getTrustTransactions(token: string): Promise<TrustTransaction[]> {
  return unwrap(await jsonOrThrow(await fetch(`${environment.djangoUrl}/api/sabipay/transactions/`, { headers: auth(token) })));
}
export async function getDisputes(token: string): Promise<DisputeCase[]> {
  return unwrap(await jsonOrThrow(await fetch(`${environment.djangoUrl}/api/trust/disputes/`, { headers: auth(token) })));
}
export async function getReviews(token: string, username?: string): Promise<TrustReview[]> {
  const suffix = username ? `?professional=${encodeURIComponent(username)}` : "";
  return unwrap(await jsonOrThrow(await fetch(`${environment.djangoUrl}/api/trust/reviews/${suffix}`, { headers: auth(token) })));
}
export async function getSupportCases(token: string): Promise<SupportCase[]> {
  return unwrap(await jsonOrThrow(await fetch(`${environment.djangoUrl}/api/trust/support/`, { headers: auth(token) })));
}
export async function getNotificationPreferences(token: string): Promise<NotificationPreferences> {
  return jsonOrThrow(await fetch(`${environment.djangoUrl}/api/notifications/preferences/`, { headers: auth(token) }));
}
export async function saveNotificationPreferences(token: string, preferences: NotificationPreferences): Promise<NotificationPreferences> {
  return jsonOrThrow(await fetch(`${environment.djangoUrl}/api/notifications/preferences/`, { method: "PATCH", headers: { ...auth(token), "Content-Type": "application/json" }, body: JSON.stringify(preferences) }));
}

export async function openDispute(token: string, input: { transactionId: string; reason: string; details: string; evidence?: { uri: string; name: string; mimeType: string } | null }) {
  const form = new FormData();
  form.append("transaction_id", input.transactionId);
  form.append("reason", input.reason);
  form.append("details", input.details);
  if (input.evidence) form.append("evidence", { uri: input.evidence.uri, name: input.evidence.name, type: input.evidence.mimeType } as unknown as Blob);
  return jsonOrThrow(await fetch(`${environment.djangoUrl}/api/trust/disputes/`, { method: "POST", headers: auth(token), body: form }));
}
export async function createReview(token: string, input: { transactionId: string; rating: number; title: string; body: string }) {
  return jsonOrThrow(await fetch(`${environment.djangoUrl}/api/trust/reviews/`, { method: "POST", headers: { ...auth(token), "Content-Type": "application/json" }, body: JSON.stringify({ transaction_id: input.transactionId, rating: input.rating, title: input.title, body: input.body }) }));
}
export async function openSupportCase(token: string, input: { category: string; summary: string; details: string; transactionId?: string }) {
  const payload: Record<string, string> = { category: input.category, summary: input.summary, details: input.details };
  if (input.transactionId) payload.transaction_id = input.transactionId;
  return jsonOrThrow(await fetch(`${environment.djangoUrl}/api/trust/support/`, { method: "POST", headers: { ...auth(token), "Content-Type": "application/json" }, body: JSON.stringify(payload) }));
}
