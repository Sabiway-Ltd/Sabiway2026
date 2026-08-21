import { access, readFile } from "node:fs/promises";

const failures = [];
const read = async (path) => readFile(new URL(path, import.meta.url), "utf8");

const session = await read("../app/demo/session.ts");
const fixtures = await read("../app/demo/fixtures.ts");
const entry = await read("../app/demo/page.tsx");
const workspace = await read("../app/demo/DemoWorkspace.tsx");
const accessPolicy = await read("../app/config/accessPolicy.ts");

for (const path of ["../app/demo/client/page.tsx", "../app/demo/professional/page.tsx"]) {
  try { await access(new URL(path, import.meta.url)); } catch { failures.push(`missing demo route ${path}`); }
}

for (const contract of [
  'NEXT_PUBLIC_DEMO_MODE === "true"',
  'const DEMO_SESSION_KEY = "sabiway_demo_session_v1"',
  "window.sessionStorage.setItem(DEMO_SESSION_KEY",
  'kind: "sabiway_demo"',
]) {
  if (!session.includes(contract)) failures.push(`demo session: missing ${contract}`);
}

for (const forbidden of [
  "document.cookie",
  "localStorage.setItem(\"access\"",
  "localStorage.setItem(\"refresh\"",
  "persistBrowserSession",
  "useAuthStore",
  "/api/auth/",
  "internal-review-login",
]) {
  if (session.includes(forbidden) || entry.includes(forbidden) || workspace.includes(forbidden)) {
    failures.push(`demo isolation: forbidden production auth dependency ${forbidden}`);
  }
}

for (const contract of [
  "Enter Client Demo",
  "Enter Professional Demo",
  "deterministic invented fixtures",
  "not authentication",
]) {
  if (!entry.includes(contract)) failures.push(`demo entry: missing ${contract}`);
}

for (const contract of [
  "SabiWay CONTROLLED DEMO",
  "not a production account",
  '(["default", "empty", "error"] as DemoScenario[])',
  "Deterministic fixture view",
]) {
  if (!workspace.includes(contract)) failures.push(`demo workspace: missing ${contract}`);
}

for (const contract of [
  "clientDefault",
  "professionalDefault",
  'scenario === "empty"',
  "Simulated error state",
  "Amina Bello",
  "David Okafor",
]) {
  if (!fixtures.includes(contract)) failures.push(`demo fixtures: missing ${contract}`);
}

if (!accessPolicy.includes('{ prefix: "/demo", access: "PUBLIC" }')) failures.push("access policy: /demo must be explicit PUBLIC inspection route");

for (const protectedRoute of [
  '{ prefix: "/home", access: "AUTHENTICATED_SHARED" }',
  '{ prefix: "/messages", access: "PARTICIPANT_SCOPED" }',
  '{ prefix: "/sabipay", access: "PARTICIPANT_SCOPED" }',
  '{ prefix: "/verification", access: "PROFESSIONAL_ONLY" }',
]) {
  if (!accessPolicy.includes(protectedRoute)) failures.push(`demo isolation: protected production route changed: ${protectedRoute}`);
}

if (failures.length) {
  console.error("Phase 7 controlled demo contract failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Phase 7 controlled demo isolation contract passed.");
