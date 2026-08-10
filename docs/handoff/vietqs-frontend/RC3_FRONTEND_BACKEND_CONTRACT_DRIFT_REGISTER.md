# RC3 Frontend Backend Contract Drift Register

This register separates frontend-complete behavior from capabilities that the Viet QS backend must implement. It does not modify the official OpenAPI or direct the backend team during the audit.

| ID | Module | Frontend behavior | Required backend capability | Contract state | Go-live impact |
|---|---|---|---|---|---|
| DRIFT-01 | Project chain | Deterministic demo conversion and postcondition verification | Atomic WON conversion and Intake completion with idempotency | BACKEND_REQUIRED | Blocks production mutation |
| DRIFT-02 | Intake revision | Same ids, revision history, READY material checks, affected-unit notification candidates | Revision endpoint, optimistic concurrency, file readiness, outbox | BACKEND_REQUIRED | Blocks production mutation |
| DRIFT-03 | Staffing | Unit-context role plan, one PM, multi-person non-PM, before/after history | Membership-scoped staffing plan API | BACKEND_REQUIRED | Blocks production mutation |
| DRIFT-04 | Input memory | Company-scoped picker and exclusion policy | Input suggestion API with company authorization | BACKEND_REQUIRED | Blocks production persistence |
| DRIFT-05 | Mail | Provider-ready compose, reply, forward, project links | Mail provider adapter and capability | PROVIDER_TBD_CONTRACT_COMPLETE | Send remains blocked |
| DRIFT-06 | Approval | Form, line snapshot, decisions, delegation UI | Approval policy and decision APIs | BACKEND_REQUIRED | Official submission remains blocked |
| DRIFT-07 | Drive | Context route, folder taxonomy, file lifecycle UI | Google Shared Drive adapter and READY file references | PROVIDER_TBD_CONTRACT_COMPLETE | Upload remains simulated or blocked |
| DRIFT-08 | Business card | Human-reviewed OCR simulation and canonical demo Contact | OCR job, contact merge, customer timeline APIs | BACKEND_REQUIRED | Cross-device persistence blocked |
| DRIFT-09 | Sales | Customer 360, contact, opportunity, activity, estimate linkage | CRM adapter and permission-scoped queries | BACKEND_REQUIRED | Production persistence blocked |
| DRIFT-10 | Finance | CFO Cockpit; company-scoped revenue/AR, purchase/AP, partial settlement, aging, expense, budget, treasury, project profitability, close, control, and five-sheet Excel UX | Dedicated finance adapter with FINANCE_ACCESS, canonical project identity, revision/idempotency, audit, close locks, permission-first search/export, and currency/tax policy | BACKEND_REQUIRED | Production persistence and official posting blocked |
| DRIFT-11 | Tax and bank | Explicit unavailable state | Tax, bank, and card providers | PROVIDER_TBD_CONTRACT_COMPLETE | Issue and live balance blocked |
| DRIFT-12 | Claim | Canonical claim workspace and immutable report revisions | Claim, evidence, report, and delivery APIs | BACKEND_REQUIRED | Production persistence blocked |
| DRIFT-13 | AI and STT | Human-review workflow, consent, restricted guard, provenance UI | Private AI/STT capabilities and policy enforcement | BACKEND_REQUIRED | AI execution blocked outside demo |
| DRIFT-14 | Notifications | Event candidates and deep links | Notification event, preference, delivery, and read-state APIs | BACKEND_REQUIRED | Cross-device delivery blocked |
| DRIFT-15 | Search | Permission-scoped grouped frontend UX | Provider registry with permission-before-projection | BACKEND_REQUIRED | Production search incomplete |
| DRIFT-16 | Localization | KO/VI/EN priority copy | Server error and reference-data localization | BACKEND_REQUIRED | Some server copy pending |
| DRIFT-17 | Integration diagnostics | Admin-only safe registry and request correlation metadata | M0-M7 probe endpoints/evidence and backend health declarations | BACKEND_REQUIRED | Sandbox certification remains NOT_TESTED/BLOCKED |

## Non-Drift Boundaries

- `DEMO_LOCAL`, `API_SANDBOX`, and `PRODUCTION_SERVER` behavior is intentional.
- Provider TBD is not a missing contract when the UI is blocked and does not claim success.
- GOU coexistence remains read-only where frozen contracts define it.
- Backend implementation, database schema, provider selection, and deployment are outside this frontend audit.
