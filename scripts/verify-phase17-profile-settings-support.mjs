import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const checks = [];
const check = (label, pass, detail) => checks.push({ label, pass: Boolean(pass), detail });
const requireText = (label, file, markers) => {
  if (!exists(file)) return check(label, false, `${file} missing`);
  const content = read(file);
  const missing = markers.filter((marker) => !content.includes(marker));
  check(label, missing.length === 0, missing.length ? `missing ${missing.join(", ")}` : file);
};
const rejectText = (label, file, markers) => {
  if (!exists(file)) return check(label, false, `${file} missing`);
  const content = read(file);
  const present = markers.filter((marker) => content.includes(marker));
  check(label, present.length === 0, present.length ? `contains ${present.join(", ")}` : file);
};

check("Phase 17 audit exists", exists("docs/PHASE-17-PROFILE-SETTINGS-SUPPORT-AUDIT.md"), "audit doc");
requireText("Authenticated profile uses AppShell", "frontend/app/profile/page.tsx", ["AppShell", "AccountProfileClient"]);
rejectText("Authenticated profile no longer owns community chrome", "frontend/app/profile/page.tsx", ["CommunityNavbar", "#008753", "#f5f6f5"]);
requireText("Focused profile preserves identity editing", "frontend/app/profile/AccountProfileClient.tsx", ["Edit identity", "updateProfile", "profile_picture", "View public profile"]);
requireText("Profile hands social activity back to SabiForum", "frontend/app/profile/AccountProfileClient.tsx", ["SabiForum identity", 'href="/sabiforum"']);
requireText("Profile preserves role-specific work links", "frontend/app/profile/AccountProfileClient.tsx", ["/professional/services", "/verification", "/jobs", "/bookings"]);
requireText("Canonical settings workspace exists", "frontend/app/settings/page.tsx", ["Settings & support", "Account information", "Security", "Support & policies"]);
requireText("Settings uses existing security/support routes", "frontend/app/settings/page.tsx", ["/forgot-password", "/helpcenter", "/contact", "/accessibility", "/privacy-policy", "/terms-of-use", "/trust-and-safety"]);
rejectText("Settings does not invent unsupported destructive/preference persistence", "frontend/app/settings/page.tsx", ["Delete account", "delete-account", "notification_preference", "marketing_preference"]);
requireText("Settings explains deletion is unavailable until governed", "frontend/app/settings/page.tsx", ["does not yet have a governed backend deletion/deactivation workflow"]);
requireText("Settings is protected by canonical access policy", "frontend/app/config/accessPolicy.ts", ['{ prefix: "/settings", access: "AUTHENTICATED_SHARED" }']);
requireText("Settings appears in both desktop role navigation sets", "frontend/app/config/accessPolicy.ts", ['{ href: "/settings", label: "Settings" }']);
requireText("AppShell knows the Settings icon", "frontend/app/_components/v2/AppShell.tsx", ["Settings,", "Settings,"]);
rejectText("Settings stays out of five-item mobile priorities", "frontend/app/_components/v2/AppShell.tsx", ['clientMobileLabels = new Set(["Home", "Find services", "My Jobs", "Messages", "Profile", "Settings"]', 'professionalMobileLabels = new Set(["Home", "Opportunities", "Proposals", "Messages", "Profile", "Settings"]']);

const failed = checks.filter((item) => !item.pass);
for (const item of checks) console.log(`${item.pass ? "PASS" : "FAIL"}  ${item.label} — ${item.detail}`);
console.log(`\nPhase 17 profile/settings/support contract: ${checks.length - failed.length}/${checks.length} checks passed.`);
if (failed.length) process.exit(1);
