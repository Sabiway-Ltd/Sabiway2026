# Contributing to SabiWay

## Non-negotiable engineering model
SabiWay uses a Preservation-First Rolling Green Baseline. The baseline is the latest `main` revision that has passed every required check for its change scope and, when applicable, deployment verification. A merge by itself does not make a revision the baseline.

Before work, execute `AGENTS.md` and `docs/DEVELOPER-START-HERE.md`.

## Change workflow
1. Verify the current Rolling Green Baseline and exact `main` SHA.
2. Define success criteria and preservation boundaries.
3. Identify affected journeys and classify risk RED/AMBER/GREEN.
4. Create a focused branch from the verified baseline/main state.
5. Extend existing implementation where possible; avoid broad rewrites.
6. Add/update characterisation, regression and feature tests.
7. Update relevant documentation in the same PR.
8. Run scope-required checks; never weaken them to get green.
9. Merge only the exact verified head.
10. Verify resulting `main`, deployment when applicable and safe smoke checks before advancing the baseline.

## Preservation boundaries
Do not silently change auth, authorisation, access control, canonical APIs, persistence, migrations, payments, verification, moderation, navigation, shared layouts, realtime or notification contracts. Any intended change to these must be explicit in PR success criteria.

## Database and migration discipline
Django migrations are the backend schema source of truth. Never edit Production data destructively to make tests pass. Add migrations with model changes; run migration-drift checks. Backward compatibility and rollback must be considered for material schema changes.

## Security and secrets
Never commit credentials, tokens, real `.env` files or local databases. Treat auth, permissions, secrets, Production data and payment controls as RED. Server-side authorisation is authoritative; client visibility is never permission enforcement.

## UI/UX
Preserve the canonical SabiWay tokens and approved Figma-export hierarchy unless change is explicit. Meet WCAG 2.2 AA: required text contrast 4.5:1, UI/non-text 3:1, no colour-only status, visible keyboard focus, keyboard-operable interactions and accessible labels for icon-only controls.

## Release and rollback
Preview deployment is evidence, not approval. Production/promotion must follow required release checks. Every material release must identify a previous known-good revision suitable for rollback and verify the deployed revision matches the intended Git revision.

## Documentation policy
Documentation is part of the codebase. Changes to architecture, features, design system, data model, security, infrastructure, CI/CD, deployment or critical journeys must update the relevant docs in the same PR. Functional change with stale documentation is incomplete.
