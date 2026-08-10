# RC3 Finance Benchmark Traceability

This record maps observed operating principles to the CON-COST finance workspace. It does not copy product screens, branding, wording, or provider APIs.

| Benchmark product | Observed principle | CON-COST adaptation | Implemented screen or control | Copied UI? | Result |
|---|---|---|---|---|---|
| Douzone Amaranth 10 | Expense request flows through approval before posting and treasury planning | Expense records keep approval and posting-candidate states separate; no official posting is claimed | Expense and Corporate Card workbench | NO | IMPLEMENTED_FRONTEND |
| Douzone Amaranth 10 | Ledger, treasury, budget, and close form one finance workflow | CFO Cockpit links revenue, purchase, cash plan, budget, profitability, and closing views | Finance Dashboard and navigation | NO | IMPLEMENTED_FRONTEND |
| Douzone Amaranth 10 | Automatic posting is policy-controlled | The UI exposes posting candidates only; server accounting policy is required for official posting | Expense detail and audit source | NO | BACKEND_REQUIRED |
| ECOUNT | Easy transaction entry derives operational ledgers and reports | One ledger draft feeds receivable/payable, aging, cashflow, and profitability projections | Revenue and Purchase drawers | NO | IMPLEMENTED_FRONTEND |
| ECOUNT | Receivable and payable schedules expose partial settlement and remaining balance | Settlement command validates positive amount, remaining amount, status, revision, and before/after audit | Revenue, Purchase, Cashflow | NO | IMPLEMENTED_FRONTEND |
| ECOUNT | Cash calendar and near-term forecasts reduce spreadsheet dependence | Company-scoped cash plans calculate 7, 30, and 90 day inflow/outflow/net forecasts | Treasury workbench | NO | IMPLEMENTED_FRONTEND |
| ECOUNT | Budget control supports warn/block policies by dimension | Company, unit, and project budgets show actual, committed, forecast, balance, rate, and INFO/WARN/BLOCK | Budget workbench | NO | IMPLEMENTED_FRONTEND |
| ECOUNT | Tax invoice workflow remains linked to transaction and collection state | Tax invoice records retain project and source links; provider-required transitions are blocked honestly | Tax Invoice workbench | NO | READY_WITH_PROVIDER_DEPENDENCY |
| Younglimwon K-System Ace | Timely close uses a visible checklist and controlled reopen | OPEN/IN_PROGRESS/REVIEW/CLOSED/REOPENED transitions, complete-checklist gate, lock notice, reopen reason | Monthly Close Cockpit | NO | IMPLEMENTED_FRONTEND |
| Younglimwon K-System Ace | Internal control requires traceability and audit | Control events, source IDs, evidence IDs, correlation IDs, revision, and before/after mutation history | Internal Control and detail drawers | NO | IMPLEMENTED_FRONTEND |
| Younglimwon K-System Ace | Management indicators should drill into operational sources | Project management profitability exposes source IDs and explicitly rejects statutory-profit meaning | Project Profitability | NO | IMPLEMENTED_FRONTEND |
| bizplay | Card, personal-card, cash, account, and other expenses share an evidence-first flow | Payment method, READY-file reference boundary, policy result, approval draft, and posting candidate are modeled separately | Expense entry and detail | NO | IMPLEMENTED_FRONTEND |
| bizplay | Policy exceptions are visible before approval and ERP posting | COMPLIANT/WARNING/BLOCKED policy state creates visible control candidates | Expense and Controls | NO | IMPLEMENTED_FRONTEND |
| Common benchmark | Import/export must reduce manual re-entry without executing workbook code | Five-sheet Revenue/Purchase/Cashflow/Expense/Budget round-trip; macro and formula payloads are rejected | Excel import preview and export | NO | IMPLEMENTED_FRONTEND |
| CON-COST-specific | Project, estimate, approval, drive, and finance must share canonical identity | Finance stores canonical `projectId` and `projectNo`; profitability drills into ledger and expense source IDs | All project-linked finance views | NO | IMPLEMENTED_FRONTEND |
| CON-COST-specific | Finance data is sensitive and company-scoped | Frontend access remains ADMIN/GRADE_1/active MANAGEMENT_SUPPORT; server mode requires FINANCE_ACCESS and selected company authorization | Route guard, export, mutation boundary | NO | READY_WITH_BACKEND_DEPENDENCY |

## Design Boundary

- `DEMO_LOCAL` uses synthetic in-memory operational simulation and does not claim server persistence.
- `API_SANDBOX` and `PRODUCTION_SERVER` never fall back to demo writes.
- Tax, bank, card, accounting-posting, and statutory-report success require backend or provider capability.
- Live bank balances are not displayed before an authorized bank provider is connected.
- Project profitability is a management estimate, not a statutory income statement.
- The frozen OpenAPI contract is unchanged. Candidate operations are documented in the backend delta only.
