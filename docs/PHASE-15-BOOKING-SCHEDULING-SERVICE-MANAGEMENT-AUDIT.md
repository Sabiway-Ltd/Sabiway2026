# Phase 15 — Booking, Scheduling & Service Management Audit

## Baseline

Phase 15 starts from merged Phase 14 revision `e68babfa1008373bf05c7b47812d6b1df9158c28`.

## Product decision

`/bookings` becomes the canonical service-management workspace after a booking agreement exists.

`/messages` remains the canonical conversation and safety surface. It may show compact booking context and links, but booking lifecycle, schedule negotiation, service progression and completed-work follow-up should be managed from `/bookings`.

This removes duplicated state-changing controls without changing backend authority.

## Preserve — mature backend authority

### Booking creation

- only the Client on the conversation can create the booking agreement;
- one booking agreement per conversation;
- agreed scope is required;
- agreed price is required and non-negative;
- currency uses a valid three-letter code;
- booking is linked to the authoritative thread/listing/job/response context.

### Participant scope

- only the booking Client and Professional can read/manage the booking;
- frontend visibility is not authorization;
- message/contact restrictions stay enforced independently.

### Booking state machine

Client transitions:
- pending → cancelled;
- accepted → cancelled or in progress;
- in progress → completed.

Professional transitions:
- pending → accepted or declined;
- accepted → cancelled or in progress;
- in progress → completed.

Invalid transitions fail on the backend.

### SabiPay coupling

Preserve SabiPay transition guards:
- funded escrow is required before service can move to `in_progress` when a transaction exists;
- funded work must be `in_progress`/delivered before booking completion;
- protected funded bookings cannot be cancelled outside controlled refund/dispute flow;
- booking progress mirrors into transaction progress/delivery without making the frontend payment authority.

### Scheduling

Preserve:
- scheduling only after booking acceptance;
- schedule must be in the future;
- both participants may propose;
- proposer cannot accept/decline their own proposal;
- only the other participant can decide;
- one active proposed schedule at a time; a new proposal supersedes the previous one;
- accepted schedule writes the booking date/time/timezone;
- declined proposal produces `change_requested` rather than pretending no scheduling history exists;
- booking audit and realtime events remain backend-generated.

### Phase 14 review boundary

Completed-work review remains eligible only after authoritative booking `completed` state. Phase 15 must not move that authority to the browser.

## Rework — frontend product architecture

### Current problem

The mature lifecycle controls currently live inside `MessagesClient`, while `/bookings` is primarily a summary/list plus Phase 14 review action. This causes:

- conversation and service-management responsibilities to be mixed;
- status/schedule actions to be difficult to discover outside an open thread;
- duplicated booking state between Messages and Bookings;
- direct token-bearing fetch logic in Messages;
- hard-coded styling in the most transactional workspace;
- weak mobile hierarchy for active work.

### Target `/bookings`

Each booking should show:
- counterpart and scope;
- agreed price/currency;
- clear booking status;
- clear schedule status;
- confirmed date/time/timezone when available;
- current active schedule proposal and who must respond;
- only backend-valid status actions for the current role/state;
- schedule proposal/change action only when backend state permits it;
- links to conversation and SabiPay without conflating those states;
- compact activity/audit context;
- Phase 14 completed-work review action after completion.

Required states:
- loading;
- genuine empty;
- unavailable/retry;
- pending acceptance;
- accepted, schedule not set;
- schedule proposed by me;
- schedule proposed by other participant;
- schedule change requested;
- schedule accepted;
- in progress;
- completed;
- cancelled/declined;
- transition rejected because SabiPay or backend authority prevents it.

### Target Messages

Messages should retain:
- conversation list/thread;
- message/attachment flow;
- block/report safety controls;
- realtime message events;
- compact booking summary;
- deep link to `/bookings`.

Move lifecycle and schedule mutation controls out once `/bookings` has parity.

## Accessibility/responsive requirements

- actions use descriptive labels, not colour alone;
- schedule proposal fields have persistent labels and helper/error association;
- status badges are textual;
- minimum 44px interactive targets;
- mobile order: status/context → next action → schedule → conversation/payment links → history/review;
- desktop may use summary + action rail but must preserve reading order;
- live success/error notices use appropriate status/alert semantics;
- no modal-only essential workflow.

## Phase 15 exit gate

Before merge:
- `/bookings` owns lifecycle and schedule management with shared authenticated API/session architecture;
- Messages retains conversation/safety and links to canonical booking management;
- no production frontend code invents allowed booking transitions;
- backend remains authority and rejects invalid/SabiPay-forbidden transitions;
- scheduling proposer/decision rules remain covered by backend tests;
- Phase 14 completed-review eligibility remains preserved;
- exact-head TypeScript, lint, build, Chromium, backend journeys and full Platform CI Release Gate pass.
