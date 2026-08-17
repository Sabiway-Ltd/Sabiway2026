# Phase 0 — Device, Responsiveness & Accessibility Baseline

The current repository contains both web and Expo mobile implementations. Phase 0 records the mandatory validation matrix; later phases must attach evidence for every affected surface.

| Surface | Mandatory baseline |
|---|---|
| Web compact | 320, 360, 375, 390, 430 px |
| Web tablet | 768, 1024 px |
| Web desktop | 1280, 1366, 1440+ px |
| Android | small/standard/large currently supported Android profiles; include at least one lower/mid-range representative device during controlled testing |
| iOS | small/standard/large currently supported iPhone profiles |
| Browsers | current stable Chrome, Safari, Firefox and Edge |
| Zoom/text | 200% browser zoom and platform text scaling where applicable |
| Input | keyboard-only web use, touch, focus visibility and logical focus order |
| Screen reader | semantic labels/roles, landmarks and form/error announcements |
| Motion | reduced-motion preference where animation is non-essential |

## Global responsive rules

- No normal horizontal scrolling at supported widths.
- Content must reflow rather than simply shrink.
- Touch targets should be at least 44px where practical.
- Safe areas, mobile keyboard behaviour and orientation/layout constraints must be handled explicitly.
- Long names, Nigerian names, long content, validation errors and translated/expanded text must not break layout.
- Loading, empty, error, success, disabled, permission-denied and offline/connection states must remain usable at every supported breakpoint.

## Phase 0 status

- Web application exists and requires screen-by-screen responsive audit during the relevant capability phases.
- Mobile application exists and requires Android/iOS visual/device certification during the relevant capability phases.
- Phase 0 does not claim visual certification; it establishes the non-negotiable matrix and acceptance rules to be used from Phase 1 onward.
