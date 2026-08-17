# Master Phase 5 — Community, Content & Engagement Baseline

Status: AUDIT / IN PROGRESS
Branch: `feat/phase-5-community-content-engagement`
Base: certified Phase 4 `main` (`2f70ffa270297670385239b05cd5096520e4e905`)

## Objective

Deliver SabiForum as one coherent, safe, accessible and performant community experience across Web, Android and iOS without duplicating the substantial content and moderation capability that already exists in Django.

This phase follows the Master Playbook sequence: inspect first, understand second, decide third, design fourth, build fifth, test sixth.

## Existing backend capability — KEEP / IMPROVE

`Backend/posts/` already contains models, serializers, permissions, pagination, realtime hooks, tests, URLs, views and Django admin.

Existing content primitives include:
- posts with text + optional image;
- hashtags and hashtag use counts;
- likes;
- comments;
- replies including nested reply parent linkage;
- comment likes and reply likes;
- bookmarks;
- reposts/original-post linkage;
- impressions;
- post reports;
- moderation status/reason on posts;
- moderation reports and immutable-style moderation audit events.

Decision:
- KEEP the existing domain model as the Phase 5 foundation.
- IMPROVE APIs, permission boundaries, counters, pagination and complete states where evidence shows gaps.
- DO NOT create parallel post/comment/reaction/report systems.

## Existing admin/moderation — KEEP / HARDEN

Django admin already exposes posts, hashtags, likes, comments, replies, reports and moderation audit records.

Web also has an existing `/community/moderation` surface.

Decision:
- KEEP existing admin/moderation capability.
- Audit transition enforcement, sensitive-data visibility, report resolution lifecycle, hidden-content behaviour and reviewer permissions before adding new admin UI.
- Prefer one authoritative moderation state and audit trail.

## Existing mobile SabiForum — KEEP / REFACTOR

`mobile/src/community/CommunityScreen.tsx` already supports:
- feed loading + pull to refresh;
- create post;
- optimistic like/unlike;
- bookmark/unbookmark;
- repost;
- open comments;
- add comment;
- report post;
- loading and empty state;
- Phase 1 design tokens for core colours.

Current gaps identified:
- initial/feed load failure is Alert-only rather than persistent retry;
- comment load/post failure is Alert-only;
- report flow relies on platform `Alert.prompt`, which is not a reliable cross-platform Android/iOS interaction contract;
- replies/nested replies exist in backend but are not surfaced here;
- comment/reply likes are not surfaced here;
- hashtag/trending/discovery integration requires audit;
- image/media creation and rendering require audit;
- post edit/delete/ownership controls require audit;
- feed pagination/incremental loading requires audit;
- sign-out is still exposed inside SabiForum even though Profile/application navigation already owns account actions;
- screen remains a large multi-concern component and should be refactored selectively, not replaced wholesale.

Decision: KEEP / REFACTOR.

## Existing Web SabiForum — AUDIT / REFACTOR

`frontend/app/community/` contains:
- layout;
- community page;
- moderation route.

Phase 5 must inspect the full Web journey before modifying it, including existing shared components/stores/hooks used by the page.

Decision so far:
- preserve working domain capability;
- align signed-in product navigation with Phase 4 `AppShell` rather than create another navigation shell;
- Web must remain a native responsive experience, not a stretched mobile UI.

## Content lifecycle target

For relevant roles and permissions, Phase 5 must verify or deliver:
1. load feed;
2. create post;
3. optional media where supported;
4. render hashtags/linkage;
5. like/unlike;
6. comment;
7. reply;
8. save/unsave;
9. repost;
10. edit/delete own content where product rules allow;
11. report harmful content;
12. moderation review/removal/restoration;
13. hidden content excluded from ordinary discovery;
14. counters remain consistent;
15. realtime/notification hooks do not create duplicate state.

## Discovery boundary

Phase 4 established `/api/search/` as the authoritative SabiForum discovery API for posts, profiles and hashtags. Phase 5 must reuse that boundary rather than creating a second community-search service.

Hashtag/trending/feed features may use dedicated posts-domain endpoints where they already exist, but must not duplicate search ownership.

## Accessibility / complete states

Target WCAG 2.2 AA on Web and equivalent accessible mobile interactions.

Required states for feed, composer, comments/replies and moderation actions:
- loading;
- empty;
- error + retry;
- success feedback;
- disabled/submitting;
- permission denied;
- offline/connection failure where applicable;
- long content;
- media failure;
- hidden/removed content;
- first-time user.

Interactive controls require meaningful accessible names and non-colour-only state.

## Performance

Audit existing post pagination before changing it. Do not introduce unbounded community feeds.

Requirements:
- paginated/incremental feed;
- bounded comments/replies where necessary;
- avoid duplicate requests;
- optimistic mutations must reconcile on failure;
- image/media payloads optimised;
- avoid automatic high-frequency refresh on expensive mobile connections.

## Safety and moderation

Audit:
- owner-only edit/delete;
- staff/moderator permissions;
- hidden content filtering across feed/search/profile/hashtag routes;
- report spam/duplicate controls;
- reason/resolution requirements;
- restoration lifecycle;
- block/report interaction where relevant;
- audit events;
- abusive media/content handling;
- rate limits where appropriate.

Client-side visibility is never authorisation.

## Analytics by design

Identify Phase 5 events before certification, including at minimum:
- feed viewed;
- post composer opened;
- post published/failed;
- reaction toggled;
- comment/reply published/failed;
- bookmark toggled;
- repost completed;
- hashtag/profile discovery opened;
- content reported;
- moderation decision completed.

Do not add analytics that captures private post/comment text as event properties.

## Vercel / deployment gate

The previous programme hold was "until Phase 5". Phase 5 is therefore the first phase where Web deployment may be considered.

Before any deployment action:
1. inspect the existing Vercel project/configuration and build root;
2. understand the previous build-rate-limit status;
3. confirm environment-variable boundaries and no secrets in source;
4. decide whether a deployment is useful for Phase 5 validation;
5. do not let deployment work bypass CI or derail the community implementation.

## Initial build order

1. Complete backend posts/views/serializers/permissions/pagination/test audit.
2. Complete full Web community + moderation audit.
3. Complete mobile API/types/screen audit.
4. Map current functionality to V2 mobile design evidence.
5. Record KEEP / IMPROVE / REFACTOR / MERGE / REPLACE / REMOVE per surface.
6. Close safety/permission/counter/pagination gaps first.
7. Refactor Web/mobile interaction surfaces around existing APIs.
8. Complete replies, reporting, media and discovery parity where required.
9. Add complete states/accessibility.
10. Add regression tests and final Platform CI.
11. Inspect/decide Vercel deployment within Phase 5, separately from code certification.

Phase 5 is not certified until Web + Android + iOS community journeys and moderation boundaries pass the final gate.
