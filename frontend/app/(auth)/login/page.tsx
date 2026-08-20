"use client";

import { useState } from "react";
import { ShieldCheck, UsersRound } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import toast from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";

import { AuthPasswordField } from "@/app/(auth)/_components/AuthPasswordField";
import Button from "@/app/_components/common/Button";
import { Field, InlineAlert } from "@/app/_components/common/DesignPrimitives";
import { rememberAuthIntent } from "@/app/auth/session";
import { safeInternalNext } from "@/app/config/accessPolicy";
import { useAuthStore, type AccountRole } from "@/app/store/useAuthStore";
import { DJANGO_URL } from "@/app/utils/MyConstants";

export default function Login() {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [reviewingRole, setReviewingRole] = useState<AccountRole | null>(null);
  const [form, setForm] = useState({ email: "", password: "" });
  const { login, reviewLogin, loading } = useAuthStore();
  const reviewModeEnabled = process.env.NEXT_PUBLIC_INTERNAL_REVIEW_MODE === "true";

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const requestedNext = () => safeInternalNext(new URLSearchParams(window.location.search).get("next"), "/home");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const success = await login(form);
    if (success) window.location.href = requestedNext();
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      rememberAuthIntent(requestedNext());
      const response = await fetch(`${DJANGO_URL}/api/auth/generate-google-url`);
      const data = await response.json();
      if (data?.auth_url) window.location.href = data.auth_url;
      else toast.error("Failed to load Google login.");
    } catch {
      toast.error("Error initialising Google login");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleReviewLogin = async (role: AccountRole) => {
    setReviewingRole(role);
    const success = await reviewLogin(role);
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
          <p className="text-xs font-black uppercase tracking-[.18em] text-primary-foreground/70">One account. One SabiWay.</p>
          <h1 className="mt-4 max-w-xl text-5xl font-black leading-[1.02] tracking-[-.04em]">Trusted services, real opportunities and useful community.</h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-primary-foreground/80">Sign in once to continue across marketplace, SabiForum, messages, bookings and protected payments.</p>
          <div className="mt-8 grid max-w-lg grid-cols-2 gap-3">
            <div className="rounded-[var(--sabi-radius-lg)] bg-primary-foreground/10 p-4">
              <ShieldCheck aria-hidden="true" />
              <p className="mt-3 font-black">Trust built in</p>
              <p className="mt-1 text-sm text-primary-foreground/75">Verification, protected transactions and support.</p>
            </div>
            <div className="rounded-[var(--sabi-radius-lg)] bg-primary-foreground/10 p-4">
              <UsersRound aria-hidden="true" />
              <p className="mt-3 font-black">Shared identity</p>
              <p className="mt-1 text-sm text-primary-foreground/75">The same profile across web and mobile.</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-primary-foreground/60">SabiWay · Built for Nigerians at home and abroad</p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link href="/" className="mx-auto mb-10 block w-fit lg:hidden">
            <Image src="/Footerlogo.svg" alt="SabiWay" width={140} height={44} />
          </Link>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h2 className="mt-1 text-3xl font-black tracking-[-.025em]"><span className="text-primary">Sign in</span> and continue your journey with SabiWay.</h2>

          {reviewModeEnabled ? (
            <InlineAlert tone="warning" className="mt-6" >
              <p className="text-xs font-black uppercase tracking-[.14em]">Internal review mode</p>
              <p className="mt-1 font-normal">Open the internal product without email, password or Google authentication. Review sessions are non-staff and available only when the backend is running in explicit development review mode.</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  disabled={loading || reviewingRole !== null}
                  loading={reviewingRole === "client"}
                  loadingLabel="Opening…"
                  onClick={() => void handleReviewLogin("client")}
                >
                  Review as Client
                </Button>
                <Button
                  variant="primary"
                  disabled={loading || reviewingRole !== null}
                  loading={reviewingRole === "professional"}
                  loadingLabel="Opening…"
                  onClick={() => void handleReviewLogin("professional")}
                >
                  Review as Professional
                </Button>
              </div>
            </InlineAlert>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Field
              label="Email Address"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
            <AuthPasswordField
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
            <div className="text-right">
              <Link href="/forgot-password" className="text-sm font-bold text-[var(--sabi-link)] hover:underline">Forgot your password?</Link>
            </div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={reviewingRole !== null}
              loading={loading && !reviewingRole}
              loadingLabel="Signing in…"
            >
              Sign in
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            variant="normal"
            size="lg"
            className="w-full border border-border bg-card"
            onClick={handleGoogleLogin}
            disabled={reviewingRole !== null}
            loading={googleLoading}
            loadingLabel="Redirecting…"
            leadingIcon={<FcGoogle size={18} />}
          >
            Continue with Google
          </Button>

          <p className="mt-7 text-center text-sm text-muted-foreground">I don’t have an account · <Link href="/signup" className="font-black text-[var(--sabi-link)] hover:underline">Sign up</Link></p>
          <p className="mt-6 text-center text-[11px] leading-5 text-muted-foreground">By continuing, you agree to our <Link href="/privacy-policy" className="font-bold text-[var(--sabi-link)] hover:underline">Privacy Policy</Link> and <Link href="/terms-of-use" className="font-bold text-[var(--sabi-link)] hover:underline">Terms of Use</Link>.</p>
        </div>
      </section>
    </main>
  );
}
