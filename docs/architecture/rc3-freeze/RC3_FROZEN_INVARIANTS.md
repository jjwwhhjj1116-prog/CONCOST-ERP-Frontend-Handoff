# RC3 Frozen Invariants

These invariants are regression gates. The Integration Harness may observe and
report them but must not redefine them.

## Project Chain

- One Estimate Request lineage produces at most one reserved canonical Project
  and one Project Intake.
- Intake completion preserves one `projectId`, issues one `projectNo` in
  `YYYYNNN` form, publishes the Project, and exposes it to assigned units in
  `PRE_WORK` without department copies.
- Retry is idempotent; assignment and database projections do not duplicate.

## Estimate Worklist

- Estimate Request Management defaults to active work only.
- Transfer to Intake removes the item from the active queue but preserves its
  database lineage. Delete is archive; restore retains `estimateRequestId`.
- Estimate financial data is restricted to approved financial access roles and
  never projected through operational Intake views.

## Intake

- Intake is created only from a WON estimate path; direct blank intake creation
  remains disabled.
- Four-step completion validates in place and supports an explicit unknown start
  date. Accepted revisions preserve `intakeId`, `projectId`, and `projectNo`.
- Revision changes record before/after, reason, actor, timestamp, and recipients.

## Staffing

- Staffing is scoped by canonical `projectId + unitId`.
- The current unit is explicit; no `assignments[0]` or FINISH fallback exists.
- Each unit has exactly one PM and may have multiple non-PM role assignees.

## Finance Access

- UI access requires ADMIN, GRADE_1, or active Management Support membership.
- The server capability `FINANCE_ACCESS` is final for production.
- Menu, route, search, widgets, export, cache, and amount projection all honor
  the same boundary. Provider absence never creates tax/bank/card success.

## Business Card

- OCR simulation is visibly demo-only and requires human review before Contact
  creation or merge.
- Business Card Record and canonical Contact remain separate. Contact carries
  `companyId`; cross-company candidates never mix.
- Original images are not persisted as browser-local Base64 payloads.

## Claim

- Claim work uses canonical `projectId + claimId`; `/conflicts` remains the
  schedule/resource conflict route.
- Evidence and reports preserve version, checksum, classification, audit, and
  legal-hold boundaries.
- AI output remains a reviewed draft with provenance and citations; approval is
  required before final delivery.

## Runtime Boundary

- `DEMO_LOCAL` is visibly simulated and does not claim server persistence.
- `API_SANDBOX` and `PRODUCTION_SERVER` never fall back to local demo success.
- Every protected request uses the selected `X-Company-Id`; stale company
  responses are rejected before state application.
- Permission is applied before projection. Diagnostics never expose credentials,
  headers, body data, customer content, or personal data.
