# SabiWay Design System and UI/UX Rules

This document defines the current SabiWay visual and interaction baseline for web and mobile. It is intended for frontend engineers, mobile engineers, UI/UX reviewers and AI coding sessions.

The design foundation is made from three sources used together:
1. the shared canonical token system under `design-system/`;
2. the supplied SabiWay mobile Figma export and the implementation matrix under `Documentation/`;
3. the implemented responsive web translation of that mobile product language.

Code-level implementation does **not** automatically prove pixel-perfect runtime fidelity. Physical-device/browser certification remains separate evidence.

## 1. Design intent

SabiWay should feel:
- trustworthy;
- local and human rather than generic SaaS;
- simple enough for first-time marketplace users;
- clear about money, trust and status;
- distinctly useful for both Clients and Professionals;
- usable under realistic mobile and lower-bandwidth conditions.

The UI should prioritise task clarity over decoration.

## 2. Core brand language

### Primary colour
SabiWay green: `#008753`.

Use primarily for:
- primary actions;
- trusted/active brand surfaces;
- selected navigation;
- important positive brand emphasis.

Do not use green indiscriminately on every surface.

### Accent colour
Orange: `#FFB800`.

Use for:
- secondary emphasis;
- promotional highlights;
- selected attention states;
- visual warmth.

Do not use orange as a universal replacement for a primary action.

### Neutral surfaces
Use white/light-grey backgrounds and dark green/near-black text for hierarchy and readability.

### Typography
Inter is the intended product typeface where available. Preserve readable body sizes, line-height and strong heading hierarchy.

### Logo
Use official SabiWay logo assets. Temporary initials/letter marks such as “SW” are not acceptable substitutes in final product surfaces when official assets exist.

## 3. Canonical tokens

`design-system/` is the shared token source. CI verifies token synchronisation through `scripts/sync-design-tokens.mjs --check`.

Prefer semantic token usage rather than repeating hard-coded values in components.

Examples of semantic intent:
- primary/background/foreground;
- accent;
- muted/surface;
- border;
- success/warning/error;
- spacing/radius/shadow.

A token change is AMBER because it can affect multiple clients and screens.

## 4. Product-specific visual patterns

Common patterns include:
- green header/hero zones;
- large rounded content surfaces;
- circular service/category discovery controls;
- compact marketplace/job cards;
- role-specific Client and Professional home hierarchy;
- clear trust/verification states;
- status-first payment and transaction surfaces;
- low-chrome authentication screens;
- raised/central mobile home emphasis in the Figma navigation language;
- richer multi-column desktop layouts where extra screen width improves task completion.

Avoid endless repeated “icon + heading + paragraph” generic cards when a more product-specific composition is available.

## 5. Client vs Professional experience

### Client priorities
Client interfaces should make these questions easy to answer:
- What service do I need?
- Who can do it?
- Can I trust them?
- What is the status of my job/booking/payment?
- Where are my messages/history?

Client home/discovery should prioritise search, categories, trusted professionals, current jobs/conversations and relevant recommendations.

### Professional priorities
Professional interfaces should make these questions easy to answer:
- What work is available?
- What enquiries/jobs require action?
- What bookings are active?
- Am I verified?
- What have I earned / what payment is pending?
- What reviews/reputation evidence do I have?

Do not force the same home hierarchy on both roles.

## 6. Mobile navigation

The supplied Figma export establishes a five-item mobile navigation model with a visually prioritised centre Home action.

Client-oriented destinations include concepts equivalent to:
- My Jobs;
- Community;
- Home;
- History;
- Profile.

Professional-oriented destinations include concepts equivalent to:
- My Jobs;
- Community;
- Home;
- Earnings;
- Profile.

Exact labels can evolve only with deliberate product/design approval. Do not silently replace role-specific information architecture with a generic identical nav for both roles.

## 7. Web translation rules

The mobile design is the product/visual foundation, but desktop/tablet must **translate**, not stretch, mobile frames.

Desktop may use:
- persistent filters;
- two/three-column marketplace layouts;
- split-pane messaging;
- side rails for profile/payment/context;
- wider comparison/reputation layouts;
- top navigation instead of bottom navigation.

The web experience should preserve the same task hierarchy, trust signals, terminology and brand identity while taking advantage of wider space.

## 8. Responsive breakpoints

Governance breakpoints:
- mobile: `<= 480px`;
- tablet: `481–1024px`;
- desktop: `>= 1025px`.

