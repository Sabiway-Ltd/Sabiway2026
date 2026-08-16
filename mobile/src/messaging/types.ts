export type MessageProfile = {
  user_id: number;
  full_name: string;
  username: string;
  role?: string | null;
  job?: string | null;
};

export type MessageThread = {
  id: string;
  client: MessageProfile;
  professional: MessageProfile;
  status: "open" | "closed";
  last_message_at?: string | null;
  unread_count: number;
  booking_id?: string | null;
  job?: string | null;
};

export type MarketplaceMessage = {
  id: string;
  thread: string;
  sender: MessageProfile;
  body: string;
  attachment?: string | null;
  attachment_name?: string;
  attachment_content_type?: string;
  attachment_size?: number;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
};

export type ScheduleProposal = {
  id: string;
  proposer: MessageProfile;
  proposed_for: string;
  timezone: string;
  note: string;
  status: "proposed" | "accepted" | "declined" | "superseded";
  responded_at?: string | null;
};

export type Booking = {
  id: string;
  thread: string;
  client: MessageProfile;
  professional: MessageProfile;
  scope_summary: string;
  agreed_price?: string | null;
  currency: string;
  requested_for?: string | null;
  timezone: string;
  schedule_status: "not_set" | "proposed" | "accepted" | "change_requested";
  status: "pending" | "accepted" | "declined" | "cancelled" | "in_progress" | "completed";
  schedule_proposals: ScheduleProposal[];
};

export type PickedAttachment = {
  uri: string;
  name: string;
  mimeType: string;
};
