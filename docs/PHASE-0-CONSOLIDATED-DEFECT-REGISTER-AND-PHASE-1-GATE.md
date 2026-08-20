# Phase 0 — Consolidated Defect Register & Phase 1 Entry Gate

Status: PHASE 0 COMPLETE — READY FOR PHASE 1 PLANNING/IMPLEMENTATION
Date: 2026-08-20
Programme: `docs/PRODUCT-REBUILD-MASTER-PLAYBOOK.md`
Branch: `plan/product-rebuild-phase-0`

## 1. Phase 0 conclusion

Phase 0 has established sufficient repository-backed evidence to begin Phase 1 safely.

The main conclusion is that SabiWay does **not** need a clean-slate rewrite. The repository already contains substantial domain implementation, governance, backend rules, design tokens, Figma evidence and product surfaces. The rebuild should preserve those strong foundations while replacing the broken information architecture, route/session model, role experience and inconsistent UI execution.

The current product's most visible failures are caused by architecture and journey contradictions, not merely styling defects.

## 2. Consolidated P0/P1/P2 register

### P0

No confirmed current P0 requiring emergency containment was proven during this Phase 0 source audit.

P0 remains reserved for proven production security compromise, data loss, unauthorised financial mutation, credential exposure or other critical incident.

### P1 — must be addressed in the rebuild before controlled user testing

#### P1-001 — Intended public routes are globally blocked
- middleware whitelist excludes many designed public/discovery pages;
- direct cause of the reported widespread login redirects.

Decision: REWORK route policy in Phase 1.

#### P1-002 — Access/session decisions are duplicated
Current authority/presentation logic is split across:
- middleware cookie;
- AppShell localStorage/Zustand hydration;
- MarketplaceShell localStorage check;
- role conditions;
- API token handling.

Decision: REPLACE with explicit route/session architecture.

#### P1-003 — Client and Professional IA are incorrectly identical
Current application navigation uses the same Home/Market/Messages/SabiForum/Profile structure for both roles.

Decision: REPLACE role IA.

#### P1-004 — Client and Professional Home hierarchy is too generic
Role differences are reduced to a few quick-action cards instead of distinct operating surfaces.

Decision: REPLACE hierarchy in Phases 8/9.

#### P1-005 — Professional acquisition loses Professional intent
Professional CTA lands in generic signup, whose initial role is Client.

Decision: REWORK role-aware acquisition/auth flow.

#### P1-006 — Return-to-intent is inconsistent/lost
Middleware redirects to login without preserving original destination, even though login supports `next`.

Decision: FIX in Phase 1/4.

#### P1-007 — Auth destinations conflict
Different flows use `/community`, `/home` or other fixed destinations after authentication.

Decision: centralise post-auth routing by intent and role.

#### P1-008 — Session state can disagree after token refresh
Axios refresh updates localStorage access token but not middleware cookie.

Decision: replace dual-authority session model.

#### P1-009 — Active logout does not revoke backend refresh/session state
Browser state is cleared, but available backend logout helper is not used by active store.

Decision: rework lifecycle when backend integration becomes authoritative.

#### P1-010 — Marketplace can hide backend failure as empty data
Initial fetch failure returns empty arrays.

Decision: explicit degraded/unavailable/empty state model.

#### P1-011 — Frontend lacks deterministic backend-independent review state
Existing internal review mode depends on backend development flags.

Decision: build isolated Client/Professional demo fixture adapters.

#### P1-012 — Design token system is available but bypassed
Many pages hard-code brand colours, radii, borders and shadows.

Decision: enforce semantic design-system usage in Phase 2.

#### P1-013 — Current implementation diverges from documented/Figma role navigation
Repository evidence already specifies role-specific mobile hierarchy.

Decision: Phase 1 must reconcile implementation to approved target IA, not historical source state.

#### P1-014 — Accessibility runtime evidence is incomplete
Keyboard order, dialogs, contrast, reflow, screen-reader behaviour and transactional status semantics are not certified.

Decision: source-level improvements throughout; full Phase 18 runtime gate.

#### P1-015 — Field-level errors are not consistently associated
Global toast/error handling is common.

Decision: standardised accessible form/error system.

#### P1-016 — No browser E2E framework covers real routing/journeys
Current frontend scripts cover type-check, lint and build only.

Decision: add browser E2E, preferably Playwright unless a stronger technical reason emerges.

#### P1-017 — Existing static journey checks cannot detect navigation/login regressions
They should remain, but runtime journey tests are required.

Decision: supplement, not replace.

#### P1-018 — Analytics cannot measure core marketplace funnels
Current measurement is mainly route-level screen views.

Decision: build governed event taxonomy and funnel instrumentation.

#### P1-019 — Analytics accepts unrestricted property objects
Potential accidental PII/sensitive data capture risk.

Decision: event/property contracts and allowlists.

#### P1-020 — Homepage hierarchy over-explains platform architecture
Discovery/value action should dominate before location/payment complexity.

Decision: rework in Phase 3.

#### P1-021 — Product content can contradict actual behaviour
Examples include public-browsing promises while routes are blocked.

Decision: bind key content claims to testable product contracts.

#### P1-022 — Security/role boundary must not depend on frontend role state
Frontend may guide UX, but backend remains permission authority.

Decision: explicit route UX plus server-side enforcement.

### P2 — address deliberately, not as blockers for Phase 1 start

- stale/historical completion wording in old evidence;
- old branch/PR accumulation;
- official logo replacement in AppShell;
- excessive rounded-card visual language;
- visual regression automation;
- performance budgets;
- cross-browser CI breadth;
- public social/profile guest visibility policy;
- long-term analytics retention/consent details;
- detailed localisation/internationalisation policy.

