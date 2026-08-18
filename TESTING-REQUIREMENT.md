# SabiWay Testing Requirement — Codespaces Web + Mobile Internal Review

This is the practical, copy/paste testing guide for reviewing the current SabiWay V2 web and mobile application from GitHub Codespaces without using normal email/password/Google authentication.

Use this document for **internal development review only**. It is not a Production login method and must never be enabled in Production.

---

## 1. What this guide gives you

By the end of this guide you should have:

- the latest `main` branch running in GitHub Codespaces;
- Django running on port `8000`;
- the Next.js web application running on port `3000`;
- the Express/Socket.io realtime service running on port `5000`;
- development-only internal review mode enabled in Django;
- the web login page showing **Review as Client** and **Review as Professional**;
- the mobile app pointing to the same Codespaces backend/realtime services;
- Expo running through a tunnel so the app can be opened on a physical Android/iPhone;
- a clear Client and Professional journey checklist to review;
- troubleshooting commands for the most common Codespaces problems.

### Important current mobile limitation

The backend internal-review endpoint already supports both `client` and `professional`, and the web already has the two review buttons.

Before relying on mobile auto-login, check whether the mobile app has also been wired to `auth/internal-review-login/` and exposes development-only **Review as Client / Review as Professional** controls.

Run:

```bash
grep -R "internal-review-login\|Review as Client\|Review as Professional" -n mobile/src mobile/App.tsx || true
```

If you get no relevant mobile result, the mobile UI still needs the small internal-review integration. Do **not** weaken normal authentication to work around this. Use the existing guarded backend endpoint and add a development-only mobile control.

Copy/paste this exact instruction into a new AI/developer session if that mobile integration is still missing:

```text
Open Sabiway-Ltd/Sabiway2026 and execute AGENTS.md first. Implement the smallest safe mobile-only internal review login integration using the existing Django POST /api/auth/internal-review-login/ endpoint. Add EXPO_PUBLIC_INTERNAL_REVIEW_MODE=true as the client-side display guard, show Review as Client and Review as Professional only when that flag is true, and keep the backend DEBUG=True + INTERNAL_REVIEW_MODE=True guard authoritative. Reuse the existing AuthSession shape and onAuthenticated flow. Do not create staff/superuser access, do not bypass backend authorisation, do not change Production behaviour, and update tests/docs in the same focused PR. Run the full Platform CI and merge only the exact green head.
```

---

# 2. Safety rules — do not skip

Internal review mode must satisfy all of these conditions:

- backend `DEBUG=True`;
- backend `INTERNAL_REVIEW_MODE=True`;
- web flag `NEXT_PUBLIC_INTERNAL_REVIEW_MODE=true` only in your review environment;
- mobile flag `EXPO_PUBLIC_INTERNAL_REVIEW_MODE=true` only after mobile review controls exist;
- review users remain non-staff and non-superuser;
- local/review database only;
- Paystack test/sandbox keys only if testing real payment-provider calls;
- no Production database credentials;
- no Production secret keys copied into Codespaces files;
- never commit `Backend/.env`, `frontend/.env.local`, `ExpressJs/.env`, `mobile/.env.local` or generated local databases.

The Django review endpoint intentionally returns `404` unless both `DEBUG` and `INTERNAL_REVIEW_MODE` are enabled. This is the primary safety gate.

---

# 3. Prerequisites

You need:

- access to `Sabiway-Ltd/Sabiway2026`;
- a GitHub Codespace for the repository;
- a desktop browser for the web review;
- **Expo Go** installed on the Android/iPhone you want to use for mobile review;
- internet access from the phone if you use an Expo tunnel;
- Paystack **test** keys only if you intend to exercise provider-backed SabiPay calls.

The standard local service ports are:

| Service | Port |
|---|---:|
| Next.js web | `3000` |
| Flask waitlist | `4000` |
| Express/Socket.io realtime | `5000` |
| Django API | `8000` |

