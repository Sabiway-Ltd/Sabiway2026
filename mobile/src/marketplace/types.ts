export type MarketplaceCategory = {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  subcategories?: Array<{ id: number; name: string; slug: string }>;
};

export type ServiceArea = {
  id?: string;
  country_code: string;
  state?: string;
  city?: string;
  area?: string;
  postcode?: string;
  latitude?: string | null;
  longitude?: string | null;
  radius_km?: string | null;
};

export type MarketplaceListing = {
  id: string;
  title: string;
  description: string;
  price_from: string;
  currency: string;
  pricing_note?: string;
  delivery_mode: "in_person" | "remote" | "both";
  country?: string;
  country_code?: string;
  state?: string;
  city?: string;
  area?: string;
  postcode?: string;
  latitude?: string | null;
  longitude?: string | null;
  service_radius_km?: string | null;
  distance_km?: number | null;
  service_areas?: ServiceArea[];
  availability_text?: string;
  available_now?: boolean;
  moderation_status?: string;
  provider: {
    user_id: number;
    full_name: string;
    username: string;
    job?: string | null;
  };
  category: MarketplaceCategory;
  subcategory?: { id: number; name: string; slug: string } | null;
};

export type MarketplaceJob = {
  id: string;
  title: string;
  description: string;
  budget_min?: string | null;
  budget_max?: string | null;
  currency: string;
  delivery_mode: "in_person" | "remote" | "both";
  country?: string;
  country_code?: string;
  state?: string;
  city?: string;
  area?: string;
  postcode?: string;
  latitude?: string | null;
  longitude?: string | null;
  search_radius_km?: string | null;
  distance_km?: number | null;
  needed_by?: string | null;
  response_count: number;
  client: {
    user_id: number;
    full_name: string;
    username: string;
  };
  category: MarketplaceCategory;
};

export type JobResponse = {
  id: string;
  job_title: string;
  message: string;
  proposed_price?: string | null;
  currency: string;
  status: "sent" | "shortlisted" | "declined" | "withdrawn";
};
