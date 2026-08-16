import { environment } from "../config/environment";
import type { Booking, MarketplaceMessage, MessageThread, PickedAttachment, ScheduleProposal } from "./types";

function headers(access: string) {
  return { Authorization: `Bearer ${access}`, "Content-Type": "application/json" };
}

async function parse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.non_field_errors?.[0] || payload?.detail || payload?.error || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return payload as T;
}

function unwrap<T>(payload: T[] | { results: T[] }): T[] {
  return Array.isArray(payload) ? payload : payload.results;
}

export async function getThreads(access: string): Promise<MessageThread[]> {
  return unwrap(await parse<MessageThread[] | { results: MessageThread[] }>(await fetch(`${environment.djangoUrl}/api/marketplace/threads/`, { headers: headers(access) })));
}

export async function createListingThread(access: string, listingId: string): Promise<MessageThread> {
  return parse(await fetch(`${environment.djangoUrl}/api/marketplace/threads/`, {
    method: "POST",
    headers: headers(access),
    body: JSON.stringify({ listing_id: listingId }),
  }));
}

export async function getMessages(access: string, threadId: string): Promise<MarketplaceMessage[]> {
  return unwrap(await parse<MarketplaceMessage[] | { results: MarketplaceMessage[] }>(await fetch(`${environment.djangoUrl}/api/marketplace/messages/?thread=${threadId}`, { headers: headers(access) })));
}

export async function markThreadRead(access: string, threadId: string): Promise<void> {
  await parse(await fetch(`${environment.djangoUrl}/api/marketplace/threads/${threadId}/mark-read/`, { method: "POST", headers: headers(access) }));
}

export async function sendTextMessage(access: string, threadId: string, body: string): Promise<MarketplaceMessage> {
  return parse(await fetch(`${environment.djangoUrl}/api/marketplace/messages/`, {
    method: "POST",
    headers: headers(access),
    body: JSON.stringify({ thread_id: threadId, body }),
  }));
}

export async function sendAttachment(access: string, threadId: string, body: string, attachment: PickedAttachment): Promise<MarketplaceMessage> {
  const form = new FormData();
  form.append("thread_id", threadId);
  form.append("body", body);
  form.append("attachment", { uri: attachment.uri, name: attachment.name, type: attachment.mimeType } as unknown as Blob);
  return parse(await fetch(`${environment.djangoUrl}/api/marketplace/messages/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${access}` },
    body: form,
  }));
}

export async function blockThread(access: string, threadId: string): Promise<void> {
  await parse(await fetch(`${environment.djangoUrl}/api/marketplace/threads/${threadId}/block/`, { method: "POST", headers: headers(access) }));
}

export async function unblockThread(access: string, threadId: string): Promise<void> {
  await parse(await fetch(`${environment.djangoUrl}/api/marketplace/threads/${threadId}/unblock/`, { method: "POST", headers: headers(access) }));
}

export async function reportThread(access: string, threadId: string, reason = "other", details = "Reported from the mobile conversation safety controls."): Promise<void> {
  await parse(await fetch(`${environment.djangoUrl}/api/marketplace/threads/${threadId}/report/`, {
    method: "POST", headers: headers(access), body: JSON.stringify({ reason, details }),
  }));
}

export async function getBookings(access: string): Promise<Booking[]> {
  return unwrap(await parse<Booking[] | { results: Booking[] }>(await fetch(`${environment.djangoUrl}/api/marketplace/bookings/`, { headers: headers(access) })));
}

export async function createBooking(access: string, threadId: string, scope: string, price: string, currency: string, timezone: string): Promise<Booking> {
  return parse(await fetch(`${environment.djangoUrl}/api/marketplace/bookings/`, {
    method: "POST", headers: headers(access), body: JSON.stringify({ thread_id: threadId, scope_summary: scope, agreed_price: price, currency, timezone }),
  }));
}

export async function updateBookingStatus(access: string, bookingId: string, status: Booking["status"]): Promise<Booking> {
  return parse(await fetch(`${environment.djangoUrl}/api/marketplace/bookings/${bookingId}/status/`, {
    method: "POST", headers: headers(access), body: JSON.stringify({ status }),
  }));
}

export async function proposeSchedule(access: string, bookingId: string, proposedFor: string, timezone: string, note: string): Promise<ScheduleProposal> {
  return parse(await fetch(`${environment.djangoUrl}/api/marketplace/schedule-proposals/`, {
    method: "POST", headers: headers(access), body: JSON.stringify({ booking_id: bookingId, proposed_for: proposedFor, timezone, note }),
  }));
}

export async function decideSchedule(access: string, proposalId: string, status: "accepted" | "declined"): Promise<ScheduleProposal> {
  return parse(await fetch(`${environment.djangoUrl}/api/marketplace/schedule-proposals/${proposalId}/decision/`, {
    method: "POST", headers: headers(access), body: JSON.stringify({ status }),
  }));
}
