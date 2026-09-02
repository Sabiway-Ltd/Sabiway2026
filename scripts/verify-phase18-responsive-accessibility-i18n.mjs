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

check("Phase 18 audit exists", exists("docs/PHASE-18-RESPONSIVE-ACCESSIBILITY-I18N-AUDIT.md"), "audit doc");
requireText("Root locale is explicit and centralised", "frontend/app/layout.tsx", ["defaultLocale", "<html lang={defaultLocale}"]);
requireText("Locale readiness supports UK and Nigeria English", "frontend/app/i18n/config.ts", ['"en-GB"', '"en-NG"', "Intl.NumberFormat", "Intl.DateTimeFormat"]);
rejectText("No fake language switcher is introduced", "frontend/app/i18n/config.ts", ["setLocale", "localStorage", "languageSwitcher"]);
requireText("Shared skip link targets stable main content", "frontend/app/_components/common/SkipLink.tsx", ['href="#main-content"', "Skip to main content"]);
requireText("Authenticated shell exposes skip target", "frontend/app/_components/v2/AppShell.tsx", ["<SkipLink />", 'id="main-content"', "tabIndex={-1}"]);
requireText("Public shell exposes skip target", "frontend/app/_components/v2/PublicShell.tsx", ["<SkipLink />", 'id="main-content"', "tabIndex={-1}"]);
requireText("Public footer links meet canonical touch target", "frontend/app/_components/v2/PublicShell.tsx", ["min-h-11 items-center rounded-lg"]);
requireText("Mobile profile control meets canonical hit area", "frontend/app/_components/v2/AppShell.tsx", ['className="flex h-11 w-11 items-center justify-center rounded-full']);
requireText("Global focus ring remains visible", "frontend/app/globals.css", [":focus-visible", "--sabi-focus-ring-width", "outline-offset"]);
requireText("Global reflow hardening exists", "frontend/app/globals.css", ["text-size-adjust: 100%", "overflow-wrap: anywhere", "max-width: 100%"]);
requireText("Reduced motion covers arbitrary future motion", "frontend/app/globals.css", ["prefers-reduced-motion: reduce", "animation-duration: 0.01ms !important", "transition-duration: 0.01ms !important"]);
requireText("Browser zoom remains enabled", "frontend/app/layout.tsx", ['viewport = { width: "device-width", initialScale: 1 }']);
rejectText("Viewport does not disable scaling", "frontend/app/layout.tsx", ["maximumScale", "userScalable"]);
requireText("Audit keeps certification claims honest", "docs/PHASE-18-RESPONSIVE-ACCESSIBILITY-I18N-AUDIT.md", ["do not constitute accessibility certification", "400% browser zoom/reflow", "screen-reader review"]);

const failed = checks.filter((item) => !item.pass);
for (const item of checks) console.log(`${item.pass ? "PASS" : "FAIL"}  ${item.label} — ${item.detail}`);
console.log(`\nPhase 18 responsive/accessibility/i18n contract: ${checks.length - failed.length}/${checks.length} checks passed.`);
if (failed.length) process.exit(1);
