import { access, readFile } from "node:fs/promises";

const failures = [];
const read = async (path) => readFile(new URL(path, import.meta.url), "utf8");

const policy = await read("../app/config/accessPolicy.ts");
const shell = await read("../app/_components/v2/AppShell.tsx");
const home = await read("../app/home/ProfessionalHome.tsx");
const services = await read("../app/professional/services/page.tsx");
const proposals = await read("../app/proposals/page.tsx");
const earnings = await read("../app/earnings/page.tsx");

for (const path of ["../app/professional/services/page.tsx", "../app/proposals/page.tsx", "../app/earnings/page.tsx", "../app/home/ProfessionalHome.tsx"]) {
  try { await access(new URL(path, import.meta.url)); } catch { failures.push(`missing Professional workspace file ${path}`); }
}

for (const contract of [
  '{ href: "/home", label: "Home" }',
  '{ href: "/marketplace", label: "Opportunities" }',
  '{ href: "/professional/services", label: "My Services" }',
  '{ href: "/proposals", label: "Proposals" }',
  '{ href: "/messages", label: "Messages" }',
  '{ href: "/bookings", label: "Bookings" }',
  '{ href: "/earnings", label: "Earnings" }',
  '{ href: "/verification", label: "Verification" }',
  '{ href: "/sabiforum", label: "SabiForum" }',
  '{ href: "/profile", label: "Profile" }',
  '{ prefix: "/professional/services", access: "PROFESSIONAL_ONLY" }',
  '{ prefix: "/proposals", access: "PROFESSIONAL_ONLY" }',
  '{ prefix: "/earnings", access: "PROFESSIONAL_ONLY" }',
]) {
  if (!policy.includes(contract)) failures.push(`Professional IA policy missing ${contract}`);
}

for (const label of ["Home", "Opportunities", "Proposals", "Messages", "Profile"]) {
  if (!shell.includes(`"${label}"`)) failures.push(`Professional mobile navigation missing ${label}`);
}
if (!shell.includes("professionalMobileLabels")) failures.push("Professional mobile navigation must be intentionally reduced from desktop IA");
if (!shell.includes('professionalMobileLabels.has(label)')) failures.push("Professional mobile navigation translation missing");

for (const contract of [
  "Professional home",
  "/api/marketplace/listings/?mine=1",
  "/api/marketplace/job-responses/",
  "/api/marketplace/bookings/",
  "/api/marketplace/threads/",
  "/api/sabipay/transactions/",
  "Live Professional summary is temporarily unavailable.",
  "Active services",
  "Live proposals",
  "Active bookings",
  "Unread messages",
  "Earnings",
  "Verification & trust",
]) {
  if (!home.includes(contract)) failures.push(`Professional home missing ${contract}`);
}

for (const contract of ["My Services", "/api/marketplace/listings/?mine=1", "No service listing yet", "moderation_status", "Retry"]) {
  if (!services.includes(contract)) failures.push(`Professional services route missing ${contract}`);
}
for (const contract of ["Proposals", "/api/marketplace/job-responses/", "No proposals yet", "proposal.status", "Retry"]) {
  if (!proposals.includes(contract)) failures.push(`Professional proposals route missing ${contract}`);
}
for (const contract of ["Earnings", "/api/sabipay/transactions/", "/api/sabipay/payout-destinations/", "No SabiPay earnings yet", "Retry"]) {
  if (!earnings.includes(contract)) failures.push(`Professional earnings route missing ${contract}`);
}

for (const forbidden of ["localStorage.setItem(\"access\"", "document.cookie", "refresh_token", "fake auth"]) {
  if ([home, services, proposals, earnings].some((source) => source.includes(forbidden))) failures.push(`Professional workspace must not introduce auth bypass primitive ${forbidden}`);
}

if (failures.length) {
  console.error("Phase 9 Professional shell and home contract failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Phase 9 Professional shell, home, services, proposals and earnings contract passed while preserving Client Phase 8 scope and allowing canonical SabiForum routing to evolve.");
