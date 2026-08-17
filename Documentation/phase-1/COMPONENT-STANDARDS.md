# SabiWay V2 — Shared Component Standards

These standards sit above platform implementation details. Web and mobile may use different primitives, but visual hierarchy, meaning, state and business behaviour must remain consistent.

## Component inventory decision

The current web repository already contains a shared `Button`, confirmation modals, notification/dropdown utilities and other common components. Those components are to be **IMPROVED/MERGED**, not replaced by a second UI kit. Missing primitives may be added under the existing common/design locations.

## Buttons

Required hierarchy:
- **Primary** — one dominant action per task region.
- **Secondary** — safe alternative/supporting action.
- **Destructive** — delete/cancel irreversible actions; never styled as primary green.
- **Ghost/text** — low-emphasis utility action.

Rules:
- minimum target 44px;
- visible focus on web;
- disabled state must be both visual and programmatic;
- loading state must preserve the control's accessible name/meaning;
- destructive actions that cannot be undone require confirmation;
- non-essential press/hover animation respects reduced-motion preference.

## Inputs and form fields

Every field must support:
- persistent visible label;
- optional helper text;
- required/optional meaning without relying on colour;
- error message associated with the field;
- disabled and read-only distinction;
- autocomplete/input-mode appropriate to the data;
- preservation of valid values after validation/network failure.

Phone fields must later support Nigerian local and +234 input under Phase 2 rules.

## Cards / surfaces

Use cards only to group related information/actions. Avoid card-within-card nesting unless information hierarchy genuinely requires it.

Base surface states:
- default;
- interactive/hover/focus where clickable;
- selected;
- disabled/unavailable;
- loading/skeleton.

A clickable card must have one clear primary interactive target or valid nested-control semantics; do not make an entire complex card a fake button.

## Avatars

- image plus meaningful fallback initials/icon;
- decorative avatars use empty alternative text; identity-bearing avatars expose the person's display name in surrounding semantics;
- do not encode verification purely in avatar border colour.

## Badges / status

Badges use **text + colour**, not colour alone. Transaction, verification and moderation states must come from shared backend authority.

Semantic intent:
- green: success/verified/completed;
- orange: warning/pending/attention;
- red: destructive/failed/high risk;
- blue: neutral informational state.

Brand green must not be used to imply success if the state is merely an active navigation item.

## Tabs

- use only for sibling views of the same context;
- web tabs support arrow-key navigation where implemented as ARIA tabs;
- active state is exposed programmatically;
- mobile tabs meet 44px target and tolerate long labels;
- use normal route navigation instead where content represents separate pages.

## Modals / dialogs

- short, interruptive decisions only;
- labelled title and description;
- `aria-modal`/dialog semantics on web;
- initial focus moves inside;
- Escape closes non-blocking dialogs;
- focus returns to the invoking control where possible;
- backdrop click must not dismiss destructive work while a request is in progress;
- long/complex tasks become a page, side panel or mobile full-screen flow rather than an oversized modal.

Existing destructive modal is being improved in place under Phase 1.

## Bottom sheets

Mobile-first pattern for short contextual choices. Requirements:
- clear title/handle where useful;
- accessible dismiss action;
- safe-area padding;
- keyboard-safe when containing inputs;
- use full-screen form instead when the flow is long or high stakes.

Web translation is normally a popover, dialog or side panel—not a literal stretched bottom sheet.

## Toasts

Supplementary feedback only. Do not use toast as the sole presentation of:
- validation errors;
- payment/escrow failure;
- security/permission denial;
- destructive-action failure.

Critical messages also appear in the affected task region.

## Alerts

Inline alerts support info/success/warning/error intent with icon/text and accessible semantics. They must explain the next action where recovery is possible.

## Skeletons

- approximate final geometry to reduce layout shift;
- no fake content that could be mistaken for real data;
- animation respects reduced motion;
- use an explicit loading status for assistive technology when a whole region is waiting.

## Empty states

An empty state answers:
1. What is empty?
2. Why might it be empty?
3. What useful action can the user take next?

Do not show a generic illustration without actionable meaning.

## Error states

Error content should distinguish, where possible:
- validation problem;
- permission/authentication problem;
- connectivity/offline problem;
- service/server failure;
- not found/removed content;
- transaction failure.

Recovery must not imply a request is safe to repeat when duplicate submission could create a job, payment or message twice.

## Accessibility acceptance baseline

Shared components are not accepted until relevant checks pass for:
- keyboard operation;
- visible focus;
- accessible name/role/state;
- colour contrast;
- 44px targets where applicable;
- zoom/reflow;
- reduced motion;
- error association;
- screen-reader status for asynchronous change.
