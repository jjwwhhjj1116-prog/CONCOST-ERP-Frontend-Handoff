# Backend Start Here

## Immediate tasks

1. Implement authenticated session and company authorization. Every protected request must validate the selected company server-side.
2. Implement the frozen OpenAPI operations in `openapi/` without changing their state, permission, revision, idempotency, or file-ready semantics.
3. Provide persistence adapters for Project, Drive, Approval, Mail, Business Card OCR, AI meeting notes, Sales, and Finance in that order.
4. Keep `DEMO_LOCAL`, `API_SANDBOX`, and `PRODUCTION_SERVER` behavior separate. Production must never fall back to local success.
5. Import real personnel only through an audited backend workflow. Follow `SECURE_REAL_DATA_IMPORT.md`.
6. Configure company-scoped search, notifications, audit events, and provider capabilities.

## Contract sources

- Common, Project Chain, Collaboration, and Business contracts: `docs/contracts/`
- OpenAPI 3.1 contract: `openapi/erp-api-v1.yaml`
- Frontend adapter map and module status: `docs/handoff/vietqs-frontend/`
- Runtime mode rules: `docs/handoff/vietqs-frontend/RUNTIME_MODES.md`

## Local frontend

```powershell
npm.cmd ci --prefer-offline --no-audit --no-fund
$env:NEXT_PUBLIC_RUNTIME_MODE='DEMO_LOCAL'
npm.cmd test
npm.cmd run lint
npx.cmd tsc --noEmit --incremental false
npm.cmd run build -- --webpack
```

The frontend is configured with the `/workspace` base path. Demo credentials are documented only for `DEMO_LOCAL` in `SYNTHETIC_DEMO_ACCOUNTS.md`.

## Server prototype

The included `server/` tree is a handoff prototype, not a production backend. Do not run a seed by default. Synthetic seed execution requires explicit opt-in and is blocked in production.
