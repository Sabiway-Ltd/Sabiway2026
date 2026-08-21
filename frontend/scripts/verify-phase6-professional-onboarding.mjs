import { readFile } from "node:fs/promises";

const failures = [];
const read = async (path) => readFile(new URL(path, import.meta.url), "utf8");

const destination = await read("../app/auth/destination.ts");
const shell = await read("../app/_components/v2/AppShell.tsx");
const access = await read("../app/config/accessPolicy.ts");
const page = await read("../app/onboarding/professional/page.tsx");

for (const contract of [
  'user?.role === "professional"',
  "user.onboarding_complete === false",
  "/onboarding/professional?next=",
]) {
  if (!destination.includes(contract)) failures.push(`destination: missing ${contract}`);
}

for (const contract of [
  'currentUser.role === "professional"',
  "/onboarding/professional?next=",
]) {
  if (!shell.includes(contract)) failures.push(`AppShell: missing ${contract}`);
}

if (!access.includes('{ prefix: "/onboarding/professional", access: "PROFESSIONAL_ONLY" }')) {
  failures.push("access policy: Professional onboarding must be PROFESSIONAL_ONLY");
}

for (const contract of [
  "Set up how Clients should understand your work.",
  "/api/auth/onboarding/professional/",
  "/api/marketplace/categories/",
  "Finish Professional setup",
  "professional_onboarding_viewed",
  "professional_onboarding_started",
  "professional_onboarding_completed",
  "This creates a draft, not a public listing.",
]) {
  if (!page.includes(contract)) failures.push(`Professional onboarding page: missing ${contract}`);
}

for (const safeDimension of ["delivery_mode", "currency", "available_now"]) {
  if (!page.includes(safeDimension)) failures.push(`Professional onboarding analytics: missing non-sensitive dimension ${safeDimension}`);
}

const analyticsCalls = page.match(/trackProductEvent\([^;]+/g) || [];
for (const sensitiveValue of [
  "full_name: form.full_name",
  "phone_number: form.phone_number",
  "professional_summary: form.professional_summary",
  "service_title: form.service_title",
  "service_description: form.service_description",
  "country: form.country",
  "state: form.state",
  "city: form.city",
  "area: form.area",
  "availability_text: form.availability_text",
  "price_from: form.price_from",
]) {
  if (analyticsCalls.some((call) => call.includes(sensitiveValue))) failures.push(`Professional onboarding analytics includes sensitive value ${sensitiveValue}`);
}

if (failures.length) {
  console.error("Phase 6 Professional onboarding contract failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Phase 6 Professional onboarding contract passed.");
