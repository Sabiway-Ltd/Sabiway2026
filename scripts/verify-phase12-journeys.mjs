import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));

const checks = [];
function requirePath(label, relativePath) {
  checks.push({ label, pass: exists(relativePath), detail: relativePath });
}
function requireText(label, relativePath, markers) {
  if (!exists(relativePath)) {
    checks.push({ label, pass: false, detail: `${relativePath} missing` });
    return;
  }
  const content = read(relativePath);
  const missing = markers.filter((marker) => !content.includes(marker));
  checks.push({ label, pass: missing.length === 0, detail: missing.length ? `${relativePath}: missing ${missing.join(", ")}` : relativePath });
}

// Playbook certification matrix: one shared account and backend, three clients.
requirePath("Register · Web", "frontend/app/(auth)/signup/page.tsx");
requireText("Register · Mobile", "mobile/src/auth/AuthFlow.tsx", ["Create an account", "submitSignUp"]);
requireText("Register · Backend", "Backend/accounts/urls.py", ['path("signup/"']);

requirePath("Login · Web", "frontend/app/(auth)/login/page.tsx");
requireText("Login · Mobile", "mobile/src/auth/AuthFlow.tsx", ["Welcome back", "submitSignIn"]);
requireText("Login · Backend", "Backend/accounts/urls.py", ['path("login/"']);

requirePath("Password recovery · Web", "frontend/app/(auth)/forgot-password/page.tsx");
requireText("Password recovery · Mobile", "mobile/src/auth/AuthFlow.tsx", ["Reset your password", "submitForgotPassword", "submitResetCode", "submitNewPassword"]);
requireText("Password recovery · Backend", "Backend/accounts/urls.py", ['path("forgot-password/"', 'path("confirm-code/"', 'path("reset-password/']);

requirePath("Profile · Web", "frontend/app/profile/MyProfile.tsx");
requirePath("Profile · Mobile", "mobile/src/profile/ProfileScreen.tsx");
requirePath("Profile · Backend", "Backend/profiles");

requirePath("Verification · Web", "frontend/app/verification");
requirePath("Verification · Mobile", "mobile/src/verification/VerificationScreen.tsx");
requirePath("Verification · Backend", "Backend/verification");

requireText("Search · Web/backend integration", "Backend/search/views.py", ["SearchView", "maximum_query_length", "search_performed"]);
requireText("Search · Mobile discovery", "mobile/src/marketplace/MarketplaceScreen.tsx", ["search"]);
requirePath("Search · Backend tests", "Backend/search/tests.py");

requirePath("Content · Web", "frontend/app/community");
requirePath("Content · Mobile", "mobile/src/community/CommunityScreen.tsx");
requirePath("Content · Backend", "Backend/posts");

requirePath("Messaging · Web", "frontend/app/messages/MessagesClient.tsx");
requirePath("Messaging · Mobile", "mobile/src/messaging/MessagingScreen.tsx");
requirePath("Messaging · Backend", "Backend/marketplace");

requirePath("Notifications · Web", "frontend/app/notifications");
requirePath("Notifications · Mobile", "mobile/src/notifications/NotificationsScreen.tsx");
requirePath("Notifications · Backend", "Backend/notifications");

requirePath("Transactions · Web", "frontend/app/marketplace");
requirePath("Transactions · Mobile", "mobile/src/marketplace/MarketplaceScreen.tsx");
requirePath("Transactions · Backend", "Backend/marketplace");

requirePath("Payments · Web", "frontend/app/sabipay");
requirePath("Payments · Mobile", "mobile/src/sabipay/SabiPayScreen.tsx");
requirePath("Payments · Backend", "Backend/sabipay");

requirePath("Support/report · Web support route", "frontend/app/helpcenter");
requireText("Support/report · Mobile report route", "mobile/src/community/api.ts", ["reportPost", '"report/"']);
requirePath("Support/report · Backend support", "Backend/operations");

requireText("Logout · Web/backend route", "Backend/accounts/urls.py", ['path("logout/"']);
requireText("Logout · Mobile", "mobile/App.tsx", ["const signOut", "setSession(null)"]);

// Cross-device scenario ingredients. These checks certify shared contracts, not physical device execution.
requireText("Scenario 1 · shared account/profile", "mobile/src/auth/AuthFlow.tsx", ["same SabiWay account"]);
requirePath("Scenario 1 · web profile", "frontend/app/profile/MyProfile.tsx");
requireText("Scenario 2 · content engagement/report", "mobile/src/community/api.ts", ["createPost", "likePost", "reportPost"]);
requirePath("Scenario 2 · notifications", "mobile/src/notifications/NotificationsScreen.tsx");
requirePath("Scenario 3 · transaction/payment", "mobile/src/marketplace/MarketplaceScreen.tsx");
requirePath("Scenario 3 · shared admin", "Backend/operations/admin.py");
requireText("Scenario 4 · suspension enforcement", "mobile/src/auth/AuthFlow.tsx", ["This account is suspended"]);
requirePath("Scenario 4 · backend account controls", "Backend/accounts");

// Regression harness requirements.
requirePath("Backend regression suite", "Backend/accounts/tests.py");
requirePath("Search boundary suite", "Backend/search/tests.py");
requirePath("Phase 11 measurement suite", "Backend/operations/test_phase11_measurement.py");
requirePath("Realtime check", "ExpressJs/package.json");
requirePath("Web TypeScript project", "frontend/tsconfig.json");
requirePath("Mobile TypeScript project", "mobile/tsconfig.json");

const failed = checks.filter((check) => !check.pass);
for (const check of checks) {
  console.log(`${check.pass ? "PASS" : "FAIL"}  ${check.label} — ${check.detail}`);
}
console.log(`\nPhase 12 software journey contract: ${checks.length - failed.length}/${checks.length} checks passed.`);
console.log("Browser and physical-device execution remain runtime evidence and are intentionally not certified by this script.");
if (failed.length) process.exit(1);
