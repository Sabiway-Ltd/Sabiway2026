# Master Phase 6 — Messaging, Realtime & Notifications Baseline

Status: AUDIT / IN PROGRESS
Branch: `feat/phase-6-messaging-realtime-notifications`
Base: certified Phase 5 `main` (`74aba654cd300d107655f135fb82a99c0fa2293f`)

## Objective

Deliver one reliable cross-platform messaging, realtime and notifications experience across Web, Android and iOS while keeping Django as authoritative state and Express/Socket.IO as a best-effort delivery channel.

This phase follows the Master Playbook sequence: inspect first, understand second, decide third, design fourth, build fifth, test sixth.

## Messaging domain — KEEP / IMPROVE

The existing Django marketplace domain already owns:
- `MessageThread` participant membership and open/closed state;
- `Message` body, attachment metadata, read state and timestamps;
- `ConversationBlock`;
- `ConversationReport`;
- booking/thread linkage;
- message/read indexes.

Decision:
- KEEP the existing `MessageThread` / `Message` domain as the authoritative messaging source.
- IMPROVE permissions, blocking, read/unread, attachments, pagination, lifecycle and complete states where audit identifies gaps.
- DO NOT create a second generic conversation/message persistence layer.

## Realtime — KEEP AS DELIVERY / HARDEN

Express Socket.IO already:
- verifies signed access JWTs before socket connection;
- joins authenticated sockets to `user:<id>` rooms;
- protects internal HTTP broadcast endpoints with `x-sabiway-internal-token`;
- emits community, notification and marketplace events.

Django marketplace already uses an authenticated best-effort `broadcast_marketplace_event` helper. Community uses the same architectural principle.

Decision:
- Django database state remains authoritative.
- Express is delivery/fanout only; realtime failure must not roll back successful persisted mutations.
- REFACTOR notification realtime calls to one authenticated helper rather than direct ad-hoc `requests.post` calls.
- clients should reconcile realtime hints against Django rather than treating socket memory as authoritative state.

## Notifications — KEEP / HARDEN

The existing Django `notifications` app contains persisted notifications, serializers, pagination, signals, tests, URLs and read APIs.

Current notification types are community-oriented: follow, like, comment, reply and followed-user post.

Current gaps identified:
- notification read/read-all views call Express directly instead of reusing a hardened transport helper;
- those direct calls do not currently add the internal broadcast token header;
- direct `print` failure handling should be replaced by best-effort transport behaviour suitable for later observability hardening;
- unread-count realtime shape is inconsistent: Express emits the payload on `new-notification`, while Web separately listens for an `update-unread-count` event;
- message/booking/schedule/payment notification coverage requires later mapping rather than inventing new types before the transaction phases are audited;
- mobile notification UI/deep-link parity still requires audit.

Decision: KEEP / HARDEN.

## Web messaging — KEEP / REFACTOR

`frontend/app/messages/MessagesClient.tsx` already provides:
- thread list + unread counts;
- message history;
- send text/file message;
- Socket.IO refresh on `new-message`, `booking-updated` and `schedule-updated`;
- booking creation/status controls;
- schedule proposal/decision controls;
- block/report controls.

Current gaps identified:
- page owns a bespoke product header rather than the Phase 4 authenticated `AppShell`;
- socket events cause broad thread/conversation refetches and require request-deduplication review;
- message/error/retry/empty/send states require full audit;
- participant labels must work correctly for both client and professional roles;
- block/unblock/report lifecycle needs server + UI parity review.

Decision: KEEP / REFACTOR.

## Mobile messaging — KEEP / REFACTOR

`mobile/src/messaging/` already contains `MessagingScreen.tsx`, `api.ts` and `types.ts` and uses the same Django marketplace APIs for threads, messages, attachments, blocking/reporting, bookings and schedules.

Decision:
- KEEP the existing screen/API foundation.
- audit complete states, pagination, participant-role rendering, block/report behaviour, attachment constraints, realtime reconciliation and accessibility before changing it.

## Single-source-of-truth rules for Phase 6

- thread membership: Django `MessageThread`;
- messages: Django `Message`;
- read/unread message state: Django message/thread APIs;
- blocks/reports: Django marketplace models/APIs;
- notifications/read state: Django `Notification`;
- realtime: Express delivery only;
- socket authentication: signed access token;
- Django -> Express: internal broadcast token;
- client UI visibility never substitutes for server authorisation.

## First implementation slice

1. Create one reusable authenticated notification realtime broadcaster.
2. Refactor notification signals + mark-read/read-all paths to use it.
3. Make the unread-count socket contract explicit and consistent.
4. Update Web notification handling to consume the authoritative contract correctly.
5. Add regression tests for internal-token use and read/unread broadcasts.
6. Run Platform CI before proceeding to messaging UI refactors.

## Remaining audit before Phase 6 certification

- marketplace messaging serializers, attachment limits and permission validators;
- block/unblock/report rules and moderation/admin surface;
- message pagination and thread unread-count correctness;
- full mobile `MessagingScreen` states and realtime usage;
- Web messages integration with shared `AppShell`;
- mobile notifications UI/deep links;
- notification target/deep-link schema across platforms;
- reconnect/duplicate-event behaviour;
- offline/retry behaviour;
- analytics events without private message text;
- final cross-platform CI/regression certification.
