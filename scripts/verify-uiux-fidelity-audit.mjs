import fs from "node:fs";
import path from "node:path";

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

const checks = [
  ["audit status is explicit", ["in_progress", "certified"].includes(audit.status)],
  ["Figma export availability is recorded", audit.design_source?.figma_export_available === true],
  ["exact visual parity is not falsely certified", audit.design_source?.exact_visual_parity_certified === false || audit.status === "certified"],
  ["prototype parity is not falsely certified without native Figma evidence", audit.design_source?.prototype_interaction_parity_certified === false || audit.design_source?.file_key_available === true],
  ["screen decisions are recorded", Object.keys(audit.decisions || {}).length >= 12],
  ["export screen matrix is required", audit.final_gate?.requires_export_screen_matrix === true],
  ["audit document uses decision framework", doc.includes("KEEP / IMPROVE / REWORK / REPLACE / REMOVE")],
  ["audit document records responsive widths", doc.includes("320, 360, 375, 390, 430, 768, 1024, 1280, 1366 and 1440+")],
  ["screen matrix includes client home", matrix.includes("Client Homepage.png")],
  ["screen matrix includes provider home", matrix.includes("Provider Homepage.png")],
  ["screen matrix includes messaging", matrix.includes("Message.png")],
  ["screen matrix includes payments", matrix.includes("Payment method.png")],
  ["screen matrix includes auth", matrix.includes("SIgnin active.png")],
];

for (const [label, pass] of checks) console.log(`${pass ? "PASS" : "FAIL"}  ${label}`);
if (checks.some(([, pass]) => !pass)) process.exit(1);
