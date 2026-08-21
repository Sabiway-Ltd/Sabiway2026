"use client";

import { useEffect, useState } from "react";
import { BriefcaseBusiness, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import toast from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";

import { AuthPasswordField } from "@/app/(auth)/_components/AuthPasswordField";
import Button from "@/app/_components/common/Button";
import { Field, InlineAlert } from "@/app/_components/common/DesignPrimitives";
import { postAuthDestination } from "@/app/auth/destination";
import { rememberAuthIntent } from "@/app/auth/session";
import { safeInternalNext } from "@/app/config/accessPolicy";
import { useAuthStore, type AccountRole } from "@/app/store/useAuthStore";
import { trackProductEvent } from "@/app/utils/analytics";
import { DJANGO_URL } from "@/app/utils/MyConstants";

const roleCopy: Record<AccountRole, { title: string; description: string }> = {
  client: {
    title: "Continue as a Client",
    description: "Return to services, conversations, bookings and work you are managing.",
  },
  professional: {
    title: "Continue as a Professional",
    description: "Return to opportunities, enquiries, services, verification and earnings activity.",
  },
};

export function LoginExperience({ lockedRole }: { lockedRole?: AccountRole }) {
  const [role, setRole] = useState<AccountRole>(lockedRole ?? "client");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [reviewingRole, setReviewingRole] = useState<AccountRole | null>(null);
  const [form, setForm] = useState({ email: "", password: "" });
  const { login, reviewLogin, loading } = useAuthStore();
  const reviewModeEnabled = process.env.NEXT_PUBLIC_INTERNAL_REVIEW_MODE === "true";
  const activeRole = lockedRole ?? role;
  const activeCopy = roleCopy[activeRole];
  const entryType = lockedRole ? "dedicated" : "generic";

  useEffect(() => {
    void trackProductEvent("role_entry_viewed", { flow: "login", role: activeRole, entry_type: entryType });
  }, [activeRole, entryType]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const requestedNext = () => safeInternalNext(new URLSearchParams(window.location.search).get("next"), "/home");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    void trackProductEvent("role_auth_started", { flow: "login", role: activeRole, entry_type: entryType, method: "password" });
    const success = await login(form);
    if (success) {
      void trackProductEvent("role_auth_succeeded", { flow: "login", role: activeRole, entry_type: entryType, method: "password" });
      window.location.href = postAuthDestination(useAuthStore.getState().user, requestedNext());
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    void trackProductEvent("role_auth_started", { flow: "login", role: activeRole, entry_type: entryType, method: "google" });
    try {
      rememberAuthIntent(requestedNext(), activeRole);
      const response = await fetch(`${DJANGO_URL}/api/auth/generate-google-url/`);
      const data = await response.json();
      if (data?.auth_url) window.location.href = data.auth_url;
      else toast.error("Failed to load Google login.");
    } catch {
      toast.error("Error initialising Google login");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleRoleSelection = (candidate: AccountRole) => {
    setRole(candidate);
    void trackProductEvent("role_intent_selected", { flow: "login", role: candidate, entry_type: "generic" });
  };

  const handleReviewLogin = async (reviewRole: AccountRole) => {
    setReviewingRole(reviewRole);
    const success = await reviewLogin(reviewRole);
    if (success) window.location.href = requestedNext();
    else setReviewingRole(null);
  };

  return (
    <main className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[.9fr_1.1fr]">
      <section className="hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="inline-flex w-fit">
          <Image src="/Footerlogo.svg" alt="SabiWay" width={150} height={48} className="brightness-0 invert" />
        </Link>
        <div>
          <p className="text-xs font-black uppercase tracking-[.18em] text-primary-foreground/70">One account. Two clear journeys.</p>
          <h1 className="mt-4 max-w-xl text-5xl font-black leading-[1.02] tracking-[-.04em]">Sign in for the work you came to do.</h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-primary-foreground/80">Client and Professional entry points stay distinct while your SabiWay identity remains shared.</p>
          <div className="mt-8 grid max-w-lg grid-cols-2 gap-3">
            <div className="rounded-[var(--sabi-radius-lg)] bg-primary-foreground/10 p-4">
              <ShieldCheck aria-hidden="true" />
              <p className="mt-3 font-black">One trusted identity</p>
              <p className="mt-1 text-sm text-primary-foreground/75">Your account role and permissions still come from the authenticated backend.</p>
            </div>
            <div className="rounded-[var(--sabi-radius-lg)] bg-primary-foreground/10 p-4">
              <UsersRound aria-hidden="true" />
              <p className="mt-3 font-black">Role-aware experience</p>
              <p className="mt-1 text-sm text-primary-foreground/75">Navigation and next actions reflect whether you are here as a Client or Professional.</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-primary-foreground/60">SabiWay · Services, opportunity, community and trust</p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link href="/" className="mx-auto mb-8 block w-fit lg:hidden">
            <Image src="/Footerlogo.svg" alt="SabiWay" width={140} height={44} />
          </Link>

          {!lockedRole ? (
            <div className="mb-7 grid grid-cols-2 gap-2" aria-label="Choose sign-in journey">
              {(["client", "professional"] as const).map((candidate) => {
                const selected = role === candidate;
                const Icon = candidate === "client" ? UserRound : BriefcaseBusiness;
                return (
                  <button
                    key={candidate}
                    type="button"
                    onClick={() => handleRoleSelection(candidate)}
                    aria-pressed={selected}
                    className={clsx(
                      "flex min-h-12 items-center justify-center gap-2 rounded-[var(--sabi-radius-md)] border px-3 text-sm font-black",
                      selected ? "border-primary bg-[var(--sabi-surface-selected)] text-primary" : "border-border bg-card text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <Icon size={17} aria-hidden="true" />
                    {candidate === "client" ? "Client" : "Professional"}
                  </button>
                );
              })}
            </div>
          ) : (
            <Link href="/login" className="mb-6 inline-flex min-h-11 items-center text-sm font-bold text-[var(--sabi-link)] hover:underline">Switch sign-in journey</Link>
          )}

          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h2 className="mt-1 text-3xl font-black tracking-[-.025em]">{activeCopy.title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{activeCopy.description}</p>

          {reviewModeEnabled ? (
            <InlineAlert tone="warning" className="mt-6">
              <p className="text-xs font-black uppercase tracking-[.14em]">Internal review mode</p>
              <p className="mt-1 font-normal">Review access remains development-only and does not replace production authentication.</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button variant="secondary" disabled={loading || reviewingRole !== null} loading={reviewingRole === "client"} loadingLabel="Opening…" onClick={() => void handleReviewLogin("client")}>Review as Client</Button>
                <Button variant="primary" disabled={loading || reviewingRole !== null} loading={reviewingRole === "professional"} loadingLabel="Opening…" onClick={() => void handleReviewLogin("professional")}>Review as Professional</Button>
              </div>
            </InlineAlert>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <Field label="Email Address" type="email" name="email" value={form.email} onChange={handleChange} required autoComplete="email" placeholder="you@example.com" />
            <AuthPasswordField value={form.password} onChange={handleChange} autoComplete="current-password" />
            <div className="text-right"><Link href="/forgot-password" className="text-sm font-bold text-[var(--sabi-link)] hover:underline">Forgot your password?</Link></div>
            <Button type="submit" variant="primary" size="lg" className="w-full" disabled={reviewingRole !== null} loading={loading && !reviewingRole} loadingLabel="Signing in…">Sign in as {activeRole === "professional" ? "Professional" : "Client"}</Button>
          </form>

          <div className="my-6 flex items-center gap-3" aria-hidden="true"><span className="h-px flex-1 bg-border" /><span className="text-xs text-muted-foreground">or</span><span className="h-px flex-1 bg-border" /></div>

          <Button variant="normal" size="lg" className="w-full border border-border bg-card" onClick={handleGoogleLogin} disabled={reviewingRole !== null} loading={googleLoading} loadingLabel="Redirecting…" leadingIcon={<FcGoogle size={18} />}>Continue with Google as {activeRole === "professional" ? "Professional" : "Client"}</Button>

          <p className="mt-7 text-center text-sm text-muted-foreground">I don’t have an account · <Link href={`/signup/${activeRole}`} className="font-black text-[var(--sabi-link)] hover:underline">Create {activeRole === "professional" ? "Professional" : "Client"} account</Link></p>
          <p className="mt-6 text-center text-[11px] leading-5 text-muted-foreground">By continuing, you agree to our <Link href="/privacy-policy" className="font-bold text-[var(--sabi-link)] hover:underline">Privacy Policy</Link> and <Link href="/terms-of-use" className="font-bold text-[var(--sabi-link)] hover:underline">Terms of Use</Link>.</p>
        </div>
      </section>
    </main>
  );
}
