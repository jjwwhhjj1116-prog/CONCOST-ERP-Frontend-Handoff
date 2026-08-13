# Viet QS Frontend Handoff v1

This package describes the Frontend boundary that the Viet QS Backend team can
connect without changing the approved ERP Contract Set.

## Baseline

- Contract set: `v1.0.1-fe-contract-all-02-patch`
- Frontend release candidate: `CONCOST_ERP_FRONTEND_HANDOFF_v1.0.0-RC2`
- Frontend branch: `feat/frontend-final-rc2`
- Validated head: `16dc2572c87767365fe2ae9e10016e5b6705eb4a`
- Default application base path: `/workspace`
- API convention: same-origin `/api/v1`
- Supported modes: `DEMO_LOCAL`, `API_SANDBOX`, `PRODUCTION_SERVER`
- Supported core locales: Korean (`ko`), Vietnamese (`vi`), English (`en`)

The OpenAPI files under `openapi/` are authoritative. The Frontend operation
mapping in `src/lib/frontendDataSource.ts` is a subset used by this handoff.

## Non-negotiable Boundary

1. `DEMO_LOCAL` is simulation only. Its result has `persisted: false`.
2. `API_SANDBOX` and `PRODUCTION_SERVER` never fall back to Demo after an API or
   Provider failure.
3. Every company-scoped request uses the common API client and
   `X-Company-Id`. The Backend must still enforce `allowedCompanyIds` and the
   resource company.
4. Relationships use canonical IDs such as `projectId`, `claimId`, `fileId`,
   and `contactId`. Display names are never relationship keys.
5. A Provider capability flag is not authorization and is not proof of a
   completed external operation.
6. Files are not usable until the server returns the approved `READY` state.
7. No token, OAuth secret, mail credential, AI key, or real company data may be
   placed in `NEXT_PUBLIC_*`, fixtures, or browser storage.

## Integration Order

1. Implement secure session and company authorization.
2. Implement the common error envelope, revision, and idempotency behavior.
3. Implement Project and Project Intake operations.
4. Implement Drive upload lifecycle and Project/Claim bindings.
5. Implement Approval and Mail adapters; keep Provider capability separate.
6. Implement Business Card OCR review and Contact commands.
7. Implement AI job polling, citations, and reviewed output persistence.
8. Implement Calendar, Task, Notification, Sales, and Finance adapters.

## Frontend Entry Points

| Module | Route | Main component |
|---|---|---|
| Project | `/projects` | `ProjectHandoffBridge` |
| Project Intake | `/projects/intake` | existing intake workflow |
| Drive | `/drive` | `DriveWorkspace` |
| Approval | `/approvals` | `ApprovalWorkspace` |
| Mail | `/mail` | `MailWorkspace` |
| Business Card | `/sales/business-cards` | `BusinessCardWorkspace` |
| AI Assistant | `/ai-assistant` | `AssistantWorkspace` conversational assistant |
| AI meeting notes | `/ai-assistant/tools/meeting-notes` | Existing `AiMeetingWorkspace` |
| Calendar | `/calendar` | `ModuleHandoffPanel` integration |
| Task | `/tasks/my` | `ModuleHandoffPanel` integration |
| Notification | `/notifications` | `ModuleHandoffPanel` integration |
| Sales | `/sales` | `BusinessModuleWorkbench` |
| Finance | `/finance` | `BusinessModuleWorkbench` |

Next.js applies `NEXT_PUBLIC_BASE_PATH`; route code must not manually duplicate
the base path.

## Backend Delivery Checklist

- OpenAPI operation implemented without changing its identifier.
- Secure cookie session and server-side permission check.
- Required `X-Company-Id` rejection: missing `400`, unauthorized `403`.
- Resource company mismatch rejected before projection or mutation.
- Revision conflict and idempotency behavior implemented.
- Capability endpoint reports Provider readiness truthfully.
- Error response maps to the frozen common error envelope.
- Integration and permission tests supplied.
- No Demo or fixture result returned from Production endpoints.

Read the remaining files in this directory before connecting an adapter.
The automated and browser release evidence is summarized in
`RC2_RELEASE_VALIDATION.md`.
