# SabiWay Realtime Service

This directory contains the SabiWay realtime delivery service built with Node.js, Express and Socket.io.

Its responsibility is **authenticated delivery of realtime events** to connected users. It is not the source of truth for messages, notifications, bookings or payments. Authoritative business state remains in the Django backend/database.

Before changing this service, read root `AGENTS.md`, `docs/ARCHITECTURE.md`, `docs/PROJECT-MAP.md`, `docs/USER-JOURNEYS.md`, `docs/ENVIRONMENTS.md` and `docs/REGRESSION_TESTING.md`.

## 1. Architecture role

Typical flow:

```text
Django authoritative event/state
→ persisted record / recipient decision
→ authenticated internal realtime broadcast
→ Express/Socket.io
→ intended user room/socket(s)
→ web/mobile UI update
```

If realtime is unavailable, the underlying persisted state must remain correct and recoverable through the Django API.

## 2. Current security model

The service includes authenticated JWT validation for socket connections and protected internal broadcast behaviour.

Important current expectations:
- JWT signature/expiry validation;
- access-token use for socket auth;
- user-specific room/socket scoping;
- internal broadcast endpoints protected by a shared internal token;
- allowed event types validated;
- payload/body sizes bounded;
- per-user socket/session limits;
- broadcast recipient counts bounded;
- connection recovery still re-runs authentication middleware;
- security headers and `x-powered-by` hardening.

Do not reintroduce unauthenticated `join userId` trust as a shortcut.

## 3. Setup

```bash
cd ExpressJs
npm ci
npm run check
node server.js
```

Typical local port: `5000`.

Use approved local environment values. Do not commit real `.env` secrets.

## 4. Configuration

Inspect the service environment example/configuration before changes.

Relevant categories include:
- port;
- allowed origins;
- JWT/verification compatibility;
- internal broadcast token;
- socket/session limits;
- broadcast-recipient limits;
- connection-recovery duration;
- optional backend/internal URLs.

The internal broadcast token is server-side only. Never put it in frontend/mobile public configuration.

## 5. Connection authentication

A client connection must map to an authenticated user identity derived from validated credentials, not an arbitrary client-supplied user ID.

When changing socket auth, test:
- valid access token;
- expired token;
- malformed token;
- wrong signing algorithm/signature;
- missing token;
- reconnect/recovery path.

Auth changes are RED.

## 6. Recipient isolation

Events intended for one user must not be broadcast globally.

For user-specific events:
- derive recipient from authorised backend event data;
- deduplicate recipient IDs;
- emit to the intended user room/socket mapping;
- preserve participant privacy.

A realtime bug can become a privacy breach even if database permissions remain correct.

## 7. Internal broadcast endpoints

Only trusted backend/server components should call internal broadcast routes.

Requirements:
- shared internal token required;
- invalid/missing token denied;
- allowed event types restricted;
- recipient list bounded;
- request body bounded;
- no secret or sensitive evidence in payload unless strictly necessary.

## 8. Event design

Realtime events should be small and sufficient to update/refresh UI.

Avoid broadcasting:
- payment secrets;
- verification documents;
- full private support/dispute evidence;
- raw backend exception traces;
- unnecessary sensitive profile fields.

Prefer event metadata/reference that lets an authorised client refresh canonical data from Django when appropriate.

## 9. Connection limits and recovery

The service includes limits intended to reduce abuse/resource exhaustion.

When changing them, consider:
- legitimate multi-tab/multi-device usage;
- memory/resource impact;
- reconnect storms;
- low-bandwidth/unstable connections;
- whether authentication is revalidated during recovery.

Do not increase limits without reasoning/evidence.

## 10. Health and safe failure

Realtime availability improves immediacy but should not decide canonical transaction success.

Examples:
- message persists but realtime push fails → recipient should still see it after refresh;
- payment state changes in backend but event fails → transaction state remains correct;
- notification broadcast fails → persisted notification remains available.

## 11. CORS/origin policy

Do not solve local connection issues by making Production origin policy globally permissive.

Use environment-appropriate allowed origins and verify actual web/mobile connection needs.

## 12. Testing

Run:

```bash
npm ci
npm run check
```

For auth/recipient/security changes, add/verify targeted tests/checks for:
- authenticated connection;
- unauthorised rejection;
- recipient isolation;
- invalid internal token;
- disallowed event;
- oversized recipient/body handling;
- session-limit behaviour;
- recovery path.

## 13. Debugging realtime issues

If the UI is not updating:
1. verify authoritative backend record exists;
2. verify notification/message recipient is correct;
3. verify Express service health/logs;
4. verify client socket URL;
5. verify access token validity;
6. verify room/user mapping;
7. verify internal broadcast response;
8. verify event name/payload;
9. refresh from backend to distinguish delivery failure from business-state failure.

Do not immediately add duplicate polling/business writes to compensate for a realtime bug.

## 14. Relationship to notifications

`Backend/notifications` owns persisted notification history/preferences/delivery evidence. Express is only one delivery channel.

Do not move persistent notification truth into this service.

## 15. Relationship to messaging

Message/thread persistence and participant permission remain backend responsibilities. Express delivers updates only after authorised business state exists.

## 16. Release considerations

Realtime changes can affect web/mobile simultaneously.

For material changes:
- classify AMBER or RED depending on auth/privacy impact;
- run realtime check plus affected backend/client checks;
- confirm event compatibility with existing clients;
- document any renamed/removed event;
- verify Production environment values before rollout;
- preserve fallback behaviour.
