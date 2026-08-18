# SabiWay Architecture

This document describes the implementation that exists in this repository. Historical phase evidence remains under `Documentation/`.

## Service boundaries

### Web — `frontend/`
Next.js/React/TypeScript web client. It contains the public landing experience, shared authentication, marketplace/jobs/listings, messaging/booking workspace, SabiForum, profiles, notifications, verification, SabiPay, support/help/legal surfaces and responsive web translations of the approved mobile/Figma-export product language.

### Mobile — `mobile/`
React Native/Expo TypeScript client for Android/iOS. It consumes the same backend/realtime services and shares the SabiWay product roles and business journeys. The current UI is aligned to the supplied Figma export at code level; physical-device visual certification remains a separate runtime gate.

### Shared backend/API — `Backend/`
Django + Django REST Framework. Django models/migrations are the backend schema source of truth. Apps include accounts, profiles, search, posts/SabiForum, notifications, marketplace, verification, SabiPay, operations/admin and health/measurement functionality.

### Realtime — `ExpressJs/`
Node/Express/Socket.io service. It handles authenticated realtime connection/event delivery while authoritative business records remain in the shared backend.

### Waitlist — `WaitList/`
Separate Flask waitlist utility retained in the repository. It is not the authoritative SabiWay application backend.

## Database and persistence
Django ORM plus versioned Django migrations are authoritative for the main platform schema. Local configuration can use SQLite; deployed environments use `DATABASE_URL`. CI checks migration drift. Do not run destructive tests against Production.

## Authentication and authorisation
- Shared account model: `Backend/accounts`.
- JWT authentication uses SimpleJWT with rotating refresh tokens and blacklist-after-rotation.
- Client roles: `client` and `professional`.
- Server-side permissions/groups provide staff/admin/operations controls; client-side visibility is not authorisation.
- Guarded internal-review login exists only when backend `DEBUG=True` and `INTERNAL_REVIEW_MODE=True`; reviewer accounts are non-staff/non-superuser. It must remain disabled in Production.

## Storage
Verification and user-upload flows use configured storage services, currently Cloudinary-backed for general media with verification-specific security/retention controls in the backend. Credentials are environment supplied and must never be committed.

## Admin and operations
Django admin is the shared operational control surface. `Backend/operations` adds support cases, configuration, consolidated audit evidence and least-privilege operational role groups. Domain-specific audit records remain in verification, moderation, marketplace and SabiPay.

## Background/scheduled work
Backend management/service routines support retention, measurement and payment/reconciliation operations. There is no separate durable queue platform documented as an authoritative dependency in the current repository; do not invent one. Any future queue/scheduler adoption is an architecture change requiring a decision record.

## Notifications and email
`Backend/notifications` stores notification history/preferences/delivery evidence. Email integrations are environment configured. Realtime and notification delivery are separate from the authoritative persisted event/history records.

## External integrations
- Vercel: web previews/Production for the Next.js frontend.
- Paystack: SabiPay Nigeria-pilot payment/payout integration.
- Google OAuth: optional authentication path.
- Resend/email configuration: account/support email delivery.
- Cloudinary: media storage.

## Critical journeys
1. signup/confirmation/login/password recovery/logout;
2. guarded internal-review access in development only;
3. profile/onboarding and professional verification;
4. marketplace discovery, service listings and jobs;
5. conversation → scope/price agreement → booking → schedule;
6. realtime messaging and notifications;
7. SabiForum post/comment/engagement/moderation;
8. SabiPay initialise/verify/fund/start/deliver/confirm/release/refund/dispute;
9. support/reporting/admin investigation;
10. cross-device continuity between web and mobile.

## Environment boundaries
Local/development, preview, controlled testing/UAT and Production must be treated separately. Preview deployment is not release approval. Production revision must be matched to the intended Git revision before advancing the Rolling Green Baseline.
