# SabiWay Public Web Experience

This document defines the public-facing information architecture introduced by the public web experience redesign. It is a product/UX contract for logged-out visitors and must stay aligned with the implemented routes.

## Purpose

The public website must answer five questions before asking somebody to create an account:

1. What is SabiWay?
2. Is SabiWay useful for me as a Client or Professional?
3. How does the service journey work?
4. Why should I trust the platform and the people I meet through it?
5. What should I do next?

The public site is not a duplicate of the authenticated product. It explains, routes and builds confidence; authenticated application surfaces perform the actual account, marketplace, messaging, verification and transaction operations.

## Primary navigation

The public header deliberately prioritises high-intent user decisions:

- `/services` — Find services
- `/for-professionals` — For professionals
- `/how-it-works` — How it works
- `/sabiforum` — SabiForum explanation
- `/trust-and-safety` — Trust & safety
- `/login` — Sign in
- `/signup` — Join SabiWay

Lower-frequency company, legal and support destinations belong primarily in the footer so the header does not become a sitemap.

## Public page inventory

### Core acquisition and explanation

- `/` — public homepage and role-aware entry point
- `/services` — service category index
- `/services/[slug]` — public service-category landing pages
- `/locations` — location discovery index
- `/locations/[slug]` — public location landing pages
- `/for-clients` — Client value proposition and journey
- `/for-professionals` — Professional value proposition and journey
- `/how-it-works` — end-to-end service journey explanation
- `/sabiforum` — public explanation of the community layer

### Trust, payment and transparency

- `/trust-and-safety` — trust model, safety expectations and support routes
- `/sabipay-explained` — public SabiPay explanation; distinct from authenticated `/sabipay`
- `/verification-info` — public verification explanation; distinct from authenticated `/verification`
- `/fees` — public fees and charges explanation
- `/accessibility` — accessibility commitment and issue-reporting route

### Product and company

- `/download` — mobile-app availability and expectations
- `/contact` — contact/support routing
- `/partners` — partnership proposition
- `/careers` — careers/employment information
- `/about-us` — company/product story
- `/helpcenter` — help content
- `/privacy-policy` and `/terms-of-use` — legal

## Authenticated route separation

Do not replace these authenticated product routes with marketing pages:

- `/sabipay` remains the operational SabiPay application.
- `/verification` remains the Professional verification workflow.
- `/community` remains the operational SabiForum/community experience.
- `/marketplace` remains the operational marketplace.

Public explanation routes use different URLs where necessary so a visitor can understand a feature without accidentally entering a protected workflow.

## Homepage UX hierarchy

The homepage follows this sequence:

1. Clear value proposition in plain language.
2. Immediate service-search entry point.
3. Popular service shortcuts.
4. Explicit Client vs Professional journey choice.
5. Four-step explanation of how work moves through SabiWay.
6. Trust/verification/payment explanation.
7. SabiForum differentiation.
8. Location discovery.
9. Web/mobile continuity.

This sequence should be preserved unless user evidence supports a better hierarchy.

## Responsive rules

Public pages must work at minimum across:

- small mobile around 320 px;
- common mobile around 375–430 px;
- tablet around 768 px;
- small desktop around 1024 px;
- standard desktop around 1280–1440 px.

Rules:

- never require horizontal scrolling for page layout;
- touch targets should be at least 44 px where practical;
- mobile navigation must expose every primary destination and authentication action;
- multi-column content must collapse in reading order;
- important CTAs must remain visible without relying on hover;
- focus states must remain visible for keyboard users;
- motion-based hover effects must respect reduced-motion behaviour where transform is used.

## Copy and trust rules

Public pages must not overclaim:

- verification is a trust signal, not a guarantee of service quality or safety;
- SabiPay/protected payment language must match actual supported transaction behaviour;
- app-store/download claims must match real distribution status;
- location pages must not imply supply exists where marketplace inventory does not support it;
- fees must remain consistent with backend policy/configuration;
- public content must not expose internal-review or development-only mechanisms.

## SEO and route strategy

Service and location landing pages exist to improve discovery and user orientation, not to generate thin pages at scale. Add new categories/locations only when there is a meaningful product reason or marketplace supply.

The Next.js sitemap includes the public page inventory plus current service and location slugs. Keep the sitemap aligned when routes are added, renamed or removed.

## Preservation boundary

Future public-web work must not casually change:

- authenticated marketplace behaviour;
- authentication/authorisation;
- SabiPay lifecycle;
- verification workflow;
- backend APIs or database schema;
- realtime messaging;
- mobile application behaviour.

Public UX can route into those systems, but must not silently redefine their contracts.

## Review checklist

Before merging a public-web change, verify:

- primary and footer navigation links resolve;
- mobile menu is keyboard/touch usable;
- homepage CTAs route to the intended Client/Professional journey;
- service/location dynamic routes render valid slugs and 404 invalid slugs;
- public SabiPay and verification pages do not replace authenticated workflows;
- metadata/sitemap stay current;
- frontend TypeScript, lint and production build pass;
- key pages are manually checked at mobile, tablet and desktop widths when a runtime preview is available.
