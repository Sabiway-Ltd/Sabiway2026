# SabiWay V2 — Product Rebuild Master Playbook

Status: CANONICAL REBUILD PROGRAMME
Created: 2026-08-20
Repository: `Sabiway-Ltd/Sabiway2026`
Base revision at programme start: `ed53bf74191ff2e0d7da3e86973624160a5e0c51`
Programme branch: `plan/product-rebuild-phase-0`

## 0. Why this playbook exists

SabiWay has a substantial amount of useful implementation, architecture, design evidence and historical work, but the current product experience has accumulated structural inconsistencies. The correct response is not a cosmetic redesign or isolated bug fixing. The product needs a preservation-first, evidence-led rebuild that separates what is valuable from what must be reworked.

This playbook is the canonical continuation document for future developers, designers and AI sessions. A new chat must be able to continue from this file and the repository without needing previous conversation history.

The target is not to copy Facebook, Instagram, X, Airbnb, Upwork or any other product visually. The target is the level of product discipline expected from mature consumer marketplaces and social products: clear information architecture, fast orientation, obvious primary actions, reliable navigation, progressive disclosure, role-aware personalisation, strong trust signals, complete state handling, performance, accessibility, security and measurable user outcomes.

## 1. Operating roles

Every rebuild phase must be reviewed through the combined responsibilities of:

- Senior Product Manager
- Senior Product Designer
- Senior Design Thinking Lead
- Senior UX Researcher
- Senior UX Strategist
- Senior UI/UX Designer
- Senior Design Systems Designer
- Senior Accessibility Designer
- Senior Software Architect
- Senior Solutions Architect
- Senior Full-Stack Software Engineer
- Senior Technical Lead
- Senior QA Engineer
- Senior Test Automation Engineer
- Senior Content Designer
- Senior UX Writer
- Senior Growth Lead
- Senior Product Analytics Lead
- Senior Security & Privacy Engineer

No phase is complete because the code compiles or because a screen looks attractive. Product, user, design, technical, accessibility, data, privacy, security and quality evidence must align.

## 2. Product principles

### 2.1 Immediate usefulness
A first-time user should understand what SabiWay enables and what to do next within seconds.

### 2.2 Role clarity
Client and Professional are different products built on shared infrastructure. They may share identity, backend services and design-system primitives, but they must not be forced into the same information architecture or home hierarchy.

### 2.3 Public discovery before authentication
Users should be able to understand SabiWay, browse appropriate marketplace/community content and assess value before being forced to authenticate. Authentication is required only when identity, personalisation, ownership, messaging, booking, payments, posting or another protected action genuinely requires it.

### 2.4 Progressive commitment
Do not ask users for more information or commitment than needed for the current task. Discovery should lead naturally to account creation when the user reaches a meaningful action.

### 2.5 Trust is contextual
Verification badges alone are insufficient. Trust should be explained through identity, reviews, activity, transaction history, service clarity, responsiveness, policies and transparent status.

### 2.6 State completeness
Every material feature must define default, loading, empty, partial, error, retry, success, offline/slow-network, expired-session, permission-denied and long-content states where relevant.

### 2.7 Responsive by design
Web is not stretched mobile. Mobile is not a compressed desktop. The product hierarchy stays consistent while layouts adapt to device context.

### 2.8 Accessibility by default
WCAG 2.2 AA is an acceptance requirement, not a later remediation phase.

### 2.9 Backend authority
When the real backend is connected, identity, permissions, state transitions, payments, verification and canonical business data remain server-authoritative.

### 2.10 No hidden architectural shortcuts
Temporary demo/review mechanisms must be explicit, isolated and removable. They must never become accidental production authentication or permission controls.

## 3. Core product architecture

SabiWay should be modelled as four clearly separated experience layers.

### A. Public SabiWay
Accessible without login where appropriate:

- Homepage
- Service discovery
- Categories
- Locations
- Public Professional profiles
- Public service/listing details
- SabiForum public discovery where policy permits
- How SabiWay works
- For Clients
- For Professionals
- Trust & Safety
- SabiPay explanation
- Fees
- Help/legal/company content

