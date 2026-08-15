# Phase 0 user journey baseline

This phase records the journeys that later phases must prove on both web and mobile against the same backend.

| Journey | Web baseline | Mobile baseline | Admin/backend dependency |
|---|---|---|---|
| Register, verify and sign in | Existing implementation requires test evidence | Not yet implemented | Shared identity, tokens and account state |
| Create and manage profile | Existing implementation requires test evidence | Not yet implemented | Shared profile record and media |
| Browse feed and post content | Existing implementation requires test evidence | Not yet implemented | Shared post, reaction and moderation rules |
| Search people, content and marketplace | Partial/unknown; requires route and API audit | Not yet implemented | Shared search contract |
| Receive realtime notifications | Existing Socket.IO service; security hardening required | Not yet implemented | Shared event contract and authenticated broadcast |
| Buy, sell and manage marketplace activity | Product-required; implementation completeness unverified | Not yet implemented | Shared catalog, order, payment and admin workflows |
| Admin moderation and operations | Existing Django/admin surface requires role audit | Same admin system; no separate mobile admin | Shared permissions, audit trail and business rules |

Phase 0 outcome: journeys are identified, but none is certified end-to-end. Certification begins when environments and test accounts are available and continues at every implementation phase.
