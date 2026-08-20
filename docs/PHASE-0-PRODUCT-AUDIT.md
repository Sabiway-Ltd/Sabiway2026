# Phase 0 — Product, UX, Code & Architecture Truth Audit

Status: IN PROGRESS
Started: 2026-08-20
Programme: `docs/PRODUCT-REBUILD-MASTER-PLAYBOOK.md`
Repository: `Sabiway-Ltd/Sabiway2026`
Baseline reviewed: `main@ed53bf74191ff2e0d7da3e86973624160a5e0c51`
Working branch: `plan/product-rebuild-phase-0`

## 1. Phase objective

Establish a verified, repository-backed picture of what SabiWay is today before rebuilding it. Phase 0 must identify what works, what is incomplete, what is misleading, what is duplicated, what is structurally unsafe and what should be preserved.

This phase is not a visual redesign phase. It produces the evidence and decisions required for Phase 1 and Phase 2.

## 2. Phase 0 exit criteria

Phase 0 is complete only when the following are documented with evidence:

- route/screen inventory
- route access classification
- Client vs Professional journey mapping
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

## 3. Repository readiness brief

### Repository state
- Repository: `Sabiway-Ltd/Sabiway2026`
- Default branch: `main`
- Start SHA: `ed53bf74191ff2e0d7da3e86973624160a5e0c51`
- `main` is protected.
- Required branch-protection contexts observed at programme start: `backend-check`, `repository-hygiene`, `realtime-check`, `waitlist-syntax`.
- The repository handbook notes that aggregate Release Gate protection and exact deployment verification still require attention.

### Active programme branch
`plan/product-rebuild-phase-0`

### Overlapping work
The temporary frontend demo PR #64 was deliberately closed unmerged after the wider audit showed it would mask deeper route/auth/role issues.

### Risk level
Phase 0 itself is mostly analysis/documentation, but the subject matter spans RED areas: authentication, session boundaries, role access, deployment, security and future backend contracts.

### Preservation boundaries
Do not delete or broadly rewrite working code during Phase 0.
Do not weaken backend auth or permissions.
Do not erase historical `Documentation/` evidence.
Do not assume old chat claims are authoritative.
Do not treat empty API responses as evidence that product logic is complete.

## 4. Confirmed initial findings

These findings are already supported by direct source inspection and become the first entries in the audit backlog.

### F0-001 — Public/protected route boundary is structurally unclear
Severity: P1
Decision: REWORK

The authenticated `AppShell` redirects to `/login` when no hydrated user and no `localStorage.access` value exist. Therefore any route wrapped by `AppShell` becomes effectively protected, regardless of whether the product intent is public or guest-capable.

Impact:
- creates the reported “everything sends me to login” experience when shell usage is wrong;
- couples route access to a presentation component;
- makes accidental protection easy;
- produces brittle behaviour before real backend/session integration.

Required Phase 1 outcome:
- explicit route access policy independent of visual shell choice;
- public, guest-capable, authenticated Client, authenticated Professional and staff-only classifications.

### F0-002 — Browser storage is being used as an authentication architecture signal
Severity: P1
Decision: REPLACE for authority; temporary compatibility only

`MarketplaceShell` decides whether to render `AppShell` or `PublicShell` using only `Boolean(localStorage.getItem("access"))`.

Impact:
- stale/invalid/expired values can create false authenticated presentation;
- server rendering cannot reliably know the same state;
- UI shell and auth/session validity are conflated;
- future token refresh/expiry behaviour will be difficult to reason about.

Required Phase 1/20 outcome:
- central session abstraction;
- route access contract;
- server-authoritative auth when backend is integrated;
- UI shell selection based on resolved user/session state rather than arbitrary storage presence.

### F0-003 — Marketplace silently masks backend unavailability as empty content
Severity: P1
Decision: REWORK

Marketplace server data fetching catches failures and returns empty listings/jobs/categories.

