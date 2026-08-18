# Developer Start Here

No material improvement work starts until this bootstrap is complete.

## Rolling Green Baseline
The Rolling Green Baseline is the latest `main` revision that has successfully passed every required check for its change scope and, when applicable, deployment verification. A merge alone does not advance the baseline.

## Mandatory cold-start procedure
1. Read `AGENTS.md`, this document, `CONTRIBUTING.md`, the handbook index and the architecture/design/CI/regression/open-issues docs.
2. Verify repository identity, default branch and exact live `main` SHA.
3. Verify current working branch, open PRs, stale/overlapping branches and branch protection.
4. Verify CI configuration and current check evidence for the exact revision.
5. Verify deployment platform, Production branch, current deployed revision and preview/staging behaviour.
6. Compare current `main` to the currently designated/last deployment-verified baseline. If post-merge/release evidence is incomplete, do not call `main` green merely because it merged.
7. Review open issues and recent consequential decisions.
8. Review real architecture: web, mobile, backend, realtime, database/migrations, auth/authorisation, storage, operations/admin, external integrations and critical journeys.
9. Review design system, Figma-export evidence, responsive behaviour and accessibility requirements.
10. Review data/security boundaries, secrets, migration strategy and any temporary review/test bypasses.
11. Produce the Repository Readiness Brief below.

## Repository Readiness Brief template
- Repository name and default branch
- Exact current revision
- Current green/baseline status and previous trusted baseline
- Current branch, open PRs and stale/overlapping branches
- Branch protection and bypass risk
- CI architecture; mandatory/optional/failing/pending/skipped checks
- Deployment architecture; Production/preview behaviour and deployed revision
- Frontend/mobile/backend/realtime stacks
- Database, auth, authorisation, storage and external services
- User/staff roles
- Critical user journeys
- Design system and accessibility/responsive status
- Existing/missing documentation
- P0/P1/security/deployment/schema/testing risks
- Preservation risks and implementation/documentation discrepancies
- Proposed files/change scope

## Before accepting an improvement
State success criteria, preservation boundaries, affected journey, RED/AMBER/GREEN risk, tests and docs. If these are not explicit, do not change code.

## Post-merge baseline procedure
Fetch exact `main` SHA → prove merge landed → verify required checks for that revision → verify deployment/promotion where applicable → match deployed revision to Git → run safe smoke checks → retain previous rollback revision → only then advance the Rolling Green Baseline.

If verification fails, stop additional improvement merges and keep the previous baseline authoritative.

Required completion sentence:

**Repository bootstrap complete. I am ready to receive an improvement request. I will define its success criteria and preservation boundaries before changing code.**
