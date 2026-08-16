export type TrustProfile = {
  user_id: number;
  full_name: string;
  username: string;
  role?: string | null;
  rating_average?: string;
  rating_count?: number;
};

export type TrustTransaction = {
  id: string;
  booking_id: string;
  client: TrustProfile;
  professional: TrustProfile;
  amount: string;
  currency: string;
  state: string;
  receipt_number: string;
  release_eligible_at?: string | null;
};

export type DisputeCase = {
  id: number;
  transaction_id: string;
  receipt_number: string;
  dispute_status: string;
  reason: string;
  details: string;
  priority: string;
  decision?: string;
  decision_reason?: string;
  created_at: string;
};

export type TrustReview = {
  id: string;
  transaction: string;
  client: TrustProfile;
  professional: TrustProfile;
  rating: number;
  title: string;
  body: string;
  moderation_status: string;
  created_at: string;
};

export type SupportCase = {
  id: string;
  category: string;
  summary: string;
  details: string;
  status: string;
  priority: string;
  created_at: string;
};

export type NotificationPreferences = {
  push_enabled: boolean;
  email_enabled: boolean;
  payment_email_enabled: boolean;
  dispute_email_enabled: boolean;
};
