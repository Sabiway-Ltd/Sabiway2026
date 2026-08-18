# SabiWay Web Frontend

This directory contains the current SabiWay V2 web application built with Next.js, React and TypeScript.

It is no longer a SabiForum-only frontend. The web product includes public pages, authentication, marketplace/jobs/listings, messaging/booking context, SabiForum, profiles, notifications, verification, SabiPay, support/help/legal surfaces and responsive desktop/tablet/mobile-web layouts.

Before changing this service, read root `AGENTS.md`, root `README.md`, `docs/PROJECT-MAP.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN-SYSTEM.md` and `docs/REGRESSION_TESTING.md`.

## 1. Responsibilities

The web frontend is responsible for:
- presenting the SabiWay product to unauthenticated and authenticated users;
- rendering Client vs Professional navigation and role-aware experiences;
- collecting user input and presenting backend validation/results;
- calling the shared Django API;
- consuming realtime updates from the Express/Socket.io service;
- presenting marketplace, community, verification and SabiPay states;
- adapting the supplied mobile/Figma product language to desktop/tablet appropriately.

The web frontend is **not** authoritative for:
- permissions;
- payment state;
- booking/work-state transitions;
- verification decisions;
- database truth.

Those are backend responsibilities.

## 2. Setup

```bash
cd frontend
npm ci
```

Create `frontend/.env.local` using approved local values/environment names. Do not commit it.

Start development server:

```bash
npm run dev
```

Default local URL: `http://localhost:3000`.

## 3. Required quality commands

```bash
npm run type-check
npm run lint
npm run build
```

A successful `npm run dev` is not sufficient release evidence. Material web changes must also pass the Production build.

## 4. Structure

### `app/`
Next.js App Router root.

Contains:
- route groups such as `(auth)/`;
- public/product routes;
- root `layout.tsx`;
- `loading.tsx` and `error.tsx`;
- global styling in `globals.css`;
- route-level/shared components.

### `app/(auth)/`
Authentication-related pages and callback handling, including login/signup/password/OAuth flows.

Internal review controls may appear on login only when development review flags are enabled. Do not weaken backend review-mode guards.

### `app/_components/`
Shared and route-specific UI components.

Before adding a new component, search for an existing shared pattern. Avoid near-duplicate cards/buttons/forms that diverge from the design system.

### `app/hooks/`
Shared React hooks.

### `app/config/`
Application configuration helpers.

### `app/design/` and global styles
Design-related implementation and shared styling. Canonical cross-platform tokens originate from `../design-system/` and are checked by CI.

## 5. Product route families

The exact route tree should be verified from `app/`, but major product areas include:
- landing/home/public pages;
- authentication;
- marketplace/service/job discovery;
- messaging;
- community/SabiForum;
- profiles;
- notifications;
- verification;
- SabiPay/trust/support/help/legal.

Do not rely on old V1 documentation as current route authority.

## 6. Data/API rules

Use the existing shared API/service patterns rather than issuing ad-hoc fetches everywhere.

Rules:
- backend validation is authoritative;
- handle 401/403 distinctly from generic failure;
- preserve loading/empty/error/retry states;
- never expose backend/payment secrets in `NEXT_PUBLIC_*` variables;
- avoid duplicating marketplace/payment state machines in client state;
- after mutations, refresh/update the authoritative server-backed view consistently.

## 7. Authentication

The web consumes the backend authentication contract.

Important current boundaries:
- token/session changes must remain compatible with mobile;
- server-side permissions remain authoritative;
- OAuth callback handling must avoid unnecessary token leakage;
- internal review mode is development-only;
- hidden UI is not access control.

Auth changes are RED scope.

## 8. Internal review mode

For development/internal UI review, frontend review UI can be enabled with the documented `NEXT_PUBLIC_INTERNAL_REVIEW_MODE` flag while backend review mode is safely enabled.

Do not assume the frontend flag alone grants access: backend guards are authoritative.

Review users must remain non-staff/non-superuser.

## 9. UI/UX rules

Use `../docs/DESIGN-SYSTEM.md` as the detailed source.

Key rules:
- use official SabiWay logo assets;
- use canonical design tokens rather than repeated hard-coded brand values where possible;
- preserve Client vs Professional product hierarchy;
- adapt mobile/Figma hierarchy to desktop rather than stretching it;
- consider loading/empty/error/permission states;
- visible keyboard focus;
- keyboard-operable controls;
- accessible labels for icon-only controls;
- no colour-only status;
- target WCAG 2.2 AA.

## 10. Responsive expectations

Review representative widths including:
- 320/360/390/430 mobile web;
- 768 tablet;
- 1024 tablet/desktop boundary;
- 1280/1366/1440+ desktop.

Check for:
- horizontal overflow;
- inaccessible nav/actions;
- collapsed filter usability;
- modal/drawer clipping;
- long-text wrapping;
- messaging pane behaviour;
- payment/status context.

## 11. Marketplace web patterns

Desktop may use:
- persistent filter sidebar;
- wider results grid/list;
- richer professional card context;
- side-by-side comparison/details.

Mobile web should remain compact and task-first.

Backend marketplace state remains authoritative.

## 12. Messaging web pattern

Desktop can use a multi-pane layout:
- conversation list;
- active chat;
- booking/profile/context rail.

Participant isolation is enforced by backend, not layout.

## 13. SabiForum web pattern

Community surfaces should preserve:
- feed/composer/detail hierarchy;
- engagement actions;
- moderation/report status behaviour;
- notification side effects from backend.

Do not rebuild community as a separate data silo.

## 14. SabiPay/trust web pattern

Before consequential financial actions, show:
- amount;
- current transaction status;
- booking/counterparty context;
- action consequence;
- retry/support/dispute path as relevant.

Never infer payment success from a button click alone.

## 15. Error handling

User-facing errors should:
- explain what failed in plain language;
- not leak raw server exceptions;
- distinguish authentication/permission from server/network failure;
- provide retry where safe;
- prevent duplicate destructive/payment submissions.

## 16. Environment configuration

See `../docs/ENVIRONMENTS.md`.

Client-visible environment variables must not contain secrets.

When debugging a deployment mismatch, verify:
- Vercel deployment Git SHA;
- environment target;
- API/realtime URLs;
- Production vs preview branch.

## 17. Testing and CI

Platform CI runs:
- `npm ci`;
- typecheck;
- lint;
- Production build.

It also runs design-system, UIUX, journey and release gates at repository level.

For material visual work, add runtime screenshots/browser evidence where practical. CI build success is not pixel-perfect/browser certification.

## 18. Before opening a PR

Confirm:
- success criteria/preservation boundaries written;
- correct risk classification;
- no backend business rules duplicated in client;
- typecheck/lint/build pass;
- responsive/accessibility reviewed;
- relevant docs updated;
- screenshots/evidence attached for material UI changes.
