# SabiWay Architecture

This document describes the architecture that exists in the current repository. It is intended to help a new engineer or AI session understand **what each service owns, where truth lives, how systems communicate, and what must not be duplicated across layers**.

Historical implementation evidence remains under `Documentation/`.

## 1. High-level architecture

SabiWay is a multi-client platform with one shared authoritative backend and a separate realtime delivery service.

```text
Web (Next.js) ─────┐
                   ├──> Django REST API ───> Django ORM / primary database
Mobile (Expo) ────┘          │
                              ├──> Notifications / audit / measurement records
                              ├──> Paystack / email / media integrations
                              └──> internal realtime broadcast path
                                            │
                                            v
                                   Express + Socket.io
                                            │
                                 connected Web/Mobile clients
```

The important rule is that **realtime delivery is not authoritative business state**. Business state is persisted in the Django backend/database first or otherwise remains backend-authoritative.

## 2. Web client — `frontend/`

Technology: Next.js, React, TypeScript.

Responsibilities:
- public landing and informational pages;
- authentication and account flows;
- role-aware product navigation;
- marketplace discovery, jobs and service listings;
- messaging/booking workspace;
- SabiForum/community;
- profiles and trust presentation;
- notifications;
- professional verification;
- SabiPay/payment/dispute presentation;
- help/support/legal/public surfaces;
- responsive desktop/tablet/mobile-web translation of the approved product language.

The web client must not become the authority for permissions, payment states, booking transitions or verification decisions. It can render allowed actions; the backend decides whether those actions are permitted.

Important route families live under `frontend/app/`, including auth route groups plus product/public routes such as home, community, help centre and marketplace-related surfaces.

## 3. Mobile client — `mobile/`

Technology: React Native, Expo, TypeScript.

Entry points:
- `mobile/index.ts`
- `mobile/App.tsx`
- `mobile/src/` for screens/components/services/state.

Responsibilities:
- Android/iOS product experience;
- role-aware Client/Professional navigation;
- service discovery/jobs;
- messaging/community/profile;
- verification and SabiPay presentation;
- shared backend/API journeys with the web client.

Mobile and web are two clients of the same business platform. Avoid implementing incompatible business rules in each client. If a rule matters to data integrity or permission safety, it belongs in the backend.

Code-level Figma alignment exists, but physical-device runtime certification is a separate evidence gate.

## 4. Shared backend/API — `Backend/`

Technology: Django + Django REST Framework.

The backend is the **authoritative business and access-control layer**.

Major apps include:
- `accounts` — account identity, authentication-related API behaviour and review-mode support;
- `profiles` — profile data and profile-related side effects;
- `search` — bounded cross-domain search;
- `posts` — SabiForum/community content and engagement;
- `notifications` — notification persistence/preferences/delivery evidence;
- `marketplace` — categories/listings/jobs/responses/bookings/scheduling and messaging-related transaction context;
- `verification` — professional verification, evidence and review lifecycle;
- `sabipay` — payment/escrow/work/dispute/refund/release lifecycle;
- `operations` — support cases, operational configuration, audit consolidation and admin role support;
- `health` — liveness/readiness and technical health/measurement-related behaviour;
- core project configuration under `Backend/sabiway/`.

### Backend authority rules

The backend is authoritative for:
- who the user is;
- what role/permissions they have;
- whether an action is allowed;
- canonical lifecycle/state transitions;
- database persistence;
- payment/verification/support audit evidence;
- business validation shared by web and mobile.

Do not rely on client-side hidden buttons or navigation guards as permission enforcement.

## 5. Django signals and side effects

This repository uses Django signals in places. A request handler may create/update a record while related profile/notification side effects happen in signals.

Before moving, deleting or duplicating backend logic:
1. inspect the endpoint/view/service;
2. inspect relevant model methods;
3. inspect `signals.py` in affected apps;
4. inspect tests that assert side effects.

A “cleaner” rewrite that ignores signal-driven behaviour can silently break notifications or counters.

## 6. Database and persistence

Django ORM models plus versioned migrations are the primary platform schema source of truth.

Local development may use SQLite depending on configuration; deployed environments use `DATABASE_URL`.

Rules:
- model schema changes require migrations;
- migration drift must stay green;
- do not casually rewrite previously applied migrations;
- do not use Production data as disposable test data;
- destructive/irreversible changes require migration-order and rollback reasoning;
- web/mobile compatibility must be considered before changing API-backed fields.

Historical waitlist storage is separate from the main Django platform.

## 7. Authentication

Authentication is handled through the Django backend with JWT-based sessions and optional Google OAuth flows.

Current security characteristics include:
- short-lived access tokens;
- refresh tokens with rotation/blacklisting behaviour;
- server-side user/permission checks;
- guarded development-only internal review mode;
- Production-safe configuration expected to disable review bypasses.

Any token/session/OAuth change is RED scope because both web and mobile depend on the contract.

## 8. Product roles vs operational roles

### Product roles
- `client`
- `professional`

These roles affect product navigation, marketplace actions and professional workflows.

### Operational/staff roles
Backend group/permission design supports roles such as verification reviewer, moderator, support agent, finance/admin and read-only analyst, with superuser remaining distinct.

Operational roles must not be inferred from product role labels. A Professional is not automatically staff.

## 9. Internal review access

Internal review mode exists to allow protected UI/product inspection without normal authentication friction during development.

