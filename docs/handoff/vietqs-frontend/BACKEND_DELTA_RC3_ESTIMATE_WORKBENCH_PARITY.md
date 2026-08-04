# Backend Delta RC3: Estimate Workbench Parity

## Scope

The RC3 frontend now implements the OFFDAY2 estimate request, sheet, database, input-memory and mail-handoff workflows. Backend teams must preserve the frontend state and safety contracts below; `DEMO_LOCAL` behavior is not production persistence.

## Required capabilities

1. Persist `EstimateRequestProfile` with revision checks and an explicit `X-Company-Id`.
2. Authorize estimate routes only for `ADMIN`, `GRADE_1`, or the `FINANCE_ACCESS` capability. Role names such as PM or department manager are not sufficient.
3. Provide company-scoped create, update, duplicate and delete operations. Delete is allowed only for unsubmitted drafts with no downstream lineage.
4. Persist immutable `EstimateSheetVersion` records. A completed version is never updated in place; correction creates the next DRAFT revision.
5. Apply profile-to-sheet synchronization only to non-manual source cells. `manualOverride=true` is authoritative for the current draft version.
6. Upsert one estimate database PJ row by canonical request/sheet/project lineage. Project names are display values, not join keys.
7. Validate imported workbooks again on the server, reject macros and unsafe formulas, and scan uploaded binaries before they become READY.
8. Persist input suggestions by `(companyId, moduleKey, fieldKey, normalizedValue)` and support usage, recent ordering, add, select and delete.
9. Reject input-memory fields outside the allowlist. Identity, contact, free-text and secret fields are never stored as suggestions.
10. Return permission-filtered widgets, search results, notifications and exports; frontend hiding is only defense in depth.

## Required operations

| Capability | Expected behavior |
|---|---|
| Request update | Requires revision; returns the complete canonical profile. |
| Request duplicate | Creates a new request identity without downstream Project or sheet lineage. |
| Request delete | Rejects requests with completed decision, Project, intake, submitted sheet or audit retention. |
| Sheet create | Creates one sheet identity and version 1 DRAFT. |
| Draft duplicate | Creates the next version under the same sheet identity. |
| Draft delete | Allowed only before submission/export retention rules; returns an auditable tombstone/result. |
| Complete writing | Transitions DRAFT to SUBMITTED (`작성완료`) and freezes its version hash. |
| Create correction | Creates the next DRAFT from SUBMITTED/SENT without mutating history. |
| Mail send result | Only provider-confirmed delivery may transition to SENT. |
| DB upsert | Idempotent by canonical lineage and company. |

## Projection boundary

Project Intake and team Project views must not receive agreed amount, unit price, cost, wage, margin or profitability fields. The server must use separate operational DTOs rather than depend on CSS or client omission.

## Current dependency status

- Frontend workflow: READY.
- Backend persistence and permissions: BACKEND_CAPABILITY_PENDING.
- Mail provider: PROVIDER_TBD_CONTRACT_COMPLETE.
- Workbook binary scanning: BACKEND_CAPABILITY_PENDING.
- Official OpenAPI update: requires approval of the accompanying contract change requests.