Impact:
- users can interpret infrastructure failure as “no results”;
- debugging and user testing become misleading;
- empty state cannot distinguish genuine zero supply from service failure.

Required outcome:
- explicit data-state model: loading, genuine empty, partial, degraded, unavailable, retry;
- demo fixture adapter before backend availability;
- backend error observability after integration.

### F0-004 — Client and Professional login experiences are not meaningfully separated
Severity: P1 product/UX
Decision: REPLACE experience; preserve shared identity concept

Current login is generic. Current signup presents Client/Professional as a radio selection inside one shared form.

Impact:
- weak role orientation;
- poor expectation setting;
- no role-specific value proposition;
- difficult to build distinct onboarding and activation funnels;
- contradicts current design-system guidance that roles require different task hierarchy.

Required Phase 4–6 outcome:
- explicit Client and Professional entry journeys;
- role-specific copy, onboarding, activation and home destinations;
- shared backend account model where technically appropriate.

### F0-005 — Current authenticated navigation is generic across Client and Professional
Severity: P1 product/IA
Decision: REPLACE information architecture

Current `AppShell` navigation uses one shared set:
Home, Market, Messages, SabiForum, Profile.

Current repository design rules already specify role-oriented navigation concepts and explicitly state that Client and Professional should not be forced into an identical navigation hierarchy.

Impact:
- Professional earnings/services/opportunities are not first-class;
- Client jobs/history/discovery are not first-class;
- home must compensate for missing navigation structure;
- product feels generic rather than role-aware.

Required Phase 1 outcome:
- separate Client and Professional IA/navigation matrices for mobile, tablet and desktop.

### F0-006 — Current internal Home is underpowered for a mature marketplace
Severity: P1 product
Decision: REWORK/REPLACE after IA

Current Home is mainly a welcome hero, three quick actions and two generic cards.

Impact:
- limited personalisation;
- no meaningful activity/status overview;
- insufficient distinction between Client and Professional;
- poor support for returning-user jobs-to-be-done.

Required Phase 8/9 outcome:
- Client Home oriented around discovery, active jobs/conversations/bookings/status;
- Professional Home oriented around opportunities, leads, services, bookings, verification, earnings/reputation.

### F0-007 — Public homepage over-explains architecture before proving immediate value
Severity: P1 growth/UX
Decision: REWORK

The current homepage spends substantial first-screen/early-page attention explaining service location, account location, cross-country behaviour, markets, payment/currency logic and multiple role concepts.

Impact:
- cognitive load before activation;
- value proposition competes with architecture explanation;
- search/discovery does not dominate strongly enough;
- first-time users may not know the simplest next action.

Required Phase 3 outcome:
- immediate value statement;
- dominant service/location discovery interaction;
- concise trust proof;
- progressive explanation later in the page;
- distinct Client and Professional conversion paths.

### F0-008 — Public and internal shells do not share a coherent transition model
Severity: P1 architecture/UX
Decision: REWORK

Public and authenticated navigation are separate compositions with no explicit visitor -> Client -> Professional transition contract.

Required outcome:
- documented state transition and route ownership;
- preserved browsing context when authentication is requested;
- return-to-intent after login/signup;
- role-aware navigation after activation.

### F0-009 — Temporary review mode is backend-oriented while current practical need is frontend product inspection
Severity: P2 engineering/product testing
Decision: IMPROVE architecture, do not weaken existing backend guard

Existing guarded internal review mode is correctly designed as a development backend facility. However the current rebuild occurs before a usable deployed backend is available.

Required Phase 7 outcome:
- separate frontend demo adapter/fixture system;
- `Enter Client Demo` and `Enter Professional Demo`;
- realistic deterministic state;
- obvious demo labelling;
- no confusion with production authentication;
- removable without affecting real auth implementation.

### F0-010 — Existing documentation contains stale release risk facts
Severity: P2 governance
Decision: IMPROVE