You normally do not need port `4000` for the main V2 product review.

---

# 4. STEP A — Open Codespaces and synchronise the repository

Open your Codespace terminal at the repository root and copy/paste:

```bash
set -e

git status
git branch --show-current

git checkout main
git pull --ff-only origin main

echo "Current branch: $(git branch --show-current)"
echo "Current revision: $(git rev-parse HEAD)"
git status --short
```

Expected:

```text
Current branch: main
```

`git status --short` should ideally be empty before you start creating local environment files.

Do **not** use `git reset --hard` merely to refresh the Codespace.

---

# 5. STEP B — Define the Codespaces URLs once

Run this in the repository root:

```bash
export CODESPACE_FORWARDING_DOMAIN="${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}"
export WEB_URL="https://${CODESPACE_NAME}-3000.${CODESPACE_FORWARDING_DOMAIN}"
export REALTIME_URL="https://${CODESPACE_NAME}-5000.${CODESPACE_FORWARDING_DOMAIN}"
export BACKEND_URL="https://${CODESPACE_NAME}-8000.${CODESPACE_FORWARDING_DOMAIN}"

printf 'WEB_URL=%s\nREALTIME_URL=%s\nBACKEND_URL=%s\n' "$WEB_URL" "$REALTIME_URL" "$BACKEND_URL"
```

You should get URLs similar to:

```text
https://YOUR-CODESPACE-3000.app.github.dev
https://YOUR-CODESPACE-5000.app.github.dev
https://YOUR-CODESPACE-8000.app.github.dev
```

Keep these URLs. The browser and physical phone cannot use the Codespace container's `localhost` as if it were their own machine.

---

# 6. STEP C — Set Codespaces port visibility

Open the **PORTS** tab in Codespaces.

For web-only desktop review:

- `3000` can remain Private if you are signed into GitHub in the browser;
- `8000` must be reachable by the browser frontend;
- `5000` must be reachable if testing realtime.

For a physical Android/iPhone using Expo:

- make `8000` **Public** temporarily;
- make `5000` **Public** temporarily if testing realtime messaging/notifications;
- port `3000` does not need to be Public for the native app.

After physical-device testing, return ports to the least-permissive visibility you need.

Never expose a Codespace running Production secrets or Production data.

---

# 7. STEP D — Backend setup with internal review mode

Open **Terminal 1** in Codespaces.

From the repository root, copy/paste the full block:

