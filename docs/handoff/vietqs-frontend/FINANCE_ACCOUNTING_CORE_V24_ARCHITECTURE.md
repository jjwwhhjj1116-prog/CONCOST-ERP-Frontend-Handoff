# Finance Accounting Core V24 Architecture

Status: `BACKEND_REQUIRED`

Audience: Viet QS backend, CON-COST finance owners, security/IT, and the appointed accountant or tax adviser.

This document defines the target accounting boundary for the RC3 finance frontend. It is a backend handoff architecture, not an OpenAPI amendment, database migration, tax opinion, or claim that statutory accounting is already connected. The frozen contracts remain authoritative until an approved contract change adopts these candidates.

## 1. Objective and Boundary

The current frontend provides operational workbenches for revenue, purchase, receivable, payable, settlement, expense, tax-provider state, budget, treasury, project profitability, closing, controls, and Excel handoff. The accounting core must convert approved operational documents into balanced, immutable accounting records without turning browser state into an accounting system of record.

Target flow:

```text
Source document
  -> approval snapshot and final decision
  -> posting request
  -> posting policy evaluation
  -> immutable journal header and lines
  -> general ledger and AR/AP subledgers
  -> reconciliation, close, and reporting projections
```

The stages are deliberately separate:

- A source document describes the business event.
- Approval authorizes the business event; approval does not itself prove accounting posting.
- A posting request is the idempotent command boundary between workflow and accounting.
- A posted journal is immutable accounting evidence.
- GL, subledger, project profitability, and reports are projections from posted journals and allocation records.

## 2. Required Domain Split

| Context | Owns | Must not own |
|---|---|---|
| Source Documents | Sales invoices, purchase invoices, expenses, payments, tax documents, opening-balance batches, adjustment requests, source versions and evidence refs | Posted journal mutation |
| Approval | Form, policy snapshot, steps, decisions, delegation, final approval state | Debit/credit calculation or posting success |
| Posting | Posting request, rule version, validation result, idempotency, journal construction, posting/reversal transaction | Provider credentials or editable posted lines |
| Accounting | Company CoA, periods, journal headers/lines, currencies, dimensions, close locks | Browser-local persistence |
| AR/AP Subledger | Open items, due dates, allocations, residual balances, aging and write-off candidates | Independent monetary truth disconnected from journals |
| Tax/Provider | Provider-neutral requests, callbacks, acknowledgements, provider reference, NTS reference, reconciliation state | Secrets in frontend or provider callback treated as journal without validation |
| Reporting | GL, trial balance, management P&L, balance sheet candidates, project management profitability and source drill-down | Direct editing or untraceable totals |
| Import | File, scan, template, staging rows, mapping, validation, preview, approval and apply result | Direct creation of posted journals from spreadsheet cells |

## 3. Canonical Entity Candidates

Names below are conceptual. Viet QS may adapt naming to its backend conventions while preserving ownership and invariants.

### 3.1 Company-Scoped, Versioned Chart of Accounts

`ChartOfAccountsVersion`

- `id`, `companyId`, `code`, `name`, `effectiveFrom`, `effectiveTo`
- `status`: `DRAFT | APPROVED | ACTIVE | RETIRED`
- `approvedBy`, `approvedAt`, `accountantApprovalRef`
- only one active version per company and effective date

`AccountCode`

- key scope: `companyId + coaVersionId + accountCode`
- `parentAccountId`, `accountType`, `normalBalance`, `isGroup`, `isPostingAllowed`
- `currencyPolicy`, `taxBehavior`, `requiresPartner`, `requiresProject`, `requiresCostCenter`
- no global `accountCode` primary key shared between CON-COST and Viet QS
- historical journal lines retain the exact account and CoA version used at posting time

`ACCOUNTANT_APPROVAL_REQUIRED`:

- company CoA content, numbering, account types and normal balances
- retained earnings and opening-balance clearing accounts
- revenue/expense recognition mapping
- VAT input/output, exempt, zero-rated, non-deductible and rounding accounts
- foreign-exchange gain/loss and bad-debt/write-off accounts
- management-report mapping to statutory-report candidates

Accounting standards do not by themselves select a universal numeric account code list. The accountant-approved company template is the operative configuration.

### 3.2 Periods and Locks

`AccountingPeriod`

- `companyId`, fiscal year, period, start/end dates, currency, status and revision
- status: `OPEN | SOFT_CLOSED | CLOSED | REOPENED`
- `SOFT_CLOSED` blocks ordinary posting and permits only an authorized close-adjustment path
- `CLOSED` blocks source posting, update, delete, allocation and backdated import
- reopen requires reason, approver, step-up/MFA policy, start/expiry, before/after audit and post-review
- posting date and source date are retained separately

