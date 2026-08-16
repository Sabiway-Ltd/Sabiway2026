# Phase 3 — SabiForum parity and web modernization

## Phase outcome

Stabilize SabiForum and make the community experience consistent across responsive web and mobile while preserving one Django source of truth and authenticated realtime delivery.

## Required capability scope

- posts, comments, replies, likes, bookmarks and reposts
- follows, hashtags and notifications
- moderation and auditability
- approved public forum discovery with private/profile/transaction boundaries
- responsive web navigation and mobile parity
- authenticated realtime events and controlled CORS
- automated coverage for signal-driven profile and notification behaviour

## Current implementation slice

### Realtime security

- Socket.IO connections now require a valid Django SimpleJWT access token.
- The socket identity is derived from the validated `user_id` claim; clients can no longer select another user's notification room by emitting an arbitrary ID.
- Django-to-Express broadcast endpoints require a separate `INTERNAL_BROADCAST_TOKEN`.
- CORS remains environment controlled and credentials-aware.
- A health endpoint reports that authenticated realtime is enabled.

### Notification reliability

- persisted notifications remain authoritative when realtime delivery fails
- outbound realtime notification requests carry the internal service token
- nested replies deduplicate recipients when the comment owner and parent-reply owner are the same user
- follower lookup uses a single related query rather than per-row relationship traversal

### Automated coverage

Added tests for:

- like notification creation
- suppression of self-like notifications
- nested-reply recipient deduplication
- follower notification on a new post

## Environment contract

Django:

- `INTERNAL_BROADCAST_TOKEN` — same server-to-server secret configured in Express

Express:

- `INTERNAL_BROADCAST_TOKEN` — authorizes Django broadcast requests
- `JWT_SIGNING_KEY` — must match the Django SimpleJWT signing key for the current HS256 architecture
- `CORS_ORIGINS` — comma-separated approved frontend origins

No secrets belong in source control.

## Remaining Phase 3 work

- update web/mobile Socket.IO clients to send their access token in the handshake
- apply the internal broadcast token to post create/update/delete broadcasts
- complete permission checks for edit/delete across post/comment/reply surfaces
- complete moderation workflow and auditable admin action states
- confirm public discovery/SEO boundaries
- audit responsive navigation, deep threads, long content and weak-network behaviour
- verify bookmarks, reposts, follows and hashtags end to end on both clients
- run backend/realtime/web/mobile automated checks and record device evidence

## Exit rule

This phase is not complete until the required SabiForum journeys pass end to end, responsive/device evidence is recorded, moderation is enforceable, realtime is authenticated, public indexing respects privacy boundaries and automated tests are green.
