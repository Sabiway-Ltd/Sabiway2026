# Phase 0 repository and security audit

Audit date: 2026-08-15

## Control baseline

- Organization repository: `Sabiway-Ltd/Sabiway2026`
- Visibility: public
- Default branch: `main`
- Connected account: `OlaoluwajohnsonT` with administrator permission
- Direct collaborators found: one administrator
- Repository teams found: none
- Branch rulesets found before remediation: none
- GitHub Actions workflows found before remediation: none

## Findings

| Priority | Finding | Phase 0 action |
|---|---|---|
| Critical | A tracked `ExpressJs/.env` exists in a public repository. | Remove from the current tree, add ignore rules and require credential rotation. |
| Critical | Django configuration contains hard-coded secret, OAuth, email, database and media-service values. | Replace active values with environment lookups and publish placeholder templates. |
| High | Realtime broadcast endpoints accept requests without service authentication. | Record as a release blocker; design a backend-to-realtime service credential before production. |
| High | `main` has no protection rules. | Add CI now; organization admin must enable required PR review/check rules. |
| High | More than ten thousand generated dependency/environment files are tracked. | Remove `node_modules`, `venv`, Python caches and local database files from the current tree. |
| Medium | One administrator and no repository team creates a continuity risk. | Add at least one second trusted organization owner/admin and use teams for developer access. |
| Medium | Automated dependency updates are absent. | Add Dependabot configuration for Python and npm projects. |
| Medium | Automated test coverage is sparse or missing in several services. | Establish syntax, framework and type-check gates; expand functional coverage in later phases. |

## Cleanup counts

The pre-remediation tree contained 10,803 files: 10,437 under committed dependency or virtual-environment directories and 3,535 Python cache/bytecode entries (some categories overlap). It also contained a local waitlist database.

## Mandatory manual security action

Rotate every credential that appeared in the copied repository or its history, including Django, database, Google OAuth, Resend and Cloudinary credentials. Deleting or replacing the current file does not invalidate credentials and does not purge Git history.
