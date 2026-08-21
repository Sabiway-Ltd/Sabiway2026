"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { MapPin, Search, ShieldCheck } from "lucide-react";

import Button from "@/app/_components/common/Button";
import { Field, InlineAlert, Skeleton } from "@/app/_components/common/DesignPrimitives";
import { safeInternalNext } from "@/app/config/accessPolicy";
import { useAuthStore, type User } from "@/app/store/useAuthStore";
import { trackProductEvent } from "@/app/utils/analytics";
import { DJANGO_URL } from "@/app/utils/MyConstants";

type OnboardingProfile = {
  full_name?: string;
  phone_number?: string;
  country?: string;
  state?: string;
  area?: string;
};

type OnboardingResponse = {
  user?: User;
  profile?: OnboardingProfile;
  detail?: string;
};

export default function ClientOnboardingPage() {
  const searchParams = useSearchParams();
  const { user, access, loadUserFromStorage, updateSessionUser } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ full_name: "", phone_number: "", country: "", state: "", area: "" });
  const next = useMemo(() => safeInternalNext(searchParams.get("next"), "/home"), [searchParams]);

  useEffect(() => {
    loadUserFromStorage();
    setHydrated(true);
  }, [loadUserFromStorage]);

  useEffect(() => {
    if (!hydrated) return;
    const current = useAuthStore.getState();
    if (!current.user || !current.access) {
      window.location.href = `/login/client?next=${encodeURIComponent(`/onboarding/client?next=${encodeURIComponent(next)}`)}`;
      return;
    }
    if (current.user.role !== "client") {
      setLoading(false);
      setError("This setup is only available to Client accounts.");
      return;
    }
    if (current.user.onboarding_complete === true) {
      window.location.href = next;
      return;
    }

    void trackProductEvent("client_onboarding_viewed", { role: "client" });

    const load = async () => {
      try {
        const response = await fetch(`${DJANGO_URL}/api/auth/onboarding/client/`, {
          headers: { Authorization: `Bearer ${current.access}` },
          cache: "no-store",
        });
        const data = (await response.json().catch(() => ({}))) as OnboardingResponse;
        if (!response.ok) throw new Error(data.detail || "Unable to load your Client setup.");
        setForm({
          full_name: data.profile?.full_name || data.user?.full_name || current.user?.full_name || "",
          phone_number: data.profile?.phone_number || data.user?.phone_number || current.user?.phone_number || "",
          country: data.profile?.country || "",
          state: data.profile?.state || "",
          area: data.profile?.area || "",
        });
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load your Client setup.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [hydrated, next]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const current = useAuthStore.getState();
    if (!current.access || current.user?.role !== "client") return;
    setSaving(true);
    setError(null);
    void trackProductEvent("client_onboarding_started", {
      role: "client",
      has_state: Boolean(form.state.trim()),
      has_area: Boolean(form.area.trim()),
    });
    try {
      const response = await fetch(`${DJANGO_URL}/api/auth/onboarding/client/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${current.access}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const data = (await response.json().catch(() => ({}))) as OnboardingResponse;
      if (!response.ok || !data.user) throw new Error(data.detail || "Unable to finish Client setup.");
      updateSessionUser(data.user);
      void trackProductEvent("client_onboarding_completed", {
        role: "client",
        has_state: Boolean(form.state.trim()),
        has_area: Boolean(form.area.trim()),
      });
      toast.success("Your Client experience is ready.");
      window.location.href = next;
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Unable to finish Client setup.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (!hydrated || loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4" aria-live="polite" aria-busy="true">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-9 w-44" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </main>
    );
  }

  if (error && user.role !== "client") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <InlineAlert tone="error" className="max-w-lg">
          <p className="font-black">Client setup is not available for this account.</p>
          <p className="mt-1 font-normal">Use your Professional journey instead.</p>
          <Button className="mt-4" variant="primary" onClick={() => { window.location.href = "/home"; }}>Go to SabiWay home</Button>
        </InlineAlert>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between gap-4">
          <Image src="/Footerlogo.svg" alt="SabiWay" width={128} height={42} priority />
          <p className="text-sm font-bold text-muted-foreground">Client setup</p>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <section>
            <p className="text-sm font-black text-primary">A useful starting point</p>
            <h1 className="mt-2 text-4xl font-black tracking-[-.035em] sm:text-5xl">Set up your Client experience.</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">Tell SabiWay where you usually need services so discovery can start somewhere useful. You can still change the service location for every search or job.</p>

            <div className="mt-7 grid gap-3">
              {[
                [MapPin, "Start discovery from a practical location", "Your account location is only a starting point, not a restriction."],
                [Search, "Search somewhere else at any time", "Every marketplace search can use a different service location."],
                [ShieldCheck, "Keep identity separate from job location", "Your profile and the place where work happens remain distinct."],
              ].map(([Icon, title, description]) => {
                const ItemIcon = Icon as typeof MapPin;
                return (
                  <div key={String(title)} className="flex gap-3 rounded-[var(--sabi-radius-lg)] border border-border bg-card p-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--sabi-primary-soft)] text-primary"><ItemIcon size={19} aria-hidden="true" /></span>
                    <div><p className="font-black">{String(title)}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{String(description)}</p></div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-[var(--sabi-radius-xl)] border border-border bg-card p-5 shadow-[var(--sabi-shadow-md)] sm:p-7">
            <div>
              <p className="text-sm font-black">Your basics</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Use information that helps SabiWay personalise the starting point for service discovery.</p>
            </div>

            {error ? <InlineAlert tone="error" className="mt-5"><p>{error}</p></InlineAlert> : null}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <Field label="Full Name" name="full_name" value={form.full_name} onChange={handleChange} required autoComplete="name" />
              <Field label="Phone Number" hint="Optional" name="phone_number" type="tel" value={form.phone_number} onChange={handleChange} autoComplete="tel" />
              <Field label="Country" name="country" value={form.country} onChange={handleChange} required autoComplete="country-name" placeholder="e.g. United Kingdom or Nigeria" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Region / State" hint="Optional" name="state" value={form.state} onChange={handleChange} autoComplete="address-level1" placeholder="e.g. Lancashire" />
                <Field label="Area / City" hint="Optional" name="area" value={form.area} onChange={handleChange} autoComplete="address-level2" placeholder="e.g. Preston" />
              </div>
              <Button type="submit" variant="primary" size="lg" className="w-full" loading={saving} loadingLabel="Finishing setup…">Finish Client setup</Button>
              <p className="text-xs leading-5 text-muted-foreground">You can update these details later from your profile. This does not lock future searches to this location.</p>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
