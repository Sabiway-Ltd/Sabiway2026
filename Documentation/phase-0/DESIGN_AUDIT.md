# Phase 0 — Design Audit Gate

The master playbook treats the existing SabiWay mobile Figma as an asset to audit, not an automatically accepted specification.

## Current verified state

- Existing mobile Figma is the intended design reference/foundation.
- Current web and mobile implementations both exist in the repository.
- The canonical Figma file URL/key is not recorded in the repository evidence inspected during this Phase 0 refresh.
- Therefore the design audit cannot yet be certified screen-by-screen through the connected Figma tooling.

## Required Figma audit when the canonical file is available

For every existing screen/component:

1. identify the screen and user journey;
2. compare against current mobile implementation;
3. compare against current web implementation where the capability exists;
4. classify KEEP / IMPROVE / REWORK / REPLACE / REMOVE;
5. capture reusable design tokens and component patterns;
6. record accessibility weaknesses;
7. record responsive/platform adaptation rules;
8. define empty/loading/error/success/disabled/permission/offline states;
9. identify missing web layouts rather than stretching mobile designs;
10. document any design that conflicts with current business rules or architecture.

## Phase 0 design decision

Do not redesign the product from scratch. Use the existing mobile Figma to establish brand and component continuity, improve weak patterns, and create web-specific responsive layouts in the relevant capability phase.

## Exit status

**OPEN — canonical Figma file key/link required for certification.**

This is a genuine Phase 0 gate, not a reason to duplicate or fabricate designs from memory.
