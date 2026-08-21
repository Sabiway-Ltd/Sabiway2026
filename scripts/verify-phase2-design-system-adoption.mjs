import { readFile } from "node:fs/promises";

const targets = [
  "frontend/app/(auth)/_components/LoginExperience.tsx",
  "frontend/app/(auth)/_components/SignupExperience.tsx",
  "frontend/app/(auth)/_components/AuthPasswordField.tsx",
  "frontend/app/_components/v2/AppShell.tsx",
  "frontend/app/_components/common/Button.tsx",
  "frontend/app/_components/common/DesignPrimitives.tsx",
  "frontend/app/_components/common/ConfirmDialog.tsx",
];

const forbiddenRawBrandValues = [
  "#008753",
  "#007047",
  "#006b42",
  "#ffb800",
  "#e7f7ef",
  "#e8f7f0",
  "#d4dcd7",
  "#173126",
  "#17211b",
  "#68776f",
  "#f4f5f4",
];

const failures = [];
const sourceByPath = new Map();
for (const path of targets) {
  const source = await readFile(path, "utf8");
  sourceByPath.set(path, source);
  const lower = source.toLowerCase();
  for (const value of forbiddenRawBrandValues) {
    if (lower.includes(value)) failures.push(`${path}: raw brand value ${value}`);
  }
}

const login = sourceByPath.get("frontend/app/(auth)/_components/LoginExperience.tsx") || "";
const signup = sourceByPath.get("frontend/app/(auth)/_components/SignupExperience.tsx") || "";
const shell = sourceByPath.get("frontend/app/_components/v2/AppShell.tsx") || "";
const primitives = sourceByPath.get("frontend/app/_components/common/DesignPrimitives.tsx") || "";
const dialog = sourceByPath.get("frontend/app/_components/common/ConfirmDialog.tsx") || "";
const globals = await readFile("frontend/app/globals.css", "utf8");

for (const [name, source, required] of [
  ["LoginExperience", login, ["Button", "Field", "AuthPasswordField"]],
  ["SignupExperience", signup, ["Button", "Field", "AuthPasswordField"]],
  ["AppShell", shell, ["Button", "Avatar", "Skeleton"]],
]) {
  for (const symbol of required) {
    if (!source.includes(symbol)) failures.push(`${name}: missing shared primitive ${symbol}`);
  }
}

for (const symbol of ["TextareaField", "SelectField", "CheckboxField", "InlineAlert", "StatusBadge", "StatePanel", "Skeleton"]) {
  if (!primitives.includes(`export ${symbol === "TextareaField" || symbol === "SelectField" || symbol === "CheckboxField" ? "const" : "function"} ${symbol}`)) {
    failures.push(`DesignPrimitives: missing ${symbol}`);
  }
}

for (const contract of ["role=\"alertdialog\"", "aria-modal=\"true\"", "useReducedMotion", "previousFocus?.focus()"] ) {
  if (!dialog.includes(contract)) failures.push(`ConfirmDialog: missing ${contract}`);
}

for (const semantic of ["--sabi-surface-selected", "--sabi-primary-soft", "--sabi-success-soft", "--sabi-warning-soft", "--sabi-danger-soft", "--sabi-info-soft", "--sabi-link"]) {
  if (!globals.includes(semantic)) failures.push(`globals.css: missing ${semantic}`);
}

if (failures.length) {
  console.error("Phase 2 design-system adoption check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Phase 2 design-system adoption check passed for ${targets.length} rebuilt surfaces.`);
