# SabiWay V2 — Figma Export Screen-by-Screen UI/UX Matrix

Status: active implementation audit  
Source received: `Sabiway Project (2).zip` on 17 August 2026  
Scope: exported mobile client, provider, community, messaging, jobs, payments, reviews and authentication screens.

## Design principles confirmed by the export

The export establishes a clearer visual system than the earlier implementation inferred from the design report:

- strong SabiWay green header zones with rounded lower corners;
- white/light-grey body canvas;
- orange used as an accent and promotional highlight, not as a general-purpose primary action colour;
- large, friendly consumer-marketplace typography;
- circular category affordances;
- image-led service/provider discovery;
- five-item mobile primary navigation with a raised circular Home destination;
- Messages and Notifications treated as contextual/header destinations rather than bottom-tab destinations;
- client bottom navigation: My Jobs / Community / Home / History / Profile;
- professional bottom navigation: My Jobs / Community / Home / Earning / Profile;
- role-specific home experiences rather than one generic dashboard;
- clean, low-chrome sign-in/sign-up screens;
- transaction/payment views that prioritise status, amount and recovery clarity;
- list/detail patterns for jobs and messaging.

## Screen matrix

| Exported frame | Current implementation | Decision | Main fidelity gap | Web translation |
|---|---|---|---|---|
| `Homepage.png` | `mobile/src/home/HomeScreen.tsx` | REWORK | Current home was card-led and lacked Figma header/search/category/navigation hierarchy | Desktop home should use the same role logic with a wider search/discovery layout and persistent account controls |
| `Client Homepage.png` | `HomeScreen.tsx` + marketplace | REWORK | Client discovery needs green header, contextual search, categories, nearby-service emphasis and Post a Job prominence | Use 2-column hero/search + service discovery; do not copy bottom tabs |
| `Provider Homepage.png` | `HomeScreen.tsx` + marketplace | REWORK | Provider needs search-for-jobs hierarchy, recommended jobs, earnings/verification prominence | Use opportunity dashboard with search, job feed and earnings/trust summary |
| `Provider Homepage-1.png` | `HomeScreen.tsx` | IMPROVE | Provider empty/loading variants need same visual structure | Preserve desktop skeleton/empty states inside the same dashboard shell |
| `Categories.png` | Marketplace categories | IMPROVE | Figma is more visual and category-led than current generic cards | Use responsive category grid with richer icon/image treatment |
| `Popular Categories for client.png` | Home/marketplace | IMPROVE | Current quick categories are functional but visually lighter | Use wider desktop category tiles while preserving the circular mobile language |
| `Popular Categories for client-1.png` | Home/marketplace | IMPROVE | Selected/category-result relationship needs clearer hierarchy | Desktop can use category rail + result grid |
| `Filter.png` | Marketplace search/filter | IMPROVE | Mobile needs dedicated filter sheet semantics and grouped controls | Desktop should expose filters persistently in sidebar/panel |
| `Post a job.png` | `MarketplaceCreateSheet` | IMPROVE | Form hierarchy and progress/action placement differ | Desktop can use modal or split-panel form with persistent summary |
| `Job Request.png` | Marketplace jobs | IMPROVE | Figma uses clear job-state tabs and compact cards | Desktop should use tabbed table/list with detail drawer |
| `My jobs.png` | Marketplace jobs | IMPROVE | Current marketplace combines discovery and owned-job management | Web should separate discovery from My Jobs workspace while sharing backend |
| `View job information.png` | Marketplace selected-job sheet | REWORK | Current detail sheet is function-first; Figma has richer job detail, media and close-job action | Desktop list/detail split pane |
| `Close job ads.png` | Marketplace/admin lifecycle | IMPROVE | Transaction/bank-detail confirmation styling is not aligned | Desktop modal with amount/account summary and irreversible-action warning |
| `Message.png` | `MessagingScreen` | IMPROVE | Need stronger green list header, search and unread hierarchy | Desktop 2-pane conversation workspace |
| `Open Message.png` | `MessagingScreen` | IMPROVE | Thread spacing/bubbles/header differ from export | Desktop conversation pane with booking context side panel |
| `Open Message-1.png` | `MessagingScreen` | IMPROVE | Alternate conversation state needs exported spacing and action hierarchy | Same shared thread component |
| `Open Message-2.png` | `MessagingScreen` | IMPROVE | Conversation variation still needs parity validation | Same shared thread component |
| `Community.png` | `CommunityScreen` | IMPROVE | Figma feed has strong green header/search and compact post actions | Desktop feed with centre column + contextual sidebar |
| `Create post.png` | Community composer | IMPROVE | Composer should be more minimal and media-first | Desktop modal or inline composer with preview |
| `Post preview.png` | Post detail/community | IMPROVE | Comment/action hierarchy needs visual alignment | Desktop detail view can use wider comments column |
| `Payment method.png` | `SabiPayScreen` | IMPROVE | Figma prioritises payment method selection and escrow context | Desktop checkout panel with amount/payment summary |
| `Summary.png` | `SabiPayScreen` / booking summary | IMPROVE | Summary needs image/service/amount/status grouping | Desktop side-by-side service and payment summary |
| `Withdraw.png` | `SabiPayScreen` | IMPROVE | Provider payout form hierarchy differs | Desktop compact payout form with account verification state |
| `Payment Histor.png` | `SabiPayScreen` | IMPROVE | Figma has status-led transaction list and top balance card | Desktop table with status filters and balance summary |
| `Download Reciept.png` | receipt/history | IMPROVE | Receipt layout should use SabiWay brand and concise transaction hierarchy | Printable desktop receipt with same data order |
| `View proffesional.png` | profile/public professional | REWORK | Current profile is more data-led; export is image/reputation/service-led | Desktop profile should use large trust summary, service/review columns |
| `Proffesional + Review.png` | trust/reviews | IMPROVE | Review composition needs star-first, low-friction hierarchy | Desktop modal/card while preserving verified-booking rule |
| `Proffesional + Review-1.png` | trust/reviews | IMPROVE | Submitted rating state needs exported feedback hierarchy | Desktop confirmation state |
| `Signup .png` | `AuthFlow` | REWORK | Current auth card is generic; export is full-canvas, brand-centred and image-led | Web should use two-column brand/story + form layout, not mobile frame stretch |
| `Select ypur role as proffesional.png` | `AuthFlow` role screen | REWORK | Export uses two large role choices with simple continuation | Web can use two large role cards side-by-side |
| `success page For professionals.png` | verification/onboarding | IMPROVE | Export shows focused identity-verification call to action | Web should use step/progress panel with clear next action |
| `SIgnin active.png` | `AuthFlow` | REWORK | Current bordered card differs from export minimal full-canvas sign-in | Web two-column auth shell; mobile keeps centred logo/form |
| `SIgnin error.png` | `AuthFlow` | IMPROVE | Error should remain inline and field-specific without shifting layout excessively | Same web auth shell with accessible error summary + inline errors |
| `SIgnin processing.png` | `AuthFlow` | IMPROVE | Processing/disabled state must retain layout and visible progress | Same web auth shell with deterministic loading state |

