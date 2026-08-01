# Contract Set v1.0.1 Changelog

- Version: `1.0.1-fe-contract-all-02-patch`
- Date: `2026-07-28`
- Change requests: `ALL01-OAS-003`, `ALL01-CON-001`
- Classification: non-breaking contract metadata and example PATCH
- Approval basis: user-approved FE-CONTRACT-ALL-02 remediation directive

## Changes

- Corrected 27 standalone component example fields to values already defined by canonical frozen enums.
- Preserved all legacy values in `OPENAPI_ENUM_EXAMPLE_MAPPING_v1.0.1.md`.
- Changed `permissionBeforeProjection` from `false` to `true` on exactly 66 protected Collaboration operations.
- Formalized `Auth -> Company -> Resource Scope -> Permission -> Query/Mutation -> Safe Projection`.

## Affected Files

- `openapi/erp-api-v1.yaml`
- `openapi/modules/mail.yaml`
- `openapi/modules/approvals.yaml`
- `openapi/modules/calendar.yaml`
- `openapi/modules/tasks.yaml`
- `openapi/modules/board.yaml`
- `openapi/modules/notifications.yaml`
- `docs/contracts/OPENAPI_ENUM_EXAMPLE_MAPPING_v1.0.1.md`
- `docs/contracts/collaboration/COLLABORATION_PERMISSION_PROJECTION_POLICY_v1.0.1.md`
- `docs/contracts/CONTRACT_SET_V1_0_1_CHANGELOG.md`

## Compatibility Boundary

- Endpoint changes: none
- DTO structure changes: none
- Schema enum changes: none
- Business state changes: none
- Permission policy relaxation: none
- Breaking changes: none
- Migration impact: none
- Runtime impact: none
- Backend impact: permission-order metadata clarification
- Mock impact: safer canonical example generation

## Validation Requirements

- Invalid component examples: `0`
- Invalid indexed examples: `0` of `252`
- `permissionBeforeProjection=false`: `0`
- Broken references: `0`
- Duplicate operation IDs: `0`
- Critical and High integrated contract conflicts: `0`
