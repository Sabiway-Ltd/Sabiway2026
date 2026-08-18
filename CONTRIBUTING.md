# Contributing to SabiWay

This repository contains a production-oriented cross-platform product, not a collection of isolated demos. Contributions must protect working behaviour across web, mobile, backend, realtime, data, payments and operations.

## 1. Before you contribute

Read, in order:
1. `AGENTS.md`
2. `README.md`
3. `docs/DEVELOPER-START-HERE.md`
4. this file
5. `docs/README.md`
6. `docs/ARCHITECTURE.md`
7. `docs/PROJECT-MAP.md`
8. `docs/USER-JOURNEYS.md`
9. `docs/CI-CD.md`
10. `docs/REGRESSION_TESTING.md`
11. `docs/OPEN-ISSUES.md`

For UI work, also read `docs/DESIGN-SYSTEM.md` and the Figma-export evidence under `Documentation/`.

## 2. Engineering model

SabiWay uses a **Preservation-First Rolling Green Baseline**.

The baseline is the latest `main` revision that has passed all required checks for its scope and, where applicable, has matching deployment evidence. A merge alone does not advance the baseline.

Contributors should extend the current implementation unless there is explicit evidence that replacement is safer or necessary.

## 3. Standard change workflow

1. Verify the exact current `main` SHA and current known-good baseline.
2. Inspect relevant implementation before proposing a solution.
3. Define success criteria.
4. Define preservation boundaries.
5. Identify affected user journeys and clients.
6. Classify the change as RED, AMBER or GREEN.
7. Create a focused branch from the intended base.
8. Implement the smallest coherent change.
9. Add/update tests and documentation in the same PR.
10. Run all scope-relevant checks locally where practical.
11. Open a focused PR with complete evidence.
12. Wait for exact-head CI; do not merge a moving/unverified head.
13. Merge only when required checks are green.
14. Verify the resulting `main` SHA and deployment evidence where applicable.
15. Advance the Rolling Green Baseline only after post-merge verification.

## 4. Success criteria and preservation boundaries

Every material PR must say what success means and what must not change.

Example:

**Success criteria**
- Professional can filter jobs by category and location.
- Existing pagination, API response shape and Client marketplace behaviour continue to work.
- Web and mobile render equivalent results.

**Preservation boundaries**
- Do not change account roles.
- Do not change job status transitions.
- Do not alter payment/booking state.
- Do not modify unrelated navigation.

## 5. Risk classification

### RED
Auth, permissions, Production data, schema/security, canonical APIs, payment/SabiPay, verification, secrets, deployment controls or critical state transitions.

Expected evidence usually includes broad backend tests, permission checks, migration review, cross-client compatibility, release evidence and rollback consideration.

### AMBER
Shared navigation, shared components, forms, design system, shared utilities, common data transformations or cross-client behaviour.

Expected evidence usually includes targeted regression plus responsive/accessibility checks.

### GREEN
Isolated copy, contained styling, documentation-only changes or self-contained presentation.

Green changes still require relevant type/lint/build or documentation checks.

## 6. Branch and PR conventions

Use descriptive branch names such as:
- `feat/...`
- `fix/...`
- `chore/...`
- `docs/...`

Avoid long-lived feature branches. Rebase/refresh deliberately if `main` has materially changed.

A PR should contain:
- summary/problem statement;
- root cause where relevant;
- success criteria;
- preservation boundaries;
- risk classification;
- architecture/data/security impact;
- changed files/systems;
- tests/checks run;
- screenshots/runtime evidence for material UI work;
- docs updated;
- known limitations;
- rollback note for material releases.

## 7. Frontend/web contribution rules

The web app lives under `frontend/` and uses Next.js, React and TypeScript.

When changing web UI:
- use the shared SabiWay tokens;
- preserve responsive layouts;
- test keyboard navigation and visible focus;
- preserve role-specific experiences;
- check loading, empty, error and permission-denied states;
- do not duplicate backend business rules in client code;
- do not treat hidden UI as authorisation;
- run TypeScript, lint and Production build.

