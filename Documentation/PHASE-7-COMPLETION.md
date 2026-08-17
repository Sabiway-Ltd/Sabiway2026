# Master Phase 7 — Marketplace / Services / Core SabiWay Transactions

## Status
Implementation candidate. Final completion is conditional on the exact PR head passing Platform CI and the phase merge gate.

## Source authority
This phase follows **SabiWay V2 — Master Cross-Platform Build, Audit, Design & User-Testing Readiness Playbook**. Phase 7 owns the main value-exchange journey:

`Discover → Inspect → Assess provider → Review conditions → Initiate → Confirm → Track → Complete → Review/support`

Payment reconciliation, financial failure handling and disputes remain Master Phase 8. Shared admin consolidation, moderation and support operations remain Master Phase 9.

## Existing-system audit and decisions

| Component | Existing state | Decision | Phase 7 reason |
|---|---|---|---|
| Service/category/job discovery | Mature V2 web + mobile foundation | KEEP / IMPROVE | Search, location, service and job discovery already satisfy the transaction entry need. |
| Message threads and secure negotiation | Shared Django/DRF + realtime, web/mobile clients | KEEP | Existing Phase 6 communication is the correct transaction negotiation layer. |
| BookingRequest | Scope, price, currency, role-bound states, scheduling | KEEP / CERTIFY | Already provides the core booking agreement and lifecycle. |
| BookingAudit | Persisted immutable-style events | KEEP | Provides state traceability required by Phase 7. |
| Web Messages + SabiPay handoff | Booking creation/acceptance/scheduling plus funded service controls | KEEP / IMPROVE | Web can progress from agreement to tracked work without inventing a second transaction model. |
| Mobile Messages | Booking, scheduling, lifecycle actions | KEEP | Strong transaction workspace already exists. |
| Mobile Marketplace → Messages | Discovery existed but service-detail transaction entry was incomplete | IMPROVE | Phase 7 now starts the secure service conversation directly and converts job responses into conversations. |
| Booking user notifications | Realtime booking events existed; persisted lifecycle history was incomplete | IMPROVE | Audited booking/schedule events now generate persisted recipient notifications. |
| SabiPay booking transition guard | Existing guard used UUID `pk` as a create/update test | FIX | UUIDs are assigned before first save; `_state.adding` is now used. |

## Delivered

### Shared backend
- Retains one authoritative `BookingRequest` model for client/professional transactions.
- Retains role-bound creation, acceptance, decline, cancellation, in-progress and completion rules.
- Retains linked service/job/thread context, agreed scope, agreed price, currency and schedule.
- Retains booking/schedule audit events.
- Adds persisted booking lifecycle notifications driven from authorised `BookingAudit` events.
- Expands notification vocabulary for transaction-oriented events while keeping community notification compatibility.
- Makes system-originated notification actors safe for future operational events.
- Corrects UUID create/update detection in the SabiPay transition guard.

### Web
Existing V2 web transaction journey is deliberately retained:
1. Marketplace service/job discovery.
2. Secure conversation creation.
3. Scope and price negotiation in Messages.
4. Client creates booking summary.
5. Professional accepts/declines.
6. Both participants schedule the work.
7. NGN accepted bookings hand off to SabiPay for funded start/delivery controls.
8. Booking and payment status remain visible through Messages/SabiPay.

The web client already contains loading, empty and recoverable error states and responsive multi-column behaviour; Phase 7 does not replace it merely to create new code.

### Android / iOS shared Expo client
- Marketplace service detail now gives clients **Message professional** as the direct transaction entry action.
- Service conversation creation uses the shared Django thread endpoint.
- A professional job response now immediately creates/opens the corresponding auditable conversation.
- Marketplace exposes **Messages & bookings** as an explicit tracking route.
- Removes stale copy claiming messaging/booking is a future phase.
- Existing mobile Messages continues to provide scope/price agreement, booking acceptance/decline, scheduling, lifecycle controls, safety actions, retry/empty/loading states and responsive compact/wide layouts.

## State and phase boundary
Core service booking states currently used are pending, accepted, declined, cancelled, in progress and completed.

The Master Playbook also lists failed and disputed where relevant. Phase 7 does **not** invent a second generic booking failure/dispute model: payment pending/failure/recovery and dispute handling are explicitly owned by Master Phase 8. Those states are implemented against the financial transaction where they are meaningful. Pre-service non-progression remains represented by declined/cancelled booking states.

## Permissions and safety
- Only a client participant creates a booking agreement.
- Only booking participants can read/update their booking.
- Professional/client transition rules remain server-side.
- Conversation blocking/reporting and attachment safety remain in force.
- Provider verification gates remain server-side.
- SabiPay prevents work starting without confirmed escrow funding where the financial transaction applies.
- Transaction notifications are derived from authorised audit events rather than trusting client-side state.

## Phase 7 certification tests
`marketplace/test_phase7_transactions.py` adds focused coverage for persisted booking-created notification, one recipient notification per audited state change, schedule-event notification/UUID target serialisation, and UUID booking creation not being mistaken for an update by SabiPay guards.

Existing marketplace tests continue to cover discovery, role boundaries, direct negotiation, contact policy, booking creation, professional acceptance, scheduling, job-to-thread-to-booking conversion, blocking/reporting, outsider denial and attachment safety.

## Cross-platform journey matrix

| Journey | Web | Android | iOS | Backend/Admin |
|---|---|---|---|---|
| Discover service/job | Yes | Yes | Yes | Shared API/admin visibility |
| Inspect provider/service | Yes | Yes | Yes | Shared listing data |
| Start secure conversation | Yes | Yes | Yes | Participant thread permissions |
| Job response → conversation | Yes | Yes | Yes | Shared job/thread contract |
| Agree scope/price/currency | Yes | Yes | Yes | Booking validation |
| Accept/decline | Yes | Yes | Yes | Server transition rules |
| Schedule/change schedule | Yes | Yes | Yes | Audit + realtime + persisted notification |
| Track active work | Yes | Yes | Yes | Booking/SabiPay state is source of truth |
| Complete funded work | Yes | Yes | Yes | SabiPay/booking transition controls |
| Audit state changes | User-visible status | User-visible status | User-visible status | BookingAudit + admin |

## Responsive/accessibility evidence
Code-level review confirms web marketplace/messages use responsive layouts; Expo marketplace uses bounded content width/native scrolling; Messaging switches between compact tabbed and wide multi-pane layouts; and the journey contains loading, empty, error and retry states.

Exact manual device-matrix evidence at 320/360/375/390/430/768/1024/1280/1366/1440+, Android hardware and iPhone hardware is still a later release/UAT evidence item; it is not fabricated here.

## Design evidence
The implementation retains the established SabiWay V2 green/amber, Inter-led, warm-card design language across web and mobile. The exact SabiWay Figma file key is not available to this implementation session, so frame-by-frame Figma parity is **not claimed**.

## Exit gate
Master Phase 7 is complete only when Platform CI is green on the exact PR head, migration drift is zero, backend regression tests pass, frontend TypeScript/lint pass, mobile TypeScript passes, realtime/repository-hygiene checks pass, and the PR is mergeable and merged to `main`.

Manual real-device/accessibility/product-owner acceptance remains part of the later cross-platform certification and controlled-user-testing release gates.
