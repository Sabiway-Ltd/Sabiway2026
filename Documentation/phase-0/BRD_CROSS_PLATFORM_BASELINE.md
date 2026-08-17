# Phase 0 — BRD Cross-Platform Baseline

Source: `SabiWay V2 Business Requirements Document` supplied by the Product Owner.

## Interpretation rule

The BRD was originally written around the V2 mobile application. For the current programme, that wording does **not** reduce product scope to mobile. The Master Playbook and Product Owner clarification require one SabiWay platform delivered through **Web + Android + iOS**.

Therefore:

- BRD business requirements define the product behaviour/outcomes;
- the Master Playbook defines cross-platform delivery, architecture and quality gates;
- requirements apply across all three clients unless a genuine platform-specific exception is documented.

## Product problem and value proposition

SabiWay addresses fragmented, informal and low-accountability discovery of Nigerian service providers by combining:

- structured service discovery;
- verified provider trust signals;
- secure messaging and negotiation;
- booking and scheduling;
- SabiPay escrow protection;
- ratings/reviews and reputation;
- admin oversight and dispute handling;
- SabiForum as supporting community context.

SabiForum is explicitly a supporting feature and must not replace provider verification, booking, payment or platform controls.

## Core geographic/user flows

The V2 platform must support:

1. Nigeria client → Nigeria provider;
2. diaspora client → Nigeria provider;
3. Nigeria provider → diaspora client where service delivery permits;
4. diaspora client → diaspora Nigerian provider within the same city/country or remotely.

Discovery must therefore be location-aware without assuming every transaction is Nigeria-local.

## V2 MVP capability baseline

| Capability | Cross-platform interpretation |
|---|---|
| Registration/authentication | One shared identity and account state exposed consistently on Web, Android and iOS. |
| Profiles | Client and professional/provider profiles share one authoritative backend record and trust state. |
| Service listings/categories | One catalogue/domain model; platform-specific presentation only. |
| Search/discovery | Search by service, problem/keyword and location; verified providers prioritised where business rules require it. |
| Job posting/requests | Clients can create structured service needs; relevant providers can discover/respond; job can convert to booking. |
| Messaging/negotiation | Secure in-platform messaging before booking, with retained context and optional policy controls on contact sharing. |
| Booking/scheduling | Shared booking lifecycle/status and mutually visible dates/times. |
| SabiPay | Shared transaction/payment/escrow state; clients pay after agreement; release/refund/dispute rules remain backend authoritative. |
| Ratings/reviews | Reviews tied to completed services; aggregated reputation and moderation. |
| Verification/trust | Provider document submission, admin review/approval/rejection/suspension, auditable trust controls. |
| SabiForum | Supporting discovery/trust/community layer linked to, but not substituting for, marketplace controls. |
| Admin | One operational/trust authority for verification, moderation, disputes, payment intervention and audit. |

## BRD constraints to retain

- launch may begin with limited cities/categories;
- city-level geolocation is acceptable initially;
- verification/disputes may be partly manual during early release;
- trust and service quality take priority over rapid expansion;
- advanced features such as real-time GPS tracking, voice/video calls, subscriptions and advanced analytics are not assumed MVP requirements;
- future enhancements require explicit prioritisation rather than accidental scope creep.

## Product acceptance principle

A requirement is not complete merely because one client has a screen. Completion requires the authoritative backend behaviour plus relevant Web, Android and iOS journeys, appropriate admin capability, failure states, accessibility, security, performance and test evidence as required by the Master Playbook.
