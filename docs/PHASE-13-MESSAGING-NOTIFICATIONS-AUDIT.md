# Phase 13 — Messaging & Notifications Audit

## Objective
Make Messages and Notifications coherent shared SabiWay capabilities without weakening marketplace participant, booking, schedule, safety or account boundaries.

## Preserve
- `MessageThread` participant authority and thread-scoped unread state.
- pre-booking contact-detail restrictions.
- block, unblock and report controls.
- booking agreement and schedule proposal state separation.
- message attachments and existing realtime refresh events.
- `/messages` as participant-scoped and `/notifications` as authenticated-shared.

## Improve in Phase 13
- Notifications use `AppShell`, not community-only navigation.
- Notifications use the shared authenticated `api` client rather than creating raw token-bearing Axios calls.
- Read/unread changes are optimistic but rollback-safe.
- Notification destinations prefer backend-provided same-origin `target_url`, with safe product fallbacks by domain.
- Notifications become a first-class desktop destination and mobile utility action without displacing the five primary role journeys.
- Empty, loading, error and retry states are explicit.

## Messaging decision
The current Messages workspace is large but already integrates messaging, booking, schedule and safety controls with backend participant authority. Phase 13 does **not** replace this transaction-heavy component merely for visual consistency. It remains hosted by `AppShell`; later hardening can progressively migrate its internal request plumbing without changing participant permissions or state meanings.

## State boundaries
- unread/read notification != underlying marketplace state change
- conversation != booking
- booking != payment
- schedule proposal != accepted booking
- notification link != authorization

## Exit evidence
- static Phase 13 contract
- TypeScript, lint and production build
- browser proof that `/messages` and `/notifications` remain protected
- all backend marketplace/notification tests remain green
- full Platform CI Release Gate
