# Contract Change Request: RC3 Project Execution Assignments

Status: `PROPOSED_FOR_BACKEND_REVIEW`

The official OpenAPI files remain unchanged. This request records the additive contract needed to replace department-name matching and PM assignment during the estimate stage.

## Canonical Enums

```yaml
ProjectExecutionUnitId:
  type: string
  enum:
    - FINISH
    - STRUCTURE
    - CIVIL_LANDSCAPE
    - CLAIM
    - DEVELOPMENT

ProjectExecutionAssignmentRole:
  type: string
  enum: [PRIMARY, PARTICIPATING]

ProjectExecutionAssignmentStatus:
  type: string
  enum: [PRE_START, START_PLANNED, ACTIVE, COMPLETED, REMOVED]
```

## Estimate Request Additions

```yaml
targetUnitIds:
  type: array
  minItems: 1
  uniqueItems: true
  items:
    $ref: '#/components/schemas/ProjectExecutionUnitId'
primaryUnitId:
  $ref: '#/components/schemas/ProjectExecutionUnitId'
```

Rules:

- `primaryUnitId` must be present in `targetUnitIds`.
- Estimate requests do not assign a PM.
- `WON` confirmation requires at least one unit and a sent immutable estimate version.
- `LOST`, `CANCELLED`, and `ON_HOLD` do not create a project or intake.

## Project Assignment Resource

```yaml
ProjectExecutionAssignment:
  type: object
  required: [id, projectId, companyId, unitId, role, status, assignedAt, revision]
  properties:
    id: { type: string, format: uuid }
    projectId: { type: string, format: uuid }
    companyId: { type: string }
    unitId: { $ref: '#/components/schemas/ProjectExecutionUnitId' }
    role: { $ref: '#/components/schemas/ProjectExecutionAssignmentRole' }
    status: { $ref: '#/components/schemas/ProjectExecutionAssignmentStatus' }
    assignedBy: { type: string }
    assignedAt: { type: string, format: date-time }
    removedAt: { type: [string, 'null'], format: date-time }
    revision: { type: integer, minimum: 1 }
```

Recommended constraints:

- Unique active assignment on `(companyId, projectId, unitId)`.
- Exactly one active `PRIMARY` assignment per project.
- Project and assignment `companyId` must match.
- Assignment history is append-only; removal changes status rather than deleting audit evidence.

## Won Decision Response

```json
{
  "request": { "id": "estimate-request-demo-001", "status": "WON" },
  "decision": { "id": "commercial-decision-demo-001", "decision": "WON" },
  "project": { "id": "project-demo-001", "status": "INTAKE_RECEIVED" },
  "intake": { "id": "project-intake-demo-001", "status": "DRAFT" },
  "assignments": [
    { "id": "assignment-demo-001", "unitId": "FINISH", "role": "PRIMARY", "status": "PRE_START" }
  ],
  "estimateDatabaseRecordId": "estimate-db-demo-001",
  "idempotent": false
}
```

## Errors

| Code | HTTP | Meaning |
|---|---:|---|
| `COMPANY_REQUIRED` | 400 | `X-Company-Id` is missing. |
| `COMPANY_FORBIDDEN` | 403 | User cannot access the selected company. |
| `EXECUTION_UNIT_REQUIRED` | 422 | No execution unit was selected. |
| `PRIMARY_UNIT_INVALID` | 422 | Primary unit is not in the selected set. |
| `ESTIMATE_VERSION_NOT_SENT` | 409 | No immutable sent estimate version exists. |
| `REVISION_CONFLICT` | 409 | Request revision is stale. |
| `IDEMPOTENCY_CONFLICT` | 409 | The key was reused with a different payload. |
| `RESOURCE_COMPANY_MISMATCH` | 409 | Request, estimate, decision, or project belongs to another company. |

## Query and Projection Contract

Project board queries apply company scope, permission scope, and execution assignment filters before projection. No project title, customer, file, or assignment metadata may be projected before authorization. The response may be grouped for UI convenience, but every appearance points to the same canonical `projectId`.

## Compatibility

Legacy query `department=FINISH|STRUCTURE|CIVIL_LANDSCAPE|CLAIM|DEVELOPMENT` may be normalized to `unit` during a deprecation window. It must not reintroduce display-name matching. Existing PM fields remain nullable until the PM scheduling phase.

## Review Gate

Backend owners must approve schema names, transaction behavior, revision headers, notification events, and migration strategy before the official OpenAPI is amended. This proposal is additive and does not authorize runtime backend or database implementation by the frontend team.
