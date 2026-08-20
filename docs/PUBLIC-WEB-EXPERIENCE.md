# SabiWay Public Web Experience

This document is the product and UX contract for SabiWay's logged-out public website.

## Core positioning

SabiWay is a **location-based global services marketplace**.

The product should primarily help people discover relevant professionals near the location where a service is needed. A user may also deliberately change the search location and find professionals in another city or country. Nigeria and the United Kingdom are the first markets being optimised operationally, but they are not architectural boundaries.

Examples:

- a user in Manchester can find professionals around Manchester;
- a user in Lagos can find professionals around Lagos;
- a user in Manchester can deliberately search Lagos when the work needs to happen there;
- a user in Lagos can deliberately search London;
- a professional in another country can register and become discoverable where they operate;
- remote services can be discovered across markets when the service does not require physical proximity.

Nationality and diaspora identity must never be used as the marketplace's routing model. The relevant concepts are **account location, preferred search location, service location, professional service area and remote availability**.

## Public-before-authentication rule

A logged-out visitor must be able to understand SabiWay before creating an account. Public navigation and footer links must not unexpectedly send a visitor to `/login`.

Authentication is reserved for actions that genuinely require identity or account state, including messaging, posting, booking, payment, verification submission, SabiForum participation and profile/account management.

## Questions the public site must answer

1. What is SabiWay?
2. How do I find a service near me?
3. Can I search another city or country?
4. How do local and remote services differ?
5. How does SabiWay help professionals become discoverable?
6. What trust signals exist and what do they mean?
7. Which payment features are supported in my market?
8. When do I need an account?

## Primary public navigation

- `/services` — find services
- `/locations` — browse/search locations
- `/for-clients` — client journey
- `/for-professionals` — professional journey
- `/how-it-works` — how SabiWay works
- `/login` — sign in
- `/signup` — join SabiWay

SabiForum remains available in public discovery and the footer without crowding the primary desktop navigation.

## Public page inventory

### Discovery and audience journeys

- `/` — public homepage
- `/services` — service category index
- `/services/[slug]` — public service-category pages
- `/locations` — public location discovery
- `/locations/[slug]` — market/location landing pages where meaningful supply exists
- `/for-clients` — Client journey
- `/for-professionals` — Professional journey
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

## Operational routes are not generic public footer destinations

The following remain product/application routes and may require authentication depending on the action:

- `/marketplace`
- `/community`
- `/sabipay`
- `/verification`
- `/messages`
- `/notifications`
- `/profile`

The public website explains these systems and asks the user to sign in only when they choose an account-dependent action.

## Homepage UX hierarchy

The homepage should use concrete situations rather than generic platform copy:

1. local-first/global-by-design positioning;
2. service-location explanation;
3. Nigeria + UK as initial priority markets without country-locking the product;
4. three obvious user routes: near me, somewhere else, offer a service;
5. simple end-to-end service journey;
6. trust, verification and SabiPay explanation;
7. clear next actions.

## Discovery model communicated publicly

The website must be consistent with the product architecture:

- **account location** personalises discovery;
- **preferred search location** controls where the user wants to browse;
- **service location** describes where work needs to happen;
- **professional base location** describes where a professional is based;
- **service areas** describe where an in-person professional operates;
- **remote availability** allows location-independent services;
- local relevance should rank suitable nearby in-person services before distant in-person services;
- users must always be able to change the search location.

## Payments and market availability

Marketplace availability and payment availability are separate concepts. A professional may be discoverable in a market before SabiPay has fully supported payment, FX and payout rails there. Public copy must never imply otherwise.

Nigeria and the UK are the first optimised markets. Additional countries can become discoverable as professionals register, while payment capability is enabled only when the required market configuration and providers are supported.

## Design quality standard

Every public page must feel like a deliberate product page, not a placeholder or login gate. Minimum expectations include clear hierarchy, responsive layout, useful content, visible next steps, 44px practical touch targets, keyboard-visible focus, no critical hover-only content and consistent SabiWay green/orange visual language.

Review at minimum at 320, 375–430, 768, 1024, 1280 and 1440 px.

## Trust and copy rules

Do not overclaim:

- verification is a trust signal, not a guarantee;
- SabiPay wording must match supported market/payment behaviour;
- location pages must not imply supply that does not exist;
- app-store availability must match real distribution status;
- fees and FX wording must match actual policy/configuration;
- estimated currency conversion must be labelled as estimated until checkout locks a quote.

## SEO and metadata

Metadata should describe SabiWay as a location-based services marketplace, with Nigeria and the UK as initial focus markets. Do not describe the product as a Nigeria-only marketplace or a dedicated diaspora service.

The sitemap should contain true public-information routes. Protected operational application routes should not be included merely for acquisition SEO.

## Preservation boundary

Public-web work must not silently redefine backend APIs, authentication/authorisation, payment lifecycle, verification, realtime messaging, database schema or mobile behaviour.

## Review checklist

Before merging:

- every header/footer public link resolves without unexpected authentication;
- homepage copy represents the local-first global model accurately;
- Nigeria and UK are presented as priority markets, not hard boundaries;
- no dedicated diaspora marketplace mode is implied;
- location and remote-service concepts are understandable;
- public payment copy distinguishes marketplace availability from SabiPay availability;
- metadata/sitemap match the current model;
- TypeScript, lint, production build and full Platform CI pass;
- runtime visual review is completed separately when preview infrastructure is available.
