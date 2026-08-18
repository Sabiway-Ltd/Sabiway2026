# CI/CD, Release Gates and Rolling Green Baseline

This document explains how SabiWay changes move from branch to verified baseline. It is written for developers, AI coding sessions and release reviewers.

## 1. Core release principle

A change is not considered safely released simply because:
- a PR was merged;
- one test passed;
- Vercel created a preview;
- a deployment shows READY;
- the web UI renders.

SabiWay requires exact-revision evidence.

## 2. Current CI workflow

The repository currently uses `.github/workflows/phase-0-ci.yml`, named **Platform CI**.

It runs on:
- pull requests;
- pushes to `main`.

The workflow is intentionally cross-platform because web, mobile, backend, realtime, data and design evidence can all be affected by shared changes.

## 3. Quality jobs

### `repository-hygiene`
Purpose: prevent generated/local/secret material from entering the repository.

Checks for tracked items such as:
- `node_modules`;
- virtual environments;
- Python caches/pyc;
- real `.env` files;
- local SQLite/database files.

A hygiene failure should be fixed by removing the prohibited tracked artefact, not by weakening the pattern.

### `design-system-check`
Runs the canonical design-token synchronisation check.

Purpose: keep shared design values aligned across clients and catch accidental manual drift.

### `uiux-fidelity-audit-check`
Runs the repository UI/UX fidelity evidence/honesty check.

Purpose: ensure documentation does not falsely claim runtime/Figma certification beyond available evidence.

### `journey-contract-check`
Verifies Phase 12 cross-platform journey contracts.

Purpose: ensure critical journey coverage/evidence remains represented after changes.

### `controlled-testing-readiness-check`
Verifies Phase 13 controlled-testing readiness evidence.

Purpose: preserve tester/readiness contracts and prevent accidental removal of readiness artefacts.

### `backend-check`
Runs in `Backend/` with CI-safe environment values.

Key steps:
- install Python dependencies;
- `python manage.py check --deploy`;
- `python manage.py makemigrations --check --dry-run`;
- backend journey tests for health, accounts, search, posts, notifications, marketplace, verification, SabiPay and operations.

A backend failure can indicate schema drift, permission/state regression or environment/security configuration issues.

### `realtime-check`
Runs in `ExpressJs/`.

Key steps:
- npm install from lockfile;
- realtime/service checks.

Purpose: protect authenticated realtime delivery and service integrity.

### `frontend-check`
Runs in `frontend/`.

Key steps:
- `npm ci`;
- TypeScript type check;
- lint;
- Next.js Production build.

A local dev server working is not a substitute for a successful Production build.

### `mobile-check`
Runs in `mobile/`.

Key steps:
- npm install from lockfile;
- React Native/Expo TypeScript check.

This is code-level evidence only; it does not prove physical Android/iPhone runtime behaviour.

### `waitlist-syntax`
Compiles the historical Flask waitlist Python source.

The waitlist is separate from the main platform, but repository changes should not silently break its syntax.

## 4. Aggregate Release Gate

`release-gate` depends on all Platform CI quality jobs.

Its purpose is to provide one explicit answer to:

> Did the complete repository quality set succeed for this workflow run?

The gate uses `always()` semantics so a failed/skipped dependency does not silently cause the aggregate gate to disappear.

A PR should not be considered release-quality green while `release-gate` is failing/pending.

## 5. Deployment Eligibility

`deployment-eligibility` runs only after Release Gate succeeds.

It records that the exact Git SHA has passed repository release checks.

It does **not** mean:
- Vercel has deployed it;
- Production is on that SHA;
- smoke checks passed;
- the Rolling Green Baseline advanced.

Think of it as “repository technically eligible for promotion”, not “released”.

## 6. Branch protection

`main` is protected.

At the time this governance system was established, only a subset of Platform CI contexts was required by branch protection. The preferred direction is to require the aggregate Release Gate, while deliberately retaining any additional mandatory checks needed by repository policy.

Branch-protection changes are RED scope because they can weaken release safety.

Never bypass or remove required checks simply because a PR is urgent.

## 7. Vercel deployment architecture

Vercel is connected to the GitHub repository for the Next.js web project.

Expected project characteristics include:
- SabiWay Vercel project only (do not modify unrelated projects);
- framework: Next.js;
- root directory: `frontend`;
- Production branch: `main`;
- preview deployments for branches/PRs;
- Production deployments from `main`.

Because the external Vercel Git integration can attempt builds independently of the GitHub Release Gate, a Vercel deployment attempt is not itself release approval.

## 8. Vercel status interpretation

### READY preview
Means Vercel built a preview successfully.

