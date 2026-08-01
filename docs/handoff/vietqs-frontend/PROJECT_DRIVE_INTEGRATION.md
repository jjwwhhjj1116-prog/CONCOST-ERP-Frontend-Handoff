# Project and Drive Integration

## Canonical Project Flow

```text
Estimate Request
→ Estimate Sheet
→ Commercial Decision
→ Execution Plan
→ Project Intake
→ canonical Project
→ Schedule / Question / QC / Meeting / Work Log / Delivery / Profit
```

All organization views reference the same `projectId`. Do not create copies per
department and do not join by project name.

## Frontend Coverage

The Project handoff bridge provides:

- estimate, intake, execution, activation, operations, QC, delivery, and profit
  lifecycle visibility
- technical headquarters, finishing, structure, civil/landscape, claim center,
  and development views
- Project links to schedule, questions, meetings, Drive, Approval, and AI
- explicit Demo/Backend capability state

The existing Project Intake route retains the four-step workflow and draft
safety contract. In Sandbox/Production, missing or failed persistence must not
switch to a local Demo draft.

## Organization Assignment

The Backend owns organization IDs, assignment validation, and permissions.
Frontend labels are display values only. One Project may have:

- one lead organization
- one lead team
- multiple participating teams
- multiple support organizations
- PM candidates followed by an approved PM

The Backend must return assignment records keyed by IDs and must keep overall
Project lifecycle state separate from team assignment state.

## Drive Binding

Drive supports:

- Drive Home, technical headquarters, claim center, and development roots
- Project and Claim folder binding states
- upload queue, progress, cancel/retry, scan, `READY`, quarantine, and failure
- version and permission summaries

Binding keys are `projectId` and `claimId`. Folder names are presentation
templates, not relationship keys.

## File Lifecycle

```text
Upload Intent
→ binary transfer owned by Backend/Provider
→ finalize
→ scan
→ READY or QUARANTINED/FAILED
```

Only a server-issued `READY` file reference may be attached to Project,
Approval, Mail, Claim, or AI records. Demo upload progress is visibly simulated.

## Backend Acceptance

1. The same Project appears in each assigned organization view with one ID.
2. Direct access to another company Project returns `403` or `404` according to
   the frozen contract.
3. Intake approval is idempotent and activates only one Project.
4. Drive folder creation is outbox/idempotency safe.
5. Retry cannot duplicate a Project, binding, notification, or file.
6. A Provider failure never produces a local READY file.