```bash
set -euo pipefail

cd Backend

python -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt

CODESPACE_FORWARDING_DOMAIN="${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}"
WEB_HOST="${CODESPACE_NAME}-3000.${CODESPACE_FORWARDING_DOMAIN}"
REALTIME_HOST="${CODESPACE_NAME}-5000.${CODESPACE_FORWARDING_DOMAIN}"
BACKEND_HOST="${CODESPACE_NAME}-8000.${CODESPACE_FORWARDING_DOMAIN}"
WEB_URL="https://${WEB_HOST}"
REALTIME_URL="https://${REALTIME_HOST}"
BACKEND_URL="https://${BACKEND_HOST}"

LOCAL_SECRET_KEY="$(python -c 'import secrets; print(secrets.token_urlsafe(48))')"
LOCAL_BROADCAST_TOKEN="$(python -c 'import secrets; print(secrets.token_urlsafe(48))')"
LOCAL_VERIFICATION_KEY="$(python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())')"

cat > .env <<EOF
SECRET_KEY=${LOCAL_SECRET_KEY}
DEBUG=True
INTERNAL_REVIEW_MODE=True
ALLOWED_HOSTS=localhost,127.0.0.1,${BACKEND_HOST}
DATABASE_URL=sqlite:///db.sqlite3
DATABASE_SSL_REQUIRE=False
FRONTEND_URL=${WEB_URL}
BACKEND_URL=${BACKEND_URL}
EXPRESS_URL=${REALTIME_URL}
CORS_ALLOWED_ORIGINS=${WEB_URL},http://localhost:3000,http://127.0.0.1:3000
CSRF_TRUSTED_ORIGINS=${WEB_URL},${BACKEND_URL}
INTERNAL_BROADCAST_TOKEN=${LOCAL_BROADCAST_TOKEN}
PREBOOKING_CONTACT_BLOCK_ENABLED=True
VERIFICATION_GATE_ENABLED=True
VERIFICATION_DOCUMENT_KEY=${LOCAL_VERIFICATION_KEY}
VERIFICATION_REVIEW_SLA_HOURS=48
VERIFICATION_RETENTION_DAYS=365
PRODUCT_EVENT_RETENTION_DAYS=180
TECHNICAL_METRIC_RETENTION_DAYS=30
SABIPAY_ENABLED=True
SABIPAY_COMMISSION_RATE=0.10
SABIPAY_FREEZE_DAYS=7
PAYSTACK_SECRET_KEY=sk_test_replace-with-your-paystack-test-secret-if-needed
PAYSTACK_PUBLIC_KEY=pk_test_replace-with-your-paystack-test-public-key-if-needed
PAYSTACK_BASE_URL=https://api.paystack.co
PAYSTACK_TIMEOUT_SECONDS=12
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
RESEND_API_KEY=
DEFAULT_FROM_EMAIL=SabiWay <no-reply@sabiway.local>
ADMIN_REPORT_EMAIL=admin@sabiway.local
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
SECURE_SSL_REDIRECT=False
SESSION_COOKIE_SECURE=False
CSRF_COOKIE_SECURE=False
SECURE_HSTS_SECONDS=0
SECURE_HSTS_INCLUDE_SUBDOMAINS=False
SECURE_HSTS_PRELOAD=False
SESSION_COOKIE_AGE=28800
JWT_ACCESS_MINUTES=30
JWT_REFRESH_DAYS=30
DATA_UPLOAD_MAX_MEMORY_SIZE=15728640
FILE_UPLOAD_MAX_MEMORY_SIZE=2097152
API_ANON_RATE=120/min
API_USER_RATE=1200/min
API_LOGIN_RATE=10/min
API_SIGNUP_RATE=10/hour
API_PASSWORD_RESET_RATE=12/hour
API_OAUTH_RATE=30/hour
API_TOKEN_REFRESH_RATE=120/hour
API_ANALYTICS_RATE=120/min
EOF

python manage.py migrate
python manage.py check
python manage.py runserver 0.0.0.0:8000
```

Leave Terminal 1 running.

### Important SabiPay note

The placeholder Paystack test values above are enough for backend startup but **not** for real Paystack requests. If you want to test payment-provider calls, replace only those two values in `Backend/.env` with your Paystack **test** keys and restart Django.

Never use live Paystack keys for this Codespaces review.

---

# 8. STEP E — Verify the backend review endpoint before starting the UI

Open **Terminal 2**.

Copy/paste:

```bash
export CODESPACE_FORWARDING_DOMAIN="${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}"
export BACKEND_URL="https://${CODESPACE_NAME}-8000.${CODESPACE_FORWARDING_DOMAIN}"

curl -sS -X POST "${BACKEND_URL}/api/auth/internal-review-login/" \
  -H 'Content-Type: application/json' \
  -d '{"role":"client"}' \
  | python -m json.tool
```

Expected: JSON containing a user/session plus `access`, `refresh`, and review-mode session information.

Then test Professional:

```bash
curl -sS -X POST "${BACKEND_URL}/api/auth/internal-review-login/" \
  -H 'Content-Type: application/json' \
  -d '{"role":"professional"}' \
  | python -m json.tool
```

If this returns `404`, check Terminal 1 and verify:

```bash
grep -E '^(DEBUG|INTERNAL_REVIEW_MODE)=' Backend/.env
```

Expected:

```text
DEBUG=True
INTERNAL_REVIEW_MODE=True
```

