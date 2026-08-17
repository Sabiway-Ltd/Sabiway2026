"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DJANGO_URL } from "@/app/utils/MyConstants";

type ReportStatus = "open" | "dismissed" | "removed" | "restored";
type ModerationAction = "dismiss" | "remove" | "restore";

type Report = {
  id: number;
  post_id: string;
  reason: string;
  status: ReportStatus;
  reported_by: string | null;
  reviewed_by: string | null;
  resolution_note: string;
  created_at: string;
  reviewed_at: string | null;
};

function actionsFor(status: ReportStatus): ModerationAction[] {
  if (status === "open") return ["dismiss", "remove"];
  if (status === "removed") return ["restore"];
  return [];
}

export default function ModerationPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [working, setWorking] = useState<number | null>(null);

  const load = useCallback(async () => {
    const token = localStorage.getItem("access");
    if (!token) {
      setError("Sign in with a staff account to open the moderation queue.");
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`${DJANGO_URL}/api/posts/moderation/reports/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 403) throw new Error("Your account does not have moderation access.");
      if (!response.ok) throw new Error("Could not load moderation reports.");
      setReports(await response.json());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load moderation reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const act = async (report: Report, action: ModerationAction) => {
    const token = localStorage.getItem("access");
    if (!token) return;
    const note = (notes[report.id] ?? "").trim();
    if (!note) {
      setError("Add a moderator note before recording a decision.");
      return;
    }

    setWorking(report.id);
    setError("");
    try {
      const response = await fetch(`${DJANGO_URL}/api/posts/moderation/reports/${report.id}/action/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.detail || "Moderation action failed.");
      setNotes((current) => {
        const next = { ...current };
        delete next[report.id];
        return next;
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Moderation action failed.");
    } finally {
      setWorking(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7faf8] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#008753]">SabiWay staff</p>
            <h1 className="text-3xl font-bold text-slate-900">SabiForum moderation</h1>
            <p className="mt-1 text-sm text-slate-600">Review reports, remove unsafe content, restore content after review, and preserve the audit trail.</p>
          </div>
          <Link href="/community" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Back to SabiForum</Link>
        </div>

        {error ? (
          <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p>{error}</p>
            <button type="button" onClick={() => void load()} className="mt-3 min-h-10 rounded-lg border border-red-300 bg-white px-3 font-semibold">Reload queue</button>
          </div>
        ) : null}
        {loading ? <p className="py-10 text-center text-slate-500" aria-live="polite">Loading moderation queue…</p> : null}
        {!loading && !error && reports.length === 0 ? <p className="rounded-xl border bg-white p-8 text-center text-slate-500">No reports in the queue.</p> : null}

        <div className="space-y-4">
          {reports.map((report) => {
            const allowedActions = actionsFor(report.status);
            const noteValue = notes[report.id] ?? "";
            const busy = working === report.id;
            return (
              <article key={report.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Report #{report.id}</p>
                    <p className="mt-1 break-all text-xs text-slate-500">Post {report.post_id}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-700">{report.status}</span>
                </div>

                <div className="mt-4 rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Reason</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{report.reason}</p>
                </div>

                <div className="mt-4 grid gap-2 text-xs text-slate-500 md:grid-cols-2">
                  <p>Reported by: {report.reported_by ?? "Unknown"}</p>
                  <p>Created: {new Date(report.created_at).toLocaleString("en-GB")}</p>
                  {report.reviewed_by ? <p>Reviewed by: {report.reviewed_by}</p> : null}
                  {report.reviewed_at ? <p>Reviewed: {new Date(report.reviewed_at).toLocaleString("en-GB")}</p> : null}
                </div>

                {report.resolution_note ? (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                    <span className="font-semibold">Recorded decision note:</span> {report.resolution_note}
                  </div>
                ) : null}

                {allowedActions.length > 0 ? (
                  <>
                    <label className="mt-4 block text-sm font-semibold text-slate-700" htmlFor={`note-${report.id}`}>Moderator note</label>
                    <textarea
                      id={`note-${report.id}`}
                      value={noteValue}
                      onChange={(event) => setNotes((current) => ({ ...current, [report.id]: event.target.value }))}
                      className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-[#008753] focus:ring-2 focus:ring-[#008753]/20"
                      placeholder="Record the reason for this decision…"
                      disabled={busy}
                    />

                    <div className="mt-4 flex flex-wrap gap-2">
                      {allowedActions.includes("dismiss") ? (
                        <button disabled={busy || !noteValue.trim()} onClick={() => void act(report, "dismiss")} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 disabled:opacity-50">Dismiss report</button>
                      ) : null}
                      {allowedActions.includes("remove") ? (
                        <button disabled={busy || !noteValue.trim()} onClick={() => void act(report, "remove")} className="min-h-11 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white disabled:opacity-50">Remove post</button>
                      ) : null}
                      {allowedActions.includes("restore") ? (
                        <button disabled={busy || !noteValue.trim()} onClick={() => void act(report, "restore")} className="min-h-11 rounded-lg bg-[#008753] px-4 text-sm font-semibold text-white disabled:opacity-50">Restore post</button>
                      ) : null}
                      {busy ? <span className="self-center text-sm text-slate-500" aria-live="polite">Recording decision…</span> : null}
                    </div>
                  </>
                ) : (
                  <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">This report is closed. A new moderation decision requires a new report.</p>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}