# RC3 Project Pipeline and Korean Holidays Backend Delta

Status: `BACKEND_CAPABILITY_PENDING`

This document describes backend work required by the RC3 frontend. The official OpenAPI contract has not been changed. Backend implementation must be reviewed against `CONTRACT_CHANGE_REQUEST_RC3_PROJECT_ASSIGNMENTS.md` before integration.

## Immediate Backend Work

1. Implement a server-owned Korean public holiday provider using KASI data.
2. Implement one atomic estimate award command that creates or reuses the commercial decision, canonical project, intake draft, execution assignments, and estimate database row.
3. Persist the four-step intake draft with optimistic revision checks.
4. Query project boards by canonical execution assignment IDs.
5. Return provider and capability states without simulating success.

## Korean Holiday Capability

Proposed endpoint:

```http
GET /api/v1/calendar/holidays?country=KR&year=2026
X-Company-Id: CON_COST
```

Response items must include:

```json
{
  "date": "2026-08-17",
  "name": "대체공휴일(광복절)",
  "type": "PUBLIC_HOLIDAY",
  "source": "KASI",
  "sourceUpdatedAt": "2026-01-01T00:00:00Z"
}
```

Requirements:

- Keep KASI credentials only in backend secret storage.
- Cache by `country + year + source version` and expose cache age.
- Preserve multiple names on the same date.
- Keep `PUBLIC_HOLIDAY`, `SUBSTITUTE_HOLIDAY`, and `COMPANY_CLOSED_DAY` distinct.
- Company closure records require company scope and must never be merged into the KASI source data.
- A provider failure must return an explicit unavailable or stale capability state. It must not return an empty successful calendar.

Acceptance fixtures must include `2026-08-15` and `2026-08-17`.

## Atomic Won Conversion

Proposed endpoint:

```http
POST /api/v1/estimate-requests/{estimateRequestId}/decision
X-Company-Id: CON_COST
Idempotency-Key: estimate-decision:{estimateRequestId}:WON
If-Match: {requestRevision}
```

For a `WON` decision, a single database transaction must:

1. Validate company, permission, request revision, sent estimate version, and at least one execution unit.
2. Create or reuse one `CommercialDecision`.
3. Create or activate one canonical `Project`.
4. Create or reuse one `ProjectIntake` draft.
5. Upsert one assignment per selected execution unit and exactly one primary assignment.
6. Upsert the same estimate database `PJ` row by `estimateRequestId`.
7. Append audit and notification outbox records.
8. Commit all records or none.

Repeated requests with the same idempotency key must return the original identifiers and `idempotent: true`. They must not create another project, intake, assignment, DB row, notification event, or audit transition.

## Canonical Identity

```text
EstimateRequest.id
  -> CommercialDecision.estimateRequestId
  -> Project.estimateRequestId
  -> ProjectIntake.estimateRequestId
  -> EstimateDbRecord.sourceRecordId

Project.id
  -> ProjectIntake.projectId
  -> ProjectExecutionAssignment.projectId
  -> EstimateDbRecord.projectId
```

Project names, department labels, and UI route labels are never relationship keys.

## Intake Draft

- Opening the intake route must not create an empty record.
- A draft is created by the won conversion command or an explicit authorized create command.
- Prefill fields are editable, while `sourceSnapshot` remains immutable.
- Save, review, and accept require `X-Company-Id`, resource scope, permission, and expected revision.
- User-entered drafts must never be removed by the cleanup for generated blank drafts.

## Estimate Database Upsert

The row key is `section=PJ + sourceRecordId=EstimateRequest.id`. `Project.id` becomes an additional lookup key after won conversion. Request, sheet, decision, and intake events update that row. Existing manually managed fields must be merged and preserved.

## Project Board Queries

Proposed filters:

```http
GET /api/v1/projects?group=TECHNICAL
GET /api/v1/projects?group=CLAIM
GET /api/v1/projects?group=DEVELOPMENT
GET /api/v1/projects?unit=FINISH
GET /api/v1/projects?unit=STRUCTURE
GET /api/v1/projects?unit=CIVIL_LANDSCAPE
```

`TECHNICAL` includes `FINISH`, `STRUCTURE`, and `CIVIL_LANDSCAPE` assignments only. `CLAIM` and `DEVELOPMENT` use their exact assignment IDs. A project with multiple assignments appears in every matching view with the same `projectId`.

## Security and Audit

- Require `X-Company-Id` and reject missing or unauthorized company scope.
- Never infer company, unit, PM, or approver from display text.
- Do not expose KASI keys, provider tokens, storage credentials, or immutable source attachments.
- Audit decision, project creation, intake creation, assignment changes, PJ row upserts, and notification outbox writes.

## Frontend Demo Boundary

The RC3 frontend demonstrates deterministic local behavior only in `DEMO_LOCAL`. `API_SANDBOX` and `PRODUCTION_SERVER` must not fall back to local success. The backend remains the source of truth for production identifiers, transactions, permissions, revisions, notifications, and provider state.
