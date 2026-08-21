import { access, readFile } from "node:fs/promises";

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
for (const [prefix, routeAccess] of expected) {
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`prefix:\\s*["']${escaped}["'][^}]*access:\\s*["']${routeAccess}["']`);
  if (!pattern.test(source)) failures.push(`${prefix} -> ${routeAccess}`);
}

if (!source.includes('return rule?.access ?? "AUTHENTICATED_SHARED"')) failures.push("unknown-route fallback contract");
if (!source.includes('pathname.startsWith("/login/")')) failures.push("nested login auth-entry contract");
if (!source.includes('pathname.startsWith("/signup/")')) failures.push("nested signup auth-entry contract");

const roleEntryFiles = [
  "../app/(auth)/login/client/page.tsx",
  "../app/(auth)/login/professional/page.tsx",
  "../app/(auth)/signup/client/page.tsx",
  "../app/(auth)/signup/professional/page.tsx",
];
for (const relativePath of roleEntryFiles) {
  try {
    await access(new URL(relativePath, import.meta.url));
  } catch {
    failures.push(`missing role entry file ${relativePath}`);
  }
}

const professionalAcquisition = await readFile(new URL("../app/for-professionals/page.tsx", import.meta.url), "utf8");
if (!professionalAcquisition.includes('href: "/signup/professional"')) failures.push("Professional acquisition must use dedicated signup route");

if (failures.length) {
  console.error("Access and role-entry policy contract failed for:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Access policy contract passed for ${expected.length} route families plus dedicated Client/Professional role entry.`);
