# SabiWay Public Web Experience

This document is the product and UX contract for SabiWay's logged-out public website.

## Core positioning

SabiWay is **Nigeria-first and diaspora-connected**.

The service network and initial marketplace supply are centred on Nigeria, but the audience is not limited to people physically in Nigeria. The public experience must make it clear that SabiWay connects:

- people in Nigeria who need trusted services;
- Nigerian professionals building reputation and opportunity;
- Nigerians abroad arranging services, support, property or projects back home;
- Nigerian communities across the diaspora who want a stronger connection to services, people and opportunity in Nigeria.

Public copy must not make SabiWay sound like a Nigeria-only local directory.

## Public-before-authentication rule

A logged-out visitor must be able to understand SabiWay before creating an account.

**Public navigation and footer links must not unexpectedly send a visitor to `/login`.**

Authentication is reserved for actions that genuinely require identity or account state, including:

- messaging;
- posting a job or service;
- booking/scheduling;
- SabiPay/payment actions;
- verification submission;
- SabiForum participation;
- profile/account management.

Public explanation pages must remain directly accessible without authentication.

## Questions the public site must answer

Before asking somebody to join, the site should make these clear:

1. What problem does SabiWay solve in real life?
2. How does it help me if I am in Nigeria?
3. How does it help me if I live abroad but still need things done in Nigeria?
4. How does it help me as a professional?
5. What can I browse publicly?
6. What trust signals exist and what do they actually mean?
7. When will I need to sign in?
8. What should I do next?

## Primary public navigation

The public header prioritises user intent:

- `/services` — Find services
- `/for-clients` — For clients
- `/for-professionals` — For professionals
- `/diaspora` — For Nigerians abroad
- `/how-it-works` — How SabiWay works
- `/login` — Sign in
- `/signup` — Join SabiWay

SabiForum remains available in mobile/public discovery and the footer without crowding the desktop primary navigation.

## Public page inventory

### Discovery and audience journeys

- `/` — public homepage
- `/services` — service category index
- `/services/[slug]` — public service-category pages
- `/locations` — Nigeria location index
- `/locations/[slug]` — public Nigeria location pages
- `/for-clients` — Client journey
- `/for-professionals` — Professional journey
- `/diaspora` — dedicated diaspora journey
- `/how-it-works` — end-to-end explanation
- `/sabiforum` — public SabiForum explanation

### Trust, money and transparency

- `/trust-and-safety`
- `/sabipay-explained`
- `/verification-info`
- `/fees`
- `/accessibility`

### Product, support and company

- `/download`
- `/contact`
- `/partners`
- `/careers`
- `/about-us`
- `/helpcenter`
- `/privacy-policy`
- `/terms-of-use`

## Operational routes are not public footer destinations

These remain product/application routes and must not be used as generic public-information links:

- `/marketplace`
- `/community`
- `/sabipay`
- `/verification`
- `/messages`
- `/notifications`
- `/profile`

The public website can explain these systems and then explicitly ask the user to sign in when they choose an authenticated action.

## Homepage UX hierarchy

The homepage must lead with recognisable human situations rather than generic platform language.

Required hierarchy:

1. Nigeria + diaspora connection stated immediately.
2. Real-life problem framing, including arranging things back home from abroad.
3. Clear public routes for browsing services and understanding the diaspora journey.
4. Situation-based paths: abroad, client, professional.
5. Cross-border connection section explaining Nigeria-first supply and global relationships.
6. Simple end-to-end service journey.
7. Trust, verification and SabiPay explanation.
8. Clear final statement that public browsing comes before sign-in.

Avoid generic phrases such as “all-in-one platform” unless supported by concrete user outcomes.

## Design quality standard for public pages

Every public page must feel like a deliberate product page, not a placeholder or a login gate.

Minimum expectations:

- clear hero with audience-specific value;
- readable content hierarchy;
- useful information cards or sections;
- visible next step;
- mobile-first spacing and touch targets;
- desktop layouts that use available width without stretching mobile patterns;
- consistent SabiWay green/orange visual identity;
- keyboard-visible focus states;
- no critical information hidden behind hover;
- no authentication redirect merely to read public information.

Shared components are encouraged, but pages must still contain specific content for their purpose.

## Responsive rules

Review at minimum:

- 320 px;
- 375–430 px;
- 768 px;
- 1024 px;
- 1280 px;
- 1440 px.

No horizontal page scrolling. Multi-column sections must collapse in logical reading order. Important controls should meet a 44 px practical touch target.

## Trust and copy rules

Do not overclaim:

- verification is a trust signal, not a guarantee;
- SabiPay wording must match supported transaction behaviour;
- service availability must not be implied outside supported locations;
- diaspora copy must distinguish global audience from Nigeria-first service supply;
- app-store availability must match real distribution status;
- fees must match actual policy/configuration.

## SEO and metadata

Global metadata should describe SabiWay as connecting Nigeria and the Nigerian diaspora, not only as a local Nigerian marketplace.

The sitemap should contain true public-information routes. Protected operational application routes should not be included merely for acquisition SEO.

## Preservation boundary

Public-web work must not silently change backend APIs, auth/authorisation, SabiPay lifecycle, verification workflow, realtime messaging, database schema or mobile application behaviour.

## Review checklist

Before merging:

- every header and footer public link resolves without unexpected authentication;
- homepage language clearly includes both Nigeria and the diaspora;
- `/diaspora` renders publicly;
- footer contains public explanation routes rather than protected operational routes;
- public-page design is deliberate and responsive;
- metadata and sitemap reflect current positioning;
- TypeScript, lint and production build pass;
- full Platform CI passes;
- runtime review is completed separately when preview infrastructure is available.
