# SabiWay Engineering Handbook

This directory is the **current engineering operating handbook** for SabiWay. It is written so that a new developer, new AI coding session, reviewer or maintainer can understand how to work safely without relying on previous chat history or undocumented assumptions.

> **Mandatory first step:** start with [`../AGENTS.md`](../AGENTS.md), then [`DEVELOPER-START-HERE.md`](DEVELOPER-START-HERE.md). Do not begin implementation from memory alone.

## 1. What belongs here

`docs/` contains current operational guidance: architecture, workflow, design-system rules, environments, CI/release policy, regression expectations, onboarding, troubleshooting, current risks and decision records.

`../Documentation/` contains historical project evidence such as phase completion reports, Figma-export matrices, deployment notes and controlled-user-testing readiness evidence.

Do not collapse the two directories into one by deleting history. Use `docs/` to explain how the repository is operated now; use `Documentation/` when historical implementation evidence matters.

## 2. Mandatory cold-start reading order

Read these in sequence before material work:

1. [`../AGENTS.md`](../AGENTS.md) — mandatory AI/developer bootstrap contract.
2. [`../README.md`](../README.md) — product and repository orientation.
3. [`DEVELOPER-START-HERE.md`](DEVELOPER-START-HERE.md) — exact readiness procedure.
4. [`../CONTRIBUTING.md`](../CONTRIBUTING.md) — contribution rules.
5. [`ARCHITECTURE.md`](ARCHITECTURE.md) — system/service boundaries.
6. [`PROJECT-MAP.md`](PROJECT-MAP.md) — repository structure and where to look first.
7. [`USER-JOURNEYS.md`](USER-JOURNEYS.md) — critical product/staff journeys and invariants.
8. [`DESIGN-SYSTEM.md`](DESIGN-SYSTEM.md) — UI/UX, responsive and accessibility rules.
9. [`ENVIRONMENTS.md`](ENVIRONMENTS.md) — local/preview/UAT/Production separation and environment flags.
10. [`CI-CD.md`](CI-CD.md) — release checks, deployment evidence and Rolling Green rules.
11. [`REGRESSION_TESTING.md`](REGRESSION_TESTING.md) — test matrix by risk and system.
12. [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) — cross-service diagnosis and common failure paths.
13. [`OPEN-ISSUES.md`](OPEN-ISSUES.md) — unresolved technical/release risks.
14. [`DECISIONS.md`](DECISIONS.md) — consequential engineering decisions and reasoning.
15. Relevant evidence under `../Documentation/` for the feature/phase you are touching.

## 3. Role-specific reading paths

### New AI development session
Read:
`AGENTS.md` → `DEVELOPER-START-HERE.md` → `PROJECT-MAP.md` → `ARCHITECTURE.md` → `USER-JOURNEYS.md` → `OPEN-ISSUES.md` → relevant source files.

Then produce the Repository Readiness Brief before accepting implementation.

### New frontend developer
Read:
`README.md` → `PROJECT-MAP.md` → `DESIGN-SYSTEM.md` → `USER-JOURNEYS.md` → `ENVIRONMENTS.md` → `REGRESSION_TESTING.md` → `../frontend/README.md`.

### New mobile developer
Read:
`README.md` → `PROJECT-MAP.md` → `DESIGN-SYSTEM.md` → `USER-JOURNEYS.md` → `ENVIRONMENTS.md` → `REGRESSION_TESTING.md` → `../mobile/README.md`.

### New backend/database developer
Read:
`ARCHITECTURE.md` → `PROJECT-MAP.md` → `USER-JOURNEYS.md` → `ENVIRONMENTS.md` → `REGRESSION_TESTING.md` → `../Backend/README.md` → relevant models/permissions/signals/tests.

### Realtime developer
Read:
`ARCHITECTURE.md` → `USER-JOURNEYS.md` messaging/notification sections → `ENVIRONMENTS.md` → `REGRESSION_TESTING.md` → `../ExpressJs/README.md`.

### Release/DevOps reviewer
Read:
`CI-CD.md` → `ENVIRONMENTS.md` → `OPEN-ISSUES.md` → `.github/workflows/phase-0-ci.yml` → deployment evidence under `Documentation/`.

### UI/UX reviewer
Read:
`DESIGN-SYSTEM.md` → Figma-export evidence under `../Documentation/` → relevant web/mobile components → `USER-JOURNEYS.md`.