### B. Client SabiWay
Authenticated Client workspace:

- Personalised Client Home
- Search/discovery continuation
- Saved/favourite Professionals/services
- Post/manage jobs
- Proposals/responses
- Messages
- Bookings/scheduling
- SabiPay/payment status
- Transaction/history
- Notifications
- SabiForum participation
- Support
- Client profile/settings

### C. Professional SabiWay
Authenticated Professional workspace:

- Personalised Professional Home
- Opportunities/jobs
- Leads/enquiries
- My services/listings
- Messages
- Bookings/scheduling
- Earnings/payout state
- Verification
- Reviews/reputation
- Portfolio/profile
- Notifications
- SabiForum participation
- Support/settings

### D. Operations/Admin
Server-authorised operational surfaces for moderation, verification, support, finance, audit and configuration. Product role must never imply staff access.

## 4. Identity architecture

One account model may serve both roles, but entry experiences must be role-aware.

Recommended entry structure:

`/login` -> role-intent choice or remembered-role routing

- Continue as Client
- Continue as Professional

Then role-specific surfaces:

- `/login/client`
- `/login/professional`
- `/signup/client`
- `/signup/professional`

Exact URLs can change after architecture review, but the experience must communicate different value, expectations and next steps.

The system should support safe role switching only if product/business rules explicitly permit it. Do not treat a front-end radio button as the full role architecture.

## 5. Temporary demo architecture before backend availability

During front-end rebuild, controlled demo mode should allow realistic inspection without pretending to be real authentication.

Required demo modes:

- Enter Client Demo
- Enter Professional Demo

Each demo must provide deterministic fixture data for:

- identity/profile
- home modules
- messages
- notifications
- jobs/services
- bookings
- trust/reviews
- transaction/payment placeholders
- community content
- empty/error variants

Demo state must be isolated behind a dedicated adapter/fixture layer, visibly marked as demo, easy to remove, and never mistaken for production authorisation.

## 6. Global quality gates for every phase

Every phase must verify, as applicable:

### Product
- user problem and outcome defined
- primary user and role defined
- success metric defined
- no conflicting journey introduced

### UX
- happy path
- alternate paths
- failure/recovery
- empty/loading states
- first-time and returning-user behaviour
- mobile/tablet/desktop task hierarchy

### Content
- labels use user language
- CTA describes the action
- no vague labels for consequential actions
- errors explain what happened and what to do next

### UI/design system
- canonical tokens/components used
- hierarchy is clear
- no card-for-everything generic composition
- responsive states defined
- brand consistency maintained

### Accessibility
- WCAG 2.2 AA target
- keyboard/focus
- semantic structure
- accessible names
- contrast
- zoom/reflow
- non-colour status cues
- touch target quality

### Engineering
- architecture boundaries respected
- no duplicate business rules
- no fragile storage-based auth decisions masquerading as authority
- loading/error handling
- TypeScript/lint/build
- backward compatibility evaluated

### QA
- acceptance tests
- regression scope
- negative tests
- responsive checks
- role isolation
- route/navigation matrix

### Security/privacy
- least privilege
- sensitive data minimisation
- no credential/token leakage
- protected actions remain protected
- demo/test data clearly separated from real user data

### Analytics/growth
- primary funnel event
- key drop-off points
- meaningful activation event
- instrumentation excludes sensitive payloads

## 7. Phase programme

### Phase 0 — Product, UX, Code & Architecture Truth Audit
Goal: establish a verified current-state inventory before rebuilding.

Deliverables:
- complete route/screen inventory
- public/protected/role route matrix
- code/component ownership map
- current user journey map
- broken/dead/duplicate/incomplete route list
- auth/session state audit
- API/backend dependency audit
- design-system divergence audit
- Figma/current web/current mobile comparison
- accessibility baseline
- responsive baseline
- content/UX writing audit
- security/privacy review
- analytics/measurement baseline
- technical debt/risk register
- KEEP / IMPROVE / REWORK / REPLACE / REMOVE decision matrix
- prioritised P0/P1/P2 product defects

