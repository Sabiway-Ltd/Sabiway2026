# SabiWay v1: Company, Product, and Technical Documentation

**Prepared by**: Johnson Taiwo, Founder & Product Owner

This is the single comprehensive reference for this repository: what SabiWay is, what v1 actually built, the full technical picture (architecture, API surface, data model), and the known issues a new developer should know about before making changes. It was written from a direct read of the codebase, not from assumptions.

This file documents the codebase as it exists. It does not change anything in it. It covers the SabiForum platform (`Backend/`, `frontend/`, `ExpressJs/`) specifically. The waitlist system (`WaitList/`) was built separately, at a different time, by a different team, and is documented on its own in `Waitlist_Documentation.md` in this same folder.

## 1. What SabiWay Is

SabiWay is a trusted digital marketplace connecting Nigerians at home and in the diaspora with verified service professionals: electricians, plumbers, tailors, hairdressers, tutors, event planners, and more. Across Nigeria and countries such as the UK, US, and Canada, many people struggle to find reliable professionals. SabiWay exists to restore trust, empower connections, and make every service experience safe, secure, and reliable.

The intended platform enables users to discover trusted professionals, hire confidently, and make secure escrow-based payments through SabiPay. Whether someone needs a tailor in Lagos, a plumber in Abuja, or a hairdresser in London, SabiWay is meant to provide a single platform to connect safely with verified service providers. Beyond professional services, SabiWay also includes SabiForum, a community-driven space where Nigerians can ask real-life questions, share experiences, discuss relocation and diaspora life, and support one another.

**Mission**: to make finding and working with trusted professionals in Nigeria and abroad seamless, secure, and transparent.

**Vision**: to empower Nigerians everywhere to connect, collaborate, and grow within a safe and trusted digital marketplace.

## 2. What v1 Actually Is (Important Distinction)

What is built and running in this repository is **SabiForum**: a free social community platform (posts, likes, comments, reposts, follows, notifications), plus a separate pre-launch waitlist system. **The escrow payment system (SabiPay) and the provider marketplace itself (bookings, provider search, verification) are not built in this codebase.** Nothing in this repository implements a booking, a payment, or a provider verification flow. Profile has a `role` field that can be set to `professional` or `client`, but that field alone does not make the marketplace functional; there is no code anywhere that uses it to gate marketplace behavior.

If you are picking this project up expecting a working marketplace, that expectation does not match what this codebase contains. What it contains is the trust-and-community foundation the marketplace is meant to be built on top of.

## 3. Repository Structure

```
Sabiway2025/
├── Backend/          Django REST API (port 8000)
├── frontend/         Next.js web app (port 3000)
├── ExpressJs/        Node.js realtime relay (port 5000)
├── WaitList/         Flask pre-launch signup system (port 4000, standalone)
├── docs/             This file
├── README.md         Quick-start guide and service overview
├── PORTS.md          One-line port reference
└── .gitattributes    Line-ending normalization rules
```

Each of the four service folders also has its own `README.md` with setup instructions and service-specific detail. This file is the comprehensive reference; the individual READMEs are the quick-start guides.

## 4. Architecture

SabiWay v1 is not one application. It is four independently deployed services.

| Service | Stack | Port | Responsibility |
|---|---|---|---|
| `frontend/` | Next.js 15, React 19, TypeScript | 3000 | The SabiForum web app: landing page, auth flows, community feed, profiles, notifications |
| `Backend/` | Django 5, Django REST Framework | 8000 | The core API: authentication, profiles, posts, notifications, search |
| `ExpressJs/` | Node.js, Express, Socket.io | 5000 | A stateless relay that pushes new posts and notifications to connected browser clients in real time |
| `WaitList/` | Flask | 4000 | A standalone pre-launch signup system with its own admin dashboard, entirely unrelated to the other three services |

