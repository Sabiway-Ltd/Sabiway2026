import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));
const json = (relativePath) => JSON.parse(read(relativePath));

const checks = [];
function check(label, pass, detail) {
  checks.push({ label, pass: Boolean(pass), detail });
}
function requirePath(label, relativePath) {
  check(label, exists(relativePath), relativePath);
}
function requireText(label, relativePath, markers) {
  if (!exists(relativePath)) return check(label, false, `${relativePath} missing`);
  const content = read(relativePath);
  const missing = markers.filter((marker) => !content.includes(marker));
  check(label, missing.length === 0, missing.length ? `${relativePath}: missing ${missing.join(", ")}` : relativePath);
}
function rejectText(label, relativePath, markers) {
  if (!exists(relativePath)) return check(label, false, `${relativePath} missing`);
  const content = read(relativePath);
  const present = markers.filter((marker) => content.includes(marker));
  check(label, present.length === 0, present.length ? `${relativePath}: contains ${present.join(", ")}` : relativePath);
}

requirePath("Phase 12 certification evidence retained", "qa/phase12-certification.json");
requirePath("Phase 13 readiness contract", "qa/phase13-readiness.json");
requirePath("Controlled testing guide", "Documentation/PHASE-13-CONTROLLED-USER-TESTING.md");
requirePath("Feedback capture template", "qa/templates/phase13-user-testing-feedback.csv");
requirePath("Defect issue template", ".github/ISSUE_TEMPLATE/user-testing-defect.yml");
requirePath("Mobile EAS profiles", "mobile/eas.json");

const readiness = json("qa/phase13-readiness.json");
const eas = json("mobile/eas.json");

const requiredCohorts = [
  "android-users",
  "iphone-users",
  "mobile-web-users",
  "desktop-users",
  "lower-digital-confidence-users",
  "higher-digital-confidence-users",
  "different-age-groups",
  "different-network-conditions",
  "different-sabiway-roles",
  "nigerian-users",
  "diaspora-users-where-relevant",
];
for (const cohort of requiredCohorts) {
  check(`Tester cohort · ${cohort}`, readiness.testerCohorts?.includes(cohort), cohort);
}

const requiredTaskNames = [
  "Create an account without help",
  "Complete your profile",
  "Find a relevant user or service",
  "Perform an interaction",
  "Recover your password",
  "Report a problem",
  "Complete the core transaction journey",
];
for (const taskName of requiredTaskNames) {
  check(`Task · ${taskName}`, readiness.tasks?.some((task) => task.name === taskName), taskName);
}

const requiredFeedback = [
  "task_completion",
  "time_seconds",
  "confusion",
  "error",
  "abandonment",
  "trust_score",
  "satisfaction_score",
  "usefulness_score",
  "device",
  "platform",
  "severity",
];
for (const field of requiredFeedback) {
  check(`Feedback field · ${field}`, readiness.feedbackFields?.includes(field), field);
}

for (const level of ["1", "2", "3", "4"]) {
  check(`Severity model · ${level}`, Boolean(readiness.severity?.[level]), readiness.severity?.[level] ?? "missing");
}

for (const profile of ["development", "qa", "uat", "beta", "production"]) {
  check(`EAS build profile · ${profile}`, Boolean(eas.build?.[profile]), profile);
}
check("Android QA build is installable APK", eas.build?.qa?.android?.buildType === "apk", "mobile/eas.json");
check("Controlled beta uses store distribution", eas.build?.beta?.distribution === "store", "mobile/eas.json");
check("Stable web URL is HTTPS", /^https:\/\//.test(readiness.web?.stableUrl ?? ""), readiness.web?.stableUrl ?? "missing");

requireText("Support route remains available", "frontend/app/helpcenter/page.tsx", ["Help"]);
requireText("Phase 12 regression gate remains in CI", ".github/workflows/phase-0-ci.yml", ["journey-contract-check", "Production build"]);

// Canonical Phase 13 Messaging & Notifications product contract.
requirePath("Phase 13 product audit", "docs/PHASE-13-MESSAGING-NOTIFICATIONS-AUDIT.md");
requirePath("Phase 13 static product contract", "frontend/scripts/verify-phase13-messaging-notifications.mjs");
requireText("Notifications use shared application shell", "frontend/app/notifications/page.tsx", ["AppShell", "Activity centre", "AllNotifications"]);
requireText("Notifications use shared authenticated API", "frontend/app/store/useAllNotificationsStore.ts", ["import { api }", "api.get<NotificationResponse>", "api.patch"]);
rejectText("Notifications avoid page/store credential duplication", "frontend/app/store/useAllNotificationsStore.ts", ['localStorage.getItem("access")', 'localStorage.setItem("access")', "document.cookie"]);
requireText("Notification contextual routing", "frontend/app/notifications/AllNotifications.tsx", ["safeNotificationLink", 'return "/messages"', 'return "/bookings"', 'return "/sabipay"']);
requireText("Messages remain in shared app shell", "frontend/app/messages/page.tsx", ["AppShell", "MessagesClient"]);
requireText("Messaging participant and booking authority preserved", "Backend/marketplace/serializers.py", ["if me.pk not in thread.participant_ids()", "Only the client can create the booking agreement.", "Contact details cannot be shared before a booking is accepted."]);
requireText("Notifications promoted to shared role navigation", "frontend/app/config/accessPolicy.ts", ['{ href: "/notifications", label: "Notifications" }', '{ prefix: "/notifications", access: "AUTHENTICATED_SHARED" }', '{ prefix: "/messages", access: "PARTICIPANT_SCOPED" }']);

const releaseGateKeys = [
  "noSeverity1",
  "criticalSeverity2Resolved",
  "crossPlatformJourneysPassed",
  "browserRuntimePassed",
  "physicalDeviceRuntimePassed",
  "stableBetaEnvironmentPassed",
  "supportRouteDefined",
  "rollbackPossible",
  "releaseNotesAvailable",
];
for (const key of releaseGateKeys) {
  check(`Release gate defined · ${key}`, Object.hasOwn(readiness.releaseGate ?? {}, key), key);
}

const failed = checks.filter((item) => !item.pass);
for (const item of checks) {
  console.log(`${item.pass ? "PASS" : "FAIL"}  ${item.label} — ${item.detail}`);
}
console.log(`\nPhase 13 repository readiness and Messaging & Notifications contract: ${checks.length - failed.length}/${checks.length} checks passed.`);
console.log("External browser, physical-device, TestFlight/store and controlled-beta runtime execution are evidence gates, not CI assumptions.");
if (failed.length) process.exit(1);
