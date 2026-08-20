# Internal Review Preview Enablement

Status: configuration action required in hosting environment.

The repository already contains a development-only internal review login flow. To expose it safely in a Vercel Preview deployment, configure the Preview environment only with:

```env
NEXT_PUBLIC_INTERNAL_REVIEW_MODE=true
```

The backend environment serving that preview must also have:

```env
DEBUG=True
INTERNAL_REVIEW_MODE=True
```

Do not set these values in Production.

Expected reviewer identities are created automatically by the backend:

- `internal-review-client@review.sabiway.local`
- `internal-review-professional@review.sabiway.local`

No password is used. The backend issues a short-lived review session and enforces non-staff/non-superuser access.

After changing the Preview environment variables, redeploy the relevant branch and confirm the internal review entry points appear and authenticate into protected Client and Professional screens.