# Viet QS Backend Reading Order

Use this order when API Sandbox implementation begins:

1. Phase 50 baseline and RC3 freeze manifest/invariants.
2. `openapi/erp-api-v1.yaml` and referenced schemas/modules.
3. Frozen Common, Project Chain, Collaboration, and Business contracts in
   `docs/contracts/`.
4. `RC3_BACKEND_DELTA_CUMULATIVE_INDEX.md`.
5. `RC3_FRONTEND_BACKEND_CONTRACT_DRIFT_REGISTER.md`.
6. Relevant module delta and contract-change-request documents.
7. `FRONTEND_INTEGRATION_CAPABILITY_MATRIX.csv`, then M0-M7 smoke milestones.

The later delta documents refine implementation needs but do not override the
frozen contracts or OpenAPI. Raise a contract change request when an operation,
DTO, state, or permission boundary cannot be implemented as frozen.
