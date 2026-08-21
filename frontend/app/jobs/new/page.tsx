"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { ArrowLeft, BriefcaseBusiness, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/app/_components/v2/AppShell";
import { InlineAlert } from "@/app/_components/common/DesignPrimitives";
import { environment } from "@/app/config/environment";
import { useAuthStore } from "@/app/store/useAuthStore";

type Category = { id: string; name: string };
type Paginated<T> = T[] | { results?: T[] };
const unwrap = <T,>(payload: Paginated<T>): T[] => Array.isArray(payload) ? payload : payload.results || [];

export default function NewJobPage() {
  const router = useRouter();
  const access = useAuthStore((state) => state.access);
  const user = useAuthStore((state) => state.user);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const response = await fetch(`${environment.djangoUrl}/api/marketplace/categories/`, { cache: "no-store" });
      if (!response.ok) throw new Error("Service categories could not be loaded.");
      setCategories(unwrap<Category>(await response.json()));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Service categories could not be loaded.");
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => { void loadCategories(); }, [loadCategories]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!access || user?.role !== "client") return;
    setSubmitting(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const payload = Object.fromEntries(Array.from(data.entries()).filter(([, value]) => String(value).trim() !== ""));
    try {
      const response = await fetch(`${environment.djangoUrl}/api/marketplace/jobs/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const first = typeof body.detail === "string" ? body.detail : Object.values(body).flat().find(Boolean);
        throw new Error(typeof first === "string" ? first : "Your job could not be posted.");
      }
      router.push(`/jobs/${body.id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Your job could not be posted.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:py-10">
        <Link href="/jobs" className="inline-flex min-h-11 items-center gap-2 text-sm font-black text-primary"><ArrowLeft size={17} aria-hidden="true" />Back to My Jobs</Link>
        <header className="mt-4">
          <p className="text-xs font-black uppercase tracking-[.14em] text-primary">Client workspace</p>
          <h1 className="mt-1 text-3xl font-black tracking-[-.03em]">Post a job</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Describe the outcome you need. Your request enters moderation before it becomes visible to Professionals.</p>
        </header>

        {error ? <InlineAlert tone="error" className="mt-5"><p>{error}</p></InlineAlert> : null}

        <form onSubmit={submit} className="mt-6 space-y-6 rounded-[var(--sabi-radius-lg)] border border-border bg-card p-5 shadow-[var(--sabi-shadow-sm)] sm:p-6">
          <div>
            <label htmlFor="title" className="text-sm font-black">Job title</label>
            <input id="title" name="title" required maxLength={180} className="mt-2 min-h-11 w-full rounded-[var(--sabi-radius-md)] border border-border bg-background px-3 text-sm" placeholder="e.g. Repair leaking kitchen tap" />
          </div>
          <div>
            <label htmlFor="description" className="text-sm font-black">What do you need?</label>
            <textarea id="description" name="description" required rows={6} className="mt-2 w-full rounded-[var(--sabi-radius-md)] border border-border bg-background px-3 py-3 text-sm" placeholder="Describe the problem, expected outcome and anything the Professional should know." />
          </div>
          <div>
            <label htmlFor="category_id" className="text-sm font-black">Service category</label>
            <select id="category_id" name="category_id" required disabled={loadingCategories} className="mt-2 min-h-11 w-full rounded-[var(--sabi-radius-md)] border border-border bg-background px-3 text-sm">
              <option value="">{loadingCategories ? "Loading categories…" : "Choose a category"}</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label htmlFor="budget_min" className="text-sm font-black">Minimum budget</label><input id="budget_min" name="budget_min" type="number" min="0" step="0.01" className="mt-2 min-h-11 w-full rounded-[var(--sabi-radius-md)] border border-border bg-background px-3 text-sm" /></div>
            <div><label htmlFor="budget_max" className="text-sm font-black">Maximum budget</label><input id="budget_max" name="budget_max" type="number" min="0" step="0.01" className="mt-2 min-h-11 w-full rounded-[var(--sabi-radius-md)] border border-border bg-background px-3 text-sm" /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label htmlFor="currency" className="text-sm font-black">Currency</label><input id="currency" name="currency" defaultValue="NGN" maxLength={3} className="mt-2 min-h-11 w-full rounded-[var(--sabi-radius-md)] border border-border bg-background px-3 text-sm uppercase" /></div>
            <div><label htmlFor="delivery_mode" className="text-sm font-black">Delivery</label><select id="delivery_mode" name="delivery_mode" defaultValue="in_person" className="mt-2 min-h-11 w-full rounded-[var(--sabi-radius-md)] border border-border bg-background px-3 text-sm"><option value="in_person">In person</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option></select></div>
          </div>
          <fieldset>
            <legend className="text-sm font-black">Location</legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-2"><input name="country" placeholder="Country" className="min-h-11 rounded-[var(--sabi-radius-md)] border border-border bg-background px-3 text-sm" /><input name="state" placeholder="State / region" className="min-h-11 rounded-[var(--sabi-radius-md)] border border-border bg-background px-3 text-sm" /><input name="city" placeholder="City" className="min-h-11 rounded-[var(--sabi-radius-md)] border border-border bg-background px-3 text-sm" /><input name="area" placeholder="Area" className="min-h-11 rounded-[var(--sabi-radius-md)] border border-border bg-background px-3 text-sm" /></div>
          </fieldset>
          <div><label htmlFor="needed_by" className="text-sm font-black">Needed by <span className="font-normal text-muted-foreground">(optional)</span></label><input id="needed_by" name="needed_by" type="date" className="mt-2 min-h-11 w-full rounded-[var(--sabi-radius-md)] border border-border bg-background px-3 text-sm" /></div>
          <InlineAlert tone="info"><BriefcaseBusiness size={18} aria-hidden="true" /><p>Posting a job does not select a Professional, create a booking or take payment. Those remain separate steps.</p></InlineAlert>
          <button type="submit" disabled={submitting || loadingCategories || user?.role !== "client"} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--sabi-radius-md)] bg-primary px-4 py-2.5 text-sm font-black text-primary-foreground disabled:opacity-60">
            {submitting ? <><Loader2 className="animate-spin" size={18} aria-hidden="true" />Posting…</> : "Post job for review"}
          </button>
        </form>
      </main>
    </AppShell>
  );
}
