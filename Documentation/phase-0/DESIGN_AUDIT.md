# Phase 0 — Design Audit

Status: **SOURCE VERIFIED; EXPORTED V2 APP DESIGN AUDITED; IMPLEMENTATION-CAPABILITY AUDIT CONTINUES BY PHASE**

## Canonical design source

Figma file: `Sabiway Project`  
File key: `l2PfJlR0mX8Y3T8OnjoA94`  
URL: `https://www.figma.com/design/l2PfJlR0mX8Y3T8OnjoA94/Sabiway-Project`

The connected Figma inspection verified three pages:

| Figma page | V2 decision | Reason |
|---|---|---|
| `Ui Mobile App Design` | **KEEP / USE AS V2 DESIGN AUTHORITY** | Product Owner-approved V2 app design source and foundation for the new V2 web design. |
| `Sabiway website` | **REMOVE FROM V2 DESIGN AUTHORITY / V1 REFERENCE ONLY** | Product Owner confirmed this is the V1 web design and must not drive V2. |
| `Visualization` | **REFERENCE ONLY** | Not an application-screen authority unless a specific visual asset is deliberately approved. |

## Exported design evidence

Because the connected Figma account reached its MCP Starter-plan tool-call limit, the Product Owner supplied an export of the approved app design. The export contains the consolidated `Sabiway Project.pdf`, individual high-resolution V2 app screens, the user-flow diagram, logo assets and the historical design-report document.

The exported app artefacts are accepted as evidence of the approved `Ui Mobile App Design` page for Phase 0 auditing. They do **not** change the source hierarchy: the live approved app Figma remains the design authority, while the export is the current auditable snapshot.

## Screen and journey inventory verified from export

The export provides design evidence for the following capability groups:

| Capability | Verified design evidence | Phase 0 decision |
|---|---|---|
| Authentication | Sign-in active, error and processing states; sign-up screens | **IMPROVE / MERGE states into shared auth pattern** |
| Role selection / onboarding | Client/professional selection and professional success/entry screens | **IMPROVE** |
| Client home / discovery | Client homepage, categories, popular categories, filters, professional discovery | **IMPROVE** |
| Provider home / opportunity discovery | Provider homepage variants, job recommendations and verification restriction messaging | **IMPROVE** |
| Search / filtering | Home search, category/filter UI | **IMPROVE / REFACTOR into shared search/filter system** |
| Professional profile | Professional detail/view screen and review screens | **IMPROVE** |
| Job request / marketplace | Job Request, Post a Job, My Jobs, View Job Information, Close Job Ads | **IMPROVE / REFACTOR transaction state handling** |
| Messaging | Message lists and open-message/conversation screens | **IMPROVE / MERGE client/provider variants** |
| Community | Community feed, Create Post, Post Preview | **IMPROVE** |
| Payments / SabiPay | Payment Method, Summary, Withdrawal, Payment History, Download Receipt | **IMPROVE / REFACTOR around authoritative payment states** |
| Reviews | Professional + Review variants | **IMPROVE** |
| Identity / trust | Identity-verification entry screen plus provider access restriction messaging | **IMPROVE / REFACTOR trust-state system** |
| User flow | Provider, client, community, SabiPay/escrow, dispute and admin-resolution flow | **KEEP as requirement evidence; REFACTOR into implementation state machine** |

## Key design strengths to preserve

- Distinct client and professional experiences while keeping a recognisable shared SabiWay shell.
- Strong SabiWay green visual identity with orange accent moments.
- Clear Nigerian/local-service context, including Naira, local service categories and location-led discovery.
- Marketplace journeys connect discovery → provider/job detail → messaging/booking → escrow/payment → completion/review.
- Provider verification is visibly connected to trust and access.
- Community is treated as a first-class product surface rather than a separate marketing add-on.
- Bottom navigation and prominent primary actions make the mobile information architecture easy to understand.

## Phase 0 design issues requiring V2 refinement

These findings are based on the exported approved app screens and are implementation/design-system requirements, not permission to replace the app design language.

### 1. Design-system consistency — **IMPROVE / MERGE**

Repeated controls are visually similar but are not yet documented as one authoritative component system. Phase 1 must consolidate:

- top app headers;
- search fields;
- filter controls;
- cards;
- text inputs/dropdowns;
- primary/secondary/destructive buttons;
- bottom navigation;
- floating actions;
- status banners;
- chips/badges;
- payment/status rows;
- modal/success-state patterns.

### 2. State completeness — **IMPROVE**

Authentication includes active/error/processing examples, which is useful, but the wider product export does not evidence complete loading, empty, error, success, disabled, permission-denied, offline/connection-failure and long-content states for every journey. These must be added during the relevant capability phases.

### 3. Accessibility — **IMPROVE**

The visual direction is usable, but WCAG 2.2 AA cannot be certified from the export alone. Implementation must verify:

- text/background contrast, especially pale green, grey and orange combinations;
- minimum interactive target sizes;
- text scaling without clipping;
- semantic labels for icon-only controls;
- keyboard/focus behaviour on web;
- non-colour status communication;
- screen-reader order and accessible form errors.

