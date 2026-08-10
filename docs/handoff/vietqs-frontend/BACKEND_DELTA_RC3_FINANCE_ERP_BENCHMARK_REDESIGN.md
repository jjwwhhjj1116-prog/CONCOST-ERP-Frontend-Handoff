# Backend Delta RC3: Finance ERP Benchmark Redesign

## Purpose

The RC3 frontend now provides a company-scoped finance operating workspace for ledger, receivable, payable, settlement, expense, tax invoice, budget, treasury, project profitability, monthly close, internal control, and Excel handoff flows. In `DEMO_LOCAL` these are synthetic simulations only. This document defines the backend capabilities required before API Sandbox or Production can persist or certify those workflows.

This is a handoff delta, not an OpenAPI amendment. The frozen OpenAPI remains authoritative until a separately approved contract change incorporates these candidates.

## Non-Negotiable Boundary

- Require authenticated session, selected `X-Company-Id`, allowed-company authorization, resource scope, and `FINANCE_ACCESS` before query or projection.
- Do not infer company from the user's default company, project owner, counterparty, or cached browser state.
- Apply permission filters before projecting amount, counterparty, evidence filename, source metadata, search result, notification preview, or export content.
- Require canonical `projectId`; preserve `projectNo` as a snapshot/search field and never join projects by name.
- Require revision or `If-Match` for updates and an idempotency key for creates, settlement, provider request, close, reopen, import apply, and export job creation.
- Return safe typed errors and correlation/request identifiers. Never return secrets, provider tokens, account credentials, or raw audit payloads.
- Store money as numeric minor units or validated decimal plus explicit currency. Tax rate and rounding are company-policy capabilities, not a global hard-coded 10 percent rule.
- `API_SANDBOX` and `PRODUCTION_SERVER` must never fall back to browser demo state.

## Candidate Operations

| Frontend operation | Server responsibility | Minimum scope and concurrency |
|---|---|---|
| `getFinanceDashboard` | Aggregate revenue, purchase, due collection/payment, AR/AP, budget, expense, management profitability, close, and controls | Company + permission-first query; as-of date and included statuses returned |
| `listFinanceTransactions` | Page and filter revenue/purchase ledger | Company, project, counterparty, date, status, evidence, approval; revision in row |
| `createFinanceTransaction` | Create authorized revenue plan or purchase entry | Idempotency key, company, canonical project, currency, tax policy, source ref, before/after audit |
| `updateFinanceTransaction` | Correct a draft/reviewable transaction | Revision match, closed-period lock, immutable source lineage, before/after audit |
| `recordFinanceSettlement` | Record partial/full collection or payment | Atomic remaining-balance check, idempotency, actual date, evidence ref, revision |
| `listFinanceAging` | Return current, 1-30, 31-60, 61-90, and 90+ buckets | Company-scoped source rows and as-of date; no unauthorized counterparty projection |
| `listFinanceExpenses` | Query expense/card records and policy state | Company/project/owner/approval/posting scopes; READY evidence only |
| `createFinanceExpense` | Create expense candidate and approval linkage | Payment method, policy capability result, project, evidence, idempotency, revision |
| `listTaxInvoices` | Query sales/purchase tax documents and source state | Company/provider capability; project and transaction source lineage |
| `requestTaxInvoice` | Submit provider request after finance review/approval | Provider readiness, idempotency, immutable request payload, callback reconciliation, no false success |
| `listFinanceBudgets` | Query company/unit/project budgets and execution | Company, scope authorization, account/category, period, pending/actual/forecast |
| `createFinanceBudget` | Create or revise a budget policy record | Revision, approval policy, currency, INFO/WARN/BLOCK policy capability |
| `listFinanceCashPlans` | Query manual/source-derived expected inflow/outflow | Company, source, date, direction, status; no fabricated bank balance |
| `createFinanceCashPlan` | Create forecast candidate or approved recurring plan | Idempotency, source ref, recurrence capability, audit |
| `getFinanceCashForecast` | Calculate 7/30/90 day forecast | Company/as-of/currency; disclose included source types and stale state |
| `getProjectProfitability` | Aggregate project commercial management profitability | Canonical project, source IDs, permission, currency; label as non-statutory |
| `getFinanceClosing` | Return month checklist, lock state, and progress | Company/month and role authorization |
| `transitionFinanceClosing` | Move close state or reopen with reason | Revision, complete-checklist gate, closed-period lock, step-up approval for reopen, audit |
| `listFinanceControls` | Query policy, provider, authorization, import, and source-trace controls | Company/admin scope with safe metadata projection |
| `resolveFinanceControl` | Record review/resolution without deleting event history | Revision, actor, reason, evidence, before/after audit |
| `importFinanceWorkbook` | Validate, preview, duplicate-check, and atomically apply supported sheets | Upload scan READY, formula/macro rejection, company scope, idempotency, row errors, audit |
| `exportFinanceWorkbook` | Produce permission-scoped workbook for current filters or selected rows | FINANCE_ACCESS, company scope, export audit, expiring READY file ref |

## Domain Requirements

### Revenue, Receivables, Purchases, and Payables

