"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MessageCircle } from "lucide-react";

import Button from "@/app/_components/common/Button";
import { InlineAlert } from "@/app/_components/common/DesignPrimitives";
import { environment } from "@/app/config/environment";
import { useAuthStore } from "@/app/store/useAuthStore";

type ThreadPayload = { id: string };

export default function ServiceContactButton({ listingId, profilePath }: { listingId: string; profilePath: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const access = useAuthStore((state) => state.access);
  const role = useAuthStore((state) => state.user?.role);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const startConversation = useCallback(async () => {
    if (!access) {
      const next = `${profilePath}?contact=${encodeURIComponent(listingId)}`;
      window.location.href = `/login/client?next=${encodeURIComponent(next)}`;
      return;
    }
    if (role !== "client") {
      setError("Service enquiries are started from a Client account.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${environment.djangoUrl}/api/marketplace/threads/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access}`,
        },
        body: JSON.stringify({ listing_id: listingId }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.non_field_errors?.[0] || payload.detail || "Could not start this conversation.");
      }
      router.push(`/messages?thread=${(payload as ThreadPayload).id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start this conversation.");
    } finally {
      setLoading(false);
    }
  }, [access, listingId, profilePath, role, router]);

  useEffect(() => {
    if (searchParams.get("contact") === listingId && access && role === "client" && !loading) {
      void startConversation();
    }
  }, [access, listingId, loading, role, searchParams, startConversation]);

  return (
    <div>
      <Button type="button" onClick={() => void startConversation()} loading={loading} leftIcon={<MessageCircle size={17} aria-hidden="true" />}>
        Message about this service
      </Button>
      {error ? <InlineAlert tone="error" className="mt-3">{error}</InlineAlert> : null}
    </div>
  );
}
