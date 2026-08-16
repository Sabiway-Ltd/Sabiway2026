import { apiRequest } from "../api/client";
import type { BookingRequest, MarketplaceListing } from "./types";

function authHeaders(access: string) {
  return { Authorization: `Bearer ${access}` };
}

export async function getMarketplaceListings(): Promise<MarketplaceListing[]> {
  const payload = await apiRequest<MarketplaceListing[] | { results: MarketplaceListing[] }>("marketplace/listings/");
  return Array.isArray(payload) ? payload : payload.results;
}

export async function createBooking(access: string, listingId: string, message: string): Promise<BookingRequest> {
  return apiRequest<BookingRequest>("marketplace/bookings/", {
    method: "POST",
    headers: authHeaders(access),
    body: JSON.stringify({ listing_id: listingId, message }),
  });
}

export async function getBookings(access: string): Promise<BookingRequest[]> {
  const payload = await apiRequest<BookingRequest[] | { results: BookingRequest[] }>("marketplace/bookings/", {
    headers: authHeaders(access),
  });
  return Array.isArray(payload) ? payload : payload.results;
}

export async function updateBookingStatus(access: string, bookingId: string, status: BookingRequest["status"]): Promise<BookingRequest> {
  return apiRequest<BookingRequest>(`marketplace/bookings/${bookingId}/status/`, {
    method: "POST",
    headers: authHeaders(access),
    body: JSON.stringify({ status }),
  });
}
