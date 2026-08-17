# Phase 0 — Product Baseline

Status: current working baseline for the SabiWay V2 master playbook  
Repository: `Sabiway-Ltd/Sabiway2026`  
Delivery model: upgrade the existing system; do not rebuild greenfield.

## Controlling source hierarchy

Where sources differ or are narrower than the complete programme, use this order of authority:

1. **SabiWay V2 Master Cross-Platform Build, Audit, Design & User-Testing Readiness Playbook** — controls delivery sequence, audit method, architecture principles, quality gates and the requirement to deliver Web + Android + iOS.
2. **Product Owner clarifications** — including the explicit decision that V2 is being built for all three clients and that the Figma V1 web designs are not the V2 web-design authority.
3. **SabiWay V2 BRD** — authoritative business/product requirements and user outcomes. Its mobile-app wording is context from the original document, not a restriction on the cross-platform V2 programme.
4. **Figma page `Ui Mobile App Design`** in `Sabiway Project` — the V2 UI/UX reference and design-system foundation.
5. **Supplied SabiWay branding package** — authoritative logo/visual-identity asset source where it does not conflict with the app design system.
6. **Existing V1 web design/code and current implementation** — audit/reuse evidence only; never allowed to override the V2 app design direction or master playbook.

Figma file: `https://www.figma.com/design/l2PfJlR0mX8Y3T8OnjoA94/Sabiway-Project`

### Explicit Figma exclusion

The Figma file contains separate pages named `Ui Mobile App Design`, `Sabiway website`, and `Visualization`. For V2 product design:

- **USE:** `Ui Mobile App Design`.
- **DO NOT USE AS V2 DESIGN AUTHORITY:** `Sabiway website` — this is the V1 website design.
- `Visualization` may be used only if a specific non-product visual asset is deliberately approved; it is not a V2 application-screen authority.

The new V2 web experience must be **derived from the mobile app's visual language, information hierarchy and interaction intent**, but redesigned as a native responsive web experience rather than a mobile screen stretched to desktop.

## Product definition

SabiWay V2 is one shared platform delivered through three user-facing clients/surfaces:

- Web application
- Android application
- iOS application

All clients must share one backend, one identity model, one role/permission authority, one authoritative profile, one verification state, one transaction state, one payment state and one administrative control layer.

## Business context from the BRD

The BRD establishes SabiWay as a trusted Nigerian service marketplace supporting:

- Nigeria-based clients hiring locally;
- diaspora clients hiring providers in Nigeria;
- Nigerians abroad hiring Nigerian providers within diaspora communities;
- service discovery by service/problem/location;
- secure in-platform messaging and negotiation;
- booking and scheduling;
- SabiPay escrow and transaction protection;
- provider verification, ratings/reviews and dispute handling;
- SabiForum as a supporting trust/community layer rather than a substitute for marketplace safeguards;
- shared admin/trust oversight.

These requirements apply to the relevant V2 capability across Web, Android and iOS unless the master playbook or an explicit product decision records a platform-specific exception.

## Current implementation surfaces

- Web: existing Next.js application under `frontend/`; preserve useful implementation, but V2 visual/UX direction comes from the mobile app Figma rather than the old V1 web design.
- Mobile: existing Expo/React Native application under `mobile/`; active code that must be audited against the V2 app Figma.
- Backend: existing Django + Django REST Framework API under `Backend/`.
- Realtime: existing Express/Socket.IO service under `ExpressJs/`; retain only while it remains the best fit and does not duplicate backend authority.
- Waitlist: existing separate `WaitList/` implementation; keep isolated from authenticated product capability unless an explicit product decision integrates it.
- Admin: one shared administrative authority; do not create a separate mobile admin system.

## Cross-platform design rule

Mobile Figma is the design foundation, not a pixel-for-pixel mandate across all clients.

- Android and iOS should preserve the mobile interaction model where appropriate while respecting native platform behaviour.
- Web must translate the same product identity into desktop, tablet and mobile-web layouts using web-native navigation, density, hover/focus, keyboard and responsive patterns.
- Shared components should align in visual language, tokens, terminology and states, but layout may differ by surface.
- Existing V1 web layouts can be mined for working functionality only; they must not drive the V2 visual system.

## Product rules inherited by every phase

1. Inspect first, understand second, decide third, design fourth, build fifth, test sixth.
2. Every existing capability receives one decision: KEEP / IMPROVE / REFACTOR / MERGE / REPLACE / REMOVE.
3. Search for equivalent models, APIs, services, components, hooks and utilities before creating new ones.
4. Business rules and authorisation remain server-side.
5. Web, Android and iOS must represent the same account and core business state.
6. WCAG 2.2 AA is the accessibility target.
7. Nigerian-market realities must be considered: Android-heavy usage, unstable networks, data cost, Nigerian phone formats, Naira/local payments, trust/fraud/impersonation and diaspora/time-zone cases.
8. Every user-facing capability must consider loading, empty, error, success, disabled, permission-denied, connection-failure, first-time and long-content states.

## Phase 0 exit definition

Phase 0 is complete only when the current repository, source hierarchy, app-design authority, branding, web UX, mobile UX, API surface, database/domain model, admin, roles, critical journeys, architecture and open decisions are documented well enough that Phase 1 can improve the foundation without guessing or duplicating work.
