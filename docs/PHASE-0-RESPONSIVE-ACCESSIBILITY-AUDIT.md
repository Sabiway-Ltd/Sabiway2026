# Phase 0 — Responsive & Accessibility Baseline Audit

Status: IN PROGRESS
Target standard: WCAG 2.2 AA
Programme: `docs/PRODUCT-REBUILD-MASTER-PLAYBOOK.md`

## 1. Objective

Establish the current source-level responsive and accessibility baseline before Phase 2/18 implementation. This audit distinguishes code evidence from runtime certification.

No claim of WCAG compliance is made by source inspection alone.

## 2. Existing strengths to preserve

### A0-001 — Global focus-visible treatment exists
Decision: KEEP + verify runtime

`globals.css` applies a shared focus outline using the design-system focus token and outline offset.

### A0-002 — Shared minimum touch-target token exists
Decision: KEEP

The design system defines a 44px touch target and applies it to buttons, role buttons, most inputs and selects globally.

### A0-003 — Reduced-motion handling exists
Decision: KEEP + extend

Global marquee/fade animation is disabled under `prefers-reduced-motion: reduce`, and smooth scrolling is disabled.

### A0-004 — Forms commonly use explicit labels/accessibility names
Decision: KEEP + standardise

Current login and marketplace search use visible labels or `sr-only` labels/`aria-label` for many controls.

### A0-005 — Major layouts already include responsive breakpoints
Decision: KEEP patterns, revalidate hierarchy

Current implementation uses mobile-first stacking and desktop grid/pane transitions across public, auth, marketplace and application shell surfaces.

## 3. Responsive risks and divergences

### A0-006 — Responsive behaviour is component-local rather than systemically certified
Severity: P1 quality
Decision: REWORK verification process

Tailwind breakpoint classes are widespread, but there is no evidence that every critical journey has been visually and functionally verified at all governance widths:
320, 360, 375, 390, 430, 768, 1024, 1280, 1366, 1440+.

Required outcome:
- journey-based viewport matrix;
- screenshots/visual regression where practical;
- test at intermediate widths, not only mobile and wide desktop.

### A0-007 — Navigation changes mode at desktop but role hierarchy remains wrong
Severity: P1
Decision: REPLACE IA, preserve responsive shell concept

`AppShell` uses desktop sidebar and mobile bottom navigation. This is a useful responsive pattern, but both variants currently expose the same generic role-independent destinations.

Responsive adaptation cannot compensate for incorrect information architecture.

### A0-008 — Marketplace search/filter density needs tablet verification
Severity: P1 usability
Decision: REWORK responsive states

Marketplace search changes to four columns at `md`, while persistent filters appear at `lg`.

Risk areas:
- 768–1024 widths may become dense;
- long translated/category labels may wrap poorly;
- touch use on tablet may be compromised by desktop-density assumptions;
- filter/search duplication can create cognitive load.

Required outcome:
- explicit mobile filter sheet;
- tablet-specific search/filter layout;
- desktop persistent filter only where width supports it.

### A0-009 — Fixed bottom navigation requires safe-area and content-overlap runtime testing
Severity: P2
Decision: KEEP pattern + verify

The current mobile nav uses safe-area bottom padding and the page adds bottom padding, which is good. Runtime tests must confirm:
- no content hidden behind nav;
- zoom/large text remains usable;
- long labels do not truncate critical meaning;
- iOS/Android browser UI does not cause inaccessible overlap.

### A0-010 — Large headings and tightly tracked text need reflow/large-text review
Severity: P2
Decision: IMPROVE

Several public/auth pages use large 5xl/6xl headings with strongly negative tracking.

Required testing:
- 320px width;
- 200% browser zoom;
- OS/browser large text;
- long localisation strings;
- no clipping/overlap.

## 4. Accessibility risks

### A0-011 — Accessible names are inconsistent across all icon controls
Severity: P1 accessibility
Decision: AUDIT + standardise

Some icon controls correctly use `aria-label`, while other interactive icons/components across legacy areas require a full inventory.

Required outcome:
- every icon-only interactive control gets a stable accessible name;
- decorative icons are hidden from assistive technology where appropriate.

### A0-012 — Focus styling is partly duplicated locally
Severity: P2 design-system/accessibility
Decision: REWORK

Some components define their own focus ring colours/opacity while global focus-visible tokens already exist.

Risk:
- inconsistent focus visibility;
- contrast drift;
- maintenance overhead.

