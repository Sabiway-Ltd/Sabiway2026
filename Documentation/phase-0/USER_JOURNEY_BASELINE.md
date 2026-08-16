# Phase 0 — User Journey Baseline

This baseline defines the journeys that every later capability phase must prove across Web, Android and iOS against the same backend and administrative rules.

| Journey | Current evidence | Phase 0 decision |
|---|---|---|
| Register / sign in / recover password | Web and mobile auth code exist; shared account behaviour implemented previously | KEEP + re-certify in Phase 2 |
| Role selection and persistence | Existing account role implementation exists; authority consistency requires explicit audit | REFACTOR if multiple role authorities remain |
| Create / view / edit profile | Web profile capability exists; mobile implementation state must be assessed from current main | KEEP/IMPROVE based on gap audit in Phase 3 |
| Verification / trust | Django verification domain plus web/mobile surfaces exist | KEEP + audit privacy, permissions and failure states in Phase 3 |
| Home / navigation / discovery / search | Existing surfaces are mixed and maturity varies | AUDIT in Phase 4; avoid duplicating search/navigation systems |
| Community contribution | Existing SabiForum web/mobile/backend capability exists | KEEP/IMPROVE in Phase 5 |
| Messaging / realtime / notifications | Socket.IO service and authenticated notification paths exist | KEEP provisionally; re-evaluate duplication and reliability in Phase 6 |
| Marketplace / services | Existing marketplace domain and user surfaces exist | KEEP/IMPROVE in Phase 7 after state-machine audit |
| Payments / SabiPay | Existing backend and user-surface code exists | KEEP/IMPROVE in Phase 8 after transaction/payment state audit |
| Reports / moderation / support | Existing moderation and staff surfaces exist | MERGE into one shared admin/control model in Phase 9 |
| Admin operations | Existing Django/staff tooling exists | KEEP as authority; improve permissions/audit/UX rather than create parallel admin apps |

## Mandatory cross-platform certification pattern

For every journey that reaches its implementation phase:

1. start on one client;
2. persist state in the shared backend;
3. continue on another client;
4. confirm identical authoritative state;
5. verify permissions server-side;
6. verify loading/error/offline/empty states;
7. verify admin/support visibility where relevant;
8. capture regression evidence.

## Phase 0 outcome

Phase 0 identifies and classifies the critical journeys. It does not certify them end-to-end. Certification occurs sequentially in the relevant phase and is repeated in the Phase 12 cross-platform journey gate.