### New contributor who is blocked
Read:
`ONBOARDING.md` → `TROUBLESHOOTING.md` → relevant service README.

## 4. Document catalogue

### Core operating documents
- [`DEVELOPER-START-HERE.md`](DEVELOPER-START-HERE.md) — exact bootstrap and readiness procedure.
- [`AI-SENIOR-DEVELOPER-STARTUP-PROMPT.md`](AI-SENIOR-DEVELOPER-STARTUP-PROMPT.md) — reusable prompt for a new AI coding chat.
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — service responsibilities, authority boundaries and integrations.
- [`PROJECT-MAP.md`](PROJECT-MAP.md) — repository map with important folders/files.
- [`USER-JOURNEYS.md`](USER-JOURNEYS.md) — end-to-end product flows and preservation invariants.
- [`DESIGN-SYSTEM.md`](DESIGN-SYSTEM.md) — shared design language, responsive behaviour and accessibility.
- [`ENVIRONMENTS.md`](ENVIRONMENTS.md) — environment separation, internal review mode and configuration safety.
- [`CI-CD.md`](CI-CD.md) — current CI jobs, Release Gate, Deployment Eligibility and Rolling Green advancement.
- [`REGRESSION_TESTING.md`](REGRESSION_TESTING.md) — test levels, scope matrix and evidence expectations.
- [`ONBOARDING.md`](ONBOARDING.md) — local setup and first-day developer workflow.
- [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) — diagnosis for auth/API/data/realtime/payment/mobile/Vercel/CI issues.
- [`OPEN-ISSUES.md`](OPEN-ISSUES.md) — P0/P1/P2 engineering issues and release blockers.
- [`DECISIONS.md`](DECISIONS.md) — append-only decision log.

### Service-specific operational docs
- [`../frontend/README.md`](../frontend/README.md) — current V2 web architecture, setup, design and testing rules.
- [`../mobile/README.md`](../mobile/README.md) — Android/iOS architecture, role navigation, Figma and build guidance.
- [`../Backend/README.md`](../Backend/README.md) — Django domain ownership, auth/data/payment/verification and migration rules.
- [`../ExpressJs/README.md`](../ExpressJs/README.md) — authenticated realtime delivery architecture and debugging.
- [`../WaitList/README.md`](../WaitList/README.md) — separate historical waitlist service.

### Root documents
- [`../AGENTS.md`](../AGENTS.md) — mandatory agent/developer rules.
- [`../CONTRIBUTING.md`](../CONTRIBUTING.md) — contribution and PR policy.
- [`../README.md`](../README.md) — product/repository entry point.
- [`../SECURITY.md`](../SECURITY.md) — security and vulnerability/engineering policy.
- [`../PORTS.md`](../PORTS.md) — local port reference.

## 5. Source-of-truth hierarchy

When information conflicts, use this order:

1. **Live repository/runtime evidence** for what exists now.
2. **Current source code and migrations** for implementation reality.
3. **Current `docs/` handbook and recent `DECISIONS.md`** for intended operating rules.
4. **Historical `Documentation/` evidence** for why/how a phase was delivered.
5. **Conversation memory or old branch content** only as context, never as authority.

If the current handbook is stale, update it in the same PR as the change or correction.

## 6. Documentation quality standard

A document is not considered useful merely because it exists. Current operational docs should answer:
- what this system/file is for;
- where the relevant code lives;
- who/what is authoritative;
- what must be preserved;
- what can safely change;
- what dependencies/integrations exist;
- how environments differ;
- what tests prove the behaviour;
- what common failure modes exist;
- what evidence is still missing;
- where to go next.

Avoid vague phrases such as “handle auth” or “manage payments” when the repository has a specific lifecycle or authority boundary that can be described.

## 7. Updating documentation

Update docs in the same PR when changing:
- architecture or service ownership;
- routes/API/data model;
- auth/authorisation/security;
- design system/navigation;
- marketplace/SabiPay state transitions;
- CI/release/deployment;
- environment variables or review/test flags;
- critical user journeys;
- known risks or accepted limitations.

For consequential decisions, append a dated entry to `DECISIONS.md`. For unresolved risk, update `OPEN-ISSUES.md`.

## 8. Historical evidence

Important historical evidence includes phase completion reports, Figma-export matrices, Vercel/Codespaces deployment notes and controlled-user-testing documents under `../Documentation/`.

Do not rewrite those documents to make the past look consistent with current architecture. Add current clarifications here and link back when needed.
