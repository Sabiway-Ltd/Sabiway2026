# SabiWay V2 — Web Translation & Responsive Rules

The approved app design defines SabiWay's product identity and mobile journey logic. It does **not** define desktop layout. The V2 web client must preserve the same business states while using web-native interaction and information density.

## Breakpoint certification matrix

Every core web journey must be checked at: **320, 360, 375, 390, 430, 768, 1024, 1280, 1366, 1440+ px**.

Across all widths:
- no normal-content horizontal scrolling;
- keyboard navigation and visible focus must work;
- layouts must tolerate 200% zoom, long names and long content;
- actions must not rely on hover alone;
- loading, empty, error, offline/connection and permission states must remain understandable.

## Shared translation principles

### Navigation
- Mobile app: bottom navigation and stacked drill-down flows.
- Mobile web: compact top header plus context-sensitive bottom/sticky action only where useful.
- Tablet: top navigation with room for secondary controls.
- Desktop: persistent top navigation and/or contextual side navigation where information density justifies it.
- Never show a desktop sidebar merely because screen width exists; it must reduce navigation effort.

### Forms
- Mobile: one column, full-width fields, progressive steps for long forms.
- Tablet: one or two columns only where field relationships remain obvious.
- Desktop: constrained readable form width; related fields may sit side-by-side. Do not stretch inputs edge-to-edge across large displays.
- Preserve entered data after recoverable errors/network loss.

### Dialogs and sheets
- Mobile app/mobile web: bottom sheets or full-screen tasks for complex flows.
- Desktop: modal/dialog for short decisions; dedicated page or side panel for complex/long-running work.
- Destructive actions require explicit confirmation and safe focus return.

## Core V2 pattern translations

### Client home / discovery
**Mobile:** search, categories, recommendations and providers in a single vertical flow.

**Web:**
- 320–430: single column, horizontal category scroller only if fully keyboard-operable; otherwise wrapping category grid.
- 768: 2-column cards where content length permits.
- 1024+: search/filter region + responsive result grid; optional secondary recommendation rail only if it remains useful.
- Filters become a drawer/sheet on narrow screens and a persistent/filter-popover region on desktop.

### Professional home / opportunities
**Mobile:** prioritised job/opportunity cards and account/trust status.

**Web:**
- narrow: stacked opportunity cards with primary status/action visible;
- tablet: 2-column opportunity grid;
- desktop: filter/sort controls plus dense card/list view, with details opening in-page or in a side panel where this reduces context switching.

### Professional profile
**Mobile:** stacked identity, verification, rating/review, service and action sections.

**Web:**
- narrow: preserve mobile order;
- desktop: identity/trust summary + primary action in a stable header/side region, main content for services/reviews/about;
- verification badges must have text meaning, not colour alone.

### Job posting / request
**Mobile:** step-based, vertically stacked inputs.

**Web:**
- retain logical steps and progress rather than presenting one huge form;
- desktop can group related fields in two columns but must preserve the same validation and transaction rules;
- confirmation/summary remains a distinct step before submission.

### My Jobs / marketplace transaction status
**Mobile:** status cards/tabs.

**Web:**
- narrow: cards;
- desktop: list/table may be used only when statuses, actions and accessibility remain clear;
- transaction state is always server-authoritative; UI labels never infer state from local navigation history.

### Messaging
**Mobile:** conversation list → full conversation screen.

**Web:**
- 320–767: same drill-down model as app;
- 768+: conversation list and active conversation split pane;
- 1024+: optional contextual job/provider summary panel if relevant;
- unread, sending, failed, retry, blocked/reported and connection-loss states must be explicit.

### SabiForum / community
**Mobile:** single readable feed with create-post entry.

**Web:**
- narrow: single feed;
- tablet/desktop: central feed with optional navigation/context rails;
- reading column must remain constrained; wider viewport must not create excessively long line length;
- composer may be inline or modal on desktop, full-screen/sheet on mobile.

### SabiPay / payments
**Mobile:** focused wallet/payment/transaction steps.

**Web:**
- narrow: stacked cards and step flow;
- desktop: balance/summary region plus transaction/history content; payment confirmation remains focused and cannot be buried in a dashboard;
- pending, processing, held/escrow, completed, failed, refunded/disputed states require explicit text and must come from the shared backend.

### Payment history / receipts
**Mobile:** card/list history and receipt detail.

**Web:**
- narrow: cards;
- desktop: accessible table/list with responsive detail panel/page;
- monetary amounts use Naira formatting appropriate to the transaction; timestamps must remain unambiguous.

### Reviews
**Mobile:** stacked review list and form.

**Web:** summary distribution may sit beside the review list on larger screens; review submission remains a focused form with validation and clear eligibility rules.

### Authentication/onboarding
**Mobile:** focused single-column screens.

**Web:** use a centred constrained auth panel, optionally paired with low-priority trust/brand context at desktop widths. The form remains the dominant task; decorative content must not push it below the fold.

## Shared component behaviour

- Buttons: minimum 44px target; primary, secondary, destructive and ghost hierarchy.
- Inputs: visible labels; helper/error text associated programmatically; no placeholder-only labels.
- Cards: content grouping, not a universal container for every piece of text.
- Badges: status communicated by text/icon as well as colour.
- Tabs: keyboard-operable and not used when normal navigation is semantically clearer.
- Toasts: supplementary feedback only; critical errors must also appear near the affected task.
- Skeletons: match the approximate final layout and respect reduced motion.
- Empty states: explain why content is empty and offer the next useful action when one exists.

## Accessibility baseline

Target: **WCAG 2.2 AA**.

Shared implementation must cover:
- semantic landmarks/headings;
- visible focus;
- keyboard access;
- 44px interactive targets where applicable;
- sufficient contrast;
- reduced motion;
- screen-reader names/states;
- error identification not based on colour;
- logical focus after dialogs/navigation/recovery;
- zoom/reflow without loss of content or actions.

## Performance/network baseline

For Nigerian mobile-network reality and lower-range devices:
- paginate large lists;
- lazy-load non-critical content/images;
- avoid large decorative media in critical journeys;
- preserve form state across recoverable failures;
- expose retry states rather than indefinite spinners;
- do not duplicate requests on repeated taps;
- favour server-authoritative data with appropriate caching rather than large client payloads.
