# Master Phase 6 — Messaging, Realtime & Notifications Baseline

Status: COMPLETE / CERTIFIED
Branch: `feat/phase-6-messaging-realtime-notifications`
Base: certified Phase 5 `main` (`74aba654cd300d107655f135fb82a99c0fa2293f`)
Final executable head: `41070f3d61b02d4bb8cd446fe6c594cab8a89d76`
Final certification CI: Platform CI #229 — PASS

## Objective

Deliver one reliable cross-platform messaging, realtime and notifications experience across Web, Android and iOS while keeping Django as authoritative state and Express/Socket.IO as a best-effort delivery channel.

This phase followed the Master Playbook sequence: inspect first, understand second, decide third, design fourth, build fifth, test sixth.

## Messaging domain — KEEP / IMPROVE

The existing Django marketplace domain remains authoritative for:
- `MessageThread` participant membership and open/closed state;
- `Message` content, attachment metadata, read state and timestamps;
- `ConversationBlock`;
- `ConversationReport`;
- booking/thread linkage;
- message/read indexes.

No second conversation or message persistence layer was introduced.

## Realtime — KEEP AS DELIVERY / HARDENED

Completed:
- notification creation/read/read-all use one authenticated Django -> Express helper;
- internal broadcast token is applied consistently;
- unread-count control payloads use explicit `update_unread_count` semantics;
- Web no longer treats unread-count control payloads as ordinary notifications;
- marketplace realtime payloads are converted to JSON-safe primitives before fanout, including UUID, Decimal, date and datetime values;
- realtime transport/serialisation failures remain best-effort and cannot roll back successful Django mutations;
- Web and mobile reconcile socket hints against authoritative Django state;
- Web/mobile request deduplication prevents overlapping socket-triggered thread/conversation refreshes;
- reconnect triggers authoritative reconciliation rather than relying on socket memory.

Decision: Express/Socket.IO remains delivery/fanout only. Django state is authoritative.

## Notifications — KEEP / HARDENED

Completed:
- persisted Django notification/read state retained;
- authenticated realtime broadcaster added;
- authoritative unread-count broadcasts after mark-read/read-all;
- recipient ownership regression coverage;
- Web socket contract aligned with backend payloads;
- Android/iOS notification API client added against existing Django endpoints;
- Android/iOS notification screen with loading, empty, error, retry, pull-to-refresh, unread, mark-one-read and mark-all-read states;
- Socket.IO notification events used only as refresh hints;
- mobile `/notifications` deep-link destination added;
- notification targets route to existing Profile or SabiForum destinations;
- Notifications remains contextual from Home rather than becoming a sixth primary tab.

Message/booking/schedule notification expansion remains intentionally deferred to later transaction phases where those lifecycle events are audited end-to-end.

## Message attachments — KEEP / HARDENED

Existing rules retained:
- 10 MB maximum size;
- JPEG, PNG, WebP, PDF and text/plain allow-list;
- participant-only message creation;
- closed-thread restrictions;
- bilateral block restrictions;
- pre-booking contact-detail protection.

Completed hardening:
- filename extension must match declared allowed MIME type;
- stored attachment display names are sanitised;
- spoofed executable-style filenames are rejected;
- regression coverage validates safe uploads and unsafe/path-style names.

No new upload service or persistence model was introduced.

## Web messaging — KEEP / REFACTORED

Completed:
- `/messages` uses the shared authenticated Phase 4 `AppShell`;
- duplicate global product header removed;
- counterparty labels derive from authoritative authenticated role;
- booking controls are role-aware while Django remains authoritative;
- persistent retry state added;
- directional `is_blocked_by_me` / `is_blocked_by_other` state consumed from Django;
- valid Block/Unblock action shown from authoritative state;
- composer, attachment and send controls are disabled while either side has an active block;
- message history remains readable while blocked;
- thread state is reconciled after Block/Unblock;
- in-flight thread/conversation request deduplication added;
- reconnect and realtime events use deduplicated authoritative refreshes.

## Mobile messaging — KEEP / REFACTORED

Completed across Android and iOS:
- existing client/professional counterparty behaviour retained;
- text/file/photo messaging, booking and scheduling retained;
- persistent inbox error + Retry state;
- persistent conversation error + Retry state;
- conversation loading state;
- directional Block/Unblock state from Django;
- composer disabled whenever either participant has an active block;
- message history remains readable while blocked;
- pull-to-refresh and socket refreshes deduplicated;
- reconnect reconciles from Django;
- primary messaging controls expose appropriate accessibility role/state semantics.

## Safety lifecycle — HARDENED

Existing Django models remain authoritative:
- `ConversationBlock` remains unique per blocker/blocked pair with active/inactive state;
- `ConversationReport` lifecycle remains `open / reviewed / dismissed / actioned`.

Completed:
- thread API exposes `is_blocked_by_me` and `is_blocked_by_other`;
- duplicate unresolved reports are rejected while an existing reporter/thread case is `open` or `reviewed`;
- a new report is allowed after the previous case is resolved;
- Web and mobile consume the same authoritative block state;
- regression coverage verifies block, unblock and report lifecycle behaviour.

No second moderation lifecycle was introduced.

## Single-source-of-truth rules

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
- Platform CI #214: FAIL — new attachment tests exposed pre-existing UUID realtime serialisation defect.
- defect fixed at the shared realtime boundary rather than weakening tests.
- Platform CI #216: PASS — UUID-safe realtime + attachment hardening.
- Platform CI #217: PASS — Web counterparty/shell/retry refactor.
- Platform CI #224: PASS — Android/iOS notification parity.
- Platform CI #227: PASS — block/report safety contract.
- Platform CI #228: PASS — mobile messaging safety/retry/deduplication.
- Platform CI #229: PASS — final Web Block/Unblock + deduplicated realtime/reconnect head.

Final #229 checks passed:
- backend deploy check, migration drift and journey tests;
- frontend TypeScript and lint;
- mobile typecheck;
- realtime check;
- design-system check;
- repository hygiene;
- waitlist syntax.

## Certification outcome

Phase 6 is COMPLETE / CERTIFIED for the scope defined by the Master Playbook. Web, Android and iOS now share one authoritative messaging, safety and notification model with hardened realtime delivery, consistent failure states and cross-platform Block/Unblock behaviour.

Later phases still own broader transaction notification coverage, analytics instrumentation without private message content, production observability and final Phase 10/12/13 hardening/certification. These are programme-level future gates, not Phase 6 blockers.
