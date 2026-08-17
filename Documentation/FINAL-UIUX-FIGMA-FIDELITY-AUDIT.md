# SabiWay V2 — Final UI/UX & Figma Fidelity Audit

Status: active export-driven correction pass

## Design authority

This audit follows the founder instruction, approved V2 requirements, the Master Cross-Platform Playbook, the current implementation and the newly supplied `Sabiway Project (2).zip` export.

The export contains the actual mobile frames for client/provider home, categories, filters, jobs, messages, community, payments, reviews, sign-up, role selection, verification entry and sign-in states. This removes the previous blocker that forced the team to infer most of the product language from a design-report thumbnail set.

A native Figma file key is still unavailable. That no longer blocks direct visual comparison of the exported frames, but prototype-only transitions, component metadata and unexported variants remain uncertified.

## Product rule

- Preserve one SabiWay identity across web, Android and iOS.
- Use the exported mobile design as the primary product/visual foundation.
- Do not simply stretch mobile frames onto desktop.
- Web must deliberately translate the same hierarchy, role logic, trust language and action priority into desktop/tablet patterns.
- Functional parity does not equal visual parity.
- Every user-facing surface receives KEEP / IMPROVE / REWORK / REPLACE / REMOVE.

## What the export confirms

The Figma export establishes a stronger design direction than the earlier engineering shell:

- green rounded header zones;
- white/light-grey content canvas;
- orange accent/promotion treatment;
- prominent search entry;
- circular category affordances;
- image/reputation-led discovery;
- five-item bottom navigation with raised centre Home;
- client tabs: My Jobs / Community / Home / History / Profile;
- professional tabs: My Jobs / Community / Home / Earning / Profile;
- Messages and Notifications as contextual destinations rather than bottom tabs;
- role-specific Home layouts;
- minimal full-canvas authentication;
- compact job/message list-detail patterns;
- status-first payment history and receipt presentation.

## Current decisions

| Surface | Decision | Reason |
|---|---|---|
| Public web | IMPROVE | Strong V2 base, but must continue translating the approved mobile product language |
| Web marketplace | IMPROVE | Search/category structure is good; job ownership/detail/filter hierarchy needs closer mobile-to-web translation |
| Web community | IMPROVE | Functional parity exists; feed/composer/post-detail visual hierarchy still needs export alignment |
| Web messaging | IMPROVE | Functional workspace exists; exported conversation hierarchy should inform density and context panels |
| Web profile/verification/SabiPay | IMPROVE | State logic is complete; visual trust/payment hierarchy needs export alignment |
| Mobile auth | REWORK | Existing generic card shell differs materially from exported sign-in/sign-up/role screens |
| Mobile primary navigation | REWORK | Export uses role-specific five-item IA with raised Home; previous app used Market/Messages/SabiForum |
| Mobile client home | REWORK | Export is discovery-first, search-led and category/provider oriented |
| Mobile professional home | REWORK | Export is opportunity-first with search-for-jobs, recommended jobs and earnings context |
| Categories/filter | IMPROVE | Existing functions work; dedicated visual category/filter treatment should match export |
| My Jobs/job detail | REWORK | Existing marketplace combines discovery and owned-job management too heavily |
| Messaging | IMPROVE | Current features exist; list/thread hierarchy needs visual alignment |
| Community | IMPROVE | Current features exist; feed/composer/detail hierarchy needs export alignment |
| Professional profile/reviews | REWORK | Export is more image/reputation/service-led than current data-led presentation |
| Verification | IMPROVE | State machine is correct; visual step/status language needs closer alignment |
| SabiPay | IMPROVE | Financial controls are correct; payment method/summary/history/receipt visual hierarchy needs alignment |

## Corrections completed from the exact export in this branch

1. Mobile primary navigation changed to the exported five-destination information architecture.
2. Raised circular centre Home destination restored.
3. Client navigation now uses `History`; professional navigation uses `Earning`.
4. Messages and Notifications moved out of primary bottom navigation.
5. Home now uses the exported green rounded header hierarchy.
6. Greeting, contextual search entry and header message/notification actions added.
7. Circular service-category rail added.
8. Client Home now prioritises discovery and Post a Job.
9. Professional Home now prioritises job discovery and verification/trust.
10. A full exported-screen matrix is stored in `Documentation/FIGMA-EXPORT-SCREEN-MATRIX.md`.

## Responsive web translation

The web must continue supporting 320, 360, 375, 390, 430, 768, 1024, 1280, 1366 and 1440+.

Desktop should deliberately use:
- persistent top/secondary navigation;
- wider search/filter controls;
- list/detail split panes for jobs and messaging;
- multi-column service/provider discovery;
- persistent filters where useful;
- tables for history/operations where scanning improves;
- modal or side-panel workflows for focused forms.

Mobile-web should deliberately use:
- single-column content;
- stacked actions;
- collapsible filters;
- full-width forms;
- bottom-safe action spacing.

## Accessibility rules retained over visual imitation

Exact visual similarity must never reduce usability. Final screens still require:

- minimum 44px touch targets;
- sufficient contrast;
- readable hierarchy without colour alone;
- large-font resilience;
- accessible labels and roles;
- explicit loading/error/empty states;
- understandable recovery paths;
- no normal horizontal scrolling.

## Certification gate

An exported screen can be marked certified only after:

1. exact exported frame inspected;
2. current Android/iOS implementation compared;
3. spacing, hierarchy, typography, colour and action priority aligned;
4. accessibility retained or improved;
5. corresponding web translation reviewed where relevant;
6. CI passes on the exact head;
7. real-device visual review is recorded.

Current status: **exact export available, implementation correction underway, full visual parity not yet certified.**
