import { environment } from "../config/environment";
import type { NigerianBank, PayoutDestination, SabiPayBooking, SabiPayTransaction } from "./types";

function unwrap<T>(payload: T[] | { results: T[] }): T[] {
  return Array.isArray(payload) ? payload : payload.results;
}

async function parseError(response: Response, fallback: string) {
  const payload = await response.json().catch(() => ({}));
  return payload.detail || payload.non_field_errors?.[0] || payload.account_number?.[0] || fallback;
}

export async function getSabiPayBookings(access: string): Promise<SabiPayBooking[]> {
  const response = await fetch(`${environment.djangoUrl}/api/marketplace/bookings/`, { headers: { Authorization: `Bearer ${access}` } });
  if (!response.ok) throw new Error(await parseError(response, "Could not load bookings."));
  return unwrap<SabiPayBooking>(await response.json());
}

export async function getSabiPayTransactions(access: string): Promise<SabiPayTransaction[]> {
  const response = await fetch(`${environment.djangoUrl}/api/sabipay/transactions/`, { headers: { Authorization: `Bearer ${access}` } });
  if (!response.ok) throw new Error(await parseError(response, "Could not load SabiPay history."));
  return unwrap<SabiPayTransaction>(await response.json());
}

export async function initializeSabiPay(access: string, bookingId: string, idempotencyKey: string) {
  const response = await fetch(`${environment.djangoUrl}/api/sabipay/transactions/initialize/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
    body: JSON.stringify({ booking_id: bookingId, return_url: "sabiway://sabipay" }),
  });
  if (!response.ok) throw new Error(await parseError(response, "Could not start SabiPay checkout."));
  return response.json() as Promise<{ checkout_url: string; reference: string; transaction: SabiPayTransaction }>;
}

export async function verifySabiPay(access: string, transactionId: string, reference: string) {
  const response = await fetch(`${environment.djangoUrl}/api/sabipay/transactions/${transactionId}/verify/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" },
    body: JSON.stringify({ reference }),
  });
  if (!response.ok) throw new Error(await parseError(response, "Payment could not be verified yet."));
  return response.json() as Promise<SabiPayTransaction>;
}

export async function actOnSabiPay(access: string, transactionId: string, action: "start-service" | "mark-delivered" | "confirm-satisfaction") {
  const response = await fetch(`${environment.djangoUrl}/api/sabipay/transactions/${transactionId}/${action}/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${access}` },
  });
  if (!response.ok) throw new Error(await parseError(response, "SabiPay could not update this transaction."));
  return response.json() as Promise<SabiPayTransaction>;
}

export async function getPayoutDestinations(access: string): Promise<PayoutDestination[]> {
  const response = await fetch(`${environment.djangoUrl}/api/sabipay/payout-destinations/`, { headers: { Authorization: `Bearer ${access}` } });
  if (!response.ok) throw new Error(await parseError(response, "Could not load payout destination."));
  return unwrap<PayoutDestination>(await response.json());
}

export async function getNigerianBanks(access: string): Promise<NigerianBank[]> {
  const response = await fetch(`${environment.djangoUrl}/api/sabipay/banks/`, { headers: { Authorization: `Bearer ${access}` } });
  if (!response.ok) throw new Error(await parseError(response, "Could not load Nigerian banks."));
  return response.json();
}

export async function savePayoutDestination(access: string, accountNumber: string, bankCode: string, bankName: string) {
  const response = await fetch(`${environment.djangoUrl}/api/sabipay/payout-destinations/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" },
    body: JSON.stringify({ account_number: accountNumber, bank_code: bankCode, bank_name: bankName }),
  });
  if (!response.ok) throw new Error(await parseError(response, "Payout destination could not be verified."));
  return response.json() as Promise<PayoutDestination>;
}
