# Master Phase 6 — Messaging, Realtime & Notifications Baseline

Status: BUILD / IN PROGRESS
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

Implemented hardening:
- notification creation/read/read-all now use one authenticated Django -> Express helper;
- internal broadcast token is applied consistently;
- unread-count control payloads use explicit `update_unread_count` semantics;
- Web no longer treats unread-count control payloads as ordinary notifications;
- marketplace realtime payloads are converted to JSON-safe primitives before fanout, including UUID, Decimal, date and datetime values;
- realtime transport/serialisation failures remain best-effort and never roll back successful Django mutations.

Decision:
- Django database state remains authoritative.
- Express is delivery/fanout only.
- clients reconcile realtime hints against Django rather than treating socket memory as authoritative state.

## Notifications — KEEP / HARDEN

The existing Django `notifications` app contains persisted notifications, serializers, pagination, signals, URLs and read APIs.

Completed:
- hardened authenticated broadcast helper;
- authoritative unread-count broadcasts after mark-read/read-all;
- recipient ownership regression coverage;
- Web socket contract aligned with backend payloads;
- Android/iOS notification API client added against the existing Django endpoints;
- Android/iOS notification screen added with loading, empty, error, retry, pull-to-refresh, unread indicators, mark-one-read and mark-all-read;
- Socket.IO `new-notification` is used only as a refresh hint; persisted Django state remains authoritative;
- mobile `/notifications` deep-link destination added;
- notification targets route into existing Profile or SabiForum sections rather than creating duplicate detail systems;
- Notifications remains contextual from Home and does not become a sixth primary bottom-navigation item.

Remaining:
- message/booking/schedule notification mapping;
- reconnect/idempotency review;
- analytics without private message content.

## Message attachments — KEEP / HARDEN

Existing rules already enforce:
- 10 MB maximum size;
- JPEG, PNG, WebP, PDF and text/plain allow-list;
- participant-only message creation;
- closed-thread restrictions;
- bilateral block restrictions;
- pre-booking contact-detail protection.

Implemented hardening:
- filename extension must match the declared allowed MIME type;
- stored attachment display names are sanitised;
- spoofed executable-style filenames are rejected;
- regression coverage validates safe uploads and unsafe/path-style names.

No new upload service or persistence model was introduced.

## Web messaging — KEEP / REFACTOR

`frontend/app/messages/MessagesClient.tsx` already provides thread list, unread counts, message history, attachments, realtime refresh, bookings, schedules and safety controls.

Completed:
- `/messages` is wrapped by the shared authenticated Phase 4 `AppShell`;
- duplicate Marketplace/SabiForum product header removed;
- participant/counterparty labels now derive from the authenticated account role so professionals see the client and clients see the professional;
- booking creation/acceptance controls are role-aware in the UI while Django remains authoritative;
- message/proposal labels identify the current user as `You`/`proposed by you` where appropriate;
- persistent Web retry action added for load/conversation failures.

Remaining:
- block/unblock/report lifecycle parity;
- realtime request-deduplication/reconnect review;
- accessibility and final responsive journey validation.

## Mobile messaging — KEEP / REFACTOR

`mobile/src/messaging/` already contains `MessagingScreen.tsx`, `api.ts` and `types.ts` and uses the same Django marketplace APIs.

Audit outcome:
- client/professional counterparty rendering is already correct;
- text/file/photo messaging, booking, schedule, report and block actions already exist;
- realtime already listens for `new-message`, `booking-updated` and `schedule-updated`;
- the principal current reliability gap is transient Alert-only load/conversation failure handling rather than missing messaging capability.

Remaining:
- persistent inbox/conversation retry states;
- block/unblock/report lifecycle parity;
- reconnect/idempotency and accessibility validation.

## Safety lifecycle — CURRENT DECISION

Existing Django models remain authoritative:
- `ConversationBlock` is unique per blocker/blocked pair and supports active/inactive state;
- `ConversationReport` lifecycle is `open / reviewed / dismissed / actioned`.

Next hardening:
- prevent duplicate unresolved reports for the same reporter/thread while a case is open or reviewed;
- expose/consume block state consistently enough for Web/mobile to offer valid Block/Unblock actions;
- do not invent a second moderation lifecycle.

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

## CI evidence

- Platform CI #211: PASS — notification/realtime hardening.
- Platform CI #214: FAIL — new attachment success tests exposed pre-existing UUID realtime serialisation defect.
- defect fixed at the shared marketplace realtime boundary rather than weakening tests.
- Platform CI #216: PASS — UUID-safe realtime + attachment hardening.
- Platform CI #217: PASS — Web counterparty/shell/retry refactor.
- Platform CI #223: pending on Android/iOS notification parity at time of this update.

## Remaining before Phase 6 certification

- duplicate unresolved report protection and block/unblock state parity;
- persistent mobile inbox/conversation error + retry states;
- message/thread pagination and request-deduplication review;
- reconnect/duplicate-event behaviour;
- offline/retry behaviour;
- accessibility and responsive journey checks;
- analytics events without private message text;
- final Web + Android + iOS regression CI and certification.