---

# 9. STEP F — Start the local realtime service

Open **Terminal 3**.

Copy/paste:

```bash
set -euo pipefail

CODESPACE_FORWARDING_DOMAIN="${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}"
WEB_URL="https://${CODESPACE_NAME}-3000.${CODESPACE_FORWARDING_DOMAIN}"

DJANGO_SECRET_KEY="$(grep '^SECRET_KEY=' Backend/.env | cut -d= -f2-)"
BROADCAST_TOKEN="$(grep '^INTERNAL_BROADCAST_TOKEN=' Backend/.env | cut -d= -f2-)"

cd ExpressJs

cat > .env <<EOF
PORT=5000
CORS_ORIGINS=${WEB_URL},http://localhost:3000
NODE_ENV=development
MAX_SOCKETS_PER_USER=5
JWT_SIGNING_KEY=${DJANGO_SECRET_KEY}
INTERNAL_BROADCAST_TOKEN=${BROADCAST_TOKEN}
EOF

npm ci
npm run check
node server.js
```

Leave Terminal 3 running.

If the package defines a dedicated start script later, prefer the current service README/package script. The goal is simply to have the authenticated realtime server listening on `5000` with the same JWT signing key and broadcast token as Django.

---

# 10. STEP G — Configure and start the web app

Open **Terminal 4**.

Copy/paste:

```bash
set -euo pipefail

CODESPACE_FORWARDING_DOMAIN="${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}"
WEB_URL="https://${CODESPACE_NAME}-3000.${CODESPACE_FORWARDING_DOMAIN}"
REALTIME_URL="https://${CODESPACE_NAME}-5000.${CODESPACE_FORWARDING_DOMAIN}"
BACKEND_URL="https://${CODESPACE_NAME}-8000.${CODESPACE_FORWARDING_DOMAIN}"

cat > frontend/.env.local <<EOF
NEXT_PUBLIC_DJANGO_URL=${BACKEND_URL}
NEXT_PUBLIC_REALTIME_URL=${REALTIME_URL}
NEXT_PUBLIC_WAITLIST_URL=https://waitlist.sabiway.com
NEXT_PUBLIC_INTERNAL_REVIEW_MODE=true
EOF

pkill -f "next dev" || true
rm -rf frontend/.next

cd frontend
npm ci
npm run dev
```

Leave Terminal 4 running.

The Codespace normally forwards port `3000`. Open the `3000` URL from the **PORTS** tab.

---

# 11. STEP H — Web auto-login test

Open:

```text
/login
```

For example:

```text
https://YOUR-CODESPACE-3000.app.github.dev/login
```

You should see an **Internal review mode** panel containing:

- **Review as Client**
- **Review as Professional**

### Client review

Click **Review as Client**.

You should enter without typing an email or password.

Review at minimum:

1. Home
2. Marketplace / service discovery
3. My Jobs / relevant Client job state
4. Messages
5. SabiForum / Community
6. Notifications
7. SabiPay / History
8. Profile
9. Support/reporting paths
10. Logout

After logout, return to `/login`.

### Professional review

Click **Review as Professional**.

Review at minimum:

1. Professional Home
2. Marketplace / available jobs
3. Service/listing/provider presentation
4. Job responses / booking-related flows available in the UI
5. Messages
6. Community
7. Notifications
8. SabiPay / Earnings
9. Professional profile and reviews
10. Verification
11. Support/reporting paths
12. Logout

Review-mode identities must **not** gain admin/moderation/finance/staff access.

---

# 12. STEP I — Configure the mobile app

Open **Terminal 5**.

Copy/paste:

