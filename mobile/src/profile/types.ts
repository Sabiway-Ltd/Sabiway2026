import type { AccountRole } from "../auth/types";

export type Profile = {
  user_id: number;
  full_name: string;
  initials: string;
  email: string;
  username: string;
  profile_picture?: string | null;
  followers_count: number;
  following_count: number;
  posts_count: number;
  phone_number?: string;
  gender?: string;
  date_of_birth?: string | null;
  country?: string;
  state?: string;
  area?: string;
  street?: string;
  address?: string;
  role: AccountRole;
  job?: string | null;
  bio?: string;
  is_verified: boolean;
  verification_status: string;
};

export type ProfileUpdate = {
  full_name: string;
  username: string;
  phone_number: string;
  country: string;
  state: string;
  area: string;
  street: string;
  job: string;
  bio: string;
};
