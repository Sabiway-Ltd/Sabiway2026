# SabiWay Design System

The current design foundation is the shared SabiWay token system plus the supplied mobile Figma export and the implemented web translation. See `Documentation/FIGMA-EXPORT-SCREEN-MATRIX.md` and `Documentation/FINAL-UIUX-FIGMA-FIDELITY-AUDIT.md` for visual evidence/status.

## Brand and typography
- Primary SabiWay green: `#008753`.
- Orange accent: `#FFB800`; use as accent/promotion, not universal primary action.
- Primary text/foreground uses dark green/near-black tones; body surfaces are white/light grey.
- Inter is the intended product typeface where available.
- Official SabiWay logo assets must be used instead of temporary letter-mark substitutes.

## Tokens and components
`design-system/` is the canonical cross-platform token source. CI runs `scripts/sync-design-tokens.mjs --check` to catch drift. Shared components/layouts must prefer semantic tokens over repeated hard-coded values.

Core patterns include green header/hero zones, rounded content surfaces, circular category affordances, compact marketplace/job cards, status-first payment surfaces, role-specific home hierarchy and low-chrome authentication.

## Layout and responsive behaviour
Required governance breakpoints:
- mobile: `<= 480px`;
- tablet: `481–1024px`;
- desktop: `>= 1025px`.

Current runtime audit widths additionally include 320, 360, 375, 390, 430, 768, 1024, 1280, 1366 and 1440+.

Mobile designs are the product/visual foundation; desktop/tablet must deliberately translate hierarchy and interaction rather than stretch mobile frames. Desktop may use persistent filters, multi-pane messaging and wider contextual side rails where appropriate.

## Accessibility — minimum standard
All material UI work must target WCAG 2.2 AA:
- normal text contrast at least 4.5:1 where required;
- UI/non-text contrast at least 3:1;
- status is never communicated by colour alone;
- visible keyboard focus;
- logical landmarks/headings;
- labels or ARIA labels on icon-only controls;
- keyboard-operable interactive controls;
- appropriate 44px-class touch targets on touch surfaces;
- explicit loading, empty, error and retry states;
- support zoom/large text without hiding critical actions.

## Interaction conventions
- Primary actions use SabiWay green unless a domain-specific accent is deliberate.
- Dangerous/destructive actions require clear language and should not visually masquerade as primary success actions.
- Forms must preserve labels, validation feedback and submission/loading state.
- Financial/trust surfaces must show amount/status/context before consequential actions.
- Client and Professional role differences must be explicit but retain one shared SabiWay identity.

## Change discipline
Design-system, navigation, shared layout or reusable-component changes are AMBER. Figma/export divergence must be intentional and documented. Code-side alignment does not equal pixel-perfect certification: browser and physical-device visual review remains required before claiming exact runtime fidelity.