```bash
set -euo pipefail

CODESPACE_FORWARDING_DOMAIN="${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}"
REALTIME_URL="https://${CODESPACE_NAME}-5000.${CODESPACE_FORWARDING_DOMAIN}"
BACKEND_URL="https://${CODESPACE_NAME}-8000.${CODESPACE_FORWARDING_DOMAIN}"

cat > mobile/.env.local <<EOF
EXPO_PUBLIC_DJANGO_URL=${BACKEND_URL}
EXPO_PUBLIC_REALTIME_URL=${REALTIME_URL}
EXPO_PUBLIC_INTERNAL_REVIEW_MODE=true
EOF

cd mobile
npm ci --ignore-scripts
npm run typecheck
npx expo start --tunnel --clear
```

Leave Terminal 5 running.

Expo should display a QR code or development URL.

On your phone:

1. connect the phone to the internet;
2. open **Expo Go**;
3. scan/open the Expo tunnel URL;
4. wait for SabiWay to load.

The phone does not need to be on the same Wi-Fi when `--tunnel` is working.

### If Expo says tunnel support is missing

Use:

```bash
cd mobile
npx expo start --tunnel
```

and follow the Expo CLI prompt to install any required tunnel dependency for the Codespace.

---

# 13. STEP J — Mobile auto-login review

If the mobile internal-review integration is present and `EXPO_PUBLIC_INTERNAL_REVIEW_MODE=true`, the authentication screen should expose development-only controls equivalent to:

- **Review as Client**
- **Review as Professional**

Use Client first, then sign out and use Professional.

### Client mobile checklist

Check:

1. Welcome/auth layout
2. Review as Client login
3. Home
4. My Jobs
5. Marketplace/service discovery
6. Messages
7. Community
8. History/SabiPay
9. Profile
10. Notifications
11. loading/empty/error states
12. bottom navigation active states
13. back navigation
14. keyboard behaviour on forms
15. long text/scroll behaviour

### Professional mobile checklist

Check:

1. Review as Professional login
2. Professional Home
3. My Jobs / opportunities
4. service/provider controls shown for Professional role
5. Messages
6. Community
7. Earnings/SabiPay
8. Profile
9. Verification
10. Notifications
11. loading/empty/error states
12. bottom navigation active states
13. keyboard behaviour
14. scroll/touch target behaviour

---

# 14. Required UI/UX review sizes

## Web

Use browser DevTools responsive mode and review at least:

- `320px`
- `360px`
- `375px`
- `390px`
- `430px`
- `768px`
- `1024px`
- `1280px`
- `1366px`
- `1440px+`

Product breakpoints to keep in mind:

- mobile: `<=480px`;
- tablet: `481–1024px`;
- desktop: `>=1025px`.

Do not judge the web only at one laptop width.

## Mobile

Where possible review:

- one lower/mid-range Android;
- one higher-resolution/current Android;
- an older supported iPhone size;
- a current iPhone size.

At minimum, review one real Android or iPhone rather than relying only on a browser simulation.

---

# 15. What to look for during visual review

For every screen, check:

- SabiWay logo/brand consistency;
- green/orange token use;
- typography hierarchy;
- spacing and alignment;
- image/card quality;
- bottom navigation or desktop navigation;
- Client vs Professional role differences;
- loading state;
- empty state;
- error state;
- disabled state;
- focus state on web;
- touch targets on mobile;
- form labels and validation;
- keyboard obstruction on mobile;
- long names/long content;
- text wrapping;
- overflow/horizontal scrolling;
- contrast;
- status not communicated by colour alone;
- payment/trust status clarity;
- verification status clarity;
- responsive behaviour;
- consistency with the approved Figma-export design language.

Do not label a screen pixel-perfect merely because the code follows the same design system. Runtime visual review is separate evidence.

---

# 16. Core product journeys to test

Use both Client and Professional accounts where the journey requires two sides.

## Authentication

- internal review login Client;
- internal review login Professional;
- logout;
- normal login UI remains visible/usable when review mode is enabled;
- review mode disappears when the client flag is removed;
- backend review endpoint returns `404` if `DEBUG=False` or `INTERNAL_REVIEW_MODE=False`.

## Profiles and trust

