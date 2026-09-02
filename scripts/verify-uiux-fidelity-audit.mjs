import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const auditPath = path.join(root, "qa/uiux-fidelity-audit.json");
const docPath = path.join(root, "Documentation/FINAL-UIUX-FIGMA-FIDELITY-AUDIT.md");
const matrixPath = path.join(root, "Documentation/FIGMA-EXPORT-SCREEN-MATRIX.md");

if (!fs.existsSync(auditPath) || !fs.existsSync(docPath) || !fs.existsSync(matrixPath)) {
  console.error("UI/UX fidelity audit evidence is missing.");
  process.exit(1);
}

const audit = JSON.parse(fs.readFileSync(auditPath, "utf8"));
const doc = fs.readFileSync(docPath, "utf8");
const matrix = fs.readFileSync(matrixPath, "utf8");
const allowedStatuses = ["in_progress", "implementation_complete_runtime_review_pending", "certified"];

const checks = [
  ["audit status is explicit", allowedStatuses.includes(audit.status)],
  ["Figma export availability is recorded", audit.design_source?.figma_export_available === true],
  ["exact visual parity is not falsely certified", audit.design_source?.exact_visual_parity_certified === false || audit.status === "certified"],
  ["prototype parity is not falsely certified without native Figma evidence", audit.design_source?.prototype_interaction_parity_certified === false || audit.design_source?.file_key_available === true],
  ["screen decisions are recorded", Object.keys(audit.decisions || {}).length >= 12],
  ["implemented screen families include mobile and web", (audit.implemented_screen_families || []).some((value) => value.startsWith("mobile")) && (audit.implemented_screen_families || []).some((value) => value.startsWith("web"))],
  ["export screen matrix is required", audit.final_gate?.requires_export_screen_matrix === true],
  ["runtime browser review remains required before certification", audit.status === "certified" || audit.final_gate?.requires_browser_review === true],
  ["runtime device review remains required before certification", audit.status === "certified" || audit.final_gate?.requires_real_device_review === true],
  ["audit document uses decision framework", doc.includes("KEEP / IMPROVE / REWORK / REPLACE / REMOVE")],
  ["audit document records responsive widths", doc.includes("320, 360, 375, 390, 430, 768, 1024, 1280, 1366 and 1440+")],
  ["screen matrix includes client home", matrix.includes("Client Homepage.png")],
  ["screen matrix includes provider home", matrix.includes("Provider Homepage.png")],
  ["screen matrix includes messaging", matrix.includes("Message.png")],
  ["screen matrix includes payments", matrix.includes("Payment method.png")],
  ["screen matrix includes auth", matrix.includes("Signup .png") && matrix.includes("SIgnin")],
  ["screen matrix records web translation", matrix.includes("Web translation completed in this pass")],
];

for (const [label, pass] of checks) console.log(`${pass ? "PASS" : "FAIL"}  ${label}`);
if (checks.some(([, pass]) => !pass)) process.exit(1);

for (const script of [
  "scripts/verify-phase3-homepage.mjs",
  "scripts/verify-phase16-sabipay-transaction-experience.mjs",
  "scripts/verify-phase17-profile-settings-support.mjs",
]) {
  if (fs.existsSync(path.join(root, script))) {
    execFileSync(process.execPath, [script], { cwd: root, stdio: "inherit" });
  }
}