## Confirmed implementation corrections in this branch

1. Mobile primary navigation changed to the exported five-destination structure.
2. Raised circular Home destination restored as the centre visual anchor.
3. Client navigation now exposes `History`; professional navigation exposes `Earning`.
4. Messages and Notifications no longer consume primary bottom-navigation slots.
5. Client and provider Home are now visually role-specific.
6. Home uses the exported green header, greeting, contextual search entry, category rail and promotion hierarchy.
7. Client Home prioritises service discovery and Post a Job.
8. Provider Home prioritises jobs and professional trust/verification.

## Required next implementation sequence

Priority 1 — auth and onboarding visual shell  
Priority 2 — marketplace categories, filters, My Jobs and job detail  
Priority 3 — messaging list/thread visual alignment  
Priority 4 — community feed/composer/post detail  
Priority 5 — professional profile/reviews/verification  
Priority 6 — SabiPay payment method, summary, history, withdrawal and receipt  
Priority 7 — corresponding web translation of each approved mobile pattern

## Certification rule

An exported frame may only be marked **visual-match certified** after:

- current implementation is inspected against that exact exported frame;
- layout hierarchy, typography, spacing, colour, action priority and states are checked;
- accessibility requirements are retained or improved;
- Android and iOS render correctly;
- the corresponding web experience deliberately translates the same product logic;
- CI passes;
- real-device visual review is recorded.

The export is sufficient for direct visual comparison of the frames listed above. It is not sufficient to certify prototype-only transitions or Figma component metadata that are not present in the export.
