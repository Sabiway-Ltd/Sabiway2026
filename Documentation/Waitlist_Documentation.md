# SabiWay Waitlist System: Documentation

**Prepared by**: Johnson Taiwo, Founder & Product Owner

This documents the pre-launch waitlist system in `WaitList/`, kept separate from `V1_Documentation.md` in this same folder because it was built at a different time, by a different team, as a standalone system unrelated to the SabiForum platform (`Backend/`, `frontend/`, `ExpressJs/`).

## 1. What This Is

A standalone signup system used to capture interest ahead of SabiWay's public launch. It has its own landing page, its own API, and its own admin dashboard. It does not share a database, an authentication system, or any code with the SabiForum platform. Per its own README, it was developed by ChiAde Tech (Chiamaka Nwankwo and Adesina Olagunju), completed September 24, 2025.

## 2. Stack

- **Backend**: Flask, with Flask-SQLAlchemy for the database layer and Flask-CORS enabled.
- **Frontend**: Server-rendered HTML templates (`templates/index.html` for the public landing page, `templates/admin.html` for the dashboard), styled with TailwindCSS. There is no separate frontend build; Flask renders these directly.
- **Database**: PostgreSQL when `DATABASE_URL` is set, falling back to a local SQLite file (`waitlist.db`) otherwise.
- **Email**: Resend API, called directly via `requests` rather than the `resend` Python package used elsewhere in this project.
- **Port**: 4000.

## 3. Data Model

A single table, `Waitlist`:

| Field | Type | Notes |
|---|---|---|
| `id` | Integer | Primary key |
| `name` | String(255) | Required |
| `email` | String(255) | Required, unique |
| `created_at` | DateTime | Defaults to signup time (UTC) |

That is the entire schema. There is no user authentication, no admin account model. The admin dashboard is reachable by anyone who knows the `/admin` path; there is no login gate in front of it.

## 4. API Surface

All routes are defined directly in `WaitList/app.py`.

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/waitlist` | Add a new signup. Validates name and email are present, returns 409 if the email is already registered. On success, triggers both a user confirmation email and an admin notification email, sent asynchronously in background threads so the request doesn't wait on email delivery. |
| GET | `/api/waitlist` | List all signups, newest first. |
| PUT | `/api/waitlist/<id>` | Update a signup's name or email. |
| DELETE | `/api/waitlist/<id>` | Remove a signup. |
| GET | `/api/waitlist/export` | Export every signup as an `.xlsx` file (via pandas and openpyxl), downloaded as `waitlist.xlsx`. |
| GET | `/` | Public landing page (`templates/index.html`). |
| GET | `/admin` | Admin dashboard (`templates/admin.html`), unauthenticated. |

## 5. Email Behavior

Two emails are sent per signup, both fired off in separate daemon threads so the API response returns immediately without waiting on Resend:

- A confirmation email to the person who signed up, welcoming them to the waitlist.
- A notification email to the admin address, with the new signup's name, email, and timestamp.

Both are sent via a direct HTTP POST to `https://api.resend.com/emails`. If either send fails for any reason, the exception is caught and only logged (`app.logger.error`); the signup itself still succeeds and returns success to the user, since the email failure happens in a background thread after the response would already be prepared. There is no retry and no alert if email delivery is silently failing.

## 6. Known Issues

- **A live Resend API key is hardcoded directly in `WaitList/app.py`** (`RESEND_API_KEY = "..."`), not read from an environment variable, despite a comment in the same file saying it should be set in the hosting environment. This is a real, currently active-looking secret committed to source control, separate from the Django backend's own hardcoded secrets documented in `V1_Documentation.md`. It should be rotated and moved to an environment variable. This documentation does not reproduce the key itself.
- **A commented-out old database connection string is also present in the same file**, including what appears to be a real password for a now-superseded Render-hosted Postgres database. Even commented out, this is preserved in git history. Treat it as compromised and confirm whether that old database still exists.
- **The admin dashboard has no authentication.** Anyone who finds or guesses the `/admin` path can view, edit, delete, and export every signup, including every collected name and email address.
- **Email failures are silent**, as described in Section 5: a failed send is logged to console only, with no alerting.
- **The `.gitignore` in this folder excludes `.venv` (with a leading dot), but the actual virtual environment folder in this project is named `venv` (no leading dot)**, so the mismatch means the full virtual environment, including all installed packages, has been committed to the repository rather than ignored. This is a repository hygiene issue worth fixing (correct the `.gitignore` entry, then untrack the already-committed `venv/` folder) as its own deliberate, isolated change.

## 7. Relationship to the Rest of the Project

This system does not call, and is not called by, any of the other three services. It exists purely to capture interest before the SabiForum platform (or, eventually, the full SabiWay marketplace) is publicly available. There is no migration path implemented that moves a waitlist signup into a real SabiForum account; if that is wanted, it does not exist yet and would need to be built.