Exit gate: no Phase 1 implementation until the major route, auth, role, design and backend-boundary risks are mapped.

### Phase 1 — Information Architecture & Access Model
Goal: fix the foundation causing login loops, dead ends and role confusion.

Deliverables:
- canonical route taxonomy
- public vs guest-capable vs authenticated vs staff route policy
- Client IA
- Professional IA
- Public IA
- navigation model per role/device
- auth boundary/redirect contract
- session state contract
- demo-state contract
- route-level tests

### Phase 2 — Design System Re-foundation
Goal: create a scalable, distinctive SabiWay system before page-by-page redesign.

Deliverables:
- semantic colour/token audit
- typography scale
- spacing/grid
- radii/shadows
- interaction/focus states
- buttons/links
- form controls
- navigation primitives
- cards only where semantically justified
- lists/rows
- status/badge system
- avatar/profile primitives
- feedback/toast/dialog
- skeleton/loading patterns
- empty/error states
- responsive component behaviour
- accessibility annotations

### Phase 3 — Public Homepage Rebuild
Goal: make the value proposition and primary discovery action immediately clear.

Expected hierarchy:
- concise header/navigation
- value-led hero
- service + location search
- high-signal categories
- relevant/featured Professionals or examples
- simple Client journey
- trust/reputation proof
- Professional acquisition section
- community discovery where useful
- final CTA
- complete footer

No architecture explanations in the hero unless they directly help the immediate task.

### Phase 4 — Role Entry & Conversion Architecture
Goal: make Client vs Professional intent explicit and low-friction.

Deliverables:
- role-intent chooser
- role-specific conversion copy
- remembered intent behaviour
- public CTA routing
- analytics funnel

### Phase 5 — Client Authentication & Onboarding
Goal: dedicated Client acquisition and activation journey.

### Phase 6 — Professional Authentication & Onboarding
Goal: dedicated Professional acquisition, capability setup and activation journey.

### Phase 7 — Controlled Client/Professional Demo Environment
Goal: enable complete product inspection before live backend availability using realistic fixtures and removable adapters.

### Phase 8 — Client Application Shell & Home
Goal: build a mature Client workspace with personalised, actionable home hierarchy.

### Phase 9 — Professional Application Shell & Home
Goal: build a distinct Professional operating dashboard focused on opportunities, actions, trust and earnings.

### Phase 10 — Marketplace Discovery & Professional Profiles
Goal: mature search, location, category, filters, result cards, service details and trust comparison.

### Phase 11 — Jobs, Leads & Proposals
Goal: complete Client job-post and Professional opportunity/proposal journeys.

### Phase 12 — SabiForum Social/Community Experience
Goal: coherent feed, posting, profiles, engagement, moderation/reporting and discovery while preserving marketplace focus.

### Phase 13 — Messaging & Notifications
Goal: reliable communication architecture across mobile and desktop, with context-aware booking/job information.

### Phase 14 — Trust, Verification, Reputation & Reviews
Goal: explain and operationalise trust using interpretable signals rather than badges alone.

### Phase 15 — Booking, Scheduling & Service Management
Goal: complete work agreement and scheduling journeys without duplicating payment state.

### Phase 16 — SabiPay & Transaction Experience
Goal: make payment, work, release, refund and dispute state explicit and safe.

### Phase 17 — Profile, Settings, Support & Account Management
Goal: complete lifecycle and self-service account operations.

### Phase 18 — Responsive, Accessibility & Internationalisation Hardening
Goal: certify representative widths, WCAG 2.2 AA implementation, long text, locale/currency/location adaptability and reduced-motion/reflow behaviour.

### Phase 19 — Performance, Reliability & Observability
Goal: Core Web Vitals, route performance, loading strategy, error boundaries, logging/monitoring and degraded-service behaviour.

