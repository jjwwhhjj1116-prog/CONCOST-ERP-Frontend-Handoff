# Contract Change Request: Estimate Request Worklist State

Status: BACKEND_CAPABILITY_PENDING

This document requests an additive contract extension. It does not modify the frozen OpenAPI.

| Field | Type | Rule |
|---|---|---|
| worklistState | enum | `ACTIVE`, `TRANSFERRED_TO_INTAKE`, `ARCHIVED` |
| transferredToIntakeAt | timestamp nullable | Set only when an Intake draft is created |
| archivedAt / archivedBy / archiveReason | nullable | Required for archive audit |
| restoredAt / restoredBy / restoreReason | nullable | Required for restore audit |

Invariant: the same `estimateRequestId` is used before and after every transition. A linked intake is opened, never duplicated. Hard delete is outside RC3.
