# Sales and Finance Operational MVP Scope

Status: `READY_WITH_BACKEND_DEPENDENCIES`

The RC3 frontend replaces the generic business-module placeholder with dedicated Sales and Finance operational workbenches. Demo data is synthetic, company-scoped, session-only data. It is not an operational system of record.

## Sales Operational MVP

Implemented for handoff:

- Customer 360 with contacts, opportunities, and activity timeline
- Contact Directory linked to the existing business-card OCR review flow
- duplicate-contact review status and merge-request action boundary
- opportunity Pipeline Kanban and editable opportunity details
- calls, meetings, mail, notes, and task activity records
- Mail Draft, Calendar, Task, and canonical Estimate Request links
- Contact XLSX/CSV import preview and XLSX/CSV export
- CON-COST/Viet QS data isolation and KO/VI/EN workbench copy
- explicit `DEMO_LOCAL`, `API_SANDBOX`, and `PRODUCTION_SERVER` behavior

Sales Quote continues to reuse the Project Chain Estimate Request and Estimate Sheet. Opportunity conversion must not create a second quote or project system.

## Finance Operational MVP

Implemented for handoff:

- finance dashboard and sales/purchase ledger
- canonical Project picker and Project number lineage
- supply amount, VAT, total, paid amount, balance, due date, and overdue state
- partial collection/payment recording
- READY evidence metadata with checksum and restricted classification
- electronic approval Draft linkage
- tax-invoice Provider state without false issuance success
- expense/corporate-card, budget/actual, treasury Provider, and monthly-closing views
- Finance XLSX/CSV import preview and XLSX export
- CON-COST/Viet QS data isolation and KO/VI/EN workbench copy
- non-finance projection guard for menu, direct route, search, widget, and export boundaries

No live bank balance, tax invoice, card settlement, or statutory ledger is represented as connected.

## Authorization

Frontend access follows the approved policy:

- `ADMIN`
- `GRADE_1`
- active `MANAGEMENT_SUPPORT` membership

The backend remains authoritative and must also require `FINANCE_ACCESS`. Rank alone must never grant finance access. Unauthorized responses must not include amounts, counterparties, evidence names, or document metadata.

## Persistence Boundary

- `DEMO_LOCAL`: synthetic session simulation with a visible disclosure
- `API_SANDBOX`: requires the approved backend adapter; no local success fallback
- `PRODUCTION_SERVER`: requires server authorization, revision, idempotency, audit, and company scope

The browser store is deliberately not persisted and must not be treated as production SSOT.

## Backend Handoff

Implement the capabilities listed in `BACKEND_DELTA_RC3_SALES_FINANCE_MVP.md`. Official OpenAPI contracts are unchanged in this frontend phase.
