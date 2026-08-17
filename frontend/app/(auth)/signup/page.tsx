"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";

import { PublicHeader } from "@/app/_components/v2/PublicShell";
import { useAuthStore, type AccountRole } from "@/app/store/useAuthStore";
import { DJANGO_URL } from "@/app/utils/MyConstants";

export default function Signup() {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signup, loading } = useAuthStore();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "client" as AccountRole,
    phone_number: "",
    terms_accepted: false,
  });
  const router = useRouter();

  const fieldClass = "w-full min-h-12 border border-[#d6e2db] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#008753]/20 focus:border-[#008753] focus:outline-none";

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
      const res = await fetch(`${DJANGO_URL}/api/auth/generate-google-url/`);
      const data = await res.json();
      if (data?.auth_url) window.location.href = data.auth_url;
      else toast.error("Failed to load Google login.");
    } catch (error) {
      console.error("Google login error:", error);
      toast.error("Error initialising Google login");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7faf8] flex flex-col text-[#173126]">
      <PublicHeader />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="w-full max-w-lg bg-white rounded-3xl px-6 py-8 sm:px-8 shadow-sm border border-[#dce8e1]">
          <p className="text-xs font-black uppercase tracking-[.16em] text-[#008753] text-center">Join SabiWay</p>
          <h1 className="mt-2 text-2xl font-black text-center">Create your account</h1>
          <p className="text-center text-[#68776f] text-sm mt-3 leading-relaxed">One account works across web, Android and iOS.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <fieldset>
              <legend className="text-sm font-bold mb-2">How will you use SabiWay?</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {([
                  ["client", "I need a service"],
                  ["professional", "I provide services"],
                ] as const).map(([role, label]) => (
                  <label key={role} className={`cursor-pointer rounded-xl border p-4 text-sm font-bold transition ${form.role === role ? "border-[#008753] bg-[#effaf4]" : "border-[#d6e2db]"}`}>
                    <input type="radio" name="role" value={role} checked={form.role === role} onChange={() => setForm((current) => ({ ...current, role }))} className="mr-2 accent-[#008753]" />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="block text-sm font-bold">Full name<input type="text" name="full_name" value={form.full_name} onChange={handleChange} required autoComplete="name" className={`${fieldClass} mt-2`} /></label>
            <label className="block text-sm font-bold">Email address<input type="email" name="email" value={form.email} onChange={handleChange} required autoComplete="email" className={`${fieldClass} mt-2`} /></label>
            <label className="block text-sm font-bold">Nigerian phone number <span className="font-normal text-[#68776f]">(optional)</span><input type="tel" name="phone_number" value={form.phone_number} onChange={handleChange} autoComplete="tel" placeholder="08012345678 or +2348012345678" className={`${fieldClass} mt-2`} /></label>

            <label className="block text-sm font-bold">Password
              <div className="relative mt-2">
                <input type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange} required autoComplete="new-password" className={`${fieldClass} pr-12`} />
                <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-3 text-[#68776f] min-h-6 min-w-6 flex items-center justify-center">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
              </div>
            </label>

            <label className="flex min-h-11 items-start gap-3 text-sm leading-6 cursor-pointer">
              <input type="checkbox" checked={form.terms_accepted} onChange={(event) => setForm((current) => ({ ...current, terms_accepted: event.target.checked }))} className="mt-1 h-5 w-5 accent-[#008753]" />
              <span>I accept the <Link href="/terms-of-use" className="text-[#008753] font-bold hover:underline">Terms of Use</Link> and <Link href="/privacy-policy" className="text-[#008753] font-bold hover:underline">Privacy Policy</Link>.</span>
            </label>

            <button type="submit" disabled={loading} className="w-full min-h-12 bg-[#008753] text-white py-3 rounded-xl text-sm font-black hover:bg-[#007047] transition disabled:opacity-60">{loading ? "Creating account…" : "Create account"}</button>
          </form>

          <div className="flex items-center justify-center my-5"><hr className="w-1/2 border-[#e2eae5]" /><span className="mx-3 text-[#7b8981] text-xs">or</span><hr className="w-1/2 border-[#e2eae5]" /></div>
          <button type="button" onClick={handleGoogleLogin} disabled={googleLoading} className="w-full min-h-12 border border-[#d6e2db] rounded-xl py-3 flex items-center justify-center gap-2 transition-all text-sm font-bold hover:bg-[#f4f8f6] disabled:opacity-60">
            {googleLoading ? <><div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"/><span>Redirecting…</span></> : <><FcGoogle size={18}/><span>Continue with Google</span></>}
          </button>
          <p className="text-center text-[#68776f] text-xs mt-5">New Google accounts will return here to complete role and terms onboarding before a session is issued.</p>
          <p className="text-center text-[#68776f] text-xs mt-3">Already have an account? <Link href="/login" className="text-[#008753] font-black hover:underline">Sign in</Link></p>
        </motion.div>
      </div>
    </div>
  );
}
