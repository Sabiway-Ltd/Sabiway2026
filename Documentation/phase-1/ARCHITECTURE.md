# Phase 1 — Shared platform architecture

SabiWay2026 is the system of record. Web and mobile are separate clients of the same services.

| Layer | Responsibility |
|---|---|
| `frontend/` | Next.js web experience |
| `mobile/` | React Native + Expo application |
| `Backend/` | Django API, authentication, data and shared Django admin |
| `ExpressJs/` | Socket.IO realtime events |
| Django admin | One operational console for web and mobile data |

## Rules

- Do not duplicate business rules in clients.
- Public client configuration uses `NEXT_PUBLIC_*` (web) and `EXPO_PUBLIC_*` (mobile).
- Secrets remain server-side and are never committed.
- API changes must support both clients or be versioned.
- Figma is the visual source; the code token files are the implementation contract.