It does not prove:
- all Platform CI jobs passed;
- Production is updated;
- backend/realtime/mobile are healthy;
- deployment Git SHA equals current `main`.

### Production READY
Useful evidence, but still verify the deployment metadata Git SHA.

### build-rate-limit failure
This is an infrastructure/platform-plan condition, not automatically a product regression.

Do not repeatedly redeploy simply to force a status change. Record the limitation and retain the previous trusted baseline until current revision deployment can be verified.

## 9. Required release sequence

For a material change, follow:

```text
classify scope
→ run targeted checks during development
→ PR
→ complete Platform CI
→ Release Gate
→ Deployment Eligibility
→ merge exact verified head
→ verify resulting main SHA
→ Production deployment/promotion where applicable
→ verify deployed Git SHA
→ safe smoke checks
→ retain previous rollback SHA
→ advance Rolling Green Baseline
```

For RED changes, include additional security/data/payment/migration evidence as relevant before promotion.

## 10. Rolling Green Baseline

The baseline is the latest `main` revision that has satisfied required checks and applicable deployment verification.

### Baseline advancement checklist

1. Fetch exact current `main` SHA.
2. Confirm intended PR/commit is included.
3. Verify all required checks for that exact revision/head evidence.
4. Confirm aggregate Release Gate succeeded.
5. Confirm Deployment Eligibility where present.
6. Verify deployment/promotion where applicable.
7. Match deployed revision to intended Git SHA.
8. Run safe smoke checks.
9. Record/retain previous known-good revision.
10. Only then call the new revision the Rolling Green Baseline.

If any step fails, the previous baseline remains authoritative.

## 11. Post-deployment smoke checks

Smoke checks must be safe and non-destructive.

Examples:
- homepage/public route loads;
- login page loads;
- health/readiness endpoint responds appropriately;
- protected page redirects/guards correctly;
- known low-risk authenticated read path works with a test/review account;
- critical assets/styles load;
- no obvious runtime 5xx spike appears.

Do not create real financial transactions or destroy Production records merely to smoke test.

## 12. RED release controls

RED changes include auth, permissions, schema/security, SabiPay, verification, secrets and deployment controls.

Additional expectations may include:
- negative permission tests;
- migration compatibility review;
- provider sandbox tests;
- rollback/data-effect plan;
- explicit environment-variable review;
- post-deployment monitoring.

## 13. Database migration releases

For schema changes:
- review generated migration;
- confirm migration drift is clean;
- identify whether old and new application versions can coexist during deploy;
- avoid destructive drop/rename patterns without migration strategy;
- define rollback limitations;
- never assume reversing code automatically reverses data effects.

## 14. External service failures

A release must fail safely if external services fail.

Examples:
- Paystack unavailable: do not fabricate payment success;
- realtime unavailable: persisted business state remains correct;
- email failure: account/business record should not become corrupt;
- Cloudinary failure: do not claim upload succeeded;
- Vercel failure: do not advance deployment baseline.

## 15. Deployment evidence to record

For material releases record:
- PR number;
- PR head SHA;
- merge commit SHA;
- resulting `main` SHA;
- Platform CI run number/status;
- Release Gate status;
- deployment ID/URL where applicable;
- deployed Git SHA;
- smoke result;
- previous rollback SHA;
- known limitations.

## 16. Rollback

Rollback is not always `git revert`.

Consider:
- database migration compatibility;
- payment side effects already sent to provider;
- external webhooks/events;
- user-visible records created under new code;
- mobile clients that may still use older API assumptions.

For purely frontend changes, rollback may be simpler. For schema/payment/auth changes, assess before acting.

## 17. What to do when CI and deployment disagree

Examples:

### CI green, Vercel failed
Do not advance baseline. Investigate whether failure is product/build-related or infrastructure/rate-limit-related.

### Vercel READY, CI failed
Do not treat preview as approved. Fix CI failure first.

### merge succeeded, Production still old SHA
Record main as ahead of Production. Previous deployment-verified baseline remains authoritative.

### Production new SHA but smoke fails
Stop further improvements and fix/revert through normal release process.

## 18. Known current limitations

Track live limitations in `docs/OPEN-ISSUES.md` rather than hiding them. Typical categories include:
- branch protection not requiring every desired aggregate context;
- external Vercel Git deployment not technically blocked on Release Gate;
- browser/device runtime E2E not fully automated;
- dedicated dependency/security scanning gaps.

## 19. Updating this document

Update this file in the same PR when changing:
- workflow jobs;
- required checks;
- branch protection policy;
- deployment provider/project/root/branch;
- release sequencing;
- baseline definition;
- rollback policy;
- smoke-check requirements.
