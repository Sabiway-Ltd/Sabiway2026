import { access, readFile } from "node:fs/promises";

const failures = [];
const read = async (path) => readFile(new URL(path, import.meta.url), "utf8");

const jobs = await read("../app/jobs/page.tsx");
const newJob = await read("../app/jobs/new/page.tsx");
const jobDetail = await read("../app/jobs/[id]/page.tsx");
const proposals = await read("../app/proposals/page.tsx");
const backendViews = await read("../../Backend/marketplace/views.py");
const backendSerializers = await read("../../Backend/marketplace/serializers.py");

for (const path of ["../app/jobs/new/page.tsx", "../app/jobs/[id]/page.tsx", "../app/proposals/page.tsx"]) {
  try { await access(new URL(path, import.meta.url)); } catch { failures.push(`missing Phase 11 surface ${path}`); }
}

for (const contract of [
  'href="/jobs/new"',
  'href={`/jobs/${job.id}`}',
  "Review job & proposals",
  "Job moderation, proposal decisions, conversations, bookings and payments are separate lifecycle states",
]) {
  if (!jobs.includes(contract)) failures.push(`Client My Jobs missing ${contract}`);
}
if (jobs.includes('localStorage.getItem("access")')) failures.push("Client My Jobs must use shared auth state, not direct localStorage token reads");

for (const contract of [
  "/api/marketplace/categories/",
  "/api/marketplace/jobs/",
  'user?.role !== "client"',
  "Post job for review",
  "does not select a Professional, create a booking or take payment",
]) {
  if (!newJob.includes(contract)) failures.push(`dedicated Client job creation missing ${contract}`);
}

for (const contract of [
  "/api/marketplace/jobs/?mine=1",
  "/api/marketplace/job-responses/",
  "/decision/",
  '"shortlisted"',
  '"declined"',
  "Shortlisting signals interest only",
  "The Professional can now open the proposal-linked conversation",
]) {
  if (!jobDetail.includes(contract)) failures.push(`Client proposal review missing ${contract}`);
}

for (const contract of [
  'proposal.status !== "shortlisted"',
  "/api/marketplace/threads/",
  "job_response_id: proposal.id",
  "Start conversation",
  "does not create a booking or payment agreement",
]) {
  if (!proposals.includes(contract)) failures.push(`Professional proposal handoff missing ${contract}`);
}

for (const source of [jobs, newJob, jobDetail, proposals]) {
  for (const forbidden of ['localStorage.getItem("access")', 'localStorage.setItem("access")', "document.cookie"]) {
    if (source.includes(forbidden)) failures.push(`Phase 11 flow must not use direct auth primitive ${forbidden}`);
  }
}

for (const contract of [
  'if self.request.user.role != "client"',
  "Only client profiles can create jobs.",
  "Only the job owner can shortlist or decline responses.",
  'elif request.user.role == "professional" and response_id',
]) {
  if (!backendViews.includes(contract)) failures.push(`existing backend authority missing ${contract}`);
}
for (const contract of [
  "Only professional profiles can respond to jobs.",
  "You have already responded to this job.",
  "Professionals start job conversations from their own job response.",
]) {
  if (!backendSerializers.includes(contract)) failures.push(`existing serializer authority missing ${contract}`);
}

if (failures.length) {
  console.error("Phase 11 Jobs, Leads & Proposals contract failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Phase 11 Jobs, Leads & Proposals contract passed.");
