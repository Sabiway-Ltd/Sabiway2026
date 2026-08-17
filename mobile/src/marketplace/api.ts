import { apiRequest } from "../api/client";
import type { JobResponse, MarketplaceCategory, MarketplaceJob, MarketplaceListing } from "./types";

export type MarketplaceDiscoveryFilters = {
  q?: string;
  category?: string;
  subcategory?: string;
  deliveryMode?: "in_person" | "remote" | "both";
  availableNow?: boolean;
  location?: string;
  country?: string;
  state?: string;
  city?: string;
  area?: string;
  page?: number;
  pageSize?: number;
};

function authHeaders(access: string) {
  return { Authorization: `Bearer ${access}` };
}

function unwrap<T>(payload: T[] | { results: T[] }): T[] {
  return Array.isArray(payload) ? payload : payload.results;
}

function discoveryQuery(filters: MarketplaceDiscoveryFilters = {}) {
  const params = new URLSearchParams();
  const q = filters.q?.trim();
  if (q) params.set("q", q);
  if (filters.category) params.set("category", filters.category);
  if (filters.subcategory) params.set("subcategory", filters.subcategory);
  if (filters.deliveryMode) params.set("delivery_mode", filters.deliveryMode);
  if (filters.availableNow) params.set("available_now", "true");
  if (filters.location?.trim()) params.set("location", filters.location.trim());
  if (filters.country?.trim()) params.set("country", filters.country.trim());
  if (filters.state?.trim()) params.set("state", filters.state.trim());
  if (filters.city?.trim()) params.set("city", filters.city.trim());
  if (filters.area?.trim()) params.set("area", filters.area.trim());
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("page_size", String(filters.pageSize));
  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function getMarketplaceCategories(): Promise<MarketplaceCategory[]> {
  return unwrap(await apiRequest<MarketplaceCategory[] | { results: MarketplaceCategory[] }>("marketplace/categories/"));
}

export async function getMarketplaceListings(filters: MarketplaceDiscoveryFilters = {}): Promise<MarketplaceListing[]> {
  return unwrap(await apiRequest<MarketplaceListing[] | { results: MarketplaceListing[] }>(`marketplace/listings/${discoveryQuery(filters)}`));
}

export async function getMarketplaceJobs(filters: MarketplaceDiscoveryFilters = {}): Promise<MarketplaceJob[]> {
  return unwrap(await apiRequest<MarketplaceJob[] | { results: MarketplaceJob[] }>(`marketplace/jobs/${discoveryQuery(filters)}`));
}

export async function createMarketplaceJob(access: string, payload: Record<string, unknown>): Promise<MarketplaceJob> {
  return apiRequest<MarketplaceJob>("marketplace/jobs/", {
    method: "POST",
    headers: authHeaders(access),
    body: JSON.stringify(payload),
  });
}

export async function createServiceListing(access: string, payload: Record<string, unknown>): Promise<MarketplaceListing> {
  return apiRequest<MarketplaceListing>("marketplace/listings/", {
    method: "POST",
    headers: authHeaders(access),
    body: JSON.stringify(payload),
  });
}

export async function respondToMarketplaceJob(access: string, jobId: string, message: string, proposedPrice?: string): Promise<JobResponse> {
  return apiRequest<JobResponse>("marketplace/job-responses/", {
    method: "POST",
    headers: authHeaders(access),
    body: JSON.stringify({ job_id: jobId, message, proposed_price: proposedPrice || null, currency: "NGN" }),
  });
}
