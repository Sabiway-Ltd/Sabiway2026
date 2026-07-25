# SabiWay Frontend (Next.js)

**Founder & Product Owner**: Johnson Taiwo

The SabiForum web app: landing page, auth flows, community feed, profiles, notifications. Next.js 15 (App Router), React 19, TypeScript. Runs on port 3000. See the root [README.md](../README.md) for how this fits into the four-service architecture, and [../Documentation/V1_Documentation.md](../Documentation/V1_Documentation.md) for the full technical documentation.

## Setup

```bash
cd frontend
npm install
npm run dev
```

## Backend URLs Are Hardcoded, Not Environment Variables

Before running locally, you need to edit `app/utils/MyConstants.ts` directly. This file currently exports `DJANGO_URL`, `EXPRESS_URL`, and `WAITLIST_URL` as hardcoded string constants, switched between local, VPS, and Render targets by commenting and uncommenting lines in the file itself:

```ts
// FOR RENDER
export const EXPRESS_URL = "https://realtime.sabiway.com"
export const DJANGO_URL = "https://backend.sabiway.com"
export const WAITLIST_URL = "https://waitlist.sabiway.com"
```

To run against a local backend, comment out the Render block and uncomment (or add) the localhost equivalents:

```ts
export const DJANGO_URL = "http://localhost:8000"
export const EXPRESS_URL = "http://localhost:5000"
```

**Do not commit a change that points these at localhost.** This is flagged in the root README's Known Issues as worth fixing (moving these to `NEXT_PUBLIC_*` environment variables would remove the need to hand-edit and remember to revert this file), but as of this writing it has not been changed, so treat it as a manual step every time you set up a fresh clone.

## Structure

- `app/`: Next.js App Router pages. Route groups like `(auth)/` hold the signup, login, password reset, and OAuth callback flows.
- `app/services/`: one file per domain (`auth.ts`, `post.ts`, `profile.ts`, `notification.ts`), each wrapping the relevant Backend API calls via the shared `api.ts` axios instance.
- `app/store/`: one Zustand store per domain, matching the services split above.
- `app/_components/`: shared and feature-specific React components (`common/`, `feed/`, `landing_page/`, `profile/`).
- `app/hooks/`: shared React hooks.
- `app/utils/`: shared utilities, including the `MyConstants.ts` file described above.

New features should generally follow the existing services-plus-store split rather than fetching data directly inside components.

## Conventions

- **State**: Zustand (`app/store/`) for client state.
- **Data fetching**: TanStack React Query, layered on top of the axios calls in `app/services/`.
- **Auth tokens**: stored in `localStorage` (`access` and `refresh` keys) and attached automatically to outgoing requests by an axios interceptor in `app/services/api.ts`, which also handles silent token refresh on a 401 response.

## Testing

There is no test setup (Jest, Playwright, or otherwise) configured in this project yet. Recommended tooling and priority order are in the external QA test plan.
