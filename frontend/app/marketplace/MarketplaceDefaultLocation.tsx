"use client";

import { useEffect } from "react";

import { environment } from "@/app/config/environment";
import { useAuthStore } from "@/app/store/useAuthStore";

type LocationPreference = {
  country_name?: string;
  state?: string;
  city?: string;
  area?: string;
  use_for_default_search?: boolean;
};

function preferredSearchLabel(preference: LocationPreference) {
  return preference.city || preference.area || preference.state || preference.country_name || "";
}

export default function MarketplaceDefaultLocation({ hasExplicitLocation }: { hasExplicitLocation: boolean }) {
  const access = useAuthStore((state) => state.access);

  useEffect(() => {
    if (hasExplicitLocation || !access) return;

    let cancelled = false;
    void fetch(`${environment.djangoUrl}/api/markets/location-preference/`, {
      headers: { Authorization: `Bearer ${access}` },
      cache: "no-store",
    })
      .then(async (response) => response.ok ? response.json() as Promise<LocationPreference> : null)
      .then((preference) => {
        if (cancelled || !preference?.use_for_default_search) return;
        const location = preferredSearchLabel(preference);
        if (!location) return;
        const url = new URL(window.location.href);
        if (url.searchParams.has("location")) return;
        url.searchParams.set("location", location);
        window.location.replace(url.toString());
      })
      .catch(() => undefined);

    return () => { cancelled = true; };
  }, [access, hasExplicitLocation]);

  return null;
}