Representative runtime widths include:
- 320;
- 360;
- 375;
- 390;
- 430;
- 768;
- 1024;
- 1280;
- 1366;
- 1440+.

Do not design only for 390px and 1440px. Intermediate widths must remain usable.

## 9. Component behaviour

### Buttons
- one visually dominant primary action per local decision area where possible;
- destructive actions must use explicit language and distinct treatment;
- disabled state must still be understandable;
- loading state should prevent accidental duplicate submissions.

### Forms
Every input should have:
- a label or equivalent accessible name;
- validation feedback close to the field;
- clear required/optional status where relevant;
- predictable focus order;
- loading/submission state;
- server-error presentation.

Do not rely on placeholder text as the only label.

### Cards
Cards should represent a meaningful product object or decision area, not be used as the default container for every piece of text.

### Status
Financial, verification, booking and dispute status should combine:
- text label;
- visual treatment;
- context/date/amount when useful.

Never use colour alone.

### Empty states
Explain:
- what is empty;
- why it may be empty;
- what useful next action exists.

### Error states
Show:
- what failed in user language;
- whether retry is safe;
- an actionable next step;
- no raw internal exception text.

## 10. Accessibility standard

Target WCAG 2.2 AA.

Minimum requirements:
- normal text contrast 4.5:1 where applicable;
- UI/non-text contrast 3:1 where applicable;
- visible keyboard focus;
- keyboard-operable web interactions;
- semantic heading/landmark structure;
- accessible names for icon-only controls;
- no colour-only status communication;
- minimum touch-target sizing appropriate to touch surfaces (44px-class target where practical);
- meaningful form errors and instructions;
- content usable at zoom/large-text settings;
- critical actions must not disappear when text wraps.

Accessibility is part of acceptance criteria, not a later cosmetic pass.

## 11. Figma/export fidelity process

For each screen family, compare:

`Figma/export` → `Current mobile` → `Current web` → `Decision` → `Implementation` → `Runtime evidence`.

Use decisions:
- KEEP;
- IMPROVE;
- REWORK;
- REPLACE;
- REMOVE.

Relevant evidence lives in:
- `Documentation/FIGMA-EXPORT-SCREEN-MATRIX.md`;
- `Documentation/FINAL-UIUX-FIGMA-FIDELITY-AUDIT.md`.

A code review may confirm implementation intent, but exact runtime visual certification requires rendered-browser/device inspection.

## 12. Required UI states

A material screen should consider:
- default;
- loading;
- empty;
- partial-data;
- error;
- retry;
- disabled/permission-denied;
- success;
- long text;
- small screen;
- large screen;
- slow/unstable network where relevant.

## 13. Marketplace design rules

Marketplace interfaces should prioritise:
- search/discovery first;
- category/location/filter clarity;
- professional trust evidence;
- price/scope context;
- readable card hierarchy;
- clear transition into conversation/booking.

Desktop can use persistent filters and multi-column results. Mobile should avoid overly dense filter control surfaces.

## 14. Messaging design rules

Mobile messaging should keep conversation and booking/context easily reachable without overwhelming the chat.

Desktop can use split/three-pane layouts:
- conversation list;
- active conversation;
- booking/profile/context panel.

Do not expose private conversation content outside authorised participant context.

## 15. SabiPay/trust design rules

Before consequential financial actions show:
- transaction amount;
- current status;
- counterparty/context;
- what the action will do;
- whether it is reversible;
- dispute/support path where relevant.

Avoid ambiguous labels such as “Continue” for irreversible payment/refund/release actions.

## 16. Verification design rules

Verification UI should clearly distinguish:
- not started;
- in progress/submitted;
- needs action;
- approved;
- rejected/failed;
- expired/reverification where implemented.

Sensitive document content should not be exposed unnecessarily in general UI or analytics.

## 17. Design change workflow

For shared navigation, layout, token or component changes:
1. identify affected screen families;
2. review Figma/export evidence;
3. inspect current web/mobile implementation;
4. define preservation boundaries;
5. classify AMBER unless security/business state makes it RED;
6. implement the smallest shared change;
7. verify responsive/accessibility states;
8. run design-system/UIUX checks;
9. add screenshots/runtime evidence for material visual changes;
10. update this document or relevant matrix if the design rule changes.

## 18. Claims that require runtime evidence

Do not claim:
- exact pixel parity;
- all-browser compatibility;
- Android/iOS visual equivalence;
- no overflow at all sizes;
- accessibility certification;

unless the corresponding runtime evidence exists.
