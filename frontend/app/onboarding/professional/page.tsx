"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { BadgeCheck, BriefcaseBusiness, MapPin, ShieldCheck } from "lucide-react";

import Button from "@/app/_components/common/Button";
import { CheckboxField, Field, InlineAlert, SelectField, Skeleton, TextareaField } from "@/app/_components/common/DesignPrimitives";
import { safeInternalNext } from "@/app/config/accessPolicy";
import { useAuthStore, type User } from "@/app/store/useAuthStore";
import { trackProductEvent } from "@/app/utils/analytics";
import { DJANGO_URL } from "@/app/utils/MyConstants";

type Category = { id: number; name: string; slug: string };
type DraftService = {
  category?: Category;
  title?: string;
  description?: string;
  price_from?: string | number;
  currency?: string;
  delivery_mode?: string;
  country?: string;
  state?: string;
  city?: string;
  area?: string;
  availability_text?: string;
  available_now?: boolean;
};
type ProfessionalProfile = {
  full_name?: string;
  phone_number?: string;
  bio?: string;
  country?: string;
  state?: string;
  area?: string;
};
type OnboardingResponse = {
  user?: User;
  profile?: ProfessionalProfile;
  draft_service?: DraftService | null;
  detail?: string;
};

type CategoryResponse = Category[] | { results?: Category[] };