- Client profile presentation;
- Professional profile presentation;
- Professional verification entry/status;
- reviews/reputation presentation;
- no staff-only UI granted to review users.

## Marketplace/jobs

- browse/search/discovery;
- categories;
- filters;
- Client job state;
- Professional opportunities/responses;
- job/service detail;
- booking/scheduling presentation where data exists.

## Messaging/realtime

- open conversation;
- send/receive message where the test data permits;
- verify participant isolation;
- check notification/realtime updates;
- reload/reconnect behaviour.

## Community

- feed;
- post/comment/engagement UI where allowed;
- profile navigation from community;
- moderation/reporting entry points.

## SabiPay

At UI level check:

- transaction status presentation;
- Client History;
- Professional Earnings;
- amount/context before consequential actions;
- dispute/support paths;
- loading/error/retry states.

Only exercise real provider calls with Paystack **test** credentials and disposable test data.

## Support/admin boundary

- normal users can reach support/report flows;
- review Client/Professional cannot become staff/admin simply by using review login;
- staff-only/admin surfaces remain protected server-side.

---

# 17. Quick health commands

## Check all expected ports

```bash
ss -ltnp | grep -E ':(3000|5000|8000)\b' || true
```

## Check Django directly inside Codespace

```bash
curl -i http://127.0.0.1:8000/api/health/ || true
```

## Check Codespaces backend URL

```bash
CODESPACE_FORWARDING_DOMAIN="${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}"
curl -i "https://${CODESPACE_NAME}-8000.${CODESPACE_FORWARDING_DOMAIN}/api/health/" || true
```

## Check review mode config

```bash
grep -E '^(DEBUG|INTERNAL_REVIEW_MODE|DATABASE_URL|FRONTEND_URL|BACKEND_URL|EXPRESS_URL)=' Backend/.env
```

## Check web env

```bash
cat frontend/.env.local
```

## Check mobile env

```bash
cat mobile/.env.local
```

## Check realtime env without printing secrets

```bash
grep -E '^(PORT|CORS_ORIGINS|NODE_ENV|MAX_SOCKETS_PER_USER)=' ExpressJs/.env
```

---

# 18. Troubleshooting

## Problem: Review buttons do not appear on web

Check:

```bash
grep '^NEXT_PUBLIC_INTERNAL_REVIEW_MODE=' frontend/.env.local
```

Expected:

```text
NEXT_PUBLIC_INTERNAL_REVIEW_MODE=true
```

Then restart Next.js:

```bash
pkill -f "next dev" || true
rm -rf frontend/.next
cd frontend
npm run dev
```

Environment changes are not guaranteed to be picked up by an already-running Next.js process.

---

## Problem: Clicking Review as Client/Professional returns an error

First test the backend directly:

```bash
CODESPACE_FORWARDING_DOMAIN="${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}"
BACKEND_URL="https://${CODESPACE_NAME}-8000.${CODESPACE_FORWARDING_DOMAIN}"

curl -i -X POST "${BACKEND_URL}/api/auth/internal-review-login/" \
  -H 'Content-Type: application/json' \
  -d '{"role":"client"}'
```

If `404`, verify backend review mode.

If CORS error appears in browser console, verify `CORS_ALLOWED_ORIGINS` contains the exact port-3000 Codespaces HTTPS URL and restart Django.

---

## Problem: Django says host is not allowed

Check the exact backend host:

```bash
echo "${CODESPACE_NAME}-8000.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}"
```

Make sure that hostname is included in `ALLOWED_HOSTS` in `Backend/.env`, then restart Django.

---

## Problem: Web opens an old/stale version

Run:

```bash
git branch --show-current
git rev-parse HEAD
git pull --ff-only origin main
pkill -f "next dev" || true
rm -rf frontend/.next
cd frontend
npm ci
npm run dev
```

Confirm the current V2 hero/product rather than relying on an old browser tab.

---