### Phase 20 — Real Backend Integration & Security Hardening
Goal: replace demo adapters with authoritative Django contracts, real sessions, permissions, state transitions and integration tests.

### Phase 21 — Controlled User Testing & Production Readiness
Goal: prove users can complete critical tasks safely before production launch.

Deliverables:
- Client usability testing
- Professional usability testing
- task completion metrics
- severity-ranked defects
- accessibility verification
- security/release checks
- browser/device evidence
- analytics validation
- rollback plan
- release-readiness decision

## 8. Phase sequencing rules

1. Do not skip Phase 0.
2. Phase 1 must finish before major internal page rebuilding.
3. Phase 2 must define core primitives before broad UI redesign.
4. Phase 3–7 establish acquisition, identity and controlled inspection.
5. Phase 8–17 rebuild product capabilities in coherent journey slices.
6. Phase 18–19 harden cross-cutting quality.
7. Phase 20 replaces fixtures/mock adapters with authoritative backend integration.
8. Phase 21 is evidence, not ceremony.

Some phases may overlap in research/prototyping, but implementation dependencies must be respected.

## 9. Repository workflow

For every phase:

`main` -> focused phase branch -> audit/decision -> implementation -> tests -> docs -> PR -> exact-head CI -> merge -> post-merge verification.

Recommended naming:

- `audit/phase-0-product-truth`
- `feat/phase-1-information-architecture`
- `feat/phase-2-design-system`
- etc.

Never stack unverified large phases on top of a failing baseline.

## 10. Decision framework: preserve vs rebuild

Every existing feature/component/route receives one decision:

- KEEP — correct and production-quality enough
- IMPROVE — structurally sound; needs refinement
- REWORK — useful concept but flawed implementation
- REPLACE — architecture/UX is wrong enough that replacement is safer
- REMOVE — duplicate, dead, misleading or no longer required

No replacement is justified merely because new code would look cleaner.

## 11. Product success measures

Final metrics will be confirmed through research, but the rebuild should enable measurement of:

### Acquisition
- homepage -> search engagement
- homepage -> Client signup intent
- homepage -> Professional signup intent

### Activation
- Client reaches first meaningful discovery/contact/job action
- Professional completes service/profile setup and reaches first opportunity

### Marketplace quality
- search-to-profile rate
- profile-to-message/job/booking rate
- no-result rate
- response rate
- time to meaningful match

### Retention/engagement
- returning active users
- conversations continued
- jobs/services managed
- community contribution with marketplace relevance

### Trust
- verification completion
- review/reputation comprehension
- report/dispute/support resolution signals

### Quality
- task completion
- error rate
- accessibility defect rate
- route/login-loop defects
- Core Web Vitals

## 12. Definition of Done for the programme

SabiWay is not considered product-ready until:

- public browsing works without unnecessary authentication
- Client and Professional journeys are clearly distinct
- every primary navigation destination is intentional and functional
- no critical CTA routes to login unless identity is genuinely required
- demo mode can inspect both internal experiences before backend readiness
- real backend integration replaces demo state safely
- critical user journeys pass automated and manual regression
- WCAG 2.2 AA target has evidence
- representative responsive widths have runtime evidence
- failures are explicit and recoverable
- security/permission tests prove role isolation
- analytics measure the funnel without sensitive leakage
- controlled users complete core tasks with acceptable severity defect levels

## 13. New-chat continuation protocol

When continuing in a new chat, instruct the next session:

> Work from `Sabiway-Ltd/Sabiway2026`. Read `AGENTS.md`, `docs/DEVELOPER-START-HERE.md`, `docs/PRODUCT-REBUILD-MASTER-PLAYBOOK.md`, and the active phase document. Verify current `main`, open PRs, CI and deployments before making changes. Do not rely on conversation memory. Continue the rebuild from the first incomplete acceptance item in the active phase.

The active phase at creation of this playbook is **Phase 0 — Product, UX, Code & Architecture Truth Audit**.
