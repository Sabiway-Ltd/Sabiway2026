# Developer Start Here

This is the mandatory cold-start procedure for every new developer, contractor, technical reviewer and AI coding session. The purpose is to prevent work from starting from stale assumptions, old chat context, old branches or a merged-but-not-deployment-verified revision.

## 1. What “ready to work” means

You are not ready to change SabiWay merely because you can see the repository or run the frontend. Readiness means you have verified:
- which repository and branch are authoritative;
- the exact current `main` SHA;
- whether that revision is actually the Rolling Green Baseline;
- current CI and deployment evidence;
- relevant architecture and data/auth boundaries;
- open overlapping work;
- the user journey you may affect;
- the preservation boundaries and required tests.

## 2. Rolling Green Baseline definition

The **Rolling Green Baseline** is the latest `main` revision that has:
1. passed every required check for its change scope;
2. completed applicable aggregate release gating;
3. been deployment-verified where deployment applies;
4. had the deployed revision matched to the intended Git SHA;
5. passed safe post-deployment smoke checks;
6. retained a previous known-good rollback revision.

A merge alone does not advance the baseline.

## 3. Mandatory reading order

Before inspecting a ticket/request deeply, read:

1. `AGENTS.md`
2. `README.md`
3. this file
4. `CONTRIBUTING.md`
5. `docs/README.md`
6. `docs/ARCHITECTURE.md`
7. `docs/PROJECT-MAP.md`
8. `docs/USER-JOURNEYS.md`
9. `docs/DESIGN-SYSTEM.md` for UI work
10. `docs/ENVIRONMENTS.md`
11. `docs/CI-CD.md`
12. `docs/REGRESSION_TESTING.md`
13. `docs/OPEN-ISSUES.md`
14. recent entries in `docs/DECISIONS.md`
15. relevant `Documentation/` phase/Figma/deployment evidence
16. the actual source files for the area you will touch

## 4. Live repository verification

Verify, rather than assume:
- repository is `Sabiway-Ltd/Sabiway2026`;
- default branch is `main`;
- exact current `main` SHA;
- current working branch;
- open PRs and their overlap with your requested area;
- stale/old phase branches that must not be treated as newer architecture;
- branch protection and required status contexts;
- current workflow definitions under `.github/workflows/`.

Do not use an old conversation statement such as “Phase X is complete” as a substitute for current repository evidence.

## 5. Release/deployment verification

For work that may be released, verify:
- Platform CI run for the exact revision;
- aggregate Release Gate status;
- Deployment Eligibility status;
- Vercel project and target branch for the web application;
- latest Production deployment Git SHA;
- whether Production is behind `main`;
- whether a build-rate limit or external platform failure exists;
- safe smoke evidence after deployment.

If deployment evidence is incomplete, record the exact limitation. Do not call the revision fully green.

## 6. Architecture inspection checklist

Confirm the relevant boundaries:

### Web
`frontend/` — Next.js/React/TypeScript. Inspect route, shared shell, data-fetching/auth utility, design tokens and loading/error states.

### Mobile
`mobile/` — React Native/Expo/TypeScript. Inspect `App.tsx`, navigation/screens/components and API integration. Consider Android and iOS behaviour separately where applicable.

### Backend
`Backend/` — Django/DRF. Inspect model, migration, serializer, view/service, permission, signal and tests. Do not assume endpoint code contains all side effects; signals are used in this codebase.

### Realtime
`ExpressJs/` — authenticated Socket.io delivery. Realtime is not authoritative business storage.

### Database
Django models/migrations are authoritative for the primary platform schema. Review migration/data impact before changing models.

### Operations
Django admin and `Backend/operations` provide shared operational support/audit/configuration surfaces.

## 7. Data/auth/security review

Before implementation answer:
- Does this touch authentication or token/session behaviour?
- Does this change authorisation or staff/product roles?
- Does it expose new user/payment/verification information?
- Does it change database schema or retention?
- Does it create a new state transition?
- Does it introduce a new external integration or secret?
- Does it affect payment/dispute/refund/release behaviour?
- Does it affect internal review mode?

If yes to any of these, the change is usually RED and needs explicit security/data tests.

## 8. User-journey review

Identify which complete journey is affected, not just which screen/function.

Examples:
- signup → onboarding → profile → verification;
- marketplace discovery → conversation → agreement → booking → SabiPay;
- job post → professional response → conversation → booking;
- message send → persisted record → realtime delivery → notification history;
- SabiForum post → engagement/moderation → notification;
- support report → operations review → audited action.

Read `docs/USER-JOURNEYS.md` and preserve journey invariants.

## 9. UI/UX review

For UI work inspect:
- supplied Figma-export evidence;
- current web and mobile implementation;
- shared design tokens;
- role-specific navigation;
- responsive states;
- loading/empty/error states;
- keyboard/focus/accessibility;
- runtime certification status.

Do not “correct” a mobile screen by copying it directly to desktop. Web should translate the product hierarchy appropriately for desktop/tablet.

## 10. Repository Readiness Brief — required template

Before implementation, produce a concise but specific brief containing:

**Repository state**
- repository/default branch;
- exact current `main` SHA;
- current/last trusted Rolling Green revision;
- current branch;
- overlapping open PRs/stale branches.

**Quality/release state**
- required checks;
- exact-head CI status;
- Release Gate/Deployment Eligibility;
- deployment target and deployed SHA;
- unresolved release blockers.

**Architecture**
- affected web/mobile/backend/realtime/data systems;
- authoritative source of truth;
- integrations involved.

**Product impact**
- affected role(s);
- affected end-to-end journey;
- UI/UX/Figma impact.

**Risk**
- RED/AMBER/GREEN;
- security/privacy/data/payment concerns;
- current P0/P1 issues relevant to the change.

**Implementation plan**
- success criteria;
- preservation boundaries;
- proposed files;
- required tests;
- required documentation.

## 11. Before accepting an improvement

Write the following before changing code:

### Success criteria
Specific observable outcomes that prove the requested improvement is complete.

### Preservation boundaries
Specific existing behaviour that must remain unchanged.

### Risk level
RED / AMBER / GREEN with reasoning.

### Test plan
Name the unit/integration/journey/build/runtime evidence required.

### Documentation plan
Name the current documents that must be updated if the implementation changes their subject.

## 12. During implementation

- work on a focused branch;
- extend rather than broadly rewrite;
- inspect existing abstractions before creating duplicates;
- keep server-side permissions authoritative;
- preserve API compatibility unless explicitly changing the contract;
- add/update tests with code;
- update docs in the same PR;
- do not bypass CI failures;
- record consequential decisions.

## 13. Before merge

Verify:
- PR head SHA is known;
- all required exact-head checks are green;
- Release Gate is green when present;
- no unresolved critical review thread exists;
- docs reflect the actual implementation;
- rollback considerations are recorded for material changes;
- no unrelated changes slipped into the PR.

## 14. Post-merge baseline procedure

After merge:

`fetch exact main SHA` → `prove merge landed` → `verify checks for exact SHA` → `verify deployment/promotion` → `match deployed SHA` → `run safe smoke checks` → `retain previous rollback SHA` → `advance Rolling Green Baseline`.

If any step fails, stop additional improvement merges. Keep the previous known-good baseline authoritative while the issue is fixed/reverted.

## 15. Required completion sentence

After completing the bootstrap and Readiness Brief, state:

**Repository bootstrap complete. I am ready to receive an improvement request. I will define its success criteria and preservation boundaries before changing code.**
