import { environment } from "../config/environment";
import type { Profile, ProfileUpdate } from "./types";

async function parse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const first = payload && typeof payload === "object" ? Object.values(payload)[0] : null;
    const detail = Array.isArray(first) ? String(first[0]) : payload.detail || payload.non_field_errors?.[0] || "Request failed.";
    throw new Error(detail);
  }
  return payload as T;
}

export async function getMyProfile(access: string): Promise<Profile> {
  const response = await fetch(`${environment.djangoUrl}/api/profiles/me/`, {
    headers: { Authorization: `Bearer ${access}` },
  });
  return parse<Profile>(response);
}

export async function updateMyProfile(access: string, profile: ProfileUpdate): Promise<Profile> {
  const response = await fetch(`${environment.djangoUrl}/api/profiles/me/`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${access}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(profile),
  });
  return parse<Profile>(response);
}
