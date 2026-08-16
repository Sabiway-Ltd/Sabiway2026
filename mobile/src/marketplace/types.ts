export type MarketplaceListing = {
  id: string;
  title: string;
  description: string;
  price_from: string;
  currency: string;
  delivery_mode: "in_person" | "remote" | "both";
  state: string;
  area: string;
  provider: {
    user_id: number;
    full_name: string;
    username: string;
    job?: string | null;
  };
  category: {
    id: number;
    name: string;
    slug: string;
  };
};

export type BookingRequest = {
  id: string;
  listing_summary: {
    id: string;
    title: string;
    provider: string;
    price_from: string;
    currency: string;
  };
  requested_for: string | null;
  message: string;
  status: "pending" | "accepted" | "declined" | "cancelled" | "completed";
};
