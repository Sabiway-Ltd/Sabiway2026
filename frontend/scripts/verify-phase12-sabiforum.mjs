import { access, readFile } from "node:fs/promises";

const failures = [];
const read = async (path) => readFile(new URL(path, import.meta.url), "utf8");

for (const path of [
  "../app/sabiforum/SabiForumEntry.tsx",
  "../app/sabiforum/SabiForumExperience.tsx",
  "../app/sabiforum/page.tsx",
  "../app/community/page.tsx",
]) {
  try { await access(new URL(path, import.meta.url)); } catch { failures.push(`missing Phase 12 file ${path}`); }
}

const entry = await read("../app/sabiforum/SabiForumEntry.tsx");
const experience = await read("../app/sabiforum/SabiForumExperience.tsx");
const page = await read("../app/sabiforum/page.tsx");
const compatibility = await read("../app/community/page.tsx");
const policy = await read("../app/config/accessPolicy.ts");

for (const contract of [
  "SabiForumEntry",
  "GuestSabiForum",
  "SabiForumExperience",
  "Reading the public SabiForum does not require an account",
  "/login?next=%2Fsabiforum",
]) {
  if (!(entry + page).includes(contract)) failures.push(`canonical SabiForum entry missing ${contract}`);
}

for (const contract of [
  "AppShell",
  "Ask, share and learn from the SabiWay community.",
  "useAuthStore",
  "auth: { token: access }",
  "Create post",
  "Search SabiForum",
  "RenderPostList",
]) {
  if (!experience.includes(contract)) failures.push(`member SabiForum experience missing ${contract}`);
}

for (const forbidden of [
  'localStorage.getItem("access")',
  'localStorage.setItem("access")',
  "document.cookie",
  "bg-[#008753]",
  "text-[#008753]",
]) {
  if (experience.includes(forbidden)) failures.push(`canonical SabiForum experience must not use ${forbidden}`);
}

if (!compatibility.includes('redirect("/sabiforum")')) failures.push("legacy /community must redirect to canonical /sabiforum");
if (!policy.includes('{ href: "/sabiforum", label: "SabiForum" }')) failures.push("app navigation must target canonical /sabiforum");
if ((policy.match(/href: "\/community", label: "SabiForum"/g) || []).length) failures.push("app navigation must not target legacy /community");
if (!policy.includes('{ prefix: "/sabiforum", access: "GUEST_CAPABLE" }')) failures.push("/sabiforum must remain guest-capable");
if (!policy.includes('{ prefix: "/community/moderation", access: "STAFF_ONLY" }')) failures.push("staff moderation boundary must be preserved");

if (failures.length) {
  console.error("Phase 12 SabiForum contract failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Phase 12 canonical SabiForum, guest/member entry and compatibility contract passed.");