`ACCOUNTANT_APPROVAL_REQUIRED`:

- fiscal year and period policy
- close checklist and materiality thresholds
- allowed backdating and close-adjustment rules
- year-end carry-forward and retained-earnings behavior

### 3.3 Posting Request

`PostingRequest`

- `id`, `companyId`, `sourceType`, `sourceId`, `sourceVersion`
- approval document ID and immutable approval snapshot ID
- posting date, currency, rule ID/version, requested by/at
- idempotency key and source fingerprint
- status: `PENDING | VALIDATING | BLOCKED | READY | POSTED | FAILED | SUPERSEDED`
- validation messages, correlation ID and resulting `journalId`

Required uniqueness:

- one effective posting per `companyId + sourceType + sourceId + sourceVersion + postingPurpose`
- retries with the same idempotency key return the original result
- conflicting payloads with a reused key return `IDEMPOTENCY_CONFLICT`

Approval completion should enqueue a posting request through an application service and transactional outbox. A database trigger must not hide rule selection, retries, permission checks, provider state, or audit behavior.

### 3.4 Immutable Journal

`JournalHeader`

- `id`, `companyId`, `journalNo`, `journalType`, `postingDate`, `periodId`
- source and approval lineage, posting request ID, rule/version and idempotency key
- transaction/base currency, exchange rate and exchange-rate source
- status: `DRAFT_VALIDATION | POSTED | REVERSED`
- total debit/credit, posted by/at, correlation ID
- `reversalOfJournalId` and reversal reason where applicable

`JournalLine`

- `journalId`, unique `lineNo`, account ID and CoA version snapshot
- debit amount and credit amount as validated decimals/minor units
- exactly one side is positive; neither negative; zero-only lines prohibited
- transaction and base amounts, exchange-rate/rounding metadata
- partner type/ID, project ID, organization/cost-center ID and optional employee dimension
- tax code/rate/base/amount, due date and subledger open-item reference
- description/memo, evidence version IDs and classifications

Posting invariants:

1. Header company, source company, accounts, dimensions, partner and project must match the selected company.
2. Sum of base debit equals sum of base credit inside one database transaction.
3. The posting period is open for the requested posting purpose.
4. Source and approval snapshots are valid and have not been superseded.
5. Required account, partner, project, tax and evidence dimensions are present.
6. Posted headers and lines cannot be updated or deleted.
7. Corrections use a reversal plus a new corrected source version and journal.
8. Secret values and full document/file bodies are never copied to the journal or audit event.

### 3.5 Reversal and Correction

- Reversal creates a new journal that mirrors every original line with debit and credit exchanged.
- Original and reversal journals remain immutable and linked in both directions.
- Reversal requires an allowed period, authorized reason, source context, revision, idempotency, audit and any configured approval.
- A closed-period error is corrected according to an accountant-approved policy: reopen, current-period reversal, or current-period adjustment.
- A correction is not an update to a posted row. It is `reversal -> corrected source version -> new posting request -> new journal`.
- Provider cancellation and accounting reversal are separate events and must be reconciled explicitly.

`ACCOUNTANT_APPROVAL_REQUIRED`: reversal date policy, cross-period correction policy, cancellation tax treatment and materiality/approval thresholds.

## 4. AR/AP and Allocation

`OpenItem`

- created from posted receivable/payable journal lines
- includes company, partner, source, currency, original amount, residual amount, due date and status
- status: `OPEN | PARTIAL | SETTLED | OVERDUE | DISPUTED | WRITTEN_OFF`

`PaymentAllocation`

- links one posted payment/receipt journal to one or more open items
- allows partial and many-to-many allocation without changing posted journal lines
- validates currency, company, partner, allocation date and residual amount atomically
- stores revision, idempotency, before/after residuals and actor/correlation metadata
- unallocation is an audited correction action; it is blocked in closed periods unless approved policy permits it

Required projections:

- AR/AP balance and aging reconcile to posted control accounts
- payment allocation total cannot exceed payment availability or open-item residual
- customer/vendor statements drill down to source, journal and allocation IDs
- project profitability uses canonical `projectId`, never project-name matching

`ACCOUNTANT_APPROVAL_REQUIRED`: aging basis, write-off rules, discount/rounding handling, foreign-currency allocation and control-account reconciliation policy.

## 5. Tax and Provider Adapter Boundary

Tax documents and accounting journals have separate lifecycles. A provider response must not double-post a source invoice already represented by a journal.

`TaxDocument`

