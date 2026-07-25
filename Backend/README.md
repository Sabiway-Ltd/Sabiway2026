# SabiWay Backend (Django)

**Founder & Product Owner**: Johnson Taiwo

The core API for SabiWay: authentication, profiles, posts, notifications, and search. Django 5 + Django REST Framework. Runs on port 8000. See the root [README.md](../README.md) for how this fits into the four-service architecture, and [../Documentation/V1_Documentation.md](../Documentation/V1_Documentation.md) for the full technical documentation, including the complete API surface and data model.

## Apps

| App | Responsibility |
|---|---|
| `accounts/` | Signup, login, JWT auth, password reset, email confirmation |
| `profiles/` | User profile data, follow/unfollow, and the signal handlers that keep profile and follower state in sync |
| `posts/` | Posts, comments, replies, likes, bookmarks, reposts, hashtags |
| `notifications/` | Notification records and the signal handlers that generate them |
| `search/` | Search across posts, users, and hashtags |
| `health/` | The `/api/health/` healthcheck endpoint |
| `docs/` | Serves the interactive API documentation (Swagger, ReDoc) described below |
| `sabiway/` | The Django project itself: settings, root URL configuration |

## Setup

```bash
cd Backend
pip install -r requirements.txt
```

Set the following as environment variables (a `.env` file read via `django-environ` works locally; do not commit one). Get the actual values from whoever holds the project accounts.

- `DATABASE_URL`
- `SECRET_KEY`
- Cloudinary credentials (used for all image storage: profile pictures, post images)
- `RESEND_API_KEY` (transactional email)
- Google OAuth client credentials (for "Sign in with Google")

Then:

```bash
python manage.py migrate
python manage.py runserver
```

## The One Pattern You Need to Know First

Profile creation, follower/following count updates, and notification generation do **not** happen inline in the view or serializer that triggers them. They happen in `profiles/signals.py` and `notifications/signals.py`, wired up through Django's signal system (`post_save`, `post_delete`, and similar).

Practically: if you're trying to understand what happens when a user likes a post, the like endpoint in `posts/views.py` only creates the `Like` record. A signal handler listening for that creation is what actually generates the notification. If you go looking for "where does X happen" only inside the relevant app's `views.py`, you will miss real behavior. Check `profiles/signals.py` and `notifications/signals.py` first for anything that sounds like it should update state elsewhere.

This is documented in more depth in `../Documentation/V1_Documentation.md`, Section 5.

## API Documentation

Once the server is running:

- Swagger UI: `http://localhost:8000/docs/swagger/`
- ReDoc: `http://localhost:8000/docs/redoc/`
- Raw OpenAPI schema: `http://localhost:8000/docs/json/`

The `docs/` app also serves a set of plain HTML documentation pages per app (`/docs/auth/`, `/docs/profiles/`, `/docs/posts/`, `/docs/notifications/`, `/docs/search/`, and admin-specific variants), generated from `docs/views.py`.

## Testing

Every app has a `tests.py` file, but as of this writing they contain only Django's auto-generated boilerplate: there are no real tests yet. Recommended priority if adding coverage: authentication and authorization first, then the signal-driven logic above, since it's the least visible and most likely to regress silently. The full QA test plan is maintained outside this repository; ask the project owner for access.

## Known Issues Specific to This Service

See the root [README.md](../README.md) Known Issues section for the full list. The two most relevant if you're working in this folder:

- The Docker healthcheck (see `Dockerfile` and `docker-compose.yml`) points at the wrong path and will always report unhealthy as currently configured.
- Do not add new hardcoded secrets to `sabiway/settings.py` or anywhere else in this app. If you're touching a file that already has one, moving it to an environment variable while you're in there is a welcome cleanup: see the Known Issues section of the main documentation for specifics.