Required outcome:
- shared focus behaviour by default;
- component-specific focus only where justified.

### A0-013 — Error messaging is not consistently field-associated
Severity: P1 accessibility/forms
Decision: REWORK

Auth/marketplace errors often appear as toast/global error strings rather than consistently linking individual field errors through `aria-describedby`/error IDs.

Required outcome:
- field-level validation near the field;
- error summary for multi-field forms where useful;
- focus management after failed submissions;
- server errors in user language.

### A0-014 — Loading states need focus/announcement verification
Severity: P2
Decision: IMPROVE

Some loading screens use `aria-live="polite"`, and buttons change labels during loading. Runtime testing must confirm:
- no repeated announcements;
- focus remains predictable;
- disabled/loading controls remain understandable;
- no duplicate submissions.

### A0-015 — Colour contrast cannot be certified from tokens alone
Severity: P1 accessibility
Decision: VERIFY

The design token palette appears intentionally contrast-aware, but many components use hard-coded colour variants and opacity such as `text-white/55`, `text-white/65`, and custom muted greens.

Required outcome:
- automated contrast checks where possible;
- manual review of text over coloured/transparent surfaces;
- 4.5:1 normal text and 3:1 relevant large/UI text targets where WCAG applies.

### A0-016 — Colour-independent status semantics must be checked in transactional domains
Severity: RED/P1
Decision: AUDIT deeply

Verification, booking, payment, dispute and notification states must expose textual status and context, not colour alone.

The design rules require this, but runtime/source review across all domain components is still pending.

### A0-017 — Dialog/sheet focus trapping and restoration require runtime testing
Severity: P1 accessibility
Decision: VERIFY/REWORK where needed

Marketplace and other domains use modals/sheets. Required evidence:
- initial focus;
- focus trap;
- Escape/close behaviour where appropriate;
- return focus to triggering control;
- semantic dialog name/description;
- background not accidentally interactive.

### A0-018 — Keyboard order and skip-navigation require explicit review
Severity: P1 accessibility
Decision: IMPROVE

Current source shows semantic nav/header/main structures in several areas, but a consistent skip-to-content mechanism and full keyboard order have not been proven.

Required outcome:
- skip link on major shells;
- logical tab order;
- no keyboard traps;
- navigation menus operable by keyboard;
- visible focus at all times.

## 5. Responsive acceptance matrix for future phases

Every material screen family must be checked at minimum for:

| Width | Expected mode |
|---:|---|
| 320 | constrained mobile |
| 360 | common Android |
| 375 | common iPhone |
| 390 | modern iPhone |
| 430 | large mobile |
| 768 | tablet portrait |
| 1024 | tablet landscape/small desktop |
| 1280 | desktop |
| 1366 | common laptop |
| 1440+ | large desktop |

For each width record:
- overflow;
- hierarchy;
- nav mode;
- touch target;
- form usability;
- modal/sheet behaviour;
- long text;
- loading/empty/error states.

## 6. Accessibility acceptance matrix

Every critical journey must verify:
- semantic page title/heading structure;
- landmarks;
- skip link;
- keyboard-only completion;
- visible focus;
- accessible names;
- labelled forms;
- associated errors;
- status announcements;
- contrast;
- non-colour status cues;
- zoom/reflow;
- reduced motion;
- touch targets;
- dialog focus management;
- screen-reader sanity pass.

## 7. Decision summary

| Area | Decision |
|---|---|
| global focus token | KEEP |
| 44px touch-target token | KEEP |
| reduced-motion baseline | KEEP + extend |
| responsive sidebar/bottom-nav pattern | KEEP concept, REPLACE role IA |
| marketplace desktop persistent filters | KEEP concept, tablet/mobile REWORK |
| hard-coded focus/contrast values | REWORK |
| field error association | REWORK |
| dialog accessibility | VERIFY/REWORK |
| large heading reflow | VERIFY/IMPROVE |
| transactional status accessibility | RED audit |

## 8. Phase 18 input

Phase 18 must include automated accessibility checks plus manual keyboard, screen-reader, zoom/reflow and device verification. Automated tooling alone cannot certify WCAG 2.2 AA.

## 9. Next Phase 0 work

Proceed to:
- content/UX writing audit;
- QA/test automation gap audit;
- security/privacy audit;
- product analytics/growth audit;
- consolidated Phase 0 defect register and Phase 1 readiness gate.
