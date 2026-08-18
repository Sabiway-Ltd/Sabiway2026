# Open Engineering Issues

Never hide unresolved risks. Severity reflects engineering/release risk, not product priority.

## P0
No P0 issue was proven during the 2026-08-18 governance bootstrap. If a security/data-loss/Production-blocking P0 is discovered, stop normal improvement merges until contained.

## P1

### P1-001 — Current main is not deployment-verified
At bootstrap, `main` was `f90b65d4422836c66e456b5989c5615ceffca61a`. GitHub combined status included a failed Vercel/build-rate-limit status, while the latest verified Vercel Production deployment found was an older Git revision. Do not designate a newer revision as Rolling Green until deployed revision matching and smoke evidence exist.

### P1-002 — Branch protection does not require the aggregate Release Gate
Live protection currently requires only `backend-check`, `repository-hygiene`, `realtime-check` and `waitlist-syntax`. The workflow now has an aggregate `Release Gate`, but repository settings still need to require that context before merge. Do not weaken existing required checks while changing this.

### P1-003 — External Vercel Production is not technically gated by GitHub Release Gate
The workflow now has `Release Gate` and `Deployment Eligibility`, but Vercel Git integration can still start deployment attempts independently. A Vercel deployment must not be treated as approved until exact revision matching and smoke evidence are complete. A future focused infrastructure change should gate Production promotion where platform capability permits without adding paid infrastructure without approval.

### P1-004 — Browser/device E2E is not automated in CI
Journey contracts and production build checks exist, but Chrome/Edge/Safari/Firefox runtime execution and physical Android/iPhone visual certification remain external/manual evidence. Pixel-perfect/full runtime Figma certification remains intentionally withheld.

### P1-005 — Stale overlapping open PRs
PR #46 (old Phase 7 draft) and PR #35 (old trust-lifecycle work) remain open against a much newer `main`. They must not be merged as-is. Review and close/rebase deliberately in a separate cleanup task.

## P2

### P2-001 — Historical branch accumulation
Many merged phase branches and old Dependabot branches remain. They create navigation/noise risk but should be cleaned only after confirming no unique work is needed.

### P2-002 — Documentation split/history
Historical evidence lives in `Documentation/`, while the new engineering operating handbook lives in `docs/`. This is deliberate. Future work should link rather than duplicate or delete valid phase evidence.

### P2-003 — Dedicated dependency/security scanning is not a named CI job
Repository hygiene and backend deploy checks exist, but there is no dedicated dependency vulnerability/security-analysis gate identified in the current workflow. Evaluate a focused, low-cost solution before making it required.

### P2-004 — Internal review access is a temporary development aid
`INTERNAL_REVIEW_MODE` is intentionally guarded by `DEBUG=True` and creates non-staff reviewers. It is useful for UI review but remains a temporary review facility and must stay disabled in Production.

## Schema/data drift
Current CI checks Django migration drift. No schema drift was proven in this bootstrap. Production DB revision/backup/restore evidence is not integrated with the web release gate and should not be assumed.
