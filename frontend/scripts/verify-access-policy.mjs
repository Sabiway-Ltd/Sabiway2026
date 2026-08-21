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
  ["/demo", "PUBLIC"],
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
  ["/onboarding/client", "CLIENT_ONLY"],
  ["/onboarding/professional", "PROFESSIONAL_ONLY"],
  ["/jobs", "CLIENT_ONLY"],
  ["/professional/services", "PROFESSIONAL_ONLY"],
  ["/proposals", "PROFESSIONAL_ONLY"],
  ["/earnings", "PROFESSIONAL_ONLY"],
  ["/bookings", "PARTICIPANT_SCOPED"],
  ["/community/moderation", "STAFF_ONLY"],
  ["/community", "GUEST_CAPABLE"],
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

const loginExperience = await readFile(new URL("../app/(auth)/_components/LoginExperience.tsx", import.meta.url), "utf8");
const signupExperience = await readFile(new URL("../app/(auth)/_components/SignupExperience.tsx", import.meta.url), "utf8");

for (const expectedLabel of ["Sign in as {activeRole === \"professional\" ? \"Professional\" : \"Client\"}", "Continue with Google as {activeRole === \"professional\" ? \"Professional\" : \"Client\"}"]) {
  if (!loginExperience.includes(expectedLabel)) failures.push(`login: missing role-specific action label ${expectedLabel}`);
}
for (const expectedLabel of ["Create Client account", "Create Professional account", "Continue with Google as {activeRole === \"professional\" ? \"Professional\" : \"Client\"}"]) {
  if (!signupExperience.includes(expectedLabel)) failures.push(`signup: missing role-specific action label ${expectedLabel}`);
}

for (const [name, authSource] of [["login", loginExperience], ["signup", signupExperience]]) {
  for (const eventName of ["role_entry_viewed", "role_intent_selected", "role_auth_started", "role_auth_succeeded"]) {
    if (!authSource.includes(`"${eventName}"`)) failures.push(`${name}: missing analytics event ${eventName}`);
  }
  for (const sensitiveKey of ["email:", "password:", "phone_number:"]) {
    const analyticsCalls = authSource.match(/trackProductEvent\([^;]+/g) || [];
    if (analyticsCalls.some((call) => call.includes(sensitiveKey))) failures.push(`${name}: analytics must not include ${sensitiveKey.replace(":", "")}`);
  }
}

if (failures.length) {
  console.error("Access and role-entry policy contract failed for:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Access policy contract passed for ${expected.length} route families plus role entry, onboarding, controlled demo, Client and Professional workspace access.`);
