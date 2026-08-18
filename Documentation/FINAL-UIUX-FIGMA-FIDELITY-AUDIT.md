# SabiWay V2 — Final UI/UX & Figma Fidelity Audit

Status: **implementation complete; runtime visual certification pending**

## Design authority

This audit follows founder instruction, approved V2 requirements, the Master Cross-Platform Playbook, the current implementation and the supplied `Sabiway Project (2).zip` export.

The export contains visible mobile frames for client/provider home, categories, filters, jobs, messages, community, payments, reviews, sign-up, role selection, verification entry and sign-in states. It is now the primary visible UI reference for this pass.

A native Figma file key is still unavailable. That does **not** block visible exported-screen alignment, but prototype-only transitions, hidden variants and Figma component metadata remain uncertified.

## Product rules

- Preserve one SabiWay identity across web, Android and iOS.
- Mobile export is the product/visual foundation.
- Web deliberately translates the same hierarchy and role logic rather than stretching mobile frames.
- Functional parity does not equal visual parity.
- Decisions use KEEP / IMPROVE / REWORK / REPLACE / REMOVE.
- Accessibility and business rules override decorative pixel matching where the source design would weaken usability or safety.

## Confirmed visual language

- SabiWay green rounded header zones.
- White/light-grey content canvas.
- Orange used mainly as accent/promotion.
- Large friendly marketplace typography.
- Search-first discovery.
- Circular category affordances.
- Compact job/provider cards.
- Role-specific client/professional homes.
- Raised centre Home in the five-item mobile navigation.
- Messages/notifications outside permanent bottom-tab priority.
- Low-chrome authentication.
- Status/amount-first payment presentation.

## Mobile audit outcome

| Surface | Decision | Implementation outcome |
|---|---|---|
| Navigation | REWORK | Role-specific five-item structure with raised Home implemented |
| Client home | REWORK | Green header, search, category discovery and client action hierarchy implemented |
| Professional home | REWORK | Opportunity/search/trust hierarchy implemented |
| Authentication | REWORK | Full-canvas sign-in/sign-up and role-selection hierarchy implemented |
| Marketplace | REWORK | Search, categories, filters, service/job cards, job detail and create flows implemented |
| Messaging | REWORK | Searchable inbox, unread hierarchy, chat bubbles, composer, booking/schedule context implemented |
| SabiForum | REWORK | Green search header, composer, feed, comments/replies and moderation actions implemented |
| Profile/reputation | IMPROVE | Identity/trust-led profile presentation implemented; existing backend remains source of truth |
| Verification | REWORK | Export-inspired intro plus secure evidence/status/review journey implemented |
| SabiPay | REWORK | Summary, fee/escrow context, history, payout and dispute presentation implemented |

## Web audit outcome

The web frontend has been deliberately translated from the app language:

| Surface | Decision | Desktop/tablet translation |
|---|---|---|
| Public shell/landing | IMPROVE | Official logo, SabiWay green/orange identity, marketplace-first structure |
| Sign in / sign up | REWORK | Two-column brand/story + form layouts; Figma-derived role hierarchy |
| Marketplace | REWORK | Green discovery header, category rail, persistent desktop filters, service/job result workspace and detail dialogs |
| Messages | REWORK | Three-pane inbox + conversation + booking/schedule workspace |
| SabiForum | REWORK | Green search header, centre feed, contextual side rails and lightweight composer |
| Profile | IMPROVE | Green identity/reputation framing around shared profile functionality |
| Verification | IMPROVE | Trust/status/evidence workspace retains secure manual-review behaviour |
| SabiPay | IMPROVE | Amount/status/reconciliation/payout workspace retains complete financial controls |
| Help/legal/about/notifications/shared pages | KEEP / IMPROVE | Existing V2 responsive shared shell retained; no V1 shell restored |

## Accessibility and responsive gate

Final implementation continues to require:

- minimum 44px practical touch targets;
- visible web keyboard focus;
- sufficient contrast and no colour-only meaning;
- readable large-text wrapping;
- explicit loading, empty, error and recovery states;
- no normal horizontal page scrolling;
- responsive verification at 320, 360, 375, 390, 430, 768, 1024, 1280, 1366 and 1440+.

Desktop-specific patterns include persistent filters, wider search controls, multi-column discovery and split panes where they improve scanability. Mobile web collapses those patterns into stacked controls and single-column content.

## Implementation evidence

The detailed frame mapping is in `Documentation/FIGMA-EXPORT-SCREEN-MATRIX.md`. Machine-readable audit state is in `qa/uiux-fidelity-audit.json`. Platform CI runs the UI/UX evidence gate alongside frontend production build, mobile TypeScript, journey contracts, design-system sync and regression checks.

## Remaining certification boundary

Do **not** call the product pixel-perfect or fully Figma-certified yet. Final visual certification requires:

1. a green Platform CI run on the exact implementation head;
2. Chrome, Edge, Safari and Firefox visual review;
3. physical Android and iPhone review at representative sizes;
4. large-text and constrained-network checks;
5. resolution or explicit acceptance of differences discovered during runtime review.

The code-side Figma export alignment is complete when CI is green. Browser/device certification remains an external release gate rather than something CI can honestly manufacture.