- company, source document/version, direction, tax type and immutable request payload hash
- supply, tax and total with explicit rounding policy
- state: `DRAFT | READY | REQUESTED | ISSUED | RECEIVED | CANCELLED | FAILED`
- provider capability, provider request/reference, NTS reference, callback state and reconciliation state

Adapter requirements:

- provider-neutral interface for tax invoice, bank and card capabilities
- server-only credentials and certificate material
- signed/authenticated callback validation and replay protection
- immutable request/callback metadata with redacted payloads
- asynchronous request, callback, retry and reconciliation states
- no `ISSUED`, live balance, settlement or posting success from a frontend request alone
- Korea and Viet QS provider capability/configuration are independent

`ACCOUNTANT_APPROVAL_REQUIRED`: VAT rate and rounding, taxable/zero/exempt/non-deductible mapping, invoice timing, cancellation/amendment handling and tax-period lock behavior.

## 6. Excel Staging and Apply

Excel is an intake channel, not an accounting ledger.

```text
Upload intent -> malware/format scan -> template detection -> staging batch
-> header/field mapping -> row validation -> duplicate detection
-> preview and error report -> authorized approval -> atomic source-document apply
-> posting requests only when every normal gate is satisfied
```

Required controls:

- reject macro-enabled formats and never execute formulas
- reject or neutralize formula injection in exported values
- retain file version, checksum, classification, template version and importer
- require company, source type, currency, project/partner/account mappings and period validation
- no spreadsheet-provided server IDs, revision, approval, journal number or posted state is authoritative
- row-level errors do not silently create partial posted journals
- repeat apply uses an idempotency key and duplicate fingerprint
- imports create source documents or explicit opening/adjustment candidates; they do not bypass approval and posting policy
- exports are permission-scoped, audited and delivered as expiring READY file references

## 7. Authorization and Segregation of Duties

Permission is enforced before query, mutation, projection, search, notification and export.

Frontend eligibility remains `ADMIN`, `GRADE_1`, or active `MANAGEMENT_SUPPORT` membership. Backend authorization additionally requires the explicit `FINANCE_ACCESS` capability. Rank alone never grants finance access. `SYSTEM_ADMIN` has no default right to business amounts or document contents.

Recommended separate capabilities:

- `FINANCE_SOURCE_CREATE`
- `FINANCE_SOURCE_APPROVE`
- `FINANCE_POST_REQUEST`
- `FINANCE_POST`
- `FINANCE_REVERSE`
- `FINANCE_ALLOCATE`
- `FINANCE_CLOSE`
- `FINANCE_REOPEN`
- `FINANCE_TAX_REQUEST`
- `FINANCE_IMPORT`
- `FINANCE_EXPORT`
- `FINANCE_REPORT_VIEW`

Segregation rules:

- creator cannot be the sole approver when company policy requires independent approval
- approver does not automatically gain posting, reversal, close or provider permissions
- journal poster cannot silently change the approved source or posting rule
- reopen and privileged reversal require reason, approver and step-up policy
- break-glass access requires request, reason, scope, approver, MFA/step-up, bounded start/expiry, full audit and post-review
- unauthorized responses must not project amount, counterparty, title, evidence name, account, tax reference or export metadata

`ACCOUNTANT_APPROVAL_REQUIRED`: approval thresholds, SoD combinations, manual-journal roles, close/reopen authority and evidence requirements.

## 8. Runtime and Failure Boundary

| Runtime | Accounting behavior |
|---|---|
| `DEMO_LOCAL` | Clearly labeled synthetic simulation only; no official journal, provider event, balance, tax issue or posting claim |
| `API_SANDBOX` | Requires sandbox backend and explicit capability states; missing/failed API returns `BACKEND_REQUIRED`, `BLOCKED`, or typed error |
| `PRODUCTION_SERVER` | Requires server session, company, permission, revision, idempotency, audit, transactional posting and provider capability |

`API_SANDBOX` and `PRODUCTION_SERVER` have zero demo fallback. API failure must preserve user input safely where permitted, display a retryable error and correlation ID, and must not write an official success to localStorage, sessionStorage, Zustand persistence or fixture state.

Minimum typed errors:

- `AUTH_REQUIRED`, `COMPANY_REQUIRED`, `COMPANY_FORBIDDEN`, `FINANCE_ACCESS_REQUIRED`
- `SOURCE_NOT_APPROVED`, `SOURCE_VERSION_CONFLICT`, `POSTING_RULE_NOT_FOUND`
- `ACCOUNT_NOT_POSTABLE`, `ACCOUNT_DIMENSION_REQUIRED`, `JOURNAL_NOT_BALANCED`
- `ACCOUNTING_PERIOD_LOCKED`, `REVERSAL_REASON_REQUIRED`, `REVERSAL_POLICY_BLOCKED`
- `IDEMPOTENCY_CONFLICT`, `ALLOCATION_EXCEEDS_BALANCE`, `CURRENCY_MISMATCH`
- `TAX_PROVIDER_NOT_CONFIGURED`, `PROVIDER_ERROR`, `FILE_NOT_READY`
- `IMPORT_TEMPLATE_INVALID`, `IMPORT_FORMULA_BLOCKED`, `VALIDATION_FAILED`