`docs/OPEN-ISSUES.md` includes bootstrap SHA/release statements from an earlier revision. The document correctly warns that issues are point-in-time evidence, but the rebuild must refresh release risks against current repository state rather than repeating stale SHAs.

## 5. Benchmark principles captured for research

Phase 0 benchmark research will focus on product patterns, not visual imitation.

Current 2026 marketplace signals include:
- faster discovery of relevant talent/opportunities;
- simplified navigation;
- personalised/relevant homepage content;
- clearer, more interpretable reputation signals;
- contextual guidance inside consequential flows;
- stronger fraud/trust controls.

Benchmark set to study:
- Upwork — two-sided marketplace, jobs/talent, trust/reputation
- Airbnb — search-first marketplace, location, trust, booking
- Facebook — large-scale social graph/feed/navigation patterns
- Instagram — content hierarchy, creation/engagement, mobile interaction discipline
- X — feed/discovery/real-time interaction patterns
- LinkedIn — dual identity/content/opportunity/professional trust patterns
- Fiverr/Taskrabbit where relevant — service marketplace listing and transaction UX

Each benchmark observation must answer:
1. What user problem is the pattern solving?
2. Why is it appropriate or inappropriate for SabiWay?
3. Which SabiWay role/journey would benefit?
4. What would be the simpler local-market adaptation?

## 6. Phase 0 audit workstreams

### W0.1 Route and screen inventory
For every `frontend/app` route and material mobile screen capture:
- path/name
- public/protected
- role
- shell/layout
- primary job-to-be-done
- CTA destinations
- backend dependency
- loading/empty/error state
- status: working/incomplete/dead/duplicate
- decision: KEEP/IMPROVE/REWORK/REPLACE/REMOVE

### W0.2 Navigation and routing audit
Map every primary/secondary navigation item and high-value CTA.
Test:
- destination exists
- destination matches intent
- login is required only when justified
- `next`/return-to-intent survives auth
- Client/Professional role isolation
- browser back/forward behaviour
- mobile menu and desktop nav parity

### W0.3 Authentication/session audit
Inspect:
- login/signup/recovery/logout
- auth store
- cookies/localStorage
- route guards
- callback handling
- review mode
- session hydration
- stale/expired token behaviour
- role resolution

### W0.4 Client journey audit
Map:
public discovery -> Client signup/login -> onboarding -> home -> search -> profile -> contact/job -> messages -> booking -> SabiPay -> history/review/support.

### W0.5 Professional journey audit
Map:
public value proposition -> Professional signup/login -> onboarding -> profile/service -> verification -> opportunity -> proposal -> messages -> booking -> work -> earnings/reputation/support.

### W0.6 Public marketing/growth audit
Review homepage and public pages for:
- clarity
- differentiation
- first action
- trust
- role conversion
- social proof/evidence
- SEO/search intent
- information density
- consistency
- dead CTAs

### W0.7 Design-system audit
Compare:
`design-system/` -> `docs/DESIGN-SYSTEM.md` -> Figma evidence -> current web -> current mobile.

Measure:
- hard-coded visual values
- token divergence
- inconsistent components
- duplicate button/form/card patterns
- hierarchy inconsistency
- logo misuse
- excessive generic cards

### W0.8 Accessibility audit
Baseline:
- landmarks/headings
- keyboard/focus
- forms/errors
- semantic links/buttons
- contrast
- touch target
- reflow/zoom
- reduced motion
- status without colour dependence
- screen-reader naming

### W0.9 Responsive audit
Representative widths:
320, 360, 375, 390, 430, 768, 1024, 1280, 1366, 1440+.

Record:
- overflow
- navigation failure
- wrapping
- CTA visibility
- search/filter usability
- dense cards/forms

### W0.10 Content/UX writing audit
Review:
- terminology consistency
- Client vs Professional labels
- vague CTAs
- error messages
- trust/payment language
- empty states
- onboarding instructions
- Nigerian/UK/global clarity without over-explanation

