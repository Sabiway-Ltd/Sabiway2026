# SabiWay V2 — Codespaces and Vercel deployment runbook

## Source of truth

The production web application lives in `frontend/` and the production branch is `main`.

The repository root preview command is:

```bash
npm run preview
```

This runs the Next.js application in `frontend/` on port 3000.

## Codespaces

The devcontainer now refreshes `main` with a fast-forward-only pull, removes the stale `.next` cache, stops an older Next.js development process, and starts the current V2 frontend on port 3000 whenever a Codespace on `main` starts.

If an existing Codespace is currently on another branch, switch it to `main` first:

```bash
git checkout main
git pull --ff-only origin main
```

Then rebuild/restart the Codespace or run:

```bash
pkill -f "next dev" || true
rm -rf frontend/.next
npm --prefix frontend ci
npm run preview
```

## Vercel

SabiWay must be a separate Vercel project from Mettelo.

Required project settings:

- Git repository: `Sabiway-Ltd/Sabiway2026`
- Production branch: `main`
- Framework preset: Next.js
- Root Directory: `frontend`
- Install command: use the detected/default `npm ci` behaviour
- Build command: use the detected/default `next build` behaviour
- Output directory: use the Next.js default; do not override it

Do not point the SabiWay project at the repository root, `WaitList/`, or an old branch. Doing so can surface the legacy website or the wrong application.

After the first successful production deployment, attach the intended SabiWay domain to this project and verify `/`, `/marketplace`, `/community`, `/login`, `/signup`, and `/messages` against the production deployment.

## Production verification

A deployment is only considered current when:

1. the deployment commit matches the latest approved `main` commit;
2. the V2 homepage is visible at `/`;
3. the production domain resolves to the SabiWay Vercel project;
4. the marketplace, community and authentication routes render from the same deployment;
5. no legacy V1 landing page is served from cache or from a different deployment target.
