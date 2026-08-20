import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../app/config/accessPolicy.ts", import.meta.url), "utf8");

const expected = [
  ["/", "PUBLIC"],
  ["/login", "PUBLIC"],
  ["/signup", "PUBLIC"],
  ["/forgot-password", "PUBLIC"],
  ["/check-email", "PUBLIC"],
  ["/confirm-signup", "PUBLIC"],
  ["/change-password", "PUBLIC"],
  ["/callback", "PUBLIC"],
  ["/about-us", "PUBLIC"],
  ["/accessibility", "PUBLIC"],
  ["/careers", "PUBLIC"],
  ["/contact", "PUBLIC"],
  ["/download", "PUBLIC"],
  ["/fees", "PUBLIC"],
  ["/for-clients", "PUBLIC"],
  ["/for-professionals", "PUBLIC"],
  ["/helpcenter", "PUBLIC"],
  ["/how-it-works", "PUBLIC"],
  ["/locations", "PUBLIC"],
  ["/partners", "PUBLIC"],
  ["/privacy-policy", "PUBLIC"],
  ["/sabipay-explained", "PUBLIC"],
  ["/services", "PUBLIC"],
  ["/terms-of-use", "PUBLIC"],
  ["/trust-and-safety", "PUBLIC"],
  ["/verification-info", "PUBLIC"],
  ["/marketplace", "GUEST_CAPABLE"],
  ["/sabiforum", "GUEST_CAPABLE"],
  ["/posts", "GUEST_CAPABLE"],
  ["/hashtag", "GUEST_CAPABLE"],
  ["/profile/", "GUEST_CAPABLE"],
  ["/community/moderation", "STAFF_ONLY"],
  ["/community", "AUTHENTICATED_SHARED"],
  ["/home", "AUTHENTICATED_SHARED"],
  ["/notifications", "AUTHENTICATED_SHARED"],
  ["/profile", "AUTHENTICATED_SHARED"],
  ["/messages", "PARTICIPANT_SCOPED"],
  ["/sabipay", "PARTICIPANT_SCOPED"],
  ["/verification", "PROFESSIONAL_ONLY"],
];

const failures = [];
for (const [prefix, access] of expected) {
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`prefix:\\s*["']${escaped}["'][^}]*access:\\s*["']${access}["']`);
  if (!pattern.test(source)) failures.push(`${prefix} -> ${access}`);
}

if (!source.includes('return rule?.access ?? "AUTHENTICATED_SHARED"')) {
  failures.push("unknown-route fallback contract");
}

if (failures.length) {
  console.error("Access policy contract failed for:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Access policy contract passed for ${expected.length} route families.`);
