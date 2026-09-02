import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const exists = (p) => fs.existsSync(path.join(root, p));
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

check("Phase 16 audit exists", exists("docs/PHASE-16-SABIPAY-TRANSACTION-EXPERIENCE-AUDIT.md"), "docs/PHASE-16-SABIPAY-TRANSACTION-EXPERIENCE-AUDIT.md");
requireText("SabiPay uses shared application shell", "frontend/app/sabipay/SabiPayClient.tsx", ["AppShell", "SabiPay transactions"]);
requireText("SabiPay uses shared authenticated API", "frontend/app/sabipay/SabiPayClient.tsx", ["import { api }", 'api.get<Paginated<Transaction>>("/sabipay/transactions/")', 'api.post<{ checkout_url?: string }>("/sabipay/transactions/initialize/"']);
rejectText("SabiPay avoids page-level credential duplication", "frontend/app/sabipay/SabiPayClient.tsx", ['localStorage.getItem("access")', "Authorization: `Bearer", "environment.djangoUrl"]);
requireText("SabiPay exposes explicit transaction states", "frontend/app/sabipay/SabiPayClient.tsx", ["Payment and escrow states", "TransactionTimeline", "reconciliation_status", "freeze_seconds_remaining"]);
requireText("SabiPay keeps funding and release controls", "frontend/app/sabipay/SabiPayClient.tsx", ["Pay securely", "Check payment status", "Confirm satisfaction", "Open dispute"]);
requireText("Professional payout experience retained", "frontend/app/sabipay/SabiPayClient.tsx", ["Payout destination", "Verify payout account", "/sabipay/payout-destinations/", "/sabipay/banks/"]);
requireText("SabiPay hands service progress to Bookings", "frontend/app/sabipay/SabiPayClient.tsx", ["Service progress belongs in Bookings", 'href="/bookings"', "Open bookings"]);
rejectText("SabiPay no longer owns service lifecycle actions", "frontend/app/sabipay/SabiPayClient.tsx", ["start-service", "mark-delivered", "Start service", "Mark delivered"]);
requireText("Backend keeps client-only checkout verification", "Backend/sabipay/views.py", ["Only the paying client can verify this checkout.", "Only professionals configure payout destinations."]);
requireText("Backend keeps transaction participant scoping", "Backend/sabipay/views.py", ["Q(client=profile) | Q(professional=profile)"]);
requireText("Backend keeps idempotent checkout and safe pending reconciliation", "Backend/sabipay/services.py", ["idempotency_key", "Payment confirmation is temporarily unavailable", "duplicate_successful_charge_detected"]);
requireText("Backend keeps dispute release freeze authority", "Backend/sabipay/services.py", ["ACTIVE_DISPUTE_STATUSES", "DISPUTABLE_STATES"]);

const failed = checks.filter((item) => !item.pass);
for (const item of checks) console.log(`${item.pass ? "PASS" : "FAIL"}  ${item.label} — ${item.detail}`);
console.log(`\nPhase 16 SabiPay transaction contract: ${checks.length - failed.length}/${checks.length} checks passed.`);
if (failed.length) process.exit(1);
