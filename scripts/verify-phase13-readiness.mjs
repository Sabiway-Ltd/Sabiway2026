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

// Phase 14 Trust, Verification, Reputation & Reviews contract.
requirePath("Phase 14 trust audit", "docs/PHASE-14-TRUST-VERIFICATION-REPUTATION-AUDIT.md");
requirePath("Phase 14 reputation model", "Backend/reputation/models.py");
requirePath("Phase 14 reputation authority tests", "Backend/marketplace/test_phase14_reputation.py");
requireText("Completed-work review authority", "Backend/reputation/serializers.py", ["BookingRequest.Status.COMPLETED", "Only the Client on this booking can review the Professional.", "A completed-work review already exists for this booking."]);
requireText("Public trust read model is backend-derived", "Backend/profiles/public_views.py", ["VerificationSubmission.Status.APPROVED", "average_rating=Avg", "PublicProfessionalReviewSerializer", '"trust"']);
requireText("Verification uses authenticated app shell", "frontend/app/verification/page.tsx", ["AppShell", "VerificationAccessGate"]);
requireText("Verification uses shared authenticated API", "frontend/app/verification/VerificationClient.tsx", ["import { api }", 'api.get<Submission>("/verification/submissions/me/")', "api.post<Submission>", "responseType: \"blob\""]);
rejectText("Verification avoids page-level credential duplication", "frontend/app/verification/VerificationClient.tsx", ['localStorage.getItem("access")', "Authorization: `Bearer", "PublicShell"]);
requireText("Public Professional profile separates trust signals", "frontend/app/profile/[username]/page.tsx", ["Completed-work reputation", "Verified Professional", "No completed-work reviews yet", "trust.reputation"]);
requireText("Completed booking exposes Client review action", "frontend/app/bookings/page.tsx", ["booking.status === \"completed\"", 'api.post<Review>("/reputation/reviews/"', "Submit completed-work review"]);
rejectText("Production profile does not contain fake review fixtures", "frontend/app/profile/[username]/page.tsx", ["fakeReview", "mockReview", "sampleReview"]);
requireText("Verification remains Professional-only", "frontend/app/config/accessPolicy.ts", ['{ prefix: "/verification", access: "PROFESSIONAL_ONLY" }']);

// Phase 15 Booking, Scheduling & Service Management contract.
requirePath("Phase 15 service-management audit", "docs/PHASE-15-BOOKING-SCHEDULING-SERVICE-MANAGEMENT-AUDIT.md");
requirePath("Phase 15 capability authority", "Backend/marketplace/booking_capabilities.py");
requirePath("Phase 15 capability tests", "Backend/marketplace/test_phase15_booking_capabilities.py");
requirePath("Phase 15 static contract", "scripts/verify-phase15-booking-service.mjs");
requireText("Booking capabilities are SabiPay-aware", "Backend/marketplace/booking_capabilities.py", ["Transaction.State.FUNDED", "Transaction.State.IN_PROGRESS", '"payment_state"', '"available_status_transitions"']);
requireText("Bookings is canonical service-management workspace", "frontend/app/bookings/page.tsx", ['api.get<BookingCapability[]>("/marketplace/booking-capabilities/")', "available_status_transitions", "can_propose_schedule", "can_respond_to_active_schedule", "Bookings & schedules"]);
requireText("Messages hands existing bookings to canonical workspace", "frontend/app/messages/MessagesClient.tsx", ['href="/bookings"', "Open Bookings & schedules", "After creation, manage its lifecycle in Bookings & schedules."]);
rejectText("Messages no longer owns status or schedule transitions", "frontend/app/messages/MessagesClient.tsx", ["async function updateBooking", "async function proposeSchedule", "async function decideSchedule"]);
requireText("Phase 15 backend preserves future-only schedule negotiation", "Backend/marketplace/serializers.py", ["The booking must be accepted before scheduling.", "Schedule must be in the future."]);
requireText("Phase 15 backend preserves other-participant decision authority", "Backend/marketplace/views.py", ["The other participant must respond to this proposal.", "This proposal is no longer active."]);

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
console.log(`\nPhase 15 repository readiness, trust and service-management contract: ${checks.length - failed.length}/${checks.length} checks passed.`);
console.log("External browser, physical-device, TestFlight/store and controlled-beta runtime execution are evidence gates, not CI assumptions.");
if (failed.length) process.exit(1);