## 8. Mobile contribution rules

The mobile app lives under `mobile/` and uses React Native/Expo/TypeScript.

When changing mobile UI:
- preserve Client vs Professional navigation intent;
- use shared product/design language;
- keep touch targets usable;
- account for smaller devices and long content;
- avoid assumptions that only work on one OS;
- preserve API compatibility with web;
- run mobile typecheck;
- keep physical-device validation separate from code-level checks.

## 9. Backend contribution rules

The authoritative platform API and schema live under `Backend/`.

Before changing backend behaviour:
- inspect models, serializers, views/services, permissions, signals and tests;
- determine whether side effects are signal-driven;
- preserve server-side permissions;
- avoid leaking sensitive data in serializers/logs;
- maintain compatibility with both web and mobile clients;
- add tests for permissions and state transitions;
- run `python manage.py check --deploy` in CI-compatible configuration;
- run migration drift checks;
- run relevant backend journey tests.

## 10. Database and migration discipline

Django migrations are the primary schema source of truth.

Rules:
- every model schema change gets a migration;
- never edit an existing applied migration casually;
- never destroy Production data to make a release easier;
- consider backwards compatibility and deploy order;
- consider rollback before destructive or irreversible changes;
- preserve audit/history records unless retention policy explicitly permits deletion;
- do not assume Production database state from local SQLite behaviour.

## 11. Auth and authorisation

Auth/access-control work is RED.

Important invariants:
- server-side authorisation is authoritative;
- Client and Professional product roles are distinct from staff/admin groups;
- internal review mode is development-only and must remain unavailable under Production-safe settings;
- token/session changes require web/mobile compatibility review;
- permissions must be tested directly, not inferred from hidden buttons.

## 12. Marketplace/SabiPay rules

Marketplace and SabiPay state transitions are business-critical.

Do not introduce alternate status paths that bypass authoritative transitions. Payment, dispute, release/refund and work-state changes require explicit server-side validation and participant/role checks.

Never log payment secrets, verification documents or sensitive dispute evidence.

## 13. Realtime and notifications

Realtime delivery is not the source of truth. Authoritative records live in the backend.

Changes to Socket.io or notification delivery must preserve:
- authenticated socket access;
- recipient scoping;
- payload size limits;
- persisted history where applicable;
- graceful behaviour when realtime delivery is unavailable.

## 14. UI/UX and accessibility

Target WCAG 2.2 AA.

Minimum expectations:
- normal text contrast 4.5:1;
- non-text/UI contrast 3:1 where applicable;
- visible keyboard focus;
- keyboard-operable web interactions;
- accessible names for icon-only controls;
- no colour-only status communication;
- meaningful form labels/errors;
- responsive behaviour across mobile/tablet/desktop.

Do not claim exact Figma parity without runtime visual evidence.

## 15. Tests and CI

Current Platform CI is defined in `.github/workflows/phase-0-ci.yml`.

Do not disable, weaken or remove checks just to merge. If a check is blocked by infrastructure, document the blocker and preserve the previous trusted baseline.

See `docs/REGRESSION_TESTING.md` for the expected matrix.

## 16. Documentation requirements

Documentation is part of the deliverable.

Update relevant docs in the same PR when changing:
- architecture/service boundaries;
- routes/APIs/data model;
- auth/security;
- design system/navigation;
- marketplace/payment state;
- CI/release/deployment;
- environment configuration;
- critical user journeys.

Historical completion evidence under `Documentation/` should be preserved. Add current operational guidance under `docs/` rather than rewriting history.

## 17. Merge and post-merge verification

After merge:
- fetch exact `main` SHA;
- confirm the intended PR is included;
- verify required checks for that revision;
- verify deployment and deployed SHA when applicable;
- run safe smoke checks;
- keep the previous known-good revision available for rollback;
- only then advance the Rolling Green Baseline.

If post-merge verification fails, stop stacking further changes until fixed or safely reverted.
