import { readFile } from "node:fs/promises";

const source = await readFile("frontend/app/page.tsx", "utf8");
const lower = source.toLowerCase();
const failures = [];

const required = [
  'action="/marketplace"',
  'href="/services"',
  'href="/for-professionals"',
  'href="/marketplace"',
  "serviceCategories",
  "Browse first",
  "Find the right professional for the job",
  "Starting with Nigeria and the UK",
];

for (const value of required) {
  if (!source.includes(value)) failures.push(`missing required homepage contract: ${value}`);
}

const removedArchitectureCopy = [
  "Your location is not the same thing as the service location",
  "Nigeria and the UK first. The architecture stays global",
  "Account location, service location and payment market stay separate",
  "Service price, payment currency and payout currency can be different",
];

for (const value of removedArchitectureCopy) {
  if (source.includes(value)) failures.push(`architecture-heavy homepage copy returned: ${value}`);
}

const forbiddenRawBrandValues = [
  "#008753",
  "#007046",
  "#006b42",
  "#ffb800",
  "#173126",
  "#f4f8f6",
  "#f6faf8",
  "#e8f7f0",
];

for (const value of forbiddenRawBrandValues) {
  if (lower.includes(value)) failures.push(`raw brand value in homepage: ${value}`);
}

if (/\b\d{2,}%\b/.test(source) || /\b\d{1,3},\d{3}\+?\b/.test(source)) {
  failures.push("homepage contains unsupported numeric social proof");
}

if ((source.match(/<h1\b/g) || []).length !== 1) failures.push("homepage must contain exactly one h1");
if (!source.includes('role="search"')) failures.push("homepage search region missing role=search");

if (failures.length) {
  console.error("Phase 3 homepage contract failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Phase 3 homepage contract passed.");
