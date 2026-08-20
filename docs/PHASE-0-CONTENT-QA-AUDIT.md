# Phase 0 — Content, UX Writing & QA/Test Automation Audit

Status: IN PROGRESS
Programme: `docs/PRODUCT-REBUILD-MASTER-PLAYBOOK.md`

## 1. Objective

Audit whether SabiWay says the right thing, sends users to the right place, and has sufficient automated evidence to prevent broken journeys from reaching review/production.

## 2. Content and UX writing findings

### C0-001 — Product copy contradicts route behaviour
Severity: P1 trust/UX
Decision: FIX architecture first, then copy validation

Examples:
- Client page promises `Browse services publicly`;
- marketing shell says `Public information pages stay public`;
- middleware currently blocks many of those destinations.

This is a serious trust defect because content describes capability that the product does not deliver.

Required outcome:
- content claims must be testable journey contracts;
- no public-access promise without route-level test coverage.

### C0-002 — Role language is present but role intent is not preserved
Severity: P1 growth/UX
Decision: REWORK

Professional acquisition copy is strong enough to establish intent, but the CTA sends users into a generic signup flow that defaults to Client.

Required outcome:
- CTA copy, URL state and form state must agree;
- Professional journey preserves Professional intent from acquisition through onboarding;
- Client journey does the same.

### C0-003 — Homepage explains system architecture before user value
Severity: P1 growth
Decision: REWORK

Current homepage copy gives substantial attention to location architecture, market boundaries and currency logic before the user has completed the primary discovery task.

Required outcome:
- lead with user need and action;
- progressive disclosure for location/payment complexity;
- trust explanation close to consequential actions.

### C0-004 — Internal Home copy is generic because underlying state is generic
Severity: P1 product/content
Decision: REPLACE with state-driven content

Copy such as `What would you like to do?` and generic trust/community cards is not wrong, but it is weak for a mature returning-user environment.

Required outcome:
- content reflects real state and urgency;
- e.g. `2 professionals replied to your plumbing job`, `Verification needs one more document`, `£120 available for payout`;
- no fabricated state in production; demo fixtures clearly labelled.

### C0-005 — Terminology needs one canonical glossary
Severity: P2 content system
Decision: BUILD

Current concepts include:
- Client
- Professional/provider
- Market/Marketplace
- Community/SabiForum
- Job/job request
- service/listing
- earnings/payout/payment

Required outcome:
- canonical term;
- allowed synonym/context;
- prohibited ambiguous variants;
- capitalization rules;
- UK English baseline;
- plain-language definitions.

### C0-006 — Error and recovery copy needs domain-specific patterns
Severity: P1
Decision: REWORK

Current errors are often generic (`Could not...`, `Failed to...`, toast-only).

Required patterns:
- what happened;
- what was/was not saved;
- whether retry is safe;
- next action;
- support path for payment/verification consequences.

### C0-007 — Consequential CTA wording must be explicit
Severity: RED/P1 for payment/trust flows
Decision: STANDARDISE

Avoid ambiguous `Continue`/`Submit` for irreversible or materially consequential actions.

Use specific labels such as:
- Pay £X
- Release payment
- Submit verification
- Withdraw proposal
- Close job
- Report issue

## 3. Current QA strengths

### Q0-001 — Platform CI is broad
Decision: KEEP

Current GitHub CI includes:
- repository hygiene;
- design-system sync;
- UI/UX evidence checks;
- journey-contract checks;
- controlled-testing readiness checks;
- backend deploy/migration/tests;
- realtime check;
- frontend type-check/lint/build;
- mobile typecheck;
- aggregate Release Gate;
- deployment-eligibility marker.

This is a strong engineering-governance foundation.

### Q0-002 — Backend domain tests exist
Decision: KEEP + expand with frontend contract/E2E

Backend CI executes tests across accounts, search, posts, notifications, marketplace, verification, SabiPay and operations.

## 4. Critical QA gaps

### Q0-003 — No frontend browser E2E framework in package
Severity: P1
Decision: BUILD

The frontend package defines only:
- dev
- build
- start
- lint
- type-check

No Playwright/Cypress/browser journey runner is configured.

Impact:
- public CTA -> login regression is not automatically caught;
- role-specific routing cannot be verified end-to-end;
- dialogs, browser history and return-to-intent are not tested in real navigation context.