It is intentionally constrained:
- backend `DEBUG=True`;
- backend `INTERNAL_REVIEW_MODE=True`;
- corresponding frontend review flag;
- non-staff/non-superuser review accounts;
- unavailable under Production-safe backend settings.

This mechanism is not a substitute for real authentication testing and must not be repurposed as a Production shortcut.

## 10. Realtime service — `ExpressJs/`

Technology: Node.js, Express, Socket.io.

Responsibilities:
- authenticated Socket.io connections;
- scoped event delivery to intended users/rooms;
- realtime message/notification updates;
- bounded payload and connection behaviour;
- internal broadcast endpoints protected by shared credentials.

Safety characteristics implemented in the service include limits on payload/session/broadcast behaviour and authenticated JWT validation.

### Realtime design principle
If Socket.io is down, authoritative database state must remain correct. Realtime should improve immediacy, not become the only record of a business event.

## 11. Notifications

`Backend/notifications` stores authoritative notification history/preferences/delivery evidence.

Notification lifecycle may involve:
1. authoritative backend event occurs;
2. notification/history record is created;
3. realtime/push/email delivery may be attempted;
4. delivery success/failure is recorded where implemented.

Do not put message bodies, payment credentials or verification documents into telemetry/logging unnecessarily.

## 12. Marketplace domain

The marketplace connects discovery to an auditable transaction journey.

Key concepts include:
- service categories/subcategories;
- professional service listings;
- client job postings;
- professional job responses;
- conversation/thread context;
- booking/agreement;
- schedule proposal;
- work/payment hand-off to SabiPay.

A core architecture decision is to avoid parallel duplicate “order” state machines where an existing authoritative booking/SabiPay lifecycle already exists.

## 13. SabiPay domain

SabiPay is the protected-transaction layer for the Nigeria pilot.

The backend remains authoritative for payment and work state.

Typical lifecycle:

```text
agreement/booking
→ transaction created
→ payment initiated
→ provider verification/reconciliation
→ funded
→ work authorised to start
→ delivery/completion evidence
→ client confirmation / dispute path
→ release / refund / dispute resolution
```

Important rules:
- prevent duplicate charges through idempotency/reconciliation controls;
- do not allow generic marketplace endpoints to bypass funded-work state;
- disputes can freeze progression;
- release/refund/dispute actions require participant/operational permission checks;
- sensitive provider responses should not be blindly trusted or logged.

Any change here is RED.

## 14. Verification domain

Professional verification maintains trust evidence and review status separately from ordinary profile editing.

Expected architecture properties:
- protected evidence storage/access;
- explicit review state;
- reviewer permissions;
- retention policy awareness;
- auditability;
- product gating where required.

Verification documents are sensitive. Avoid exposing them through analytics, general serializers or client logs.

## 15. Operations/admin

Django admin is the shared operational control surface rather than a parallel custom admin product.

`Backend/operations` adds shared operational concepts such as:
- support cases;
- platform configuration;
- consolidated operational audit evidence;
- operational role/group structure;
- dashboard/read-only visibility.

Domain-specific audit trails can remain in verification, marketplace, moderation and SabiPay while operations provides a shared operational view.

## 16. Analytics and monitoring

The platform includes first-party product/technical measurement introduced before user testing.

Measurement should answer questions such as:
- what failed;
- who/which journey was affected;
- where it failed;
- how often;
- what evidence exists.

Do not capture sensitive data merely because an analytics event could contain it.

## 17. External integrations

Current integrations include:
- **Vercel** — Next.js previews/Production deployment;
- **Paystack** — payment/payout provider for SabiPay pilot;
- **Google OAuth** — optional authentication path;
- **Resend/email configuration** — transactional/account/support email delivery;
- **Cloudinary** — media storage;
- **Expo/EAS** — mobile build/distribution configuration.

Each external integration must fail safely. Its availability must not silently corrupt authoritative platform state.

## 18. Environment boundaries

Treat these as separate environments:
- local/development;
- preview;
- QA/UAT/controlled testing;
- Production.

Different environments may use different databases, API origins, payment credentials and review/test flags.

Never assume a preview URL proves Production readiness. Never point destructive test routines at Production.

See `docs/ENVIRONMENTS.md`.

## 19. Critical cross-system journeys

The main architecture must continue to support:
1. registration/login/password recovery/logout;
2. development-only internal review access;
3. onboarding/profile/professional verification;
4. marketplace discovery and search;
5. service listing and job posting/responding;
6. conversation → agreement → booking → scheduling;
7. realtime messaging plus persisted notification evidence;
8. SabiForum post/comment/engagement/moderation;
9. SabiPay fund/start/deliver/confirm/release/refund/dispute;
10. support/reporting/admin investigation;
11. continuity between web and mobile.

See `docs/USER-JOURNEYS.md` for preservation invariants.

## 20. Architecture change checklist

Before changing a service boundary or introducing a new dependency, answer:
- Why can the existing architecture not safely support the requirement?
- What becomes authoritative after the change?
- What old path is being removed/replaced?
- How will web and mobile remain compatible?
- What migration/data effects exist?
- What permissions change?
- What new secret/external failure mode is introduced?
- What tests prove safe fallback?
- What rollback path exists?
- What decision record must be added?

Architecture changes should be deliberate, not accidental side effects of feature implementation.
