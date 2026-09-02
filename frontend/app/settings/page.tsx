"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Accessibility, FileText, HelpCircle, KeyRound, LogOut, Mail, MapPin, Phone, ShieldCheck, UserRound } from "lucide-react";

import Button from "@/app/_components/common/Button";
import { AppShell } from "@/app/_components/v2/AppShell";
import { Skeleton, Surface } from "@/app/_components/common/DesignPrimitives";
import { useAuthStore } from "@/app/store/useAuthStore";
import { useProfileStore } from "@/app/store/useProfileStore";

function SettingsLink({ href, title, description, icon }: { href: string; title: string; description: string; icon: React.ReactNode }) {
  return <Link href={href} className="flex min-h-16 items-start gap-3 rounded-xl border border-[var(--sabi-border)] bg-[var(--sabi-surface-elevated)] p-4 transition-colors hover:bg-[var(--sabi-surface-muted)]"><span className="mt-0.5 text-[var(--sabi-primary)]">{icon}</span><span><span className="block text-sm font-black">{title}</span><span className="mt-1 block text-sm leading-5 text-[var(--sabi-text-muted)]">{description}</span></span></Link>;
}

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { profile, getMyProfile, loading } = useProfileStore();

  useEffect(() => { void getMyProfile(); }, [getMyProfile]);

  if (!user || loading || !profile) return <AppShell><main className="mx-auto max-w-5xl space-y-4 p-4 sm:p-6"><Skeleton className="h-28 w-full" /><Skeleton className="h-72 w-full" /></main></AppShell>;

  const privateLocation = [profile.street, profile.area, profile.state, profile.country].filter(Boolean).join(", ");

  return <AppShell><main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
    <header><p className="text-xs font-black uppercase tracking-[.14em] text-[var(--sabi-primary)]">Private account controls</p><h1 className="mt-1 text-3xl font-black">Settings & support</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--sabi-text-muted)]">Manage private account information, security entry points and support links. Public identity stays in Profile; work status stays in the relevant SabiWay workspace.</p></header>

    <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
      <Surface className="p-5 sm:p-6"><div className="flex items-center gap-2"><UserRound className="text-[var(--sabi-primary)]" /><h2 className="text-xl font-black">Account information</h2></div><p className="mt-2 text-sm text-[var(--sabi-text-muted)]">These details are private account context unless another product surface explicitly identifies them as public.</p><dl className="mt-5 grid gap-3"><div className="rounded-xl bg-[var(--sabi-surface-muted)] p-4"><dt className="flex items-center gap-2 text-xs font-black uppercase tracking-[.1em] text-[var(--sabi-text-muted)]"><Mail size={15} /> Email</dt><dd className="mt-1 break-all text-sm font-bold">{profile.email || user.email || "Not available"}</dd></div><div className="rounded-xl bg-[var(--sabi-surface-muted)] p-4"><dt className="flex items-center gap-2 text-xs font-black uppercase tracking-[.1em] text-[var(--sabi-text-muted)]"><Phone size={15} /> Phone</dt><dd className="mt-1 text-sm font-bold">{profile.phone_number || "Not added"}</dd></div><div className="rounded-xl bg-[var(--sabi-surface-muted)] p-4"><dt className="flex items-center gap-2 text-xs font-black uppercase tracking-[.1em] text-[var(--sabi-text-muted)]"><MapPin size={15} /> Private address context</dt><dd className="mt-1 text-sm font-bold">{privateLocation || "Not added"}</dd></div></dl><div className="mt-4"><Link href="/profile" className="text-sm font-black text-[var(--sabi-primary)]">Edit profile identity →</Link></div></Surface>

      <Surface className="p-5 sm:p-6"><div className="flex items-center gap-2"><ShieldCheck className="text-[var(--sabi-primary)]" /><h2 className="text-xl font-black">Security</h2></div><p className="mt-2 text-sm leading-6 text-[var(--sabi-text-muted)]">Password changes continue through the established account-recovery flow rather than creating a second security implementation.</p><div className="mt-4 grid gap-3"><SettingsLink href="/forgot-password" title="Reset password" description="Request a secure password-reset link for this account." icon={<KeyRound size={19} />} /><SettingsLink href="/privacy-policy" title="Privacy policy" description="Review how SabiWay handles account and product data." icon={<ShieldCheck size={19} />} /></div></Surface>
    </div>

    <section><div className="mb-3"><p className="text-xs font-black uppercase tracking-[.14em] text-[var(--sabi-primary)]">Support & policies</p><h2 className="mt-1 text-2xl font-black">Get help and understand your account</h2></div><div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3"><SettingsLink href="/helpcenter" title="Help centre" description="Find guidance for using SabiWay features and journeys." icon={<HelpCircle size={19} />} /><SettingsLink href="/contact" title="Contact support" description="Use the existing support route when you need direct assistance." icon={<Mail size={19} />} /><SettingsLink href="/accessibility" title="Accessibility" description="Review SabiWay accessibility commitments and support." icon={<Accessibility size={19} />} /><SettingsLink href="/trust-and-safety" title="Trust & safety" description="Understand verification, protected work and marketplace safety." icon={<ShieldCheck size={19} />} /><SettingsLink href="/terms-of-use" title="Terms of use" description="Review the terms governing your SabiWay account." icon={<FileText size={19} />} /><SettingsLink href="/privacy-policy" title="Privacy" description="Review privacy and data-handling information." icon={<ShieldCheck size={19} />} /></div></section>

    <Surface className="border-[var(--sabi-danger)]/25 p-5 sm:p-6"><h2 className="text-xl font-black">Session</h2><p className="mt-2 text-sm leading-6 text-[var(--sabi-text-muted)]">Sign out of this browser session. Account deletion is not shown because SabiWay does not yet have a governed backend deletion/deactivation workflow.</p><div className="mt-4"><Button variant="danger" leadingIcon={<LogOut size={18} />} onClick={() => void logout()}>Sign out</Button></div></Surface>
  </main></AppShell>;
}