Required outcome:
- Playwright (preferred unless architecture gives a strong reason otherwise);
- deterministic demo/test fixtures;
- Chromium baseline in CI;
- selected cross-browser certification outside/inside CI as practical.

### Q0-004 — Current journey-contract checks are not browser journey execution
Severity: P1
Decision: KEEP contracts + add runtime tests

Static/custom contract scripts are useful but cannot substitute for:
- click navigation;
- middleware behaviour;
- hydration;
- cookie/localStorage interaction;
- focus management;
- responsive rendering.

### Q0-005 — Public route access needs a dedicated regression suite
Severity: P1
Decision: BUILD in Phase 1

Test unauthenticated navigation for every PUBLIC/GUEST_CAPABLE route.

Examples:
- `/services`
- `/locations`
- `/for-clients`
- `/for-professionals`
- `/how-it-works`
- `/marketplace`
- `/trust-and-safety`

Expected: no unintended login redirect.

### Q0-006 — Auth intent/role routing needs E2E tests
Severity: P1
Decision: BUILD

Required cases:
- Professional CTA preserves professional signup intent;
- Client CTA preserves client intent;
- protected action preserves `next` destination;
- successful login returns to safe intended route;
- invalid external/open redirect is rejected;
- role-incompatible routes show correct denial/redirect experience.

### Q0-007 — Demo mode needs deterministic test personas
Severity: P1 rebuild enabler
Decision: BUILD

Need stable personas with known state:
- Client: no jobs / active job / completed history;
- Professional: unverified / active leads / earnings state;
- messaging/bookings/payment scenarios;
- clear demo labelling.

Fixtures should be reusable by Storybook-like component review and browser E2E if introduced.

### Q0-008 — Accessibility automation is not a named CI gate
Severity: P1 quality
Decision: BUILD

Add automated axe-style checks to critical browser flows, while retaining manual accessibility review.

### Q0-009 — Visual regression is not a named automated gate
Severity: P2
Decision: EVALUATE

Use targeted screenshot comparison for high-value stable surfaces rather than brittle whole-product pixel snapshots.

Candidate screens:
- public homepage;
- Client/Professional entry;
- role homes;
- marketplace results;
- messaging desktop/mobile;
- payment/verification status screens.

### Q0-010 — Performance regression is not a named frontend gate
Severity: P2 initially, P1 pre-production
Decision: BUILD later

Need budgets/monitoring for:
- LCP;
- INP;
- CLS;
- JS bundle growth;
- image weight;
- route-level performance.

## 5. Minimum browser E2E suite before user testing

1. Public homepage loads unauthenticated.
2. Browse services without login.
3. Search marketplace as guest.
4. Protected action redirects to role-aware login and preserves return intent.
5. Client demo entry -> Client Home.
6. Professional demo entry -> Professional Home.
7. Client cannot access Professional-only management route.
8. Professional cannot perform Client-only job-owner action.
9. Message flow opens correct thread.
10. Booking/payment fixture shows correct state transitions.
11. Logout clears authoritative client state and returns to public surface.
12. Keyboard navigation smoke through auth, shell and one modal.

## 6. Test pyramid for rebuild

### Unit/component
- formatting/validation;
- domain state selectors;
- design-system controls;
- route policy functions.

### Integration
- session adapter;
- API/demo repository adapters;
- form submit/error states;
- role navigation configuration.

### Browser E2E
- critical end-to-end journeys;
- routing/middleware;
- return intent;
- browser storage/session behaviour;
- accessibility smoke.

### Backend
- permissions;
- business lifecycle;
- transaction integrity;
- security boundaries.

### Manual/exploratory
- UX quality;
- visual fidelity;
- assistive tech;
- physical devices;
- constrained network;
- content comprehension.

## 7. Phase 1 QA gate generated here

Phase 1 routing/access changes must not merge without tests proving:
- intended public routes remain public;
- protected routes remain protected;
- Client/Professional access policy is explicit;
- return-to-intent works;
- unsafe redirects are prevented;
- middleware and UI shell agree about session state.

## 8. Next Phase 0 work

Proceed to:
- security/privacy audit;
- product analytics/growth audit;
- consolidated defect register;
- Phase 0 completion/readiness assessment.