export default function ProfessionalOnboardingPage() {
  const searchParams = useSearchParams();
  const { user, loadUserFromStorage, updateSessionUser } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    full_name: "",
    phone_number: "",
    professional_summary: "",
    category_id: "",
    service_title: "",
    service_description: "",
    price_from: "",
    currency: "NGN",
    delivery_mode: "in_person",
    country: "",
    state: "",
    city: "",
    area: "",
    availability_text: "",
    available_now: false,
  });
  const next = useMemo(() => safeInternalNext(searchParams.get("next"), "/home"), [searchParams]);
  const inPerson = form.delivery_mode === "in_person" || form.delivery_mode === "both";

  useEffect(() => {
    loadUserFromStorage();
    setHydrated(true);
  }, [loadUserFromStorage]);

  useEffect(() => {
    if (!hydrated) return;
    const current = useAuthStore.getState();
    if (!current.user || !current.access) {
      window.location.href = `/login/professional?next=${encodeURIComponent(`/onboarding/professional?next=${encodeURIComponent(next)}`)}`;
      return;
    }
    if (current.user.role !== "professional") {
      setLoading(false);
      setError("This setup is only available to Professional accounts.");
      return;
    }
    if (current.user.onboarding_complete === true) {
      window.location.href = next;
      return;
    }

    void trackProductEvent("professional_onboarding_viewed", { role: "professional" });

    const load = async () => {
      try {
        const [onboardingResponse, categoryResponse] = await Promise.all([
          fetch(`${DJANGO_URL}/api/auth/onboarding/professional/`, {
            headers: { Authorization: `Bearer ${current.access}` },
            cache: "no-store",
          }),
          fetch(`${DJANGO_URL}/api/marketplace/categories/`, { cache: "no-store" }),
        ]);
        const onboarding = (await onboardingResponse.json().catch(() => ({}))) as OnboardingResponse;
        const categoryData = (await categoryResponse.json().catch(() => ([]))) as CategoryResponse;
        if (!onboardingResponse.ok) throw new Error(onboarding.detail || "Unable to load Professional setup.");
        if (!categoryResponse.ok) throw new Error("Unable to load service categories.");
        const categoryList = Array.isArray(categoryData) ? categoryData : categoryData.results || [];
        setCategories(categoryList);
        const draft = onboarding.draft_service;
        setForm({
          full_name: onboarding.profile?.full_name || onboarding.user?.full_name || current.user?.full_name || "",
          phone_number: onboarding.profile?.phone_number || onboarding.user?.phone_number || current.user?.phone_number || "",
          professional_summary: onboarding.profile?.bio || "",
          category_id: draft?.category?.id ? String(draft.category.id) : "",
          service_title: draft?.title || "",
          service_description: draft?.description || "",
          price_from: draft?.price_from != null ? String(draft.price_from) : "",
          currency: draft?.currency || "NGN",
          delivery_mode: draft?.delivery_mode || "in_person",
          country: draft?.country || onboarding.profile?.country || "",
          state: draft?.state || onboarding.profile?.state || "",
          city: draft?.city || "",
          area: draft?.area || onboarding.profile?.area || "",
          availability_text: draft?.availability_text || "",
          available_now: Boolean(draft?.available_now),
        });
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load Professional setup.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [hydrated, next]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = event.target;
    const value = target instanceof HTMLInputElement && target.type === "checkbox" ? target.checked : target.value;
    setForm((current) => ({ ...current, [target.name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const current = useAuthStore.getState();
    if (!current.access || current.user?.role !== "professional") return;
    setSaving(true);
    setError(null);
    void trackProductEvent("professional_onboarding_started", {
      role: "professional",
      delivery_mode: form.delivery_mode,
      currency: form.currency,
      available_now: form.available_now,
    });
    try {
      const response = await fetch(`${DJANGO_URL}/api/auth/onboarding/professional/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${current.access}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...form, category_id: Number(form.category_id), price_from: form.price_from }),
      });
      const data = (await response.json().catch(() => ({}))) as OnboardingResponse;
      if (!response.ok || !data.user) throw new Error(data.detail || "Unable to finish Professional setup.");
      updateSessionUser(data.user);
      void trackProductEvent("professional_onboarding_completed", {
        role: "professional",
        delivery_mode: form.delivery_mode,
        currency: form.currency,
        available_now: form.available_now,
      });
      toast.success("Your Professional workspace is ready.");
      window.location.href = next;
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Unable to finish Professional setup.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (!hydrated || loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4" aria-live="polite" aria-busy="true">
        <div className="w-full max-w-3xl space-y-4">
          <Skeleton className="h-9 w-52" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </main>
    );
  }

  if (error && user.role !== "professional") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <InlineAlert tone="error" className="max-w-lg">
          <p className="font-black">Professional setup is not available for this account.</p>
          <p className="mt-1 font-normal">Use your Client journey instead.</p>
          <Button className="mt-4" variant="primary" onClick={() => { window.location.href = "/home"; }}>Go to SabiWay home</Button>
        </InlineAlert>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between gap-4">
          <Image src="/Footerlogo.svg" alt="SabiWay" width={128} height={42} priority />
          <p className="text-sm font-bold text-muted-foreground">Professional setup</p>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
          <section>
            <p className="text-sm font-black text-primary">Build a useful Professional starting point</p>
            <h1 className="mt-2 text-4xl font-black tracking-[-.035em] sm:text-5xl">Set up how Clients should understand your work.</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">Create the first draft of your service presence. It stays private as a draft until you deliberately move it into the marketplace publishing and trust flow.</p>

            <div className="mt-7 grid gap-3">
              {[
                [BriefcaseBusiness, "Start with one clear service", "Choose the category, scope and starting price that best represent the work you want to win first."],
                [MapPin, "Be explicit about delivery", "Remote and in-person availability are different promises. Your service area should reflect what you can actually deliver."],
                [ShieldCheck, "Draft does not mean verified", "Completing setup does not approve your service or verification status. Trust checks remain separate."],
                [BadgeCheck, "Improve after setup", "You can refine your profile, service, availability and verification evidence before public publishing."],
              ].map(([Icon, title, description]) => {
                const ItemIcon = Icon as typeof BriefcaseBusiness;
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
              <p className="text-sm font-black">Your Professional starting point</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Complete the minimum information needed for a coherent profile and first draft service.</p>
            </div>

            {error ? <InlineAlert tone="error" className="mt-5"><p>{error}</p></InlineAlert> : null}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full Name" name="full_name" value={form.full_name} onChange={handleChange} required autoComplete="name" />
                <Field label="Phone Number" hint="Optional" name="phone_number" type="tel" value={form.phone_number} onChange={handleChange} autoComplete="tel" />
              </div>
              <TextareaField label="Professional Summary" hint="At least 40 characters. Explain what you do, who you help and the kind of work you are best suited for." name="professional_summary" value={form.professional_summary} onChange={handleChange} required rows={4} />

              <div className="border-t border-border pt-5">
                <p className="font-black">First service draft</p>
                <p className="mt-1 text-sm text-muted-foreground">This remains a draft after onboarding.</p>
              </div>

              <SelectField label="Service Category" name="category_id" value={form.category_id} onChange={handleChange} required>
                <option value="">Choose a category</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </SelectField>
              <Field label="Service Title" name="service_title" value={form.service_title} onChange={handleChange} required placeholder="e.g. Home electrical installation and repairs" />
              <TextareaField label="Service Description" hint="At least 40 characters. Be specific about scope and what a Client can expect." name="service_description" value={form.service_description} onChange={handleChange} required rows={5} />

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Starting Price" name="price_from" type="number" min="0" step="0.01" value={form.price_from} onChange={handleChange} required />
                <SelectField label="Currency" name="currency" value={form.currency} onChange={handleChange} required>
                  <option value="NGN">NGN</option>
                  <option value="GBP">GBP</option>
                </SelectField>
                <SelectField label="Delivery Mode" name="delivery_mode" value={form.delivery_mode} onChange={handleChange} required>
                  <option value="in_person">In person</option>
                  <option value="remote">Remote</option>
                  <option value="both">In person or remote</option>
                </SelectField>
              </div>

              {inPerson ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Service Country" name="country" value={form.country} onChange={handleChange} required placeholder="e.g. Nigeria or United Kingdom" />
                  <Field label="Region / State" hint="Optional" name="state" value={form.state} onChange={handleChange} />
                  <Field label="City" hint="Optional" name="city" value={form.city} onChange={handleChange} />
                  <Field label="Area" hint="Optional" name="area" value={form.area} onChange={handleChange} />
                </div>
              ) : null}

              <Field label="Availability Note" hint="Optional" name="availability_text" value={form.availability_text} onChange={handleChange} placeholder="e.g. Weekdays after 5pm and Saturdays" />
              <CheckboxField label="I am currently available for new enquiries" name="available_now" checked={form.available_now} onChange={handleChange} />

              <InlineAlert tone="info">
                <p className="font-black">This creates a draft, not a public listing.</p>
                <p className="mt-1 font-normal">Publishing, moderation and verification remain separate steps so Clients are never shown an unreviewed service as approved.</p>
              </InlineAlert>

              <Button type="submit" variant="primary" size="lg" className="w-full" loading={saving} loadingLabel="Finishing Professional setup…">Finish Professional setup</Button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
