# RC3 Backend Delta Cumulative Index

The following approved handoff documents are the implementation entry points for the Viet QS backend team. Later deltas refine earlier documents without changing the frozen Common, Project, Collaboration, or Business contract meanings.

| Order | Area | Source document | Backend starting point |
|---:|---|---|---|
| 1 | Runtime boundary | `RUNTIME_MODES.md` | Enforce DEMO, sandbox, and production behavior server-side |
| 2 | Environment | `ENVIRONMENT_CONFIGURATION.md` | Supply public endpoints and server-only secrets |
| 3 | API map | `API_ADAPTER_MAPPING.csv` | Implement operation-to-adapter mapping |
| 4 | Project and holidays | `BACKEND_DELTA_RC3_PROJECT_PIPELINE_HOLIDAYS.md` | KASI proxy and canonical project conversion |
| 5 | Project assignments | `CONTRACT_CHANGE_REQUEST_RC3_PROJECT_ASSIGNMENTS.md` | Unit assignments and atomic Intake completion |
| 6 | Intake revision | `BACKEND_DELTA_RC3_INTAKE_CONTEXT_QUEUE_REVISION.md` | Accepted Intake revision and notification outbox |
| 7 | Worklist archive | `BACKEND_DELTA_RC3_REQUEST_WORKLIST_ARCHIVE_RESTORE.md` | Archive, restore, and database projection |
| 8 | Staffing | `CONTRACT_CHANGE_REQUEST_RC3_PROJECT_UNIT_STAFFING.md` | Membership candidates, role plans, and history |
| 9 | Estimate workbench | `BACKEND_DELTA_RC3_ESTIMATE_WORKBENCH_PARITY.md` | Estimate profile, sheet, Excel, and database lineage |
| 10 | Input memory | `CONTRACT_CHANGE_REQUEST_RC3_INPUT_MEMORY_MANAGEMENT.md` | Company-scoped safe suggestion storage |
| 11 | Approval | `BACKEND_DELTA_RC3_ZIOYOU_APPROVAL_PARITY.md` | Form, line, policy, decision, and delegation APIs |
| 12 | Approval line | `CONTRACT_CHANGE_REQUEST_RC3_APPROVAL_LINE_MANAGEMENT.md` | Versioned reusable approval lines |
| 13 | Approval distribution | `CONTRACT_CHANGE_REQUEST_RC3_APPROVAL_DISTRIBUTION_DELEGATION.md` | Reference, circulation, distribution, and delegation |
| 14 | Sales and finance | `BACKEND_DELTA_RC3_SALES_FINANCE_MVP.md` | CRM and finance operational adapters |
| 15 | Business card | `BACKEND_DELTA_RC3_BUSINESS_CARD_CONTACT_OS.md` | OCR, duplicate review, Contact, and customer timeline |
| 16 | Claim workflow | `BACKEND_DELTA_RC3_CLAIM_DRIVE_AI_APPROVAL.md` | Claim, evidence, meeting, report, approval, and delivery |
| 17 | Drive | `PROJECT_DRIVE_INTEGRATION.md` | Shared Drive binding and READY file lifecycle |
| 18 | Mail and approval | `APPROVAL_MAIL_INTEGRATION.md` | Provider and cross-module context |
| 19 | AI | `AI_ASSISTANT_INTEGRATION.md` | AI/STT job, provenance, citations, and human review |
| 20 | Current drift | `RC3_FRONTEND_BACKEND_CONTRACT_DRIFT_REGISTER.md` | Remaining frontend-to-backend capability gaps |
| 21 | Integration matrix | `FRONTEND_INTEGRATION_CAPABILITY_MATRIX.csv` | Map M0-M7 adapters, providers, and no-fallback gates |
| 22 | Sandbox milestones | `API_SANDBOX_SMOKE_MILESTONES.md` | Produce explicit NOT_TESTED/BLOCKED/FAIL/PASS evidence |
| 23 | Typed errors | `TYPED_INTEGRATION_ERROR_TAXONOMY.md` | Return safe stable codes and correlation identifiers |
| 24 | Reading order | `BACKEND_READING_ORDER.md` | Apply baseline, contracts, deltas, drift, then matrix |
| 25 | Finance ERP redesign | `BACKEND_DELTA_RC3_FINANCE_ERP_BENCHMARK_REDESIGN.md` | Revenue/AR, purchase/AP, settlement, expense, tax, budget, treasury, profitability, close, control, and Excel adapters |
| 26 | Business card OCR accuracy | `BACKEND_DELTA_RC3_BUSINESS_CARD_OCR_ACCURACY.md` | Structured layout evidence, company/language provider capability, conservative mapping, and server-only credentials |
| 27 | Operational board | `BACKEND_DELTA_RC3_BOARD_OPERATIONAL_SYSTEM.md` | Company-scoped boards, permissions, post/comment lifecycle, READY files, read receipts, notifications, search, and audit |

## Immediate Backend Order

1. Authentication, company scope, permission-before-projection, revision, and idempotency.
2. Project conversion, Intake completion, assignments, revisions, notifications, and staffing.
3. File lifecycle and Drive binding.
4. Approval and Mail providers.
5. Contacts, OCR, and Sales adapters.
6. Finance ERP adapters in the dedicated redesign delta, including access, company scope, revision, idempotency, providers, and close locks.
7. Claim evidence, AI/STT, report approval, and delivery.
8. Search provider registry and cross-module notification deep links.
9. Execute M0-M7 in order and retain explicit probe evidence.

Every implementation must preserve canonical ids, company isolation, immutable file and report versions, explicit provider states, and zero production fallback to browser-local demo data.
