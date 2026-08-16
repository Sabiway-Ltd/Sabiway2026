# Phase 0 — Product Baseline

Status: current working baseline for the SabiWay V2 master playbook  
Repository: `Sabiway-Ltd/Sabiway2026`  
Delivery model: upgrade the existing system; do not rebuild greenfield.

## Product definition

SabiWay V2 is one shared platform delivered through three user-facing clients/surfaces:

- Web application
- Android application
- iOS application

All clients must share one backend, one identity model, one role/permission authority, one authoritative profile, one verification state, one transaction state, one payment state and one administrative control layer.

## Current implementation surfaces

- Web: existing Next.js application under `frontend/`; preserve useful implementation and redesign/refactor only where evidence requires it.
- Mobile: existing Expo/React Native application under `mobile/`; this is now active code and must be audited alongside web.
- Backend: existing Django + Django REST Framework API under `Backend/`.
- Realtime: existing Express/Socket.IO service under `ExpressJs/`; retain only while it remains the best fit and does not duplicate backend authority.
- Waitlist: existing separate `WaitList/` implementation; keep isolated from authenticated product capability unless an explicit product decision integrates it.
- Admin: one shared administrative authority; do not create a separate mobile admin system.
- Design source: existing SabiWay mobile Figma is an input and design-system foundation, not an automatically accepted specification. Web designs must adapt rather than stretch mobile layouts.

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

Phase 0 is complete only when the current repository, design, web UX, mobile UX, API surface, database/domain model, admin, roles, critical journeys, architecture and open decisions are documented well enough that Phase 1 can improve the foundation without guessing or duplicating work.