## Problem: Mobile cannot connect to Django

Never use this for a physical phone:

```text
http://localhost:8000
```

`localhost` on the phone means the phone itself.

Check:

```bash
cat mobile/.env.local
```

`EXPO_PUBLIC_DJANGO_URL` must use the `https://...-8000.app.github.dev` Codespaces URL.

Also confirm port `8000` is temporarily **Public** in the Codespaces PORTS tab.

Restart Expo after changing environment files:

```bash
cd mobile
npx expo start --tunnel --clear
```

---

## Problem: Mobile review buttons are missing

Run:

```bash
grep -R "internal-review-login\|EXPO_PUBLIC_INTERNAL_REVIEW_MODE\|Review as Client\|Review as Professional" -n mobile/src mobile/App.tsx || true
```

If the integration is genuinely absent, use the exact AI/developer instruction in **Section 1** of this document. Do not hardcode a fake authenticated session into `App.tsx` and do not remove backend auth checks.

---

## Problem: Realtime messages/notifications are not updating

Confirm port `5000` is running:

```bash
ss -ltnp | grep ':5000' || true
```

Confirm frontend/mobile use the Codespaces realtime URL.

Confirm Express and Django share the same values without printing the secrets themselves:

```bash
BACKEND_SECRET="$(grep '^SECRET_KEY=' Backend/.env | cut -d= -f2-)"
EXPRESS_JWT="$(grep '^JWT_SIGNING_KEY=' ExpressJs/.env | cut -d= -f2-)"
BACKEND_BROADCAST="$(grep '^INTERNAL_BROADCAST_TOKEN=' Backend/.env | cut -d= -f2-)"
EXPRESS_BROADCAST="$(grep '^INTERNAL_BROADCAST_TOKEN=' ExpressJs/.env | cut -d= -f2-)"

[ "$BACKEND_SECRET" = "$EXPRESS_JWT" ] && echo 'JWT signing key match: yes' || echo 'JWT signing key match: NO'
[ "$BACKEND_BROADCAST" = "$EXPRESS_BROADCAST" ] && echo 'Broadcast token match: yes' || echo 'Broadcast token match: NO'
```

Do not paste the secret values into chat/issues/screenshots.

---

## Problem: Verification screen errors

Ensure `VERIFICATION_DOCUMENT_KEY` is a valid Fernet key. The setup block in this guide generates one automatically.

If you manually replaced the environment file, recreate a local-only key:

```bash
cd Backend
source .venv/bin/activate
python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())'
```

Put the generated value in local `Backend/.env` only and restart Django.

---

## Problem: SabiPay provider call fails

If the UI loads but a provider-backed payment request fails, check whether the local file still contains placeholder test values:

```bash
grep -E '^PAYSTACK_(PUBLIC|SECRET)_KEY=' Backend/.env
```

Use only Paystack sandbox/test credentials for Codespaces testing.

Do not report a SabiPay UI defect solely because placeholder provider credentials cannot contact Paystack.

---

# 19. How to stop everything

In each running terminal use `Ctrl+C`.

Or, from a new terminal:

```bash
pkill -f "manage.py runserver" || true
pkill -f "next dev" || true
pkill -f "node server.js" || true
pkill -f "expo start" || true
```

Then verify:

```bash
ss -ltnp | grep -E ':(3000|5000|8000)\b' || true
```

---

# 20. Local cleanup

Review environment files are intentionally untracked.

Check:

```bash
git status --short
```

Never commit:

```text
Backend/.env
Backend/db.sqlite3
frontend/.env.local
ExpressJs/.env
mobile/.env.local
```

If you want to remove the disposable local review database after testing:

```bash
rm -f Backend/db.sqlite3
```

Only do that after confirming `Backend/.env` uses the local SQLite URL from this guide. Never use cleanup commands against a Production database.

---

# 21. Recommended review order

Use this order so defects are easier to isolate:

1. backend health;
2. direct Client internal-review endpoint;
3. direct Professional internal-review endpoint;
4. web Client review login;
5. web Client journeys;
6. web Professional review login;
7. web Professional journeys;
8. desktop/tablet/mobile-web responsive review;
9. mobile Client review login;
10. mobile Client journeys;
11. mobile Professional review login;
12. mobile Professional journeys;
13. realtime two-session testing;
14. verification;
15. SabiPay UI;
16. Paystack sandbox transaction testing only if sandbox credentials are deliberately configured;
17. final accessibility/visual comparison.

---

# 22. Defect evidence to capture

For every issue record:

- Client or Professional;
- web or mobile;
- browser/device;
- viewport/device size;
- Codespaces Git SHA (`git rev-parse HEAD`);
- screen/journey;
- exact reproduction steps;
- expected result;
- actual result;
- Severity 1/2/3/4;
- screenshot/video where safe;
- whether issue reproduces after refresh/restart;
- whether it is UI-only, API, realtime, data, auth, verification or payment related.

Never include passwords, JWTs, Paystack secrets, database URLs containing credentials, verification documents, or sensitive user data in screenshots/issues.

Severity guide:

- **Severity 1 — Blocker:** critical journey impossible, security issue, serious data risk.
- **Severity 2 — Major:** journey works only with significant difficulty or major workaround.
- **Severity 3 — Moderate:** usability/functional issue but journey remains possible.
- **Severity 4 — Minor:** cosmetic or low-impact issue.

---

# 23. Final review checklist

Do not call testing complete until you can answer **yes** to the applicable items below:

- [ ] Codespace is on intended `main` SHA.
- [ ] Django health endpoint works.
- [ ] Client internal review login works directly against backend.
- [ ] Professional internal review login works directly against backend.
- [ ] Web Review as Client works.
- [ ] Web Review as Professional works.
- [ ] Web critical journeys reviewed.
- [ ] Web reviewed at mobile/tablet/desktop widths.
- [ ] Mobile internal review integration exists.
- [ ] Mobile Review as Client works.
- [ ] Mobile Review as Professional works.
- [ ] Mobile critical journeys reviewed on a physical device.
- [ ] Realtime behaviour checked where applicable.
- [ ] Verification checked as Professional.
- [ ] SabiPay UI/status journeys checked.
- [ ] Any Paystack provider test used test/sandbox keys only.
- [ ] No review user has staff/admin privileges.
- [ ] Loading/empty/error/retry states checked.
- [ ] Accessibility basics checked.
- [ ] No secrets captured in defect evidence.
- [ ] Review mode remains development-only.

---

# 24. Never do these things just to make review easier

Do **not**:

- disable authentication globally;
- comment out backend permissions;
- make review users staff/superusers;
- hardcode a fake authenticated user in Production code;
- set `DEBUG=True` in Production;
- set `INTERNAL_REVIEW_MODE=True` in Production;
- expose Production database credentials to Codespaces;
- use live Paystack credentials for disposable UI review;
- weaken CORS to `*` in Production to fix Codespaces;
- commit local `.env` files;
- push generated SQLite databases;
- claim mobile auto-login works unless the mobile integration actually exists;
- claim pixel-perfect Figma certification without actual runtime visual comparison.

---

# 25. One-line restart commands

## Backend

```bash
cd Backend && source .venv/bin/activate && python manage.py runserver 0.0.0.0:8000
```

## Web

```bash
cd frontend && rm -rf .next && npm run dev
```

## Realtime

```bash
cd ExpressJs && node server.js
```

## Mobile

```bash
cd mobile && npx expo start --tunnel --clear
```

---

# 26. Source-of-truth reminder

If any command in this guide stops matching the repository after future changes:

1. stop;
2. read `AGENTS.md`;
3. inspect the current service code/configuration;
4. update this document in the same PR as the relevant implementation change.

Testing documentation is part of the product's engineering contract. It must not silently become stale.
