export type SabiPayProfile = {
  user_id: number;
  full_name: string;
  username: string;
  role?: string | null;
};

export type SabiPayBooking = {
  id: string;
  client: SabiPayProfile;
  professional: SabiPayProfile;
  scope_summary: string;
  agreed_price: string;
  currency: string;
  status: string;
};

export type SabiPayAttempt = {
  id: string;
  reference: string;
  authorization_url: string;
  status: string;
  failure_reason?: string;
};

export type SabiPayPayout = {
  id: string;
  amount: string;
  currency: string;
  reference: string;
  status: string;
  destination_label: string;
};

export type SabiPayDisputeEvidence = {
  id: string;
  submitted_by: SabiPayProfile;
  note: string;
  reference_url?: string;
  created_at: string;
};

export type SabiPayDispute = {
  id: string;
  transaction: string;
  receipt_number: string;
  opened_by_profile: SabiPayProfile;
  reason: string;
  details: string;
  status: string;
  outcome: string;
  resolution?: string;
  evidence: SabiPayDisputeEvidence[];
  created_at: string;
};

export type SabiPayTransaction = {
  id: string;
  booking_id: string;
  booking_status: string;
  scope_summary: string;
  client: SabiPayProfile;
  professional: SabiPayProfile;
  amount: string;
  currency: string;
  commission_amount: string;
  provider_amount: string;
  state: string;
  payment_status: string;
  last_payment_error?: string;
  receipt_number: string;
  reconciliation_status: string;
  latest_attempt?: SabiPayAttempt | null;
  payout?: SabiPayPayout | null;
  disputes: SabiPayDispute[];
  freeze_seconds_remaining: number;
};

export type PayoutDestination = {
  id: string;
  account_name: string;
  bank_code: string;
  bank_name: string;
  account_last4: string;
  is_active: boolean;
};

export type NigerianBank = {
  name: string;
  code: string;
  active?: boolean;
};
