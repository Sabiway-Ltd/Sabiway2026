import { apiRequest } from "../api/client";
import type { JobResponse, MarketplaceCategory, MarketplaceJob, MarketplaceListing } from "./types";

function authHeaders(access: string) {
  return { Authorization: `Bearer ${access}` };
}

function unwrap<T>(payload: T[] | { results: T[] }): T[] {
  return Array.isArray(payload) ? payload : payload.results;
}

export async function getMarketplaceCategories(): Promise<MarketplaceCategory[]> {
  return unwrap(await apiRequest<MarketplaceCategory[] | { results: MarketplaceCategory[] }>("marketplace/categories/"));
}

export async function getMarketplaceListings(): Promise<MarketplaceListing[]> {
  return unwrap(await apiRequest<MarketplaceListing[] | { results: MarketplaceListing[] }>("marketplace/listings/"));
}

export async function getMarketplaceJobs(): Promise<MarketplaceJob[]> {
  return unwrap(await apiRequest<MarketplaceJob[] | { results: MarketplaceJob[] }>("marketplace/jobs/"));
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
