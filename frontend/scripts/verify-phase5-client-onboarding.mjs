import { readFile } from "node:fs/promises";

const failures = [];
const read = async (path) => readFile(new URL(path, import.meta.url), "utf8");

const destination = await read("../app/auth/destination.ts");
const login = await read("../app/(auth)/_components/LoginExperience.tsx");
const signup = await read("../app/(auth)/_components/SignupExperience.tsx");
const callback = await read("../app/(auth)/callback/GoogleCallbackClient.tsx");
const shell = await read("../app/_components/v2/AppShell.tsx");
const page = await read("../app/onboarding/client/page.tsx");
const store = await read("../app/store/useAuthStore.ts");

for (const contract of [
  "user?.onboarding_complete === false",
  'user.role === "client"',
  "/onboarding/client?next=",
  "safeInternalNext",
]) {
  if (!destination.includes(contract)) failures.push(`destination: missing Client behavior ${contract}`);
}

if (!login.includes("postAuthDestination(useAuthStore.getState().user, requestedNext())")) {
  failures.push("login: incomplete Client destination resolver is not used");
}

for (const contract of [
  'intent: "signup"',
  "role: activeRole",
  'terms_accepted: "true"',
  "Accept the SabiWay Terms and Privacy Notice before continuing with Google.",
]) {
  if (!signup.includes(contract)) failures.push(`signup: missing Google intent contract ${contract}`);
}

if (!callback.includes("postAuthDestination(normalizedUser, intent.next)")) failures.push("callback: missing post-auth Client onboarding resolver");
if (!callback.includes("`/signup/${intent.role}`")) failures.push("callback: missing dedicated role signup recovery");

for (const contract of [
  "currentUser?.onboarding_complete === false",
  'currentUser.role === "client"',
  "/onboarding/client?next=",
]) {
  if (!shell.includes(contract)) failures.push(`AppShell: missing Client behavior ${contract}`);
}

for (const contract of [
  "Set up your Client experience.",
  "/api/auth/onboarding/client/",
  "Finish Client setup",
  "client_onboarding_viewed",
  "client_onboarding_started",
  "client_onboarding_completed",
  "has_state",
  "has_area",
]) {
  if (!page.includes(contract)) failures.push(`Client onboarding page: missing ${contract}`);
}

for (const sensitiveAnalyticsValue of ["country: form.country", "state: form.state", "area: form.area", "phone_number: form.phone_number", "full_name: form.full_name"]) {
  const analyticsCalls = page.match(/trackProductEvent\([^;]+/g) || [];
  if (analyticsCalls.some((call) => call.includes(sensitiveAnalyticsValue))) failures.push(`Client onboarding analytics includes sensitive value ${sensitiveAnalyticsValue}`);
}

if (!store.includes("updateSessionUser: (user: User) => void")) failures.push("auth store: missing updateSessionUser contract");
if (!store.includes("persistBrowserSession({ user })")) failures.push("auth store: refreshed Client user is not persisted");

if (failures.length) {
  console.error("Phase 5 Client onboarding contract failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Phase 5 Client onboarding contract passed with shared Client/Professional destination resolver.");
