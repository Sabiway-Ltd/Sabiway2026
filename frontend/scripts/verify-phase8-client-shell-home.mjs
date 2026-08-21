import { access, readFile } from "node:fs/promises";

const failures = [];
const read = async (path) => readFile(new URL(path, import.meta.url), "utf8");

const policy = await read("../app/config/accessPolicy.ts");
const shell = await read("../app/_components/v2/AppShell.tsx");
const home = await read("../app/home/page.tsx");
const jobs = await read("../app/jobs/page.tsx");
const bookings = await read("../app/bookings/page.tsx");

for (const path of ["../app/jobs/page.tsx", "../app/bookings/page.tsx"]) {
  try { await access(new URL(path, import.meta.url)); } catch { failures.push(`missing Client workspace route ${path}`); }
}

for (const contract of [
  '{ href: "/home", label: "Home" }',
  '{ href: "/marketplace", label: "Find services" }',
  '{ href: "/jobs", label: "My Jobs" }',
  '{ href: "/messages", label: "Messages" }',
  '{ href: "/bookings", label: "Bookings" }',
  '{ href: "/sabipay", label: "SabiPay" }',
  '{ href: "/sabiforum", label: "SabiForum" }',
  '{ href: "/profile", label: "Profile" }',
  '{ prefix: "/jobs", access: "CLIENT_ONLY" }',
  '{ prefix: "/bookings", access: "PARTICIPANT_SCOPED" }',
]) {
  if (!policy.includes(contract)) failures.push(`Client IA policy missing ${contract}`);
}

for (const label of ["Home", "Find services", "My Jobs", "Messages", "Profile"]) {
  if (!shell.includes(`"${label}"`)) failures.push(`Client mobile navigation missing ${label}`);
}
if (!shell.includes("clientMobileLabels")) failures.push("Client mobile navigation must be intentionally reduced from desktop IA");
if (!shell.includes('role === "client" ? clientMobileLabels.has(label)')) failures.push("Client-only mobile navigation translation missing");

for (const contract of [
  "function ClientHome()",
  "What needs your attention",
  "/api/marketplace/jobs/?mine=1",
  "/api/marketplace/bookings/",
  "/api/marketplace/threads/",
  "Live workspace summary is temporarily unavailable.",
  "Active jobs",
  "Active bookings",
  "Unread messages",
  "SabiPay & history",
  "Next booking",
]) {
  if (!home.includes(contract)) failures.push(`Client home missing ${contract}`);
}

for (const contract of [
  "My Jobs",
  "/api/marketplace/jobs/?mine=1",
  'user.role === "professional"',
  "You have not posted a job yet",
  "Retry",
  "response_count",
]) {
  if (!jobs.includes(contract)) failures.push(`My Jobs route missing ${contract}`);
}

for (const contract of [
  "Bookings",
  'api.get<Paginated<Booking>>("/marketplace/bookings/")',
  "No bookings yet",
  "Agreed price",
  "Payment status",
  "Retry",
]) {
  if (!bookings.includes(contract)) failures.push(`Bookings route missing ${contract}`);
}

if (failures.length) {
  console.error("Phase 8 Client shell and home contract failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Phase 8 Client shell, home, jobs and bookings contract passed while allowing later phases to evolve data adapters without removing Client capability.");
