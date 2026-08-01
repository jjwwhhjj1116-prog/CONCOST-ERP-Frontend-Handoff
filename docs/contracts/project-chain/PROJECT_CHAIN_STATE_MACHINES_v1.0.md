# PROJECT CHAIN STATE MACHINES v1.0

All transitions are server-authoritative in production. The frontend renders returned state,
revision and capabilities and never fabricates a successful transition.

## 1. Estimate Request
`DRAFT -> INQUIRY_RECEIVED -> QUOTE_PREPARING -> QUOTE_SENT -> NEGOTIATING -> WON|LOST|ON_HOLD|CANCELLED`.

## 2. Estimate Sheet
`DRAFT -> INTERNAL_REVIEW -> APPROVED -> ISSUED -> SUPERSEDED`; cancellation is audited.
ISSUED is immutable. Revision creates a new DRAFT version.

## 3. Commercial Decision
Before Execution Plan: audited hold/cancel/reopen with reason. After plan or Intake Draft:
cancel dependent plan/intake and issue a correction preserving lineage. After Project
activation: Project cancellation or contract-change workflow only.

## 4. Execution Plan
`DRAFT -> CONFIRMED -> CONSUMED`; `DRAFT -> CANCELLED`. Confirmation requires backend
`canConfirmExecutionPlan`.

## 5. Project Intake
`DRAFT -> SUBMITTED -> UNDER_REVIEW -> APPROVED`; review may request
`CHANGES_REQUESTED -> SUBMITTED`; cancellation is explicit. Submit requires four steps,
READY files and at least one primary-team PM candidate.

## 6. Project Lifecycle
`INTAKE_PREPARATION -> START_PLANNED -> PM_ASSIGNMENT -> SCHEDULE_PLANNING -> IN_PROGRESS -> QC -> DELIVERY -> COMPLETED -> ARCHIVED`.
`CANCELLED` is explicit. Health is independent: `NORMAL|AT_RISK|BLOCKED`.

## 7. Assignment
`START_PLANNED -> PM_ASSIGNED -> SCHEDULED -> ACTIVE -> COMPLETED`.
Changes use `CHANGE_PENDING`, then `REMOVED|REPLACED` history.

## 8. PM Schedule
`PENDING_ASSIGNMENT -> PM_ASSIGNED -> DRAFT_REQUESTED -> DRAFTING -> SUBMITTED -> APPROVED`;
rejection returns `REJECTED -> DRAFTING`. Submit/approve require an assigned PM.

## 9. Questions
`OPEN -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> CLOSED`; a reasoned reopen yields
`REOPENED`. Visibility is explicit and defaults to `PROJECT_TEAM`.

## 10. QC
`OPEN -> IN_PROGRESS -> REVIEW_REQUESTED -> APPROVED -> SENT`; changes yield
`CHANGES_REQUESTED`. Approval actors come from backend policy.

## 11. Delivery
`DRAFT -> INTERNAL_REVIEW -> APPROVED -> DELIVERY_PREPARED -> DELIVERED -> ACKNOWLEDGEMENT_PENDING -> ACKNOWLEDGED|REJECTED`.
A re-delivery makes a new DRAFT version and the prior version becomes SUPERSEDED.

## 12. Work Log and Profitability
Work log: `DRAFT -> SUBMITTED -> PM_APPROVED -> MANAGEMENT_APPROVED`, with rejection.
Profitability: `DRAFT -> CALCULATED -> REVIEWED -> SNAPSHOTTED`; snapshots are immutable.
