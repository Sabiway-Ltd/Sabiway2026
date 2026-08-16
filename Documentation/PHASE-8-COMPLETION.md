# Phase 8 — Disputes, reviews, notifications and operational controls

## Source-aligned outcome

Phase 8 completes the post-service trust lifecycle defined by the SabiWay AI Development Playbook: a dispute can stop release, authorised operations can triage and resolve it, only completed/released bookings can create reputation, notification history remains recoverable, and support escalation preserves notes and audit history.

## Delivered

### Disputes and money safety
- Participant-only disputes are accepted only after delivery and before SabiPay release.
- Opening a dispute moves the financial transaction to `disputed`, which blocks automatic/client release.
- Optional JPG/PNG/WebP/PDF/text evidence is encrypted with a dedicated Fernet key, SHA-256 checked and served only through authenticated participant/reviewer endpoints with `private, no-store` headers.
- Trust operators have queue, priority, response-due, assignment, notes and attributable decision records.
- Full provider release and full client refund are controlled authorised outcomes.
- Partial outcomes are represented in the data model but execution remains disabled until the product/payment policy and settlement adapter are formally approved. Phase 8 does not invent a split policy.
- Dispute decisions are written into the SabiPay transaction audit trail.

### Reviews and reputation
- Only the paying client can review a transaction after successful SabiPay release.
- One booking/transaction can create only one review.
- Published ratings recalculate provider `rating_average` and `rating_count`.
- Review reports feed a moderation queue; repeated reports can temporarily hide a review pending moderator action.
- Publish/hide/remove moderation recalculates provider reputation.

### Notifications and recovery
- In-app history is the authoritative notification record.
- Message, booking, verification, payment, dispute, review and support events can create persisted notifications.
- Delivery attempts are recorded separately for in-app, push and email.
- Push devices and user notification preferences have authenticated APIs.
- External push/email channels can be operationally disabled without losing the in-app record.
- Event keys prevent duplicate persisted lifecycle notifications for repeat-safe events.

### Support and operational escalation
- Users can open support cases linked to relevant transactions/disputes/reviews.
- Support queues record priority, response-due time, assignment, notes, escalation and resolution.
- Internal staff notes remain staff-only; user-visible notes remain available to the case owner.
- Critical escalation creates an operational fraud/risk signal.
- Fraud signals have dedicated permissioned review queues.
- Scoped rate limits cover dispute, review and support creation APIs.

### Web and mobile
- Responsive web `/trust` supports disputes, evidence upload, verified reviews, support history and notification preferences.
- Authenticated product navigation exposes Marketplace, Messages, SabiPay and Trust Centre.
- Mobile Trust Centre provides the same core dispute/review/support/preferences journeys and uses the existing native document picker for dispute evidence.
- Mobile navigation was changed to horizontally scroll rather than compress six destinations into unusable touch targets.

## User-journey evidence

| Journey | Implemented proof |
|---|---|
| Dispute | Delivered transaction → participant opens dispute → escrow becomes `disputed` → evidence/notes preserved → authorised decision → release or refund path → both parties notified. |
| Review | Released transaction → paying client creates one rating/review → provider aggregate recalculates → report/moderation can hide/remove abuse. |
| Notification recovery | Lifecycle event persists in-app first → push/email delivery recorded separately → disabled/failed secondary delivery cannot delete authoritative history. |
| Operational escalation | User opens support case → notes persist → authorised agent escalates → priority/audit preserved → high-risk signal can enter fraud queue. |

## Security and negative cases covered
- non-participant dispute/evidence access denied
- evidence encrypted at rest and integrity checked
- admin session and JWT paths both enforce evidence permissions
- no dispute after escrow release or outside the eligible state/window
- automatic release remains stopped while dispute is active
- partial money outcome blocked until policy approval
- non-client/provider review attempts rejected
- duplicate reviews rejected
- support references restricted to journeys belonging to the requester
- staff-only trust, moderation, support and fraud actions use explicit permissions
- external notification failure/disablement does not remove in-app history

## Operational defaults, not product promises
The playbook requires response-time reporting, rate limits and fraud signals but does not fix their numeric thresholds. The build therefore uses configurable defaults rather than hard-coded product commitments:
- dispute response target: 24 hours
- support response target: 24 hours
- high-value Nigeria risk signal: NGN 500,000
- repeated dispute signal: 3 disputes in 30 days
- review temporary-hide threshold: 3 open reports

These values must be approved/tuned operationally before launch.

## Production prerequisites / physical-device evidence still required
Code completion does not substitute for the Phase 8 runtime exit gate. Before production sign-off:
- configure a production-only `TRUST_EVIDENCE_KEY`
- configure and validate the approved push provider/mobile token-registration build and notification permission UX
- enable/test approved transactional email delivery policy
- verify push-denied, push-failure and email-failure recovery against authoritative in-app history
- test evidence capture/upload on supported iOS/Android devices, including large/slow/interrupted uploads
- test deep links, app background/foreground, offline recovery and expired sessions
- test 200% text scaling, screen-reader labels/focus order, touch targets and long/localised content
- run admin evidence viewing and support/dispute drills on desktop and supported tablet
- record device/build/browser versions plus screenshots/video and defect references
- complete support/UAT drills for every post-service trust journey

## Phase boundary
- Phase 8 does **not** add Stripe, FX or cross-border settlement. Those remain Phase 9.
- Phase 8 does **not** enable an unapproved partial dispute settlement formula.
- Phase 7 real-money production gates remain applicable to any monetary dispute outcome.