### 4. Long mobile pages — **REFACTOR where necessary**

Client/provider home screens contain substantial vertically stacked content. Preserve the information hierarchy but use pagination/lazy loading, skeleton states and progressive loading in production. Web must not reproduce the same narrow vertical stack.

### 5. Search/filter architecture — **REFACTOR**

Search, category browsing, location and filters appear across multiple discovery contexts. Build one shared query/filter contract backed by the API, with client/provider-specific presets rather than duplicated logic.

### 6. Marketplace and job state model — **REFACTOR**

The design demonstrates posting, viewing, closing and responding to jobs, but production must define one authoritative server-side lifecycle. UI labels/actions must derive from transaction state, permissions and escrow/payment state rather than client-side assumptions.

### 7. Messaging variants — **MERGE**

Client and provider message-list/open-message screens should share one messaging component model with persona-aware actions. Realtime state, retry, delivery/read state, attachment handling, moderation/reporting and offline behaviour need implementation-level completion.

### 8. Trust / verification — **REFACTOR**

The provider homepage includes a visible identity-verification access restriction. Preserve this trust signal, but verification must be expressed through one authoritative backend state and reusable UI states: not-started, pending, action-required, verified, rejected/failed, expired/reverification if applicable.

### 9. Payments / escrow — **REFACTOR**

The job-posting design explains that funds are held in escrow and released after completion, and the export includes payment method, summary, history, withdrawal and receipt screens. Production must make the backend transaction/payment state authoritative and provide failure, retry, pending, reversed/refunded/disputed and permission states before certification.

### 10. Copy and content quality — **IMPROVE**

The export contains placeholder/lorem-ipsum content and several visible spelling/wording inconsistencies in screen/file naming. Placeholder content must not ship. Product copy must be reviewed for Nigerian clarity, trust, plain English and consistency across web/Android/iOS.

## User-flow audit

The exported user-flow diagram confirms the intended high-level model:

- user type separates Provider and Client journeys;
- both use sign-up/login and identity verification;
- providers manage listings/earnings, receive bookings, confirm details, deliver service and receive released payment;
- clients search/filter, view provider profiles, book/request services, use SabiPay escrow, confirm completion and rate providers;
- both access SabiForum/community;
- dispute paths lead to dispute resolution;
- admin participates in dispute resolution, analytics and provider verification.

**Decision:** KEEP the flow as product-requirement evidence, but REFACTOR it into explicit backend state machines, permission rules and cross-platform acceptance tests before production certification.

## V2 web-design rule

The new web application is **not** the V1 website reskinned and is **not** the mobile UI stretched horizontally.

For each capability, V2 web must:

1. inherit the approved app design's brand, terminology, trust signals, component language and information hierarchy;
2. preserve the same business journey and backend state as Android/iOS;
3. translate bottom/mobile navigation into web-native desktop/tablet/mobile-web navigation;
4. use responsive grids, wider content regions, side panels/columns and progressive disclosure where appropriate;
5. support keyboard, hover, focus, pointer and 200% zoom behaviour;
6. retain semantic parity while allowing platform-appropriate layout differences;
7. provide complete loading, empty, error, success, disabled, permission and connection/offline states;
8. meet WCAG 2.2 AA.

Examples of required web adaptation:

- Client discovery: responsive provider grid + persistent/expandable filter region rather than a two-column mobile card stack stretched across desktop.
- Provider opportunity feed: wider job-result layout with filter/sort controls and optional detail pane at desktop widths.
- Messaging: conversation list + active conversation split view on desktop; single-pane push navigation on narrow widths.
- Community: constrained readable feed with optional topic/trending/utility side rails at larger widths.
- Job posting: step-based responsive form with clear progress, validation summary and persistent transaction/escrow explanation.
- Payments/history: responsive data/card representation with accessible status labels and receipt/action controls.

## Mobile-design audit decision framework

Every app screen/component receives one of:

- **KEEP** — valid as designed and aligned to V2 requirements.
- **IMPROVE** — concept is sound but usability/accessibility/state handling needs refinement.
- **REFACTOR** — useful pattern but component/layout/state structure should be redesigned for maintainability or platform adaptation.
- **MERGE** — duplicate patterns should become one shared design-system pattern.
- **REPLACE** — requirement remains but the existing design is unsuitable.
- **REMOVE** — obsolete, V1-only, duplicated or outside V2 scope.

## Phase 0 design conclusion

**The detailed-design evidence gate is now CLOSED for Phase 0.**

The approved V2 app export supplies sufficient screen and flow evidence to establish the design baseline, identify reusable patterns, expose design-system/state/accessibility gaps and define the V2 web-adaptation rules. This does **not** certify every screen as implementation-ready: each capability still requires its detailed design-to-code comparison and state/accessibility testing in the relevant build phase.

The V1 `Sabiway website` Figma page remains excluded from V2 design authority.