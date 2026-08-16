# V2 deployment state

- Web source: `frontend/`
- Production branch: `main`
- Local/Codespaces preview: repository-root `npm run preview`
- Preview port: `3000`
- Vercel project must use Root Directory `frontend`
- Legacy V1 landing components are not the production web source of truth

If a browser shows the legacy site, first verify the deployment/preview is built from current `main`, then clear `.next` for local preview or correct the Vercel project/root-directory/domain target for production.
