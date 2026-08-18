# SabiWay Security Policy

Security is part of normal engineering work in SabiWay. Authentication, authorisation, Production data, database security, payment/SabiPay state, verification evidence, secrets and deployment controls are **RED-scope** changes under the repository governance model.

## 1. Reporting a vulnerability

Do **not** open a public GitHub issue for:
- suspected authentication/authorisation bypass;
- exposed credentials/tokens;
- payment manipulation;
- private message/data exposure;
- verification-document exposure;
- Production database vulnerability;
- admin/operations privilege escalation.

Use the repository Security tab/private security advisory mechanism and notify authorised SabiWay repository administrators.

Include:
- affected component/path;
- environment observed;
- reproduction steps using non-sensitive/test data;
- expected vs actual behaviour;
- security/privacy impact;
- suggested mitigation if known.

Do not include real customer payment details, verification documents, passwords or access tokens in the report.

## 2. Credential handling

Secrets belong only in approved deployment secret stores or untracked local environment files.

Never commit:
- real `.env` files;
- Django `SECRET_KEY`;
- database credentials;
- Paystack secret key;
- OAuth client secret;
- Cloudinary secret;
- Resend/email secret;
- internal realtime broadcast token;
- verification encryption/storage key;
- access/refresh tokens.

`.env.example` files must contain placeholders/documentation only.

If a secret enters Git history, treat it as compromised and rotate it. Deleting the current file does not remove the secret from history.

## 3. Client-side secret rule

Anything shipped in web or mobile client bundles should be treated as public/readable.

Do not place server secrets in:
- `NEXT_PUBLIC_*`;
- `EXPO_PUBLIC_*`;
- frontend source constants;
- mobile source/config;
- public JSON/assets.

Sensitive provider/database operations must be performed server-side.

## 4. Authentication

Authentication changes are RED.

Current security expectations include:
- bounded access-token lifetime;
- refresh rotation/blacklisting behaviour;
- safe OAuth callback/token handling;
- rate limiting on sensitive auth endpoints;
- Production-safe secure-cookie/origin configuration;
- clear token/session invalidation on logout/recovery flows.

Test both success and failure paths, including expired/invalid/missing credentials.

## 5. Authorisation

The Django backend is authoritative for permissions.

Rules:
- hidden UI is not access control;
- Client and Professional product roles do not grant staff/admin privileges;
- staff/operations actions require explicit Django permissions/groups;
- object ownership/participant access must be enforced server-side;
- unauthorised access should fail without leaking sensitive object details.

Permission changes require negative tests for wrong user/wrong role/unauthenticated access.

## 6. Internal review mode

Development-only internal review mode must remain safely guarded.

Expected conditions include:
- backend `DEBUG=True`;
- backend `INTERNAL_REVIEW_MODE=True`;
- separate frontend review UI flag where applicable;
- review users non-staff/non-superuser;
- Production-safe settings make the review endpoint unavailable.

Never turn review mode into a hidden Production support/admin login.

## 7. Database and Production data

Never use Production data as disposable test data.

Rules:
- verify active database/environment before mutation commands;
- migrations must be reviewed for destructive/irreversible effects;
- do not reset/delete Production records to make testing easier;
- least privilege for DB credentials;
- backups/restore strategy should be considered for material schema/data changes;
- logs/errors must not dump sensitive records.

## 8. Payment/SabiPay security

Payment changes are RED.

Requirements:
- Paystack secret remains server-side;
- payment-provider responses are verified/reconciled;
- retries are idempotent/safe;
- duplicate-charge paths are prevented;
- generic marketplace endpoints cannot bypass funded-work controls;
- release/refund/dispute actions require participant/staff permissions;
- provider/payment secrets are not logged;
- failure/mismatch states cannot silently become success.

Use sandbox/test provider credentials for non-Production testing.

## 9. Verification evidence

Professional verification documents/evidence are sensitive.

Rules:
- restrict access to owner/authorised reviewers as designed;
- do not expose evidence through general profile serializers;
- do not include document content in analytics/events/logs;
- enforce retention/configuration policy;
- audit reviewer decisions;
- do not let a Professional self-approve through client-controlled fields.

## 10. Messaging and privacy

Private message/thread access must be limited to authorised participants and staff only where explicitly permitted.

Realtime delivery must preserve recipient isolation. A user-specific message/notification must never use global broadcast as a convenience.

## 11. Realtime service security

Protect:
- socket authentication;
- token validation;
- room/user mapping;
- internal broadcast endpoints;
- allowed event list;
- payload/recipient/session limits;
- origin policy.

Realtime failures must not corrupt authoritative backend state.

## 12. Uploads and media

Validate uploads server-side.

Consider:
- file type/size;
- storage visibility;
- malicious content/metadata;
- verification evidence vs general public media;
- retention/deletion policy;
- secure URL/access patterns.

Do not assume all Cloudinary/media assets can share the same public-access model.

## 13. Input/output security

Backend/client work should preserve protections against:
- XSS;
- SQL injection through ORM/query misuse;
- CSRF where browser/session semantics apply;
- unsafe redirects;
- oversized requests/uploads;
- enumeration/brute force;
- raw exception leakage.

Use framework protections rather than bypassing them for convenience.

## 14. Logging and analytics

Do not log/capture unnecessarily:
- passwords;
- access/refresh tokens;
- payment secrets/full provider credentials;
- verification documents;
- private message bodies;
- private dispute/support evidence;
- raw Production database URLs.

Analytics should answer behaviour/failure questions using minimum necessary properties.

## 15. Dependency security

Keep dependencies locked and reviewed. Dependabot/security updates may exist, but do not merge blindly if they affect framework/runtime compatibility.

A dedicated dependency/security scanning gate remains an engineering area to improve; see `docs/OPEN-ISSUES.md`.

## 16. Deployment security

Deployment controls are RED.

Before calling a revision Production-ready:
- Platform CI/Release Gate green;
- intended Git SHA verified;
- Production deployment SHA matches;
- Production review/debug flags off;
- correct secure origins/cookies/HTTPS settings;
- correct payment/database environment;
- safe smoke checks complete.

A Vercel READY preview alone is not security/release approval.

## 17. Incident response basics

For a suspected security incident:
1. stop further risky releases/changes;
2. preserve evidence/logs without exposing them publicly;
3. revoke/rotate compromised credentials;
4. restrict affected feature/access if necessary;
5. assess affected users/data/transactions;
6. fix through reviewed RED-scope change;
7. verify exact deployed revision;
8. document the consequential decision/incident privately as appropriate.

## 18. Security review checklist for PRs

Ask:
- Does this expose new data?
- Does this change who can act?
- Can a Client/Professional act on another user’s object?
- Can client-controlled state bypass backend rules?
- Does this add a secret/environment variable?
- Does this alter schema/data retention?
- Does this touch payment/verification/admin?
- Could retries cause duplicate side effects?
- Could logs/analytics leak sensitive data?
- What happens if the external provider fails?

If any answer is material, document it explicitly in the PR.
