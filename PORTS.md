# SabiWay Local Port Reference

This file lists the conventional local-development ports used by the services in this repository. Ports can be overridden by environment/configuration, so treat this as the default map rather than an immutable network contract.

| Port | Service | Directory | Purpose |
|---:|---|---|---|
| `3000` | SabiWay Web | `frontend/` | Next.js/React web application |
| `4000` | Waitlist | `WaitList/` | Separate historical Flask waitlist utility |
| `5000` | Realtime | `ExpressJs/` | Express + Socket.io authenticated realtime delivery |
| `8000` | Django API | `Backend/` | Authoritative SabiWay API, auth, marketplace, verification, SabiPay, operations and health |

## Typical local startup order

1. Backend/API on `8000`
2. Realtime service on `5000`
3. Web frontend on `3000`
4. Mobile app using an API/realtime URL reachable from the emulator/device
5. Waitlist on `4000` only when the task affects it

## Important notes

- A physical mobile device generally cannot reach the development computer through `localhost`; use a reachable LAN/tunnel URL when required.
- Do not solve port conflicts by committing hard-coded localhost values that break preview/Production.
- Web/realtime/backend URLs should come from approved environment/configuration for the target environment.
- The Waitlist service is not the primary SabiWay backend.
- If a service appears on a different port, inspect its environment/configuration before changing code.

See `docs/ONBOARDING.md`, `docs/ENVIRONMENTS.md` and `docs/TROUBLESHOOTING.md` for setup/debugging guidance.