The frontend talks to the Django backend over a normal REST API for everything except live updates, and to the Express service over Socket.io for those live updates. The Django backend, in turn, calls the Express service's HTTP endpoints (`/broadcast`, `/broadcast-notification`) after something happens, so the Express service can fan it out over WebSocket. The waitlist system does not talk to any of the other three services; it exists purely to capture pre-launch signups.

## 5. The Signal-Driven Business Logic Pattern

This is the single most important thing to understand before touching the Django backend. A meaningful amount of real behavior does not live in the API view or serializer you would naturally look in. It lives in Django signal handlers, in `Backend/profiles/signals.py` and `Backend/notifications/signals.py`, triggered by `post_save` and `post_delete` on specific models.

**`profiles/signals.py`**:
- `create_profile_for_new_user`: fires on every new `User` creation. Auto-generates initials from the full name, builds a unique `@username` from the name (appending `_1`, `_2`, and so on if there's a collision), and creates the `Profile` row. This is why a `Profile` always exists for a `User` without any explicit "create profile" step anywhere else in the code.
- `ensure_initials_on_profile_save`: a `pre_save` hook on `Profile` that regenerates initials from the current full name and enforces the `@` prefix on the username, every single time a `Profile` is saved, not just on creation.
- `handle_new_follow` / `handle_unfollow`: fire on `Follow` creation and deletion. Recompute and save `followers_count` and `following_count` on both profiles involved by actually counting the related rows, rather than incrementing or decrementing a counter. This means the counts are always correct but every follow or unfollow costs two extra database writes.

**`notifications/signals.py`**:
- Listens for `post_save` on `Follow`, `Like`, `Comment`, `Reply`, and `Post`, and creates a `Notification` row for the relevant recipient in each case.
- `notify_followers_new_post` is worth knowing specifically: on every new `Post`, it loads **every follower** of the author and creates a `Notification` for each one, synchronously, inside the request/response cycle. On an account with a large follower count, this is a real scaling concern; there is no batching, queueing, or async task handling here.
- After creating a `Notification` row, the same signal handler makes a synchronous HTTP POST to the Express service's `/broadcast-notification` endpoint (a 2-second timeout, wrapped in a bare `try/except` that only prints on failure) to push it live over Socket.io. If the Express service is down or slow, the notification still gets created in the database; only the real-time push silently fails.

Practical consequence: if you are tracing "what happens when someone likes a post," the like endpoint in `posts/views.py` only creates the `Like` row. The notification, and the attempt to push it in real time, happen separately, triggered by the signal.

## 6. Full API Surface

All endpoints below are mounted under `/api/` except `/admin/` and `/docs/`. Base path per app, from `Backend/sabiway/urls.py`:

```
/admin/                Django admin
/api/health/           health app
/api/auth/             accounts app
/docs/                 API documentation (Swagger, ReDoc, plain HTML per app)
/api/profiles/         profiles app
/api/posts/            posts app
/api/search/           search app
/api/notifications/    notifications app
```

### Accounts (`/api/auth/`)

| Method | Path | Purpose |
|---|---|---|
| POST | `signup/` | Create a `PendingSignup` record and send a confirmation email; does not create a real `User` yet |
| GET | `confirm-signup/<uuid:token>/` | Confirms the pending signup, creates the real `User`, sends a welcome email |
| POST | `login/` | Email/password login, returns JWT access and refresh tokens |
| POST | `google-login/` | Google OAuth login |
| GET | `google/callback/` | Google OAuth callback |
| POST | `forgot-password/` | Requests a password reset; generates a 4-digit code, valid 15 minutes |
| POST | `confirm-code/` | Confirms the reset code |
| GET | `verify-reset-token/<uuid:token>/` | Verifies a reset link's token |
| POST | `reset-password/<uuid:token>/` | Sets the new password |
| POST | `logout/` | Blacklists the refresh token |
| GET | `generate-google-url/` | Returns the Google OAuth consent URL |
| POST | `token/refresh/` | Standard JWT refresh (djangorestframework-simplejwt) |
| n/a | `users/` (router) | Admin-only user management (`IsAdminUser`) |

Signup is a two-step, email-confirmation-first flow, not immediate account creation: `PendingSignup` holds the email, name, and hashed password until the confirmation link is clicked, with a 1-hour validity window.

### Profiles (`/api/profiles/`)

| Method | Path | Purpose |
|---|---|---|
| GET | `me/` | Current user's profile |
| GET | `contributors/top/` | Top contributors listing |
| GET | `me/followers/` | Current user's followers |
| GET | `me/following/` | Who the current user follows |
| n/a | `` (router) | Standard profile CRUD/list/detail via `ProfileViewSet` |

### Posts (`/api/posts/`)

| Method | Path | Purpose |
|---|---|---|
| POST | `<uuid:post_id>/repost/` | Repost |
| POST | `<uuid:post_id>/unrepost/` | Undo repost |
| POST | `<uuid:id>/bookmark/` / `unbookmark/` | Bookmark toggle |
| GET | `me/bookmarks/` | Current user's bookmarks |
| GET | `me/reposts/` | Current user's reposts |
| GET | `hashtags/trending/` | Trending hashtags |
| POST | `comments/<uuid:id>/like/` / `unlike/` | Comment like toggle |
| POST | `replies/<uuid:id>/like/` / `unlike/` | Reply like toggle |
| GET | `replies/<uuid:parent_reply>/children/` | Nested replies |
| POST | `report/` | Report a post |
| GET | `me/` | Current user's posts |
| n/a | `hashtags/`, `comments/`, `replies/`, `likes/`, `` (router) | Standard CRUD for each resource, posts registered last so it doesn't shadow the others |

### Notifications (`/api/notifications/`)

| Method | Path | Purpose |
|---|---|---|
| GET | `` | List notifications |
| POST | `<int:id>/read/` | Mark one notification read |
| POST | `read/all/` | Mark all read |

### Search (`/api/search/`)

| Method | Path | Purpose |
|---|---|---|
| GET | `` | Search across posts, users, hashtags |

### Interactive API Documentation

The `docs` app serves this at `/docs/`, once the server is running:

- Swagger UI: `/docs/swagger/`
- ReDoc: `/docs/redoc/`
- Raw OpenAPI schema: `/docs/json/`
- Plain HTML docs per app: `/docs/auth/`, `/docs/profiles/`, `/docs/posts/`, `/docs/notifications/`, `/docs/search/`, plus admin-specific variants

## 7. Data Model

### accounts app

**User** (custom user model, email as the username field): `email` (unique), `full_name`, `is_active`, `is_staff`, standard Django auth fields via `AbstractBaseUser` and `PermissionsMixin`.

**PendingSignup**: `email` (unique), `full_name`, `password_hash`, `token` (UUID), `code` (6-digit), `created_at`, `is_used`. Valid for 1 hour.

**PasswordReset**: `user` (FK), `code` (4-digit), `reset_token` (UUID), `created_at`, `is_used`. Valid for 15 minutes.

### profiles app

**Profile** (one-to-one with `User`, `user` is the primary key): `full_name`, `initials` (auto-generated), `username` (unique, auto-generated as `@firstname_lastname`, collision-safe), `profile_picture` (Cloudinary), `followers_count`, `following_count`, `posts_count`, `phone_number`, `gender`, `date_of_birth`, `country`, `state`, `area`, `street`, `address` (auto-generated from the location fields, not directly editable), `role` (`professional` or `client`, optional), `job`, `bio`, `created_at`, `updated_at`.

**Follow**: `follower` (FK to Profile), `following` (FK to Profile), `created_at`. Unique together on `(follower, following)`.

### posts app

**Post**: UUID primary key, `author` (FK to Profile), `content`, `image` (Cloudinary), `hashtags` (M2M to Hashtag), `likes_count`, `comments_count`, `impressions_count`, `reposts_count`, `original_post` (self-FK, set when a post is a repost), `created_at`, `updated_at`.

**Hashtag**: `tag` (unique), `use_count`, `created_at`. Extracted from post content via regex on save.

**Comment**: UUID primary key, `user`, `post`, `content`, `image`, `likes_count`, `created_at`.

**Reply**: UUID primary key, `user`, `comment`, `content`, `image`, `likes_count`, `parent_reply` (self-FK, supports nested replies), `created_at`.

**Like**, **CommentLike**, **ReplyLike**: each a `(user, target)` pair with a unique-together constraint preventing duplicates.

**Bookmark**: `(user, post)` unique together.

**PostImpression**: tracks views, with three separate unique constraints so an impression is deduplicated by logged-in user, session key, or IP address depending on which is available (i.e., anonymous view tracking is supported).

**PostReport**: `post`, `reported_by` (nullable, `SET_NULL` on user deletion), `reason`, `post_url`, `created_at`.

### notifications app

**Notification**: `user` (recipient), `actor` (who triggered it), `type` (`follow`, `like`, `comment`, `reply`, `post`), `message`, a generic foreign key (`target_content_type` + `target_object_id`) pointing at whatever triggered it (a Post, Comment, or Reply), `is_read`, `created_at`.

## 8. Known Issues

These are real, current issues found by reading the code, not hypothetical risks.

- **Hardcoded secrets in source**: `Backend/sabiway/settings.py` has the Django `SECRET_KEY` and the Resend `RESEND_API_KEY` hardcoded directly in the file, not read from an environment variable. This means both values are in git history permanently, even if removed from the current version of the file. They should be rotated and moved to environment variables. This documentation does not reproduce the actual values.
- **Docker healthcheck points at the wrong path**: `Backend/docker-compose.yml` curls `http://localhost:8000/health/`, but the health endpoint is actually mounted at `/api/health/` in `Backend/sabiway/urls.py`. The healthcheck will always report unhealthy as currently configured.
- **Open CORS on the realtime service**: `ExpressJs/server.js` configures Socket.io with `cors: { origin: "*" }`, with a comment already flagging it as needing to change before production hardening. It currently accepts WebSocket connections from any origin.
- **Silent email failures**: both `Backend/accounts/email_utils.py` (Django, via Resend) and the equivalent path in the Flask waitlist app catch email-sending exceptions and only print them to console. A failed signup confirmation or password reset email currently produces no alert anywhere.
- **No automated tests**: every Django app has a `tests.py` file, but each contains only Django's auto-generated boilerplate. There is no test suite for the frontend, the Express service, or the waitlist app either.
- **Frontend backend URLs are hardcoded, not environment-driven**: `frontend/app/utils/MyConstants.ts` hardcodes `DJANGO_URL`, `EXPRESS_URL`, and `WAITLIST_URL` as string constants, switched between local, VPS, and Render targets by commenting and uncommenting lines in the file directly. See `frontend/README.md` for the exact mechanism.
- **New post notification fan-out is synchronous and unbounded**: as described in Section 5, every new post notifies every follower synchronously, with no batching or async task queue. This will not scale gracefully with a large follower count.
- **Dependency folders are tracked in git**: as of this writing, `ExpressJs/node_modules` and `WaitList/venv` (a full Python virtual environment) are committed to the repository rather than gitignored. This bloats the repository and is worth cleaning up (add the appropriate `.gitignore` entries, then `git rm -r --cached` the tracked copies) as a deliberate, isolated change, ideally its own commit, reviewed on its own rather than mixed into unrelated work.
- **Working-tree line-ending inconsistency**: the repository has a pre-existing mix of CRLF and LF line endings across tracked files, inherited from how it was originally checked out. A `.gitattributes` file has been added at the repository root to normalize this for future commits; it does not retroactively rewrite any existing file.

## 9. What This Documentation Does Not Cover

This file describes the codebase as it exists. It does not cover: the business model and monetization plan, the SabiPay payment specification, the provider verification specification, the product roadmap, account credentials and access transfer procedures, or formal QA test planning. That material exists separately, is business-sensitive, and is intentionally not stored in this repository. Ask the project owner for access if you need it.
