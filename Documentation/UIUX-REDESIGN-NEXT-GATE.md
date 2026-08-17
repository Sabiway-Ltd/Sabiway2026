# UI/UX Redesign — Exact Figma Export Gate

The founder has now supplied `Sabiway Project (2).zip`, containing exported screens for the client, provider, jobs, messaging, community, payments, reviews and authentication journeys.

## What changed

The previous UI/UX pass was forced to rely on the design report and selected screenshots. That limitation no longer applies to the exported frames.

The exact export confirms several design rules that must now drive implementation:

- role-specific client and provider homes;
- green rounded header zones;
- search-led marketplace entry;
- circular service-category navigation;
- image/reputation-led provider discovery;
- five primary mobile destinations with a raised centre Home control;
- role-specific `History` versus `Earning` navigation;
- Messages and Notifications outside the five primary bottom tabs;
- clean full-canvas authentication rather than a generic bordered card shell;
- compact job/message list-detail patterns;
- payment/status-first SabiPay presentation.

## Implementation gate

The full exported-screen matrix is recorded in `Documentation/FIGMA-EXPORT-SCREEN-MATRIX.md`.

Work must now proceed in this order:

1. Mobile shell and role-specific Home.
2. Auth and onboarding.
3. Categories, filter, My Jobs and job detail.
4. Messages and conversation.
5. Community feed, create post and post detail.
6. Professional profile, reviews and verification.
7. SabiPay payment method, summary, history, withdrawal and receipt.
8. Translate the approved mobile product language into responsive web layouts.

## Web rule

The mobile export is a design foundation, not a desktop template.

Web must preserve:
- brand identity;
- information hierarchy;
- role logic;
- state language;
- action priority;
- trust and transaction semantics.

Web may deliberately use:
- top/side navigation;
- multi-column layouts;
- split panes;
- persistent filter panels;
- tables for transaction/job history;
- wider detail views;
- modal workflows.

## Remaining Figma boundary

A native Figma file key is still not available. That no longer blocks direct visual comparison of the exported frames, but it does mean prototype-only transitions, component metadata and unexported variants cannot be certified.

No screen should be labelled fully certified until implementation, CI and real-device visual review have all passed.
