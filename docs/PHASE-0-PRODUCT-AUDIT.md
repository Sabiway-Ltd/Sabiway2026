# Phase 0 — Product, UX, Code & Architecture Truth Audit

Status: COMPLETE
Started: 2026-08-20
Completed: 2026-08-20
Programme: `docs/PRODUCT-REBUILD-MASTER-PLAYBOOK.md`
Repository: `Sabiway-Ltd/Sabiway2026`
Baseline reviewed: `main@ed53bf74191ff2e0d7da3e86973624160a5e0c51`
Working branch: `plan/product-rebuild-phase-0`

## 1. Phase objective

Establish a verified, repository-backed picture of what SabiWay is today before rebuilding it. Phase 0 identifies what works, what is incomplete, what is misleading, what is duplicated, what is structurally unsafe and what should be preserved.

Phase 0 is now complete. The authoritative exit decision, consolidated defect register and Phase 1 gate are recorded in:

`docs/PHASE-0-CONSOLIDATED-DEFECT-REGISTER-AND-PHASE-1-GATE.md`

## 2. Exit criteria result

Completed evidence now covers:

- route/screen inventory
- route access classification
- Client vs Professional journey/IA mapping
- public vs protected boundary audit
- current auth/session behaviour
- backend/API dependency map
- navigation architecture audit
- design-system/Figma divergence
- responsive/accessibility baseline
- content/UX writing baseline
- product analytics baseline
- security/privacy baseline
- QA/test coverage baseline
- technical debt and risk register
- KEEP / IMPROVE / REWORK / REPLACE / REMOVE matrix
- prioritised P0/P1/P2 product defect backlog
- Phase 1 inputs and acceptance criteria

## 3. Core findings

### F0-001 — Public/protected route boundary is structurally wrong
Severity: P1
Decision: REWORK

`frontend/middleware.ts` uses a small public whitelist, so many pages designed as public discovery/marketing surfaces redirect to `/login` before they can render.

This is the strongest root-cause evidence for the reported “everything sends me to login” behaviour.

### F0-002 — Route/session authority is duplicated
Severity: P1/RED architecture
Decision: REPLACE authoritative model

Access/session decisions are distributed across middleware cookie state, `AppShell`, `MarketplaceShell`, localStorage, Zustand and API clients.

### F0-003 — Marketplace can mask backend failure as empty content
Severity: P1
Decision: REWORK

Initial marketplace fetch failure can return empty arrays, making infrastructure failure look like legitimate zero supply.

### F0-004 — Client and Professional authentication journeys are not meaningfully separated
Severity: P1 product/UX
Decision: REPLACE experience; preserve shared account concept

### F0-005 — Current authenticated navigation is generic across Client and Professional
Severity: P1 product/IA
Decision: REPLACE information architecture

### F0-006 — Current internal Home is underpowered for a mature marketplace
Severity: P1 product
Decision: REPLACE role hierarchy

### F0-007 — Public homepage over-explains architecture before proving immediate value
Severity: P1 growth/UX
Decision: REWORK

### F0-008 — Public and internal shells do not share a coherent transition model
Severity: P1 architecture/UX
Decision: REWORK

### F0-009 — Temporary review need is different from production/backend review authentication
Severity: P1 rebuild enablement
Decision: BUILD isolated deterministic demo adapters later

### F0-010 — Historical implementation/completion claims require revalidation
Severity: P2 governance
Decision: REFRESH rather than delete historical evidence

### F0-011 — Professional acquisition loses role intent
Severity: P1 growth/UX
Decision: REWORK

Professional CTA lands in generic signup whose initial role is Client.

### F0-012 — Return-to-intent is inconsistent
Severity: P1
Decision: REWORK

Middleware drops original destination while login itself supports `next`.

### F0-013 — Token refresh/session lifecycle is fragmented
Severity: P1/RED architecture
Decision: REWORK

Axios refresh exists, but refresh updates localStorage access state without updating the middleware cookie. Raw `fetch()` paths do not share the same interceptor behaviour.

### F0-014 — Design-system implementation diverges from its own rules
Severity: P1
Decision: KEEP foundation + REWORK usage

Canonical tokens and accessibility primitives exist, but many components hard-code colours/radii/shadows and current role navigation contradicts documented/Figma intent.

### F0-015 — Accessibility intent exists without runtime certification
Severity: P1 quality
Decision: KEEP primitives + VERIFY/REWORK

### F0-016 — Frontend browser E2E is missing
Severity: P1 QA
Decision: BUILD

Type-check, lint and build cannot detect real routing/click/session regressions.

### F0-017 — Product analytics is too thin for marketplace optimisation
Severity: P1 product/growth
Decision: BUILD governed funnel instrumentation

### F0-018 — Analytics property governance is required
Severity: P1 privacy
Decision: BUILD contracts/allowlists

## 4. Phase 0 decision principles

### KEEP
Strong governance, backend permission authority, backend tests, canonical design tokens, global accessibility primitives, guarded backend review mode, useful domain implementations and historical design evidence.

### IMPROVE
Public shell, domain presentations, responsive layouts, accessible controls, CI, support pages and measurement transport.

### REWORK
Homepage, middleware/access policy, auth intent, route transitions, session adapters, marketplace data states, forms/errors, design-system usage and demo architecture.

### REPLACE
Generic Client/Professional IA, generic shared Home hierarchy, browser-storage-presence as auth authority, temporary `SW` app branding, generic role-neutral conversion flow and silent empty-on-infrastructure-failure behaviour.

### REMOVE
Only after evidence proves a component/path is genuinely duplicate or dead. No broad deletion was authorised in Phase 0.

## 5. Approved Phase 1 direction

Phase 1 is **Information Architecture & Access Model**.

It must deliver:

1. canonical route registry/access taxonomy;
2. PUBLIC / GUEST_CAPABLE / AUTHENTICATED_SHARED / CLIENT_ONLY / PROFESSIONAL_ONLY / STAFF_ONLY / PARTICIPANT_SCOPED classifications;
3. middleware aligned with that registry;
4. safe return-to-intent handling;
5. distinct Client navigation;
6. distinct Professional navigation;
7. consistent post-auth routing;
8. session abstraction boundary;
9. browser E2E tests for route/access behaviour;
10. preserved backend permission authority.

## 6. Phase 0 evidence set

- `PRODUCT-REBUILD-MASTER-PLAYBOOK.md`
- `PRODUCT-REBUILD-NEW-CHAT-HANDOFF.md`
- `PHASE-0-PRODUCT-AUDIT.md`
- `PHASE-0-ROUTE-INVENTORY.md`
- `PHASE-0-CTA-AND-FUNNEL-AUDIT.md`
- `PHASE-0-AUTH-SESSION-AUDIT.md`
- `PHASE-0-ROLE-IA-AUDIT.md`
- `PHASE-0-BACKEND-DEPENDENCY-AUDIT.md`
- `PHASE-0-DESIGN-FIGMA-DIVERGENCE-AUDIT.md`
- `PHASE-0-RESPONSIVE-ACCESSIBILITY-AUDIT.md`
- `PHASE-0-CONTENT-QA-AUDIT.md`
- `PHASE-0-SECURITY-PRIVACY-ANALYTICS-AUDIT.md`
- `PHASE-0-CONSOLIDATED-DEFECT-REGISTER-AND-PHASE-1-GATE.md`

## 7. Exit decision

**Phase 0 COMPLETE.**

There is sufficient verified repository evidence to begin Phase 1 without guessing at the main failure modes or unnecessarily rewriting working domain logic.
