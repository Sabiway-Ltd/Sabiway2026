# SabiWay V2 — Figma Export Screen-by-Screen UI/UX Matrix

Status: implementation complete for exported screen families; runtime visual certification pending  
Source: `Sabiway Project (2).zip` supplied by the founder  
Scope: mobile client/provider/community/jobs/messages/payments/reviews/authentication plus deliberate web translations.

## Design language confirmed by the export

- SabiWay green header zones with rounded lower edges.
- White/light-grey body canvas.
- Orange as accent/promotional colour, not the default primary action.
- Large friendly consumer-marketplace type hierarchy.
- Circular category affordances and compact content cards.
- Role-specific client and professional homes.
- Five-item mobile navigation with a raised Home destination.
- Client tabs: My Jobs / Community / Home / History / Profile.
- Professional tabs: My Jobs / Community / Home / Earning / Profile.
- Messages and notifications as contextual destinations rather than permanent bottom tabs.
- Clean low-chrome authentication.
- List/detail patterns for jobs and messaging.
- Status/amount-first payment and payout screens.

## Exported-frame implementation matrix

| Export family | Mobile implementation | Web translation | Decision | Runtime gate |
|---|---|---|---|---|
| `Homepage.png`, `Client Homepage.png` | Reworked green header, greeting, search, categories, role-specific actions | Landing/marketplace use wider search/discovery and desktop information density | REWORKED | Browser/device visual review |
| `Provider Homepage.png`, `Provider Homepage-1.png` | Opportunity-first professional home with jobs/trust/payment destinations | Marketplace/profile/payment surfaces provide wider professional workspace | REWORKED | Browser/device visual review |
| `Categories.png`, `Popular Categories...` | Circular category rail and active category state | Responsive horizontal/mobile rail and 8-column desktop category rail | REWORKED | Browser/device visual review |
| `Filter.png` | Dedicated modal filter sheet | Persistent desktop filter sidebar, compact responsive search/filter controls | REWORKED | Browser/device visual review |
| `Post a job.png` | Green-header stepped create sheet | Responsive green-header create panel | REWORKED | Browser/device visual review |
| `Job Request.png`, `My jobs.png`, `View job information.png`, `Close job ads.png` | Compact job cards, job detail/response sheet, lifecycle actions retained | Desktop list/detail-style job rows and modal detail/response | REWORKED | Browser/device visual review |
| `Message.png`, `Open Message*.png` | Searchable inbox, unread hierarchy, clean bubbles, booking tab/composer | Three-pane desktop inbox/chat/booking workspace | REWORKED | Browser/device visual review |
| `Community.png`, `Create post.png`, `Post preview.png` | Green header/search, minimal composer, compact feed, comments/replies | Centre feed with contextual side rails and desktop composer/search | REWORKED | Browser/device visual review |
| `View proffesional.png` | Image/identity/trust-led own profile shell | Strong green identity header and wider reputation/profile workspace | REWORKED | Browser/device visual review |
| `Proffesional + Review*.png` | Review/trust journeys remain transaction-gated; profile hierarchy prepared for reputation | Desktop trust/review surfaces retain verified-booking controls | IMPROVED | Browser/device visual review |
| `success page For professionals.png` | Verification intro/status/review/resubmission reworked | Existing desktop verification already uses status, evidence and review columns; aligned to shared green/trust hierarchy | IMPROVED | Browser/device visual review |
| `Payment method.png`, `Summary.png` | SabiPay summary, fee disclosure, escrow context, Paystack checkout | Desktop SabiPay preserves amount/fee/status hierarchy and secure checkout | IMPROVED | Browser/device visual review |
| `Payment Histor.png`, `Withdraw.png`, `Download Reciept.png` | Balance, history, payout account and status-led transaction UI | Desktop transaction/payout workspace retains reconciliation, receipt and payout actions | IMPROVED | Browser/device visual review |
| `Signup .png`, `Select ypur role...` | Full-canvas auth and large role choices | Two-column desktop brand/story + form with large role cards | REWORKED | Browser/device visual review |
| `SIgnin active/error/processing.png` | Minimal sign-in hierarchy with preserved error/loading behaviour | Two-column desktop sign-in with same action order and accessible states | REWORKED | Browser/device visual review |

## Mobile implementation completed in this pass

Navigation, client home, professional home, authentication, role selection, marketplace search/discovery, categories, filters, service cards, job cards, job detail/response, post-job/service forms, messaging, booking/scheduling context, community feed/composer/comments, profile/trust presentation, verification, SabiPay history/summary/payout and dispute presentation.

## Web translation completed in this pass

The web is not a stretched mobile frame. The exported mobile language has been translated into desktop/tablet patterns:

- marketplace: strong green discovery header, category rail, persistent desktop filters, compact service/job results and detail dialogs;
- messaging: searchable inbox + conversation + booking/schedule context in a three-pane desktop workspace;
- SabiForum: green search header, centre feed, desktop side context and lightweight composer;
- auth: two-column desktop brand/story and form layouts, with Figma-derived role hierarchy;
- profile: green identity/reputation framing around the existing shared profile functionality;
- verification and SabiPay retain their full production journeys while following the same trust/status hierarchy;
- public landing continues the same SabiWay green/orange, marketplace-first, role-aware design system.

## Accessibility and responsive rules retained

- 44px+ interactive targets where appropriate.
- visible keyboard focus on web.
- no colour-only status communication.
- loading, empty, error and retry states remain explicit.
- mobile layouts collapse to one column; desktop uses persistent filters/context panes where useful.
- target widths remain 320, 360, 375, 390, 430, 768, 1024, 1280, 1366 and 1440+.

## Certification boundary

The exported PNG frames are sufficient to guide and compare visible layout hierarchy, colour, typography, spacing and action priority. They do not expose native Figma prototype transitions, component metadata or hidden variants.

Do **not** label the whole product pixel-perfect or fully Figma-certified until:

1. Platform CI passes on the exact implementation head;
2. Chrome, Edge, Safari and Firefox are visually reviewed;
3. physical Android and iPhone renders are reviewed at representative sizes;
4. critical large-text and constrained-network states are checked;
5. any differences found during runtime review are recorded and resolved or deliberately accepted.
