# Frontend Module Status

Status is based on the current branch code, not on earlier completion reports.

| Priority | Module | Frontend | DataSource boundary | Actual persistence | Provider | Handoff status |
|---|---|---|---|---|---|---|
| P0 | Project | workflow bridge, organization views, operation links | mapped | Backend required | not required | READY_WITH_BACKEND_DEPENDENCIES |
| P0 | Project Intake | existing four-step workflow and safety guards | mapped | Backend required outside Demo | not required | READY_WITH_BACKEND_DEPENDENCIES |
| P0 | Drive | roots, bindings, upload queue, scan/READY states | mapped | Backend required | Google Shared Drive not configured | READY_WITH_BACKEND_DEPENDENCIES |
| P0 | Approval | form, draft, policy preview, decisions, recall, history | mapped | Backend required | policy/server not configured | READY_WITH_BACKEND_DEPENDENCIES |
| P0 | Mail | folders, list, thread, compose, reply, forward, attachments | mapped | Backend required | mail Provider not configured | READY_WITH_BACKEND_DEPENDENCIES |
| P0 | Business Card | capture, OCR job, review, duplicate, Contact actions | mapped | Backend required | OCR/Google Contacts not configured | READY_WITH_BACKEND_DEPENDENCIES |
| P0 | AI Assistant | notes, audio/STT, structured result, citations, candidates | mapped | Backend required | AI Provider not configured | READY_WITH_BACKEND_DEPENDENCIES |
| P1 | Calendar | existing calendar plus guarded create boundary | mapped | Backend required outside Demo | not required | READY_WITH_BACKEND_DEPENDENCIES |
| P1 | Task | existing tasks plus guarded create/update boundary | mapped | Backend required outside Demo | not required | READY_WITH_BACKEND_DEPENDENCIES |
| P1 | Notification | existing list/read UI plus guarded mutation boundary | mapped | Backend required outside Demo | delivery Provider deferred | READY_WITH_BACKEND_DEPENDENCIES |
| P2 | Sales | list, detail, basic Opportunity input, mode states | mapped | Backend required outside Demo | advanced CRM deferred | READY_WITH_BACKEND_DEPENDENCIES |
| P2 | Finance | dashboard/list/detail/basic input, mode states | mapped | Backend required outside Demo | tax/bank/card deferred | READY_WITH_BACKEND_DEPENDENCIES |

## State Coverage

Every handoff component exposes the applicable runtime and capability state:

- `DEMO_SIMULATION`
- `SERVER_READY`
- `BACKEND_REQUIRED`
- `PROVIDER_REQUIRED`
- `UNAVAILABLE`

Core handoff text is available in Korean, Vietnamese, and English. Demo writes
are component-memory simulations and are not reported as server persistence.

## Deliberately Deferred

- Backend API and database implementation
- Mail, Drive, OCR, AI, tax, bank, and card Providers
- Google OAuth and secret storage
- Advanced CRM automation and reports
- Legal ledger, automatic journal entry, tax filing, and live balances
- GOU migration or dual write

## RC2 Browser Gate

- The business-card workspace subscribes to the stable session collection and
  derives the selected-company view with memoization. The production React
  maximum-update-depth regression is closed.
- Required screenshots: `29/29`.
- Browser viewports: `1920x1080`, `1440x900`, `1280x800`, `768x1024`, and
  `390x844`.
- Critical console errors: `0`.
- Product network errors: `0`.
- Horizontal overflow findings: `0`.
- Backend-unavailable requests are reported separately and never become a
  persisted success.