## 9. Audit and Reporting

Every create, update, archive, restore, approval, posting request, posting, reversal, allocation, unallocation, close, reopen, import, export and provider transition records:

- company, actor, capability and permission snapshot
- source ID/version and related journal/allocation/provider IDs
- before/after structured metadata and revision
- reason, timestamp, correlation/request ID and idempotency key hash
- evidence version ID, checksum and classification where relevant

Do not store secrets, tokens, cookies, payment credentials, raw provider payloads, full document bodies or full file content in audit events.

Reporting rules:

- GL and trial balance are derived only from posted journals.
- AR/AP aging is derived from open items and allocations reconciled to GL control accounts.
- Project profitability is explicitly management reporting until an accountant approves statutory mapping.
- Every total supports permission-checked source drill-down.
- Report generation includes company, as-of date, period, currency, CoA version and included statuses.

## 10. Viet QS Backend Responsibilities

Viet QS owns implementation and operation of:

1. PostgreSQL schema, migrations and transactional constraints after separate approval.
2. Company-scoped CoA versions, periods, locks and approved policy configuration.
3. Source adapters and immutable approval snapshot verification.
4. Posting rule engine, balanced-journal transaction, numbering and idempotency.
5. Immutable journal storage, reversal/correction and full audit.
6. AR/AP open items, allocations, aging and GL reconciliation.
7. Tax, bank and card provider adapters, server-only credentials, callbacks and reconciliation.
8. Excel upload, scanning, staging, validation, preview, apply, error report and export jobs.
9. Permission-before-projection, `FINANCE_ACCESS`, SoD and break-glass enforcement.
10. Outbox events for approval completion, posting results, due/overdue, provider errors and closing.
11. API Sandbox milestone evidence and production monitoring, backup, restore and migration execution.
12. Safe typed errors, correlation IDs, redaction and zero server-mode demo fallback.

The frontend owns user interaction, explicit capability/error states, draft preservation UX, API adapters and contract-aligned screens. It must never infer official posting from a local action.

## 11. Accountant/Tax Adviser Decision Gate

The following must be approved before production posting is enabled:

| Decision | Required evidence | Gate |
|---|---|---|
| Accounting basis and company CoA | Approved versioned CoA and report mapping | `ACCOUNTANT_APPROVAL_REQUIRED` |
| Fiscal year, periods and close policy | Period calendar, backdate and reopen rules | `ACCOUNTANT_APPROVAL_REQUIRED` |
| Posting rules by source | Signed posting-rule matrix with thresholds and dimensions | `ACCOUNTANT_APPROVAL_REQUIRED` |
| VAT and tax invoice policy | Rates, rounding, tax codes, provider/cancellation handling | `ACCOUNTANT_APPROVAL_REQUIRED` |
| Opening balance | Reconciled trial balance, source evidence and cutover date | `ACCOUNTANT_APPROVAL_REQUIRED` |
| Foreign currency | Rate source, recognition and realized/unrealized gain/loss policy | `ACCOUNTANT_APPROVAL_REQUIRED` |
| Reversal/write-off | Timing, period and approval rules | `ACCOUNTANT_APPROVAL_REQUIRED` |
| Statutory reports and filing | Accountant-approved mapping/export and reconciliation | `ACCOUNTANT_APPROVAL_REQUIRED` |

Until these gates are approved, affected posting rules remain `BLOCKED_BY_ACCOUNTANT_DECISION`; the frontend may show configuration/readiness but must not claim posting readiness.

## 12. Acceptance Gates

- Debit equals credit for every posted journal in base currency.
- Posted journal/header/lines are immutable; correction uses linked reversal and repost.
- Duplicate posting under retry is zero.
- Closed-period unauthorized mutation is zero.
- One company cannot query, post, allocate, export or report another company's data.
- AR/AP residuals reconcile to their GL control accounts.
- Tax/provider callback never creates duplicate source or journal records.
- Excel import cannot bypass scan, preview, authorization, approval, period or posting gates.
- Unauthorized amount, counterparty, account, evidence and tax metadata projection is zero.
- `API_SANDBOX` and `PRODUCTION_SERVER` demo fallback is zero.
- Accountant-dependent rules remain blocked until recorded approval is active.