- Support multiple billing rounds per project and preserve the commercial decision/project lineage.
- Store supply, VAT, total, settled amount, due date, status, currency, and source/evidence references.
- Partial settlement must be atomic and cannot exceed the remaining balance.
- Aging must use an explicit as-of date and return drill-down source IDs.

### Expense, Evidence, Approval, and Posting Candidate

- Keep employee expense entry capability separate from full finance-ledger access.
- Accept only READY file references as official evidence.
- Reuse the existing electronic approval engine with `expenseId`, project context, amount, category, and READY evidence.
- Approval completion may create a posting candidate; it must not claim official accounting posting without the accounting adapter and policy.

### Tax, Bank, and Card Providers

- Expose provider state as `PROVIDER_NOT_CONFIGURED`, `READY`, `DEGRADED`, or `ERROR`.
- Provider submission is asynchronous and must persist request/callback/reconciliation state.
- Never return `ISSUED`, a live bank balance, or live card collection success solely from a frontend request.
- Korea and Viet QS provider capabilities are independent.

### Budget and Treasury

- Budget dimensions: COMPANY, UNIT, PROJECT; account/category; MONTH/QUARTER/HALF_YEAR/YEAR.
- Return budget, actual, committed/pending, forecast, balance, rate, and effective INFO/WARN/BLOCK control.
- Treasury must distinguish planned cash, source-derived expected cash, fixed-cost candidates, provider balance, stale balance, and unavailable balance.

### Project Management Profitability

- Aggregate order/agreed amount, revenue plan, billing, collection, purchase, expense, AR, AP, management profit, and margin.
- Include source IDs for drill-down and retain canonical `projectId`/`projectNo`.
- Never label this projection as statutory profit or an audited financial statement.

### Monthly Close and Internal Control

- Close states: OPEN, IN_PROGRESS, REVIEW, CLOSED, REOPENED.
- Closing requires all mandatory checklist items and locks covered-period mutation.
- Reopen requires reason, role/capability, approval policy, revision, and complete audit.
- Every create/update/delete/archive/restore/state/settlement/assignment/provider/import action records before/after metadata, actor, company, revision, source/evidence IDs, correlation ID, and timestamp.
- Do not copy document bodies, secrets, payment credentials, or full file contents into audit events.

## Company, Access, Search, Notification, and Export

Frontend eligibility remains ADMIN, GRADE_1, or active MANAGEMENT_SUPPORT membership. Backend authorization remains `FINANCE_ACCESS`; rank alone must not grant it.

Unauthorized users receive no finance menu result, direct-route payload, search result, widget amount, notification preview, export, file metadata, counterparty, or evidence name. Administrators still require an explicit selected company; no cross-company all-data fallback is allowed.

Notification candidates include receivable due/overdue, payable due, budget warning/exceeded, expense review, evidence missing, closing task due, and provider error. Deep links must include the exact authorized view/filter/record, while title and amount projection remains permission-gated.

## Excel Security and Reconciliation

- Supported sheets: Revenue, Purchase, Cashflow, Expense, Budget.
- Use upload intent, malware scan, template/version detection, header mapping, preview, validation, duplicate detection, atomic apply, and result report.
- Reject VBA/macro formats and cells containing formulas. Never evaluate workbook formulas on the server.
- Export only selected-company, permission-approved rows and log the export event.
- Round-trip semantic fields must remain stable; server-assigned IDs, revision, and audit are not client-authoritative.

## Required Error Codes

`AUTH_REQUIRED`, `COMPANY_REQUIRED`, `COMPANY_FORBIDDEN`, `FINANCE_ACCESS_REQUIRED`, `RESOURCE_COMPANY_MISMATCH`, `PROJECT_NOT_FOUND`, `REVISION_CONFLICT`, `IDEMPOTENCY_CONFLICT`, `INVALID_SETTLEMENT_AMOUNT`, `CLOSED_PERIOD_LOCKED`, `CLOSING_CHECKLIST_INCOMPLETE`, `REOPEN_REASON_REQUIRED`, `TAX_PROVIDER_NOT_CONFIGURED`, `BANK_PROVIDER_NOT_CONFIGURED`, `FILE_NOT_READY`, `IMPORT_TEMPLATE_INVALID`, `IMPORT_FORMULA_BLOCKED`, `VALIDATION_FAILED`, `PROVIDER_ERROR`.

## Sandbox Acceptance

1. Authenticate with explicit company and `FINANCE_ACCESS`.
2. Verify CON-COST and Viet QS data isolation on every list, aggregate, search, notification, and export.
3. Create project-linked revenue and purchase records using canonical IDs.
4. Record repeated partial settlement with no duplicate and correct balance/revision.
5. Verify tax/bank/card false-success remains zero while providers are missing.
6. Create expense, attach READY evidence, open approval draft, and produce posting candidate only after approved response.
7. Verify budget INFO/WARN/BLOCK and closed-month mutation guards.
8. Close and reopen with reason, revision, and audit.
9. Import/export five sheets with formula/macro rejection and permission-scoped output.
10. Confirm server-mode API failure never activates demo persistence.
