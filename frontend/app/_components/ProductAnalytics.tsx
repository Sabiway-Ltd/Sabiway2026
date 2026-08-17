"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackProductEvent } from "@/app/utils/analytics";

export function ProductAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    void trackProductEvent("screen_viewed", { route: pathname });
  }, [pathname]);

  return null;
}
