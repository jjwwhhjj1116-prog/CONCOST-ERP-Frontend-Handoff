# RC3 Finance Excel Project Import Backend Delta

## Purpose

The Finance workbench can preview an approved `.xlsx` workbook, match revenue rows to canonical projects, and export the current finance workbook. `DEMO_LOCAL` simulates the confirmed import only after a user reviews the project resolution result.

`API_SANDBOX` and `PRODUCTION_SERVER` must never fall back to browser persistence.

## Required command

`POST /api/v1/finance/imports/confirm`

The command must accept the selected `companyId`, workbook upload reference, validated row hashes, user-confirmed project candidates, and an idempotency key. The server must perform these steps in one transaction:

1. Verify `X-Company-Id`, authenticated company access, and `FINANCE_ACCESS`.
2. Validate the workbook template and reject formulas, macros, and legacy workbook formats.
3. Resolve each row by canonical `projectId`, otherwise by exact `projectNo` inside the selected company.
4. Never link projects by project-name text.
5. Create each approved unmatched revenue project candidate at most once.
6. Create revenue or purchase ledger records with the resolved canonical `projectId`.
7. Calculate VAT at 10% only when the VAT cell was blank; preserve explicit zero for tax-exempt rows.
8. Commit project creation, ledger creation, audit events, and notifications atomically.
9. Return row-level results, created IDs, correlation ID, revision, and idempotent retry status.

## Error contract

- `400 PROJECT_ID_OR_PROJECT_NO_REQUIRED`
- `403 FINANCE_ACCESS_REQUIRED`
- `403 COMPANY_SCOPE_FORBIDDEN`
- `409 PROJECT_ID_NO_MISMATCH`
- `409 AMBIGUOUS_PROJECT_NO`
- `409 CONFLICTING_PROJECT_NAMES_FOR_PROJECT_NO`
- `422 PURCHASE_REQUIRES_EXISTING_PROJECT`
- `422 FINANCE_WORKBOOK_VALIDATION_FAILED`

The response must not expose project metadata from another company, even in an error message.

## Export

`GET /api/v1/finance/exports/workbook` must apply company and finance permission filters before projection. The generated workbook keeps the approved Revenue, Purchase, Cashflow, Expense, and Budget sheets.
