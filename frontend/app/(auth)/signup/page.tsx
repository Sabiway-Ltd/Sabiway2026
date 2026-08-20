"use client";

import { useId, useState } from "react";
import { BriefcaseBusiness, UserRound } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";

import { AuthPasswordField } from "@/app/(auth)/_components/AuthPasswordField";
import Button from "@/app/_components/common/Button";
import { Field } from "@/app/_components/common/DesignPrimitives";
import { rememberAuthIntent } from "@/app/auth/session";
import { useAuthStore, type AccountRole } from "@/app/store/useAuthStore";
import { DJANGO_URL } from "@/app/utils/MyConstants";

function roleFromQuery(value: string | null): AccountRole {
  return value === "professional" ? "professional" : "client";
}

export default function Signup() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const termsId = useId();
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signup, loading } = useAuthStore();
  const [form, setForm] = useState(() => ({
    full_name: "",
    email: "",
    password: "",
    role: roleFromQuery(searchParams.get("role")),
    phone_number: "",
    terms_accepted: false,
  }));

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.terms_accepted) {
      toast.error("Accept the SabiWay Terms and Privacy Notice to continue.");
      return;
    }
    const success = await signup(form);
    if (success) router.push("/check-email");
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      rememberAuthIntent("/home", form.role);
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

  return (
    <main className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[.8fr_1.2fr]">
      <section className="hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="w-fit">
          <Image src="/Footerlogo.svg" alt="SabiWay" width={150} height={48} className="brightness-0 invert" />
        </Link>
        <div>
          <p className="text-xs font-black uppercase tracking-[.18em] text-primary-foreground/70">Join SabiWay</p>
          <h1 className="mt-4 max-w-lg text-5xl font-black leading-[1.02] tracking-[-.04em]">Choose how you want to use SabiWay.</h1>
          <p className="mt-5 max-w-md text-base leading-7 text-primary-foreground/80">Clients find trusted help. Professionals build visibility, trust and opportunities. Both stay connected through SabiForum.</p>
        </div>
        <p className="text-xs text-primary-foreground/60">One account across web, Android and iOS</p>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-xl">
          <Link href="/" className="mx-auto mb-8 block w-fit lg:hidden">
            <Image src="/Footerlogo.svg" alt="SabiWay" width={140} height={44} />
          </Link>
          <p className="text-sm text-muted-foreground">Create your account</p>
          <h2 className="mt-1 text-3xl font-black tracking-[-.025em]"><span className="text-primary">Sign up</span> and start your journey with SabiWay.</h2>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <fieldset>
              <legend className="mb-2 text-sm font-bold">Select your role</legend>
              <div className="grid grid-cols-2 gap-3">
                {([
                  ["professional", "Professional", BriefcaseBusiness],
                  ["client", "Client", UserRound],
                ] as const).map(([role, label, Icon]) => {
                  const selected = form.role === role;
                  return (
                    <label
                      key={role}
                      className={clsx(
                        "cursor-pointer rounded-[var(--sabi-radius-lg)] border p-5 text-center transition-colors focus-within:ring-[var(--sabi-focus-ring-width)] focus-within:ring-ring focus-within:ring-offset-2",
                        selected ? "border-primary bg-[var(--sabi-surface-selected)] shadow-[var(--sabi-shadow-sm)]" : "border-border bg-card hover:bg-muted",
                      )}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role}
                        checked={selected}
                        onChange={() => setForm((current) => ({ ...current, role }))}
                        className="sr-only"
                      />
                      <span className={clsx("mx-auto flex h-12 w-12 items-center justify-center rounded-full", selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                        <Icon size={21} aria-hidden="true" />
                      </span>
                      <span className="mt-3 block text-sm font-black">{label}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <Field
              label="Full Name"
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              required
              autoComplete="name"
              placeholder="Full name"
            />
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
            <Field
              label="Phone Number"
              hint="Optional"
              type="tel"
              name="phone_number"
              value={form.phone_number}
              onChange={handleChange}
              autoComplete="tel"
              placeholder="08012345678 or +2348012345678"
            />
            <AuthPasswordField
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
            />

            <div className="flex min-h-11 items-start gap-3 rounded-[var(--sabi-radius-md)] py-2 text-sm leading-6">
              <input
                id={termsId}
                type="checkbox"
                checked={form.terms_accepted}
                onChange={(event) => setForm((current) => ({ ...current, terms_accepted: event.target.checked }))}
                className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--sabi-primary)]"
              />
              <label htmlFor={termsId}>
                I acknowledge that I have read and agree to the <Link href="/terms-of-use" className="font-bold text-[var(--sabi-link)] hover:underline">SabiWay Agreements</Link> and <Link href="/privacy-policy" className="font-bold text-[var(--sabi-link)] hover:underline">Privacy Policy</Link>.
              </label>
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading} loadingLabel="Creating account…">
              Sign Up as {form.role === "professional" ? "Professional" : "Client"}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            variant="normal"
            size="lg"
            className="w-full border border-border bg-card"
            onClick={handleGoogleLogin}
            loading={googleLoading}
            loadingLabel="Redirecting…"
            leadingIcon={<FcGoogle size={18} />}
          >
            Continue with Google as {form.role === "professional" ? "Professional" : "Client"}
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">I already have an account · <Link href="/login" className="font-black text-[var(--sabi-link)] hover:underline">Sign in</Link></p>
        </div>
      </section>
    </main>
  );
}
