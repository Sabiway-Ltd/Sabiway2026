# SabiWay

**Founder & Product Owner**: Johnson Taiwo

SabiWay is a trusted digital marketplace connecting Nigerians at home and in the diaspora with verified service professionals (electricians, tailors, hairdressers, tutors, event planners, and more). Payments are designed to move through SabiPay, an escrow layer, so a client and a professional who have never met can transact safely.

**What exists today (this repository) is SabiForum**, a free social community platform: posts, likes, comments, reposts, follows, and notifications. It is the trust-and-community foundation the marketplace is meant to be built on top of. The provider marketplace, bookings, and SabiPay itself are specified in detail elsewhere but **not yet built** here.

This README is the map for getting the four services running locally and understanding how the codebase fits together. The full business and product documentation (business model, SabiPay and verification specs, roadmap, QA plan, credentials handling) is maintained outside this repository, since it is business-sensitive and not something that belongs in source control. Ask the project owner for access if you need it.

## Read This First If You're New

1. **This README**: for getting the four services running locally and understanding the overall shape of the codebase.
2. **[Documentation/](Documentation/)**: the in-repo technical documentation. `V1_Documentation.md` covers the SabiForum platform (Backend, frontend, ExpressJs) in full: architecture, API surface, data model, known issues. `Waitlist_Documentation.md` covers the standalone waitlist system separately, since it was built at a different time by a different team.
3. **Each service's own README** (linked below): for service-specific setup, structure, and gotchas.
4. **The external project documentation** (ask the project owner): for the business model, the SabiPay and verification specs, the product roadmap, and account/credential handling. None of that lives in this repository.

If you're picking this project up for the first time, read this file end to end, then `Backend/README.md`, since the signal-driven pattern described below is the single most important thing to understand before writing backend code.

## Architecture: Four Independent Services

SabiWay v1 is not one application: it's four separately deployed services that together make up SabiForum and the pre-launch waitlist.

| Service | Stack | Port | What it does | Docs |
|---|---|---|---|---|
| `frontend/` | Next.js 15, React 19, TypeScript | 3000 | The SabiForum web app: landing page, auth flows, community feed, profiles, notifications | [frontend/README.md](frontend/README.md) |
| `Backend/` | Django 5 + Django REST Framework | 8000 | The core API: authentication, profiles, posts, notifications, search | [Backend/README.md](Backend/README.md) |
| `ExpressJs/` | Node.js + Express + Socket.io | 5000 | Pushes new posts and notifications to connected clients in real time | [ExpressJs/README.md](ExpressJs/README.md) |
| `WaitList/` | Flask | 4000 | Standalone pre-launch signup system with its own admin dashboard; unrelated to the other three services | [WaitList/README.md](WaitList/README.md) |

See [PORTS.md](PORTS.md) for the short version of the port table.

## Getting Started Locally

You'll need real environment variable values for each service before you can run anything against live data (database URL, Cloudinary credentials, Resend API key, and so on). These are not stored in this repository: ask whoever manages project accounts for access. Do not expect to find real credentials anywhere in this codebase; if you do, that is a bug to report, not an example to follow (see Known Issues below).

```bash
# Backend (Django): http://localhost:8000
cd Backend
pip install -r requirements.txt
# set DATABASE_URL, SECRET_KEY, Cloudinary credentials, RESEND_API_KEY as environment variables
python manage.py runserver

# Frontend (Next.js): http://localhost:3000
cd frontend
npm install
# edit app/utils/MyConstants.ts to point DJANGO_URL and EXPRESS_URL at localhost (see frontend/README.md: this is not env-var driven)
npm run dev

# Realtime service (Express + Socket.io): http://localhost:5000
cd ExpressJs
npm install
node server.js

# Waitlist (Flask, only if you're working on it specifically): http://localhost:4000
cd WaitList
pip install -r requirements.txt
python app.py
# falls back to a local SQLite file if DATABASE_URL isn't set, which is fine for local work
```

Confirm all four are reachable at the ports above, and that the frontend can actually reach the backend (try signing up a test account), before assuming your environment is fully working.

## A Pattern Worth Knowing Before You Touch the Backend

Business logic in the Django backend does not always live in the API endpoint you'd expect. Profile creation, follower count updates, and notification generation happen in `Backend/profiles/signals.py` and `Backend/notifications/signals.py`, wired up through Django's signal system rather than directly in the view that triggers them. If you're tracing what happens when someone likes a post, the like endpoint only creates the `Like` record: the notification is created separately by a signal listening for that creation. See `Backend/README.md` for more on this.

## API Documentation

The Django backend serves its own interactive API documentation once running:

- Swagger UI: `http://localhost:8000/docs/swagger/`
- ReDoc: `http://localhost:8000/docs/redoc/`
- Raw OpenAPI schema: `http://localhost:8000/docs/json/`

## Known Issues

- There are no automated tests anywhere in this project yet.
- The Docker healthcheck for the backend points at the wrong path and will always report unhealthy as currently configured.
- The realtime service (`ExpressJs/`) currently accepts WebSocket connections from any origin; this should be restricted before it matters more. See `ExpressJs/README.md`.
- Email sending failures are currently swallowed silently (caught and printed to console only) in both the Django backend and the Flask waitlist app.
- The frontend's backend and realtime service URLs are hardcoded in `frontend/app/utils/MyConstants.ts` rather than driven by environment variables; switching between local, VPS, and Render targets means editing that file and committing the change, not setting a variable. See `frontend/README.md`.
- This repository has a working-tree line-ending inconsistency (mixed CRLF and LF) inherited from how it was originally checked out. A `.gitattributes` file has been added to normalize this going forward; see the note in that file for what it does and does not fix retroactively.
