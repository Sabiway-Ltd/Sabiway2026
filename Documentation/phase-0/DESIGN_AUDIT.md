# Phase 0 — Design Audit

Status: **SOURCE VERIFIED; STRUCTURE AUDITED; SCREEN-LEVEL AUDIT PARTIALLY BLOCKED BY FIGMA TOOL LIMIT**

## Canonical design source

Figma file: `Sabiway Project`  
File key: `l2PfJlR0mX8Y3T8OnjoA94`  
URL: `https://www.figma.com/design/l2PfJlR0mX8Y3T8OnjoA94/Sabiway-Project`

The connected Figma inspection verified three pages:

| Figma page | V2 decision | Reason |
|---|---|---|
| `Ui Mobile App Design` | **KEEP / USE AS V2 DESIGN AUTHORITY** | This is the Product Owner-approved V2 app design source and the foundation for the new web design. |
| `Sabiway website` | **REMOVE FROM V2 DESIGN AUTHORITY / V1 REFERENCE ONLY** | Product Owner confirmed this is the V1 web design and must not drive the V2 web experience. |
| `Visualization` | **REFERENCE ONLY** | Not an application-screen authority unless a specific visual asset is deliberately approved. |

## Verified app-design structure

The `Ui Mobile App Design` page contains, among other artefacts:

- `Branding Foundation`
- project/background and persona material
- information architecture
- user-flow material
- `Sabiway Client` section
- `Professional` section
- `Documentation`
- logo assets and icon collections

This is sufficient to establish the **correct design source and exclusion boundary**. A subsequent Figma inspection request hit the account's Figma MCP Starter-plan tool-call limit, so a complete frame-by-frame catalogue could not be truthfully completed in this session. No screen details will be fabricated.

## V2 web-design rule

The new web application is **not** the V1 website reskinned and is **not** the mobile UI stretched horizontally.

For each capability, the V2 web design must:

1. inherit the app design's brand, terminology, trust signals, component language and information hierarchy;
2. preserve the same business journey and backend state as Android/iOS;
3. translate mobile navigation into web-native desktop/tablet/mobile-web navigation;
4. use responsive grids, wider content regions, side panels/columns and progressive disclosure where appropriate;
5. support keyboard, hover, focus, pointer and 200% zoom behaviour;
6. retain semantic parity while allowing platform-appropriate layout differences;
7. provide complete loading, empty, error, success, disabled, permission, offline/connection and long-content states;
8. meet WCAG 2.2 AA.

## Mobile-design audit decision framework

Every mobile Figma screen/component is to receive one of:

- **KEEP** — valid as designed and aligned to V2 requirements.
- **IMPROVE** — concept is sound but usability/accessibility/state handling needs refinement.
- **REFACTOR** — useful pattern but component/layout structure should be redesigned for maintainability or platform adaptation.
- **MERGE** — duplicate patterns should become one shared design-system pattern.
- **REPLACE** — requirement remains but the existing design is unsuitable.
- **REMOVE** — obsolete, V1-only, duplicated or outside V2 scope.

## Screen-level audit checklist

For every app screen during capability audit:

- journey and persona served;
- BRD/playbook requirement mapping;
- current mobile implementation comparison;
- current web implementation comparison;
- KEEP / IMPROVE / REFACTOR / MERGE / REPLACE / REMOVE decision;
- reusable component/token identification;
- Android/iOS behaviour differences;
- V2 web adaptation pattern;
- accessibility risks;
- privacy/security/trust implications;
- empty/loading/error/success/disabled/permission/offline states;
- analytics events;
- responsive/long-content constraints.

## Phase 0 design conclusion

**The design-source decision is CLOSED.** We now know exactly which Figma page governs V2 and which web page must be excluded.

**The exhaustive screen-by-screen catalogue remains PARTIALLY OPEN** only because the Figma connector reached its current plan/tool-call limit during inspection. This must not cause work to fall back to the V1 web design. When Figma access is available again, the remaining app frames are to be audited capability-by-capability before their implementation is certified.
