"use client";

import { useState } from "react";
import { Eye, EyeOff, ShieldCheck, UsersRound } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import toast from "react-hot-toast";
import { safeInternalNext } from "@/app/config/accessPolicy";
import { rememberAuthIntent } from "@/app/auth/session";
import { useAuthStore, type AccountRole } from "@/app/store/useAuthStore";
import { DJANGO_URL } from "@/app/utils/MyConstants";
import Link from "next/link";
import Image from "next/image";

export default function Login() {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [reviewingRole, setReviewingRole] = useState<AccountRole | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const { login, reviewLogin, loading } = useAuthStore();
  const reviewModeEnabled = process.env.NEXT_PUBLIC_INTERNAL_REVIEW_MODE === "true";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [e.target.name]: e.target.value });
  const requestedNext = () => safeInternalNext(new URLSearchParams(window.location.search).get("next"), "/home");
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(form);
    if (success) window.location.href = requestedNext();
  };
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      rememberAuthIntent(requestedNext());
      const res = await fetch(`${DJANGO_URL}/api/auth/generate-google-url`);
      const data = await res.json();
      if (data?.auth_url) window.location.href = data.auth_url;
      else toast.error("Failed to load Google login.");
    } catch {
      toast.error("Error initializing Google login");
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

  return <main className="min-h-screen bg-[#f4f5f4] text-[#173126] lg:grid lg:grid-cols-[.9fr_1.1fr]">
    <section className="hidden bg-[#008753] p-12 text-white lg:flex lg:flex-col lg:justify-between"><Link href="/" className="inline-flex w-fit"><Image src="/Footerlogo.svg" alt="SabiWay" width={150} height={48} className="brightness-0 invert"/></Link><div><p className="text-xs font-black uppercase tracking-[.18em] text-white/65">One account. One SabiWay.</p><h1 className="mt-4 max-w-xl text-5xl font-black leading-[1.02] tracking-[-.04em]">Trusted services, real opportunities and useful community.</h1><p className="mt-5 max-w-lg text-base leading-7 text-white/75">Sign in once to continue across marketplace, SabiForum, messages, bookings and protected payments.</p><div className="mt-8 grid max-w-lg grid-cols-2 gap-3"><div className="rounded-2xl bg-white/10 p-4"><ShieldCheck/><p className="mt-3 font-black">Trust built in</p><p className="mt-1 text-sm text-white/70">Verification, protected transactions and support.</p></div><div className="rounded-2xl bg-white/10 p-4"><UsersRound/><p className="mt-3 font-black">Shared identity</p><p className="mt-1 text-sm text-white/70">The same profile across web and mobile.</p></div></div></div><p className="text-xs text-white/55">SabiWay · Built for Nigerians at home and abroad</p></section>
    <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8"><div className="w-full max-w-md"><Link href="/" className="mx-auto mb-10 block w-fit lg:hidden"><Image src="/Footerlogo.svg" alt="SabiWay" width={140} height={44}/></Link><p className="text-sm text-[#66756d]">Welcome back</p><h2 className="mt-1 text-3xl font-black tracking-[-.025em]"><span className="text-[#008753]">Sign in</span> and continue your journey with SabiWay.</h2>
      {reviewModeEnabled ? <section className="mt-6 rounded-2xl border border-[#f1d57b] bg-[#fff8dc] p-4" aria-label="Internal review access"><p className="text-xs font-black uppercase tracking-[.14em] text-[#7a5a00]">Internal review mode</p><p className="mt-1 text-sm leading-6 text-[#5d511f]">Open the internal product without email, password or Google authentication. Review sessions are non-staff and available only when the backend is running in explicit development review mode.</p><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" disabled={loading || reviewingRole !== null} onClick={() => void handleReviewLogin("client")} className="min-h-11 rounded-xl border border-[#d9bd57] bg-white px-3 text-sm font-black text-[#173126] disabled:opacity-50">{reviewingRole === "client" ? "Opening…" : "Review as Client"}</button><button type="button" disabled={loading || reviewingRole !== null} onClick={() => void handleReviewLogin("professional")} className="min-h-11 rounded-xl bg-[#008753] px-3 text-sm font-black text-white disabled:opacity-50">{reviewingRole === "professional" ? "Opening…" : "Review as Professional"}</button></div></section> : null}
      <form onSubmit={handleSubmit} className="mt-8 space-y-4"><label className="block"><span className="mb-1.5 block text-sm font-bold">Email Address</span><input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="Email Address" className="min-h-12 w-full rounded-xl border border-[#d4dcd7] bg-white px-4 text-sm outline-none focus:border-[#008753] focus:ring-2 focus:ring-[#008753]/15"/></label><label className="block"><span className="mb-1.5 block text-sm font-bold">Password</span><span className="relative block"><input type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange} required placeholder="Password" className="min-h-12 w-full rounded-xl border border-[#d4dcd7] bg-white px-4 pr-11 text-sm outline-none focus:border-[#008753] focus:ring-2 focus:ring-[#008753]/15"/><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#68776f]" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></span></label><div className="text-right"><Link href="/forgot-password" className="text-sm font-bold text-[#008753]">Forgot your password?</Link></div><button type="submit" disabled={loading || reviewingRole !== null} className="min-h-12 w-full rounded-xl bg-[#008753] font-black text-white transition hover:bg-[#007047] disabled:opacity-60">{loading && !reviewingRole ? "Signing in…" : "Sign in"}</button></form>
      <div className="my-6 flex items-center gap-3"><span className="h-px flex-1 bg-[#dfe4e1]"/><span className="text-xs text-[#808a84]">or</span><span className="h-px flex-1 bg-[#dfe4e1]"/></div><button type="button" onClick={handleGoogleLogin} disabled={googleLoading || reviewingRole !== null} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#d4dcd7] bg-white text-sm font-bold disabled:opacity-60"><FcGoogle size={18}/>{googleLoading ? "Redirecting…" : "Continue with Google"}</button>
      <p className="mt-7 text-center text-sm text-[#68776f]">I don’t have an account · <Link href="/signup" className="font-black text-[#008753]">Sign up</Link></p><p className="mt-6 text-center text-[11px] leading-5 text-[#89928d]">By continuing, you agree to our <Link href="/privacy-policy" className="font-bold text-[#008753]">Privacy Policy</Link> and <Link href="/terms-of-use" className="font-bold text-[#008753]">Terms of Use</Link>.</p></div></section>
  </main>;
}