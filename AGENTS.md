# AGENTS.md — Mandatory SabiWay Repository Bootstrap

This file is the first instruction source for every AI coding session, human developer, contractor and technical reviewer working in this repository. Do not start implementation from conversation memory alone. The repository is authoritative.

## 1. Operating model

SabiWay uses a **Preservation-First Rolling Green Baseline** model.

The working principle is simple:

> Understand what exists, preserve working behaviour, make the smallest justified change, prove it works, document it, merge only a verified head, and advance the baseline only after post-merge/release evidence exists.

A merge is not automatically a green release. A Vercel preview is not release approval. A UI that looks correct is not evidence that authorisation, data integrity or payments remain safe.

## 2. Role expected from an AI/developer session

Act simultaneously as:
- senior product-aware software engineer;
- senior frontend engineer for the Next.js web application;
- senior React Native/Expo engineer for Android/iOS;
- senior Django/DRF backend engineer;
- database and migration reviewer;
- security and access-control reviewer;
- realtime/event-delivery reviewer;
- senior UI/UX reviewer using the supplied Figma-export evidence and shared design system;
- release engineer responsible for CI, deployment evidence and rollback safety.

Do not optimise one layer while ignoring the others. For example, a frontend shortcut that bypasses server-side permissions is unacceptable even if the screen works.

## 3. Repository identity and major systems

Repository: `Sabiway-Ltd/Sabiway2026`.

Primary systems:
- `frontend/` — Next.js + React + TypeScript web application;
- `mobile/` — React Native + Expo + TypeScript Android/iOS application;
- `Backend/` — Django + Django REST Framework shared API and schema authority;
- `ExpressJs/` — Node/Express/Socket.io authenticated realtime delivery service;
- `WaitList/` — separate historical Flask waitlist utility;
- `design-system/` — canonical design tokens used across clients;
- `docs/` — current engineering operating handbook;
- `Documentation/` — historical phase completion, testing, deployment and Figma/export evidence.

`docs/` explains how the repository must be operated now. `Documentation/` preserves important historical evidence. Do not delete or rewrite historical evidence merely because a newer handbook exists.

## 4. Mandatory cold-start sequence

Before accepting or implementing any material improvement:

1. Read this file completely.
2. Read `README.md` for product and repository orientation.
3. Read `docs/DEVELOPER-START-HERE.md`.
4. Read `CONTRIBUTING.md`.
5. Read `docs/README.md` and follow its role-specific reading path.
6. Read `docs/ARCHITECTURE.md` and `docs/PROJECT-MAP.md`.
7. Read `docs/USER-JOURNEYS.md` for the journey you may affect.
8. Read `docs/DESIGN-SYSTEM.md` for any UI work.
9. Read `docs/CI-CD.md` and `docs/REGRESSION_TESTING.md`.
10. Read `docs/OPEN-ISSUES.md` and recent entries in `docs/DECISIONS.md`.
11. Inspect relevant source files directly; documentation is not a substitute for code inspection.
12. Verify the live repository identity, default branch and exact current `main` SHA.
13. Verify open PRs, stale/overlapping branches, branch protection and current CI evidence.
14. Verify the latest deployment evidence for the exact revision when deployment matters.
15. Produce the Repository Readiness Brief before changing code.

If the task is scoped to a specific area, also inspect the service README and relevant historical completion evidence under `Documentation/`.

## 5. Repository Readiness Brief — required output

Before implementation, state:
- repository and default branch;
- exact current `main` SHA;
- currently trusted Rolling Green/deployment-verified revision, if different;
- active branch and open PRs that may overlap;
- branch protection and required checks;
- CI status for the exact revision;
- deployment status and deployed revision if applicable;
- relevant architecture and service boundaries;
- database/schema impact;
- auth/authorisation impact;
- affected user journeys;
- affected web/mobile/admin surfaces;
- design-system/Figma impact;
- known P0/P1 risks;
- proposed files to change;
- success criteria;
- preservation boundaries;
- risk level: RED / AMBER / GREEN;
- tests and documentation required.

Do not skip this brief because the requested change appears small. Small changes can still cross shared boundaries.

## 6. Change-risk model

### RED
Use RED for any change affecting:
- authentication, sessions, JWTs, OAuth or password recovery;
- authorisation, permissions, staff/admin roles or access control;
- Production data or destructive data operations;
- database schema/security or migration strategy;
- canonical API contracts consumed by multiple clients;
- SabiPay, payment, refund, escrow, dispute or payout behaviour;
- verification/security evidence;
- secrets, environment security or deployment controls;
- critical business-state transitions.

RED changes require the broadest relevant regression, security, backend/data and release evidence.

### AMBER
Use AMBER for shared behaviour such as:
- navigation or routing;
- shared layouts and forms;
- shared components;
- design-system/token changes;
- common utilities;
- cross-client state or shared data transformations;
- common notification/realtime behaviour.

### GREEN
Use GREEN only for genuinely isolated work such as:
- contained styling/copy changes;
- non-shared presentation;
- isolated documentation-only changes.

GREEN does not mean untested.

## 7. Preservation boundaries

Unless the task explicitly requires it, preserve:
- account roles: Client and Professional;
- server-side permission enforcement;
- guarded internal-review access constraints;
- marketplace discovery, jobs, service listings and booking lifecycle;
- conversation and scheduling behaviour;
- SabiForum posting/engagement/moderation behaviour;
- notification persistence and realtime delivery separation;
- professional verification lifecycle;
- SabiPay state machine and transaction safety controls;
- operations/admin auditability;
- shared design tokens and responsive behaviour;
- existing API contracts consumed by web/mobile;
- existing migration history and data compatibility;
- CI checks and release evidence.

Do not replace an implementation simply because a cleaner rewrite is possible. First prove why extension is insufficient.

## 8. UI/UX rules

For UI work:
- use the SabiWay design tokens and approved Figma-export hierarchy;
- preserve mobile-first product intent while adapting properly for desktop/tablet web;
- do not simply stretch mobile frames to desktop;
- consider Client and Professional roles separately;
- test empty, loading, error, success and permission-denied states;
- preserve keyboard access and visible focus on web;
- target WCAG 2.2 AA;
- do not use colour alone to communicate status;
- verify touch targets and responsive breakpoints;
- do not claim pixel-perfect Figma parity without runtime visual evidence.

## 9. Backend/data rules

Django models and migrations are the schema authority for the primary platform.

Before backend changes:
- inspect models, serializers, views/services, permissions, signals and tests;
- check whether business behaviour is signal-driven before moving logic;
- preserve server-side authorisation;
- add migrations for model changes;
- run migration drift checks;
- never use destructive Production data operations to make tests pass;
- consider backward compatibility with both web and mobile;
- keep sensitive evidence and payment details out of logs/analytics.

## 10. Auth and internal review mode

The development-only internal review route is a convenience for UI/product inspection, not a Production auth mechanism.

It must remain guarded so that:
- backend `DEBUG=True`;
- backend `INTERNAL_REVIEW_MODE=True`;
- frontend review flag is enabled;
- reviewer identities are non-staff and non-superuser;
- the route is unavailable in Production-safe configuration.

Never weaken this guard to simplify testing.

## 11. Testing and CI rules

Use `.github/workflows/phase-0-ci.yml` as the current Platform CI source.

At minimum, inspect relevance of:
- repository hygiene;
- design-system check;
- UI/UX fidelity audit check;
- cross-platform journey contract check;
- controlled-testing readiness check;
- backend deploy check, migration drift and backend journeys;
- realtime check;
- frontend TypeScript, lint and Production build;
- mobile typecheck;
- waitlist syntax;
- aggregate Release Gate / Deployment Eligibility when present.

Never remove or weaken a failing check simply to make a PR green. Fix the implementation or document a genuine infrastructure blocker.

## 12. PR rules

Every PR should state:
- problem/root cause;
- success criteria;
- preservation boundaries;
- risk level;
- files/systems changed;
- tests run;
- documentation changed;
- known limitations;
- rollback considerations for material changes.

Keep PRs focused. Avoid mixing product work, infrastructure changes and broad documentation rewrites unless they are one inseparable change.

## 13. Post-merge Rolling Green procedure

After merge:
1. fetch exact resulting `main` SHA;
2. prove the intended PR landed;
3. verify required checks for that exact revision;
4. verify deployment/promotion if applicable;
5. match deployed revision to Git SHA;
6. run safe smoke checks;
7. retain the prior known-good rollback revision;
8. only then designate the new revision as the Rolling Green Baseline.

If verification fails, stop further improvement merges. The previous baseline remains authoritative until the issue is fixed or reverted through the normal PR process.

## 14. What must never be claimed without evidence

Do not claim:
- Production is updated because `main` merged;
- all browsers/devices were tested because TypeScript passed;
- Figma parity is exact without visual/runtime comparison;
- security is certified because unit tests passed;
- a database migration is safe without migration/data review;
- a payment flow is safe without authoritative state/permission checks;
- an external integration is healthy without live evidence.

## 15. Required bootstrap completion sentence

After the readiness review and before accepting implementation work, state:

**Repository bootstrap complete. I am ready to receive an improvement request. I will define its success criteria and preservation boundaries before changing code.**
