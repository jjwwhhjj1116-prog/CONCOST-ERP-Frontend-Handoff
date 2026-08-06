# RC3 Project Intake Context, Queue, and Accepted Revision Delta

## Scope

The frontend treats Project Intake as a work queue generated only by the canonical estimate pipeline. Direct intake creation is disabled.

```text
Estimate WON
  -> RESERVED canonical Project
  -> Project Intake DRAFT
  -> complete-won
  -> ACCEPTED Intake + PUBLISHED Project + unit assignments
```

`intakeId`, `projectId`, and `projectNo` remain stable after acceptance and through every correction revision. A revision must not create a second Intake or Project.

## Staffing context

Project staffing screens pass the current route unit as an explicit `contextUnitId`:

- `FINISH`
- `STRUCTURE`
- `CIVIL_LANDSCAPE`
- `CLAIM`
- `DEVELOPMENT`

The server must authorize the current company and unit. It must not infer the unit from the first assignment. If the requested unit is not assigned to the Project, return a scoped not-found or conflict response and do not select another unit.

## Direct intake policy

- `DIRECT_INTAKE` is OFF.
- `new=1`, missing `intakeId`, direct route entry, and refresh must not create data.
- The empty queue directs users to Estimate Request Management.
- The only normal creation lineage is an approved `Estimate WON` command.

## Accepted revision command

Recommended operation:

```http
POST /api/v1/project-intakes/{intakeId}/revisions
X-Company-Id: <selected company>
If-Match: <current revision>
Idempotency-Key: <client generated key>
```

Minimum request:

```json
{
  "reason": "Required correction reason",
  "draft": {},
  "readyFileReferences": []
}
```

Minimum response:

```json
{
  "intake": {},
  "project": {},
  "assignments": [],
  "revision": 3,
  "changedFields": [],
  "eventTypes": []
}
```

The command must atomically:

1. Verify company, resource scope, permission, revision, and idempotency.
2. Require a non-empty correction reason.
3. Preserve `ACCEPTED`, `intakeId`, `projectId`, and `projectNo`.
4. Update the same Estimate DB row.
5. Add or reactivate unit assignments on the same canonical Project.
6. Mark removed assignments `REMOVED`; do not delete their history.
7. Keep exactly one active `PRIMARY` assignment.
8. Accept only file references whose provider state is `READY`.
9. Commit the Intake revision, Project projection, assignment history, outbox events, and audit record in one transaction.
10. Return the committed aggregate. A partial result must not be reported as success.

When the adapter is unavailable, the frontend reports `BACKEND_REQUIRED`. Production and sandbox modes never fall back to local persistence.

## Notification outbox

Event types:

- `PROJECT_INTAKE_UPDATED`
- `PROJECT_INTAKE_ADDITIONAL_MATERIAL_ADDED`
- `PROJECT_INTAKE_SCOPE_CHANGED`
- `PROJECT_INTAKE_SCHEDULE_CHANGED`
- `PROJECT_INTAKE_UNIT_ADDED`
- `PROJECT_INTAKE_UNIT_REMOVED`

Recipients are the editing actor, primary and participating unit managers, Project PM, and assigned personnel. A removed unit's manager and previously assigned personnel receive the removal event. Delivery deduplication key:

```text
intakeId + revision + eventType + recipientUserId
```

User notification preferences may suppress delivery channels, but must not delete the event or audit record.

## Audit requirements

Each revision records:

- actor and timestamp
- reason
- revision before and after
- changed field names
- assignment before and after
- primary unit before and after
- schedule before and after
- file reference IDs, versions, readiness, checksum, and classification

Do not copy file bodies, secrets, credentials, or unrestricted personal data into audit messages.

## Required backend tests

- direct intake creation is unavailable
- missing and unauthorized company scope fail
- revision preserves all canonical IDs and `ACCEPTED`
- stale revision returns conflict
- repeated idempotency key returns the same result
- unit add/remove maintains exactly one active primary
- removed unit recipients receive one removal event per revision
- READY file accepted; pending or failed file rejected
- Estimate DB row is updated, not duplicated
- Project Board query reflects the revision immediately
- transaction rollback leaves Intake, Project, assignments, outbox, and audit unchanged
