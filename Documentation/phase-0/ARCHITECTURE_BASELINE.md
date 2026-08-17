# Phase 0 — Architecture & Authority Baseline

This document prevents duplicated business logic while SabiWay V2 upgrades the existing system.

## Target architecture

### User-facing clients
- Web: `frontend/` — Next.js
- Android/iOS: `mobile/` — Expo / React Native

### Shared platform services
- API/business authority: `Backend/` — Django + Django REST Framework
- Realtime delivery: `ExpressJs/` — Express + Socket.IO
- Administrative authority: Django/staff/admin surfaces backed by the same business state
- Waitlist: `WaitList/` remains a separate acquisition surface unless explicitly integrated later

## Source-of-truth map

| Domain | Authority | Client responsibility |
|---|---|---|
| Identity/account | Django account model/API | collect/display credentials and session state only |
| Roles/permissions | Django account/RBAC rules | render permitted UX; never authorise solely client-side |
| Profile | Django profile domain | edit/display through shared API |
| Verification | Django verification domain | submit evidence/display status; staff decisions remain server-side |
| Community/content | Django persistence/business rules | compose/browse/interact through API |
| Marketplace | Django marketplace domain/state machine | browse/create/manage through shared API |
| Messaging persistence | Django/domain persistence where implemented | present conversation state; realtime is transport only |
| Realtime events | Express/Socket.IO transport, triggered by authorised backend actions | subscribe/render/reconnect; no business authority |
| Payments/SabiPay | Django payment/transaction state and provider reconciliation | initiate/display state; no client-calculated authoritative payment status |
| Moderation/support | Django/staff authority and audit records | user reporting/support entry points |
| Analytics events | shared event contract; implementation phased | emit approved client/server events without duplicating business truth |

## Architecture rules

1. Clients may optimise presentation but must not own business truth.
2. Realtime delivery may fail without corrupting persisted state.
3. A new service is not introduced when an existing authoritative service can satisfy the requirement safely.
4. Duplicate account, role, profile, verification, transaction, payment or moderation state is prohibited.
5. Cross-platform flows must reconcile against backend state, not local assumptions.
6. API contracts should be reused across web and mobile unless platform-specific input/output is genuinely required.
7. Admin capability is centralised; no independent mobile-admin business layer is created.
8. Existing Express realtime remains provisional and must be re-evaluated in Phase 6 for complexity, scaling, authentication, delivery guarantees and duplication.

## Current architectural decision

KEEP the monorepo, Next.js web, Expo mobile, Django/DRF backend and current authenticated Socket.IO transport. Improve/refactor in place. No greenfield rewrite is justified by the Phase 0 evidence reviewed so far.
