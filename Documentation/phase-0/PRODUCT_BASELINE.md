# Phase 0 product baseline

Status: approved working baseline for implementation planning  
Repository: `Sabiway-Ltd/Sabiway2026`

## Product surfaces

- Web: complete and update the existing marketplace experience.
- Mobile: build the full marketplace experience, not a reduced companion.
- Backend: one shared Django API and database for web and mobile.
- Realtime: one shared Socket.IO service for notifications and live updates.
- Administration: web and mobile operations use the same administrative system and business rules.
- Design source: the existing Sabiway Project Figma file is the UI/UX reference.

## Architecture decision boundary

Phase 0 does not select or scaffold the mobile framework. React Native with Expo is the current recommendation and remains an explicit Phase 1 decision.

## Environments

Development, staging, and production must use separate credentials and data. No production secret may be committed to source control. Production changes require a reviewed pull request and passing checks.

## Definition of done for Phase 0

- Repository ownership and access are recorded.
- Current public-tree credential and generated-file exposure is remediated.
- CI and dependency update automation exist.
- Product surfaces and shared-backend decision are recorded.
- Critical journeys and device matrix are baselined.
- Remaining security risks and owner decisions are visible.
