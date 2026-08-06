# Contract Change Request: Project Unit Staffing

Status: BACKEND_CAPABILITY_PENDING

## Identity and scope

- One canonical Project; no per-department copies.
- Staffing identity: `projectId + unitId`.
- Candidate query is restricted to the selected company and active organization membership.
- Cross-unit support personnel require a separate authorized action.

## Plan

Each unit has role rows with `roleId`, `roleLabel`, `personnelIds[]`, `startDate`, and `endDate`. PM is single-select and exactly one PM is required for `CONFIRMED` or `ACTIVE`. Other roles are multi-select.

Statuses: `DRAFT | CONFIRMED | ACTIVE | COMPLETED`.

Commands:

- Save staffing draft
- Confirm staffing
- Confirm and start

Every command requires revision/idempotency and emits before/after history with actor, reason, timestamp, and revision. Starting updates only the selected unit assignment and must not duplicate the Project.

## Proposed endpoints

- `GET /api/v1/projects/{projectId}/units/{unitId}/staffing`
- `PUT /api/v1/projects/{projectId}/units/{unitId}/staffing-draft`
- `POST /api/v1/projects/{projectId}/units/{unitId}/staffing-confirm`
- `POST /api/v1/projects/{projectId}/units/{unitId}/staffing-start`
- `GET /api/v1/projects/{projectId}/units/{unitId}/staffing-history`
- `GET /api/v1/organizations/{unitId}/active-members`
- `POST /api/v1/projects/{projectId}/units/{unitId}/support-personnel`
