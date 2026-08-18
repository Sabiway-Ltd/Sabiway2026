# CI/CD and Release Policy

## Current CI
The repository currently has one GitHub Actions workflow: `.github/workflows/phase-0-ci.yml` (`Platform CI`) triggered on pull requests and pushes to `main`.

Current jobs:
- `repository-hygiene`: rejects tracked generated directories, `.env`, local DB files and common generated artefacts;
- `design-system-check`: verifies canonical token sync;
- `uiux-fidelity-audit-check`: verifies UI/UX audit evidence/honesty gate;
- `journey-contract-check`: Phase 12 cross-platform journey contracts;
- `controlled-testing-readiness-check`: Phase 13 readiness contract;
- `backend-check`: Python install, Django deploy check, migration drift and backend journey tests;
- `realtime-check`: Express/Socket.io install and checks;
- `frontend-check`: npm install, TypeScript, lint and Production Next.js build;
- `waitlist-syntax`: Python compile check;
- `mobile-check`: npm install and React Native/Expo TypeScript check.

## Current enforcement gap
`main` is protected, but live branch protection currently requires only `backend-check`, `repository-hygiene`, `realtime-check` and `waitlist-syntax`. The frontend, mobile, design-system, journey, controlled-testing and UI/UX checks are not all branch-protection-required. Treat this as a P1 release-governance gap until deliberately corrected.

There is also no explicit aggregate `Release Gate` job and no GitHub-controlled `Deployment Gate` that waits for it.

## Deployment
Vercel is connected directly to the GitHub repository. It creates preview deployments from branches/PRs and Production deployments from `main`. Because this integration is external to the current aggregate release workflow, a preview/deployment attempt can start before all release evidence is complete. A Vercel preview is evidence only; it is not release approval.

Current audit found the latest deployment-verified Production revision behind current `main`, while a Vercel build-rate-limit status is failing on current `main`. Therefore current `main` must not automatically be called the Rolling Green Baseline.

## Desired release sequence
change-scope classification
→ fast/static/security checks
→ unit/integration/regression/browser checks
→ backend/database E2E when required
→ aggregate Release Gate
→ Deployment Gate
→ deployment/promotion
→ deployed-revision verification
→ safe post-deployment smoke checks
→ Rolling Green Baseline advancement

Until infrastructure enforces that order, the gap must remain in `docs/OPEN-ISSUES.md`.

## Scope model
**RED:** auth/authorisation/access control, Production data, canonical APIs, DB security, deployment controls, secrets, critical business/payment rules. Require the broadest relevant regression, security, backend/data and release evidence.

**AMBER:** navigation, forms, shared components/layouts, design system, common utilities/shared DB functions. Require shared regression and responsive/accessibility evidence.

**GREEN:** isolated styling/copy/contained feature presentation. Still requires relevant lint/type/build and targeted regression; green does not mean untested.

## Rolling Green Baseline
The baseline is the latest `main` revision that passed every required check for its scope and, when applicable, deployment verification. A merge alone does not advance it.

After every merge:
1. fetch exact resulting `main` SHA;
2. prove the merge landed;
3. verify required checks for that exact revision;
4. verify deployment/promotion when applicable;
5. match deployed revision to intended Git SHA;
6. perform safe smoke checks;
7. retain the prior known-good rollback revision;
8. only then advance the baseline.

If post-merge verification fails, stop additional improvement merges. The previous baseline remains authoritative; fix or revert through the normal PR/release process.

## Rollback
Every material release must identify the previous known-good revision. Do not roll back database/schema changes blindly; assess migration compatibility and data effects first.
