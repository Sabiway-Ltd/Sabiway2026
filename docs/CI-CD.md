# CI/CD and Release Policy

## Current CI
The repository has one GitHub Actions workflow: `.github/workflows/phase-0-ci.yml` (`Platform CI`) triggered on pull requests and pushes to `main`.

Current quality jobs:
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

## Aggregate Release Gate
`release-gate` depends on every Platform CI quality job above and succeeds only when all of them succeed. It uses `always()` so a failed/skipped dependency cannot silently remove the aggregate result. This gives the repository one explicit release-quality decision for each workflow run.

`deployment-eligibility` runs only after `release-gate` succeeds. It records that the exact Git SHA has passed repository release checks. It deliberately does **not** claim that Vercel deployed that SHA.

## Branch-protection enforcement gap
`main` is protected, but live branch protection currently requires only `backend-check`, `repository-hygiene`, `realtime-check` and `waitlist-syntax`. The preferred policy is to require the aggregate `Release Gate` context (and retain any additional contexts that are intentionally required). Until repository settings are updated, this remains a P1 release-governance gap.

Do not weaken protection to make a merge easier. Branch-protection changes are RED-scope release-control changes and need explicit evidence.

## Deployment
Vercel is connected directly to the GitHub repository. It creates preview deployments from branches/PRs and Production deployments from `main`. Because this external Git integration can start independently of GitHub's aggregate gate, deployment *attempts* are not proof of release approval.

A Vercel preview or READY deployment is evidence only. Before advancing the Rolling Green Baseline, verify:
1. exact resulting `main` SHA;
2. Release Gate success for the relevant change head and/or resulting revision as available;
3. Production deployment Git SHA equals intended `main` SHA;
4. safe post-deployment smoke checks pass.

If Vercel is blocked by plan/build-rate limits, the baseline does not advance. Do not repeatedly redeploy simply to force a green status.

## Desired release sequence
change-scope classification
→ fast/static/security checks
→ unit/integration/regression/browser checks
→ backend/database E2E when required
→ aggregate Release Gate
→ Deployment Eligibility
→ deployment/promotion
→ deployed-revision verification
→ safe post-deployment smoke checks
→ Rolling Green Baseline advancement

The repository now enforces the aggregate Release Gate and Deployment Eligibility ordering inside GitHub Actions. External Vercel Production promotion is not yet technically blocked on that GitHub job, so the remaining deployment-control gap stays recorded in `docs/OPEN-ISSUES.md`.

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