### W0.11 Backend/API dependency audit
For every frontend feature record:
- endpoint
- whether currently available
- failure mode
- mock/demo requirement
- authoritative state owner
- future integration test requirement

### W0.12 QA and automation audit
Map current CI/checks against:
- route smoke tests
- browser E2E
- role journeys
- auth boundaries
- responsive visual regression
- accessibility automation
- backend contract testing

### W0.13 Security/privacy audit
Review:
- auth bypass risk
- token storage
- sensitive data exposure
- role separation
- verification/payment surfaces
- logging/analytics payload risk
- demo data isolation

### W0.14 Analytics/growth audit
Define current/required events for:
- homepage search
- Client intent
- Professional intent
- signup started/completed
- activation milestones
- search no-results
- profile viewed
- message/job/booking initiated
- funnel abandonment

## 7. Initial decision matrix

| Area | Current decision | Reason |
|---|---|---|
| Repository governance/docs | KEEP + refresh | Strong preservation/release rules already exist |
| Backend permission authority | KEEP | Correct long-term architecture |
| Existing backend review guard | KEEP | Security boundary is appropriate |
| `PublicShell` concept | IMPROVE | Correct separation idea; needs IA integration |
| `AppShell` generic navigation | REPLACE | Does not model role-specific products |
| `AppShell` redirect logic | REWORK | Access policy belongs in central routing/session architecture |
| Marketplace storage auth check | REPLACE | `localStorage` presence is not session authority |
| Marketplace empty-on-error behaviour | REWORK | Infrastructure failure is hidden as empty data |
| Generic login page | REPLACE UX | Needs role-aware entry |
| Signup role radio inside generic form | REWORK/REPLACE UX | Role is a product journey, not merely a field |
| Current public homepage | REWORK | Too much explanation; needs search/value hierarchy |
| Current Client/Professional shared Home | REPLACE hierarchy | Roles need distinct operating surfaces |
| Shared design tokens | KEEP + audit | Correct foundation |
| Existing Figma evidence | KEEP as evidence | Use as input, not unquestioned authority |
| Frontend-only demo need | BUILD in Phase 7 | Required for review before backend readiness |

## 8. Phase 0 defect priorities — initial

### P1
- route access/login-loop architecture
- role-specific navigation missing
- role-specific login/onboarding missing
- backend unavailability masked as empty marketplace
- generic internal home architecture
- homepage value/discovery hierarchy
- auth/session architecture coupled to local storage/presentation shell

### P2
- temporary demo capability mismatch
- stale release-risk documentation
- design token/hard-coded visual divergence audit pending
- browser/device E2E gap already documented
- analytics/funnel instrumentation audit pending

P0 remains reserved for proven security, data-loss, financial or production-blocking critical risk.

## 9. Phase 0 next execution order

1. Complete frontend route inventory.
2. Map every public CTA and its destination.
3. Build public/protected/Client/Professional/staff route matrix.
4. Audit auth/session code paths.
5. Audit Client and Professional navigation/journeys.
6. Compare current implementation against Figma/design-system evidence.
7. Audit backend dependencies and demo needs.
8. Run responsive/accessibility/content review.
9. Map QA/security/analytics gaps.
10. Finalise decision matrix and Phase 1 backlog.

## 10. Phase 0 success statement

Phase 0 succeeds when a new team member can answer, from repository evidence alone:

- What does SabiWay currently do?
- Which screens/routes exist?
- Which are public and which require identity?
- How do Client and Professional experiences differ today?
- Where are they incorrectly identical?
- Why are users being sent to login?
- Which features are blocked by missing backend state?
- What should be preserved?
- What should be rebuilt?
- What is the safest implementation order?
- What evidence is required before each phase can merge?

Until those answers are complete, Phase 1 implementation should not begin.
