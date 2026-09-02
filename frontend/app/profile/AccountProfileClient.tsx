"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { BadgeCheck, BriefcaseBusiness, Camera, MapPin, Settings, ShieldCheck, UsersRound } from "lucide-react";

import Button from "@/app/_components/common/Button";
import { Avatar, Field, InlineAlert, Skeleton, Surface, TextareaField } from "@/app/_components/common/DesignPrimitives";
import { useAuthStore } from "@/app/store/useAuthStore";
import { useProfileStore } from "@/app/store/useProfileStore";

function publicProfileHref(username?: string) {
  return username ? `/profile/${username.replace(/^@/, "")}` : null;
}

export default function AccountProfileClient() {
  const user = useAuthStore((state) => state.user);
  const { profile, getMyProfile, updateProfile, loading } = useProfileStore();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ full_name: "", bio: "", job: "", country: "", state: "", area: "" });

  useEffect(() => { void getMyProfile(); }, [getMyProfile]);

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name || "",
      bio: profile.bio || "",
      job: profile.job || "",
      country: profile.country || "",
      state: profile.state || "",
      area: profile.area || "",
    });
  }, [profile]);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!profile) return;
    setSaving(true); setError(null); setNotice(null);
    try {
      await updateProfile(profile.user_id, form);
      await getMyProfile();
      setEditing(false);
      setNotice("Profile updated. Public-facing changes use the same SabiWay identity across discovery and community surfaces.");
    } catch {
      setError("Your profile could not be updated. Review the fields and try again.");
    } finally { setSaving(false); }
  }

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !profile) return;
    const payload = new FormData();
    payload.append("profile_picture", file);
    setUploading(true); setError(null); setNotice(null);
    try {
      await updateProfile(profile.user_id, payload);
      await getMyProfile();
      setNotice("Profile photo updated.");
    } catch {
      setError("Your profile photo could not be updated.");
    } finally { setUploading(false); }
  }

  if (loading || !profile || !user) return <div className="space-y-4"><Skeleton className="h-40 w-full" /><Skeleton className="h-72 w-full" /></div>;

  const isProfessional = user.role === "professional";
  const publicHref = publicProfileHref(profile.username);
  const location = [profile.area, profile.state, profile.country].filter(Boolean).join(", ");

  return <div className="space-y-6">
    {notice && <InlineAlert tone="success" title="Profile updated">{notice}</InlineAlert>}
    {error && <InlineAlert tone="error" title="Profile needs attention">{error}</InlineAlert>}

    <Surface className="overflow-hidden">
      <div className="bg-[var(--sabi-primary-strong)] px-5 py-8 text-[var(--sabi-text-inverse)] sm:px-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar src={profile.profile_picture} name={profile.full_name || "SabiWay member"} size={88} className="ring-4 ring-white/20" />
              <label className="absolute -bottom-1 -right-1 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white text-[var(--sabi-primary-strong)] shadow" aria-label="Change profile photo">
                <Camera size={18} aria-hidden="true" />
                <input type="file" accept="image/*" className="sr-only" onChange={(event) => void uploadAvatar(event)} disabled={uploading} />
              </label>
            </div>
            <div><p className="text-xs font-black uppercase tracking-[.15em] opacity-70">{isProfessional ? "Professional identity" : "Client identity"}</p><h1 className="mt-1 text-3xl font-black">{profile.full_name}</h1><p className="mt-1 text-sm opacity-75">@{profile.username}</p></div>
          </div>
          <div className="flex flex-wrap gap-2">{publicHref && <Link href={publicHref} className="inline-flex min-h-11 items-center rounded-xl bg-white px-4 py-2.5 text-sm font-black text-[var(--sabi-primary-strong)]">View public profile</Link>}<Link href="/settings" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/30 px-4 py-2.5 text-sm font-black"><Settings size={16} /> Settings</Link></div>
        </div>
      </div>
      <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[1.5fr_1fr]">
        <div><p className="text-xs font-black uppercase tracking-[.12em] text-[var(--sabi-primary)]">About</p><p className="mt-2 text-sm leading-6 text-[var(--sabi-text-muted)]">{profile.bio || "Add a short description so people understand who you are and how you use SabiWay."}</p>{profile.job && <p className="mt-4 flex items-center gap-2 text-sm font-bold"><BriefcaseBusiness size={17} className="text-[var(--sabi-primary)]" />{profile.job}</p>}{location && <p className="mt-2 flex items-center gap-2 text-sm text-[var(--sabi-text-muted)]"><MapPin size={17} />{location}</p>}</div>
        <div className="grid gap-2"><div className="rounded-xl bg-[var(--sabi-surface-muted)] p-4"><p className="text-xs font-black uppercase tracking-[.1em] text-[var(--sabi-text-muted)]">Community</p><p className="mt-1 text-lg font-black">{profile.followers_count || 0} followers</p><p className="text-sm text-[var(--sabi-text-muted)]">{profile.posts_count || 0} posts · {profile.following_count || 0} following</p></div><Button variant="secondary" onClick={() => setEditing((value) => !value)}>{editing ? "Cancel editing" : "Edit profile"}</Button></div>
      </div>
    </Surface>

    {editing && <Surface className="p-5 sm:p-7"><form onSubmit={save} className="grid gap-4"><div><h2 className="text-xl font-black">Edit identity</h2><p className="mt-1 text-sm text-[var(--sabi-text-muted)]">These fields describe your SabiWay identity. Private contact/security controls live in Settings.</p></div><Field label="Full name" value={form.full_name} onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))} required /><TextareaField label="Bio" value={form.bio} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} rows={4} /><Field label="Professional headline or role" value={form.job} onChange={(event) => setForm((current) => ({ ...current, job: event.target.value }))} /><div className="grid gap-4 sm:grid-cols-3"><Field label="Country" value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))} /><Field label="State / region" value={form.state} onChange={(event) => setForm((current) => ({ ...current, state: event.target.value }))} /><Field label="Area" value={form.area} onChange={(event) => setForm((current) => ({ ...current, area: event.target.value }))} /></div><div className="flex gap-2"><Button type="submit" loading={saving}>Save profile</Button><Button type="button" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button></div></form></Surface>}

    <div className="grid gap-4 md:grid-cols-3">
      {isProfessional ? <><Surface className="p-5"><BadgeCheck className="text-[var(--sabi-primary)]" /><h2 className="mt-3 font-black">Services</h2><p className="mt-1 text-sm leading-6 text-[var(--sabi-text-muted)]">Manage the services that power your marketplace presence.</p><Link href="/professional/services" className="mt-4 inline-flex text-sm font-black text-[var(--sabi-primary)]">Manage services →</Link></Surface><Surface className="p-5"><ShieldCheck className="text-[var(--sabi-primary)]" /><h2 className="mt-3 font-black">Verification & trust</h2><p className="mt-1 text-sm leading-6 text-[var(--sabi-text-muted)]">Verification and completed-work reputation remain backend-derived trust signals.</p><Link href="/verification" className="mt-4 inline-flex text-sm font-black text-[var(--sabi-primary)]">Review verification →</Link></Surface></> : <><Surface className="p-5"><BriefcaseBusiness className="text-[var(--sabi-primary)]" /><h2 className="mt-3 font-black">My jobs</h2><p className="mt-1 text-sm leading-6 text-[var(--sabi-text-muted)]">Keep job activity separate from your personal identity.</p><Link href="/jobs" className="mt-4 inline-flex text-sm font-black text-[var(--sabi-primary)]">Open My Jobs →</Link></Surface><Surface className="p-5"><ShieldCheck className="text-[var(--sabi-primary)]" /><h2 className="mt-3 font-black">Bookings & trust</h2><p className="mt-1 text-sm leading-6 text-[var(--sabi-text-muted)]">Manage protected work and completed-work reviews from the booking journey.</p><Link href="/bookings" className="mt-4 inline-flex text-sm font-black text-[var(--sabi-primary)]">Open bookings →</Link></Surface></>}
      <Surface className="p-5"><UsersRound className="text-[var(--sabi-primary)]" /><h2 className="mt-3 font-black">SabiForum identity</h2><p className="mt-1 text-sm leading-6 text-[var(--sabi-text-muted)]">Posts, bookmarks and following relationships belong in SabiForum, not account settings.</p><Link href="/sabiforum" className="mt-4 inline-flex text-sm font-black text-[var(--sabi-primary)]">Open SabiForum →</Link></Surface>
    </div>
  </div>;
}
