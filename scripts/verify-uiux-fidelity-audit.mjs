import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const auditPath = path.join(root, "qa/uiux-fidelity-audit.json");
const docPath = path.join(root, "Documentation/FINAL-UIUX-FIGMA-FIDELITY-AUDIT.md");

if (!fs.existsSync(auditPath) || !fs.existsSync(docPath)) {
  console.error("UI/UX fidelity audit evidence is missing.");
  process.exit(1);
}

const audit = JSON.parse(fs.readFileSync(auditPath, "utf8"));
const doc = fs.readFileSync(docPath, "utf8");

const checks = [
  ["audit status is explicit", ["in_progress", "certified"].includes(audit.status)],
  ["Figma exact parity is not falsely certified", audit.design_source.exact_parity_certified === false || audit.design_source.file_key_available === true],
  ["screen decisions are recorded", Object.keys(audit.decisions || {}).length >= 10],
  ["final gate requires screen matrix", audit.final_gate?.requires_screen_by_screen_matrix === true],
  ["audit document uses decision framework", doc.includes("KEEP / IMPROVE / REWORK / REPLACE / REMOVE")],
  ["audit document records responsive widths", doc.includes("320, 360, 375, 390, 430, 768, 1024, 1280, 1366 and 1440+")],
];

for (const [label, pass] of checks) console.log(`${pass ? "PASS" : "FAIL"}  ${label}`);
if (checks.some(([, pass]) => !pass)) process.exit(1);
