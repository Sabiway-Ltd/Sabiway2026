# SabiWay Mobile App

This directory contains the SabiWay React Native + Expo + TypeScript application for Android and iOS.

The mobile app uses the same authoritative Django API and business rules as the web application. It covers Client and Professional journeys including home/navigation, marketplace/jobs, messaging, SabiForum/community, profile, professional verification, SabiPay/payment history/earnings and related trust/status surfaces.

Before changing this service, read root `AGENTS.md`, root `README.md`, `docs/PROJECT-MAP.md`, `docs/ARCHITECTURE.md`, `docs/USER-JOURNEYS.md`, `docs/DESIGN-SYSTEM.md`, `docs/ENVIRONMENTS.md` and `docs/REGRESSION_TESTING.md`.

## 1. Responsibilities

The mobile app is responsible for:
- presenting the Android/iOS product experience;
- role-aware Client/Professional navigation;
- collecting user input and displaying backend state;
- consuming the shared Django API;
- receiving realtime updates where configured;
- translating the supplied Figma mobile design into functional product screens.

It is not authoritative for permissions, payment state, verification decisions or booking/work transitions.

## 2. Setup

```bash
cd mobile
npm ci
```

Copy/configure environment values using `.env.example` and approved local values. Do not commit secrets.

Start Expo:

```bash
npm start
```

Other scripts may include:

```bash
npm run android
npm run ios
```

Check `package.json` for the exact current scripts.

## 3. Required quality command

```bash
npm run typecheck
```

Platform CI runs the mobile TypeScript check. This proves code-level type integrity, not physical-device visual or runtime certification.

## 4. Important files

### `App.tsx`
Top-level mobile application/navigation/orchestration.

When changing primary navigation, inspect role-specific information architecture and the supplied Figma-export evidence before replacing tabs/routes.

### `src/`
Contains the mobile screens/components/services/state used by the current product.

Before creating a new screen/component, search for existing patterns to avoid duplicated card/form/navigation implementations.

### `app.json`
Expo application configuration.

### `eas.json`
EAS build profiles used for controlled mobile builds/distribution.

### `.env.example`
Client-safe configuration names. Treat everything bundled into the app as readable by an end user; never put server secrets in `EXPO_PUBLIC_*` values.

## 5. Client vs Professional navigation

The supplied Figma export establishes role-specific primary navigation.

Client concepts include:
- My Jobs;
- Community;
- Home;
- History;
- Profile.

Professional concepts include:
- My Jobs;
- Community;
- Home;
- Earnings;
- Profile.

The centre Home action is visually prioritised in the mobile design language.

Do not silently collapse both roles into a generic identical navigation model unless product/design explicitly changes.

## 6. Home/dashboard hierarchy

### Client home
Should prioritise:
- service search/discovery;
- categories;
- trusted/relevant professionals;
- active jobs/conversations/history as useful;
- clear route to posting/finding help.

### Professional home
Should prioritise:
- available work/enquiries;
- active bookings;
- verification/trust status;
- earnings/payment status;
- reputation/reviews;
- actions needed next.

Avoid filling the entire home with repetitive generic cards when a stronger task hierarchy exists.

## 7. Marketplace/jobs

Mobile marketplace/job surfaces should preserve:
- search/category/filter clarity;
- compact cards;
- role-appropriate actions;
- trust/reputation context;
- clear hand-off to conversation/booking;
- safe empty/loading/error states.

Backend marketplace models/permissions are authoritative.

## 8. Messaging

Mobile messaging should keep chat readable while making booking/context accessible.

Security invariants:
- only authorised thread participants can access messages;
- realtime is delivery only;
- refresh from backend remains possible if realtime fails.

Do not expose unrelated participant data simply because it is available in a realtime payload.

## 9. SabiForum/community

Community surfaces should support the existing feed/composer/detail/engagement model.

Preserve:
- backend ownership/permissions;
- moderation/reporting behaviour;
- notification side effects;
- role-neutral community identity unless explicitly designed otherwise.

## 10. Profile and verification

Profile is general user identity/presentation. Professional verification is a separate trust lifecycle.

Do not expose sensitive verification evidence inside ordinary profile state or client analytics.

Verification status should communicate not-started/submitted/needs-action/approved/rejected states clearly where applicable.

## 11. SabiPay and earnings

Mobile financial surfaces should show:
- amount;
- transaction status;
- booking/counterparty context;
- next allowed action;
- history/payout/withdrawal context for Professionals;
- dispute/support path where relevant.

Never infer payment success from local UI state alone. Refresh/consume backend-authoritative transaction state.

## 12. Figma/export fidelity

The mobile UI was aligned against the supplied SabiWay Figma export at code level.

Relevant evidence:
- `../Documentation/FIGMA-EXPORT-SCREEN-MATRIX.md`;
- `../Documentation/FINAL-UIUX-FIGMA-FIDELITY-AUDIT.md`.

Do not claim exact pixel parity on Android/iPhone until runtime visual comparison is performed.

## 13. Accessibility/mobile usability

Consider:
- 44px-class touch targets where practical;
- readable type and wrapping;
- screen-reader accessible names for icon-only controls;
- no colour-only status;
- clear validation/errors;
- safe keyboard handling for forms/chat;
- scrollability on smaller devices;
- bottom-nav visibility with long content;
- loading/retry on poor networks.

## 14. Environment/network notes

A physical device usually cannot reach your development computer through `localhost`.

For local device testing, use a backend/realtime URL reachable from the device (LAN/tunnel as appropriate) and configure mobile environment values accordingly.

Never use Production secrets in the mobile app.

## 15. Internal review/access

The mobile app should continue to use real backend auth/session rules. Development internal-review functionality is primarily a guarded product-review facility and must not become a hidden mobile Production login.

If review access is extended to mobile, preserve the same backend `DEBUG` + review-mode safety guards and non-staff reviewer identity.

## 16. EAS/build profiles

Use `eas.json` as the current source for mobile build profiles.

Before changing build/distribution configuration, document:
- target environment;
- API endpoint;
- internal/UAT/Production purpose;
- signing/credential implications;
- rollback/rebuild expectations.

Build-config changes are AMBER/RED depending on Production impact.

## 17. Debugging mobile API failures

Check in this order:
1. backend health;
2. configured API URL reachable from device;
3. auth token/session state;
4. response status/body;
5. device network/logs;
6. backend permission/state;
7. realtime only after authoritative API state is confirmed.

Do not patch around a backend permission/state bug by hardcoding client behaviour.

## 18. Before opening a PR

Confirm:
- success criteria/preservation boundaries;
- role/journey affected;
- risk classification;
- mobile typecheck green;
- backend/web compatibility if shared API changes;
- Figma/design impact reviewed;
- smaller-screen and Android/iOS considerations documented;
- relevant handbook/service docs updated;
- physical-device evidence stated honestly (complete or pending).
