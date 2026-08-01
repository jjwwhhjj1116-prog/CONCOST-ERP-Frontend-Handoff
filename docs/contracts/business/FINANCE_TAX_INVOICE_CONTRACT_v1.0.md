# Finance and Tax Invoice Contract v1.0

## v1 boundary

v1 includes operational finance workflow, receivable/payable, receipt/payment, expense, approved import/reconciliation, budget/actual/forecast, cash position, tax-invoice draft/approval status, Project profitability projection, closing checklist and management reports.

The full statutory ledger, automatic journal engine, statutory filing, payroll tax, depreciation and final accounting automation are `ACCOUNTING_PHASE_2_APPROVED`.

## Provider and approval

- Money is a decimal string plus ISO currency.
- POSTED transactions are immutable; correction/void commands create audit.
- Tax Provider remains `PROVIDER_TBD_CONTRACT_COMPLETE`.
- Tax submission requires Author → Finance review → Finance Manager approval → authorized issuer submission.
- NOT_CONFIGURED permits Draft, validation and approval, but never provider submission, issued success or real-time status.
- Real-time bank/card providers are deferred. v1 uses approved CSV/XLSX/manual source, importBatchId, deduplication, reconciliation and audit.
- Finance visibility is capability and sensitivity based; Project PM receives summary only and never payroll, individual labor, bank or card source data.