## 3. Canonical KEEP / IMPROVE / REWORK / REPLACE / REMOVE matrix

### KEEP
- repository preservation/release governance;
- backend business/permission authority;
- backend domain test suite;
- guarded backend internal-review mode;
- shared design token source;
- global focus/touch/reduced-motion primitives;
- official Figma/export evidence as historical design input;
- major domain implementations where business logic is sound: marketplace, messaging, verification, SabiPay, community/profile components subject to audit;
- PublicShell concept;
- responsive desktop/mobile shell concept;
- best-effort non-blocking analytics transport.

### IMPROVE
- PublicShell navigation/content;
- marketplace UI/data states;
- messaging/community integration;
- verification and payment presentation;
- responsive layouts;
- existing accessible labels/focus behaviour;
- CI/release gates;
- auth support screens;
- public information pages;
- analytics transport/governance.

### REWORK
- homepage;
- route access taxonomy;
- middleware;
- auth redirect/return intent;
- signup/login role journeys;
- marketplace shell selection;
- API/session adapters;
- forms/error handling;
- design-system consumption;
- content hierarchy;
- tablet layouts;
- demo/review architecture.

### REPLACE
- generic Client/Professional application IA;
- shared generic Home hierarchy;
- browser-storage-presence as authentication authority;
- temporary `SW` application brand mark;
- generic role-neutral conversion flow;
- silent empty-on-backend-failure behaviour.

### REMOVE
Only after evidence proves duplication/dead code. No broad deletion is authorised by Phase 0.

## 4. Approved target route taxonomy for Phase 1

Every web route must be assigned exactly one access class:

1. PUBLIC
2. GUEST_CAPABLE
3. AUTHENTICATED_SHARED
4. CLIENT_ONLY
5. PROFESSIONAL_ONLY
6. STAFF_ONLY
7. PARTICIPANT/OBJECT_SCOPED

The visual shell must never be the security/access authority.

## 5. Approved role IA direction

### Client operating environment
Primary goals:
- discover help;
- manage requests/jobs;
- manage conversations;
- manage bookings/history/payment state;
- participate in community;
- manage profile/trust.

Target primary destinations:
- Home
- Find Services
- My Jobs
- Messages/contextual inbox
- History/Bookings
- SabiForum
- Profile

Exact mobile bottom-nav allocation must be finalised in Phase 1 against Figma evidence and usability constraints.

### Professional operating environment
Primary goals:
- discover/respond to work;
- manage own services;
- manage leads/proposals;
- manage conversations/work;
- manage earnings;
- manage trust/verification/reputation;
- participate in community.

Target primary destinations:
- Home
- Opportunities/My Jobs
- My Services
- Leads/Proposals
- Messages/contextual inbox
- Work/Bookings
- Earnings
- SabiForum
- Profile

Exact mobile bottom-nav allocation must be finalised in Phase 1.

## 6. Phase 1 implementation scope

Phase 1 is **Information Architecture & Access Model**, not a broad visual redesign.

Phase 1 must deliver:

1. canonical route registry/access taxonomy;
2. public/guest/authenticated/role/staff/participant route matrix;
3. middleware rewrite aligned to that registry;
4. safe `next`/return-to-intent model;
5. Client navigation configuration;
6. Professional navigation configuration;
7. shared vs role-specific destination policy;
8. post-auth destination resolver;
9. session abstraction boundary (even if backend remains unavailable for full production auth);
10. browser E2E routing tests;
11. no weakening of backend permission authority.

## 7. Phase 1 acceptance criteria

Phase 1 cannot complete until all of the following are true:

### Public/guest access
- intended public pages load without identity;
- guest marketplace discovery works without login where product policy allows;
- protected actions request auth only at the moment required;
- public content no longer contradicts route behaviour.

### Role experience
- Client and Professional primary navigation are distinct;
- route definitions identify role ownership;
- role-incompatible destinations are absent or denied appropriately;
- shared destinations are deliberately shared, not accidentally generic.

### Authentication intent
- `next` preserves safe internal destination;
- open redirects are blocked;
- Client/Professional acquisition intent survives login/signup;
- post-auth destination is resolved consistently.

### Architecture
- shell selection does not determine security policy;
- one route policy source is used by middleware/navigation/tests where practical;
- session access is abstracted away from arbitrary direct localStorage checks in new routing code.

### QA
Browser tests prove at minimum:
1. homepage -> services stays public;
2. homepage -> locations stays public;
3. homepage search -> marketplace stays guest-capable;
4. protected Client action -> login with preserved return intent;
5. Professional CTA preserves Professional role intent;
6. Client and Professional navigation differ;
7. role-restricted destination behaves correctly;
8. unsafe `next` does not redirect externally.

### Security
- backend permissions remain authoritative;
- no production demo bypass introduced;
- no role elevation from URL/localStorage state;
- no sensitive data included in routing analytics.

## 8. Phase 1 non-goals

Do not use Phase 1 to:
- redesign every screen visually;
- rewrite marketplace business logic;
- implement SabiPay changes;
- rebuild messaging;
- delete legacy code broadly;
- claim complete WCAG certification;
- claim backend authentication is production-ready before backend integration phase.

## 9. Phase 0 evidence set

Canonical Phase 0 documents now include:
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
- this consolidated register.

## 10. Exit decision

**Phase 0: COMPLETE.**

There is now enough verified evidence to begin Phase 1 without guessing at the primary failure modes or prematurely rebuilding working domains.

Next action:
Create a new focused Phase 1 implementation branch from the current approved baseline, preserve this audit branch/PR as programme evidence, and implement Information Architecture & Access Model in small testable slices.
