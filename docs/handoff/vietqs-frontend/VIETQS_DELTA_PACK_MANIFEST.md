# Viet QS Delta Pack Manifest

This manifest prepares a reading package only. It does not transmit work or
authorize a backend implementation.

## Package Roots

- `docs/contracts/`: frozen product contracts.
- `openapi/`: frozen API contract; unchanged in this phase.
- `docs/handoff/vietqs-frontend/RC3_BACKEND_DELTA_CUMULATIVE_INDEX.md`.
- `docs/handoff/vietqs-frontend/RC3_FRONTEND_BACKEND_CONTRACT_DRIFT_REGISTER.md`.
- module-specific `BACKEND_DELTA_*` and `CONTRACT_CHANGE_REQUEST_*` documents.
- `FRONTEND_INTEGRATION_CAPABILITY_MATRIX.csv`.
- `API_SANDBOX_SMOKE_MILESTONES.md`.
- `TYPED_INTEGRATION_ERROR_TAXONOMY.md`.

## Acceptance Boundary

The backend team confirms capability readiness through the M0-M7 probes. The
frontend registry reports missing capability honestly and must not be edited to
simulate a PASS. Server authorization, company isolation, provider secrets,
deployment, database, storage, notifications, backup, and migration execution
remain backend-owned.
