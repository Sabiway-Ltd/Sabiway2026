# Security policy

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability or exposed credential. Use the repository's **Security** tab to open a private security advisory and notify the SabiWay Ltd repository administrators.

Include the affected component, reproduction steps, impact, and any suggested mitigation. Do not include real customer data.

## Credential handling

Secrets belong in deployment secret stores or local untracked environment files. Commit only `.env.example` templates with placeholder values.

Because this repository was made public after being copied from an earlier codebase, every credential previously committed must be treated as exposed and rotated. Removing a file from the current tree does not remove it from Git history.
