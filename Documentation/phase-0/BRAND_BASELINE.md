# Phase 0 — Brand Baseline

Source: Product Owner-supplied SabiWay branding package plus the `Branding Foundation` area in the approved mobile-app Figma page.

## Role of branding in V2

Brand assets define identity; they do not override usability, accessibility, responsive design or the Master Playbook. The app Figma is the primary product-UI reference. The separate V1 website design is not a V2 design authority.

## Verified supplied asset colours

Inspection of the supplied vector logo assets found these recurring colour values:

- Primary green: `#008753`
- Dark neutral: `#333333`
- Light neutral: `#F5F5F5`
- Accent orange: `#FFAA33`

These values are recorded as **brand-source colours**, not yet automatically promoted to every UI semantic token. Phase 1 must validate contrast and define semantic roles such as primary/action, text, surface, warning/accent, borders, focus and disabled states before implementation.

## Asset baseline

The supplied package contains multiple SabiWay logo/icon variants in SVG/PNG and a logo PDF. Reusable application assets should prefer vector sources where practical and should be optimised for web/mobile delivery.

Do not:

- invent a new logo;
- substitute V1 web styling for the mobile-app design language;
- hard-code raw brand colours across components without design tokens;
- use the orange accent as a generic error/warning/success colour without semantic review;
- rely on colour alone to communicate state.

## Phase 1 design-system requirement

Phase 1 should convert the approved app/brand language into a governed cross-platform token system covering at minimum:

- colour roles and accessible contrast pairs;
- typography scale;
- spacing and layout scale;
- radii;
- elevation/shadows;
- icon sizing;
- form/control sizing;
- interactive/focus/pressed/disabled states;
- feedback/status colours;
- responsive web breakpoints and content widths.

The same visual identity should be recognisable across Web, Android and iOS while allowing platform-native layout and interaction patterns.
