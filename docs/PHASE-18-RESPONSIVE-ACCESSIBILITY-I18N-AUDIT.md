# Phase 18 — Responsive, Accessibility & Internationalisation Hardening Audit

## Purpose
Phase 18 is a cross-product hardening pass over the rebuilt SabiWay experience. It is not a feature redesign and it does not replace the accessibility work already delivered in earlier phases.

The programme target remains WCAG 2.2 AA. This phase must improve implementation evidence while remaining explicit that automated checks alone do not constitute accessibility certification.

## Existing strengths to preserve
- canonical focus-ring tokens and global `:focus-visible` styling;
- 44px canonical touch-target token applied to buttons and major form controls;
- semantic shared fields with labels, hints, errors, `aria-invalid` and `aria-describedby`;
- reduced-motion handling already present for known marquee/fade animations;
- role-aware responsive AppShell with five-item mobile primary navigation rather than compressed desktop navigation;
- public mobile navigation with `aria-expanded` and `aria-controls`;
- semantic status/error panels and non-colour text labels;
- browser regression at runtime plus mobile TypeScript CI;
- viewport configuration does not disable browser zoom.

## Gaps identified

### Keyboard / focus navigation
There is no shared skip-to-content mechanism across public and authenticated shells. Keyboard users currently have to traverse repeated navigation before reaching page content.

### Reduced motion
The global reduced-motion rule disables only named marquee/fade animations. Future component transitions/animations can still run unless each component remembers to opt out.

### Locale semantics
The root document uses `lang="en"` even though current copy, metadata and product conventions are English for Nigeria/UK. Locale intent should be explicit and centralised rather than scattered through ad hoc `toLocaleString` calls.

### Reflow / long content
The product has responsive layouts, but Phase 18 must explicitly protect 320px width, browser zoom/reflow and long unbroken user-generated strings. No surface should rely on horizontal page scrolling for ordinary task completion.

### Touch targets
Most interactive controls use 44px targets, but public-footer links still use a 40px minimum height. Shared navigation should consistently meet the product target.

### Runtime accessibility evidence
Existing Chromium regression proves routes and rendered states, not full keyboard order, screen-reader output, contrast, zoom/reflow or assistive-technology behaviour. These remain manual/runtime release evidence requirements.

## Phase 18 implementation decisions
1. Add a reusable skip link and stable `#main-content` focus target to both `PublicShell` and `AppShell`.
2. Strengthen global reduced-motion behaviour without disabling content or functionality.
3. Centralise supported/default locale metadata. Start with `en-GB` and `en-NG`; do not expose a language switcher until translated/localised product copy actually exists.
4. Use explicit locale helpers for new shared formatting work; do not pretend the entire existing product is translated.
5. Harden global reflow/long-string behaviour and preserve browser zoom.
6. Raise remaining shared navigation touch targets to the canonical 44px target.
7. Add a required Phase 18 repository contract plus browser evidence for protected/public shells.
8. Keep accessibility status honest: implementation hardening complete does not equal WCAG certification until manual keyboard, zoom/reflow, contrast and assistive-technology review is recorded.

## Manual release evidence still required after automation
- keyboard-only traversal of representative Client, Professional and public journeys;
- visible focus and logical focus order;
- 200% and 400% browser zoom/reflow review;
- 320 CSS px narrow viewport review;
- VoiceOver/NVDA or equivalent screen-reader review on representative journeys;
- colour contrast verification for production-rendered states;
- reduced-motion OS setting review;
- error identification and recovery review;
- touch target review on representative real devices.
