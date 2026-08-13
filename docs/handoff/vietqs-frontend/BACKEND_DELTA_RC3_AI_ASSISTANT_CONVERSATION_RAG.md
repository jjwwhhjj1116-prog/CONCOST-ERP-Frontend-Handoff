# RC3 Conversational AI Assistant Backend Delta

## Purpose

The RC3 frontend separates the conversational AI work assistant from the existing meeting-notes and STT tool. `/ai-assistant` is the conversation workspace and `/ai-assistant/tools/meeting-notes` retains the existing human-reviewed meeting workflow. This document is a backend handoff delta only; it does not change the frozen OpenAPI contract.

## Runtime Contract

| Mode | Required behavior |
|---|---|
| `DEMO_LOCAL` | Deterministic intent matching over company-scoped synthetic stores. It must be labeled `DEMO AI Assistant`. |
| `API_SANDBOX` | Use the authenticated backend adapter. Missing adapter or provider returns a typed blocker. No local demo fallback. |
| `PRODUCTION_SERVER` | Use the authenticated backend adapter and approved provider routing. No browser persistence and no local demo fallback. |

The frontend capability flags are `NEXT_PUBLIC_AI_ADAPTER_READY`, `NEXT_PUBLIC_AI_PROVIDER_READY`, and `NEXT_PUBLIC_PRIVATE_AI_PROVIDER_READY`. They describe build-time capability only and do not replace an authenticated smoke probe.

## Domain Model

### Thread

- `id`, `companyId`, `ownerPersonnelId`, `title`, `status`, `createdAt`, `updatedAt`
- optional last route and entity references
- company and owner are immutable after creation
- list, archive, and delete operations must apply company and owner scope before projection

### Message

- `id`, `threadId`, `companyId`, `role`, `content`, `status`, `createdAt`
- `runtimeMode`, provider/model label, correlation ID
- citations and action candidates are versioned response artifacts
- sensitive prompts and answers use policy-based retention rather than an unconditional permanent history

### Citation

- `sourceType`, canonical `sourceId`, safe label, internal route, optional safe excerpt
- every citation must reference a record returned by the same permission-scoped retrieval run
- do not return a title, filename, amount, or existence signal for denied resources

### Action Candidate

- kinds: open record, task draft, calendar draft, mail draft, approval draft, meeting-note tool
- states: proposed, confirmed, cancelled, blocked
- AI never directly completes the business mutation
- confirmation opens or calls the existing module draft command; mail send and approval submission require their own final confirmation

## Required Operations

| Operation | Required controls |
|---|---|
| `createThread` | Auth, selected company, owner, idempotency |
| `listThreads` | Company and owner filter in the query |
| `getThread` | Resource scope before message projection |
| `archiveThread` | Revision and before/after audit |
| `deleteThread` | Retention policy, revision, before/after audit |
| `sendMessage` | Idempotency, rate limit, correlation ID, provider route |
| `streamAnswer` | Cancellable run ID and ordered events |
| `cancelRun` | Actor/thread/run validation |
| `confirmActionCandidate` | Candidate revision, explicit user confirmation, downstream command idempotency |
| `submitFeedback` | Structured helpful/not-helpful value; no automatic free-text PII collection |

## Permission-aware Retrieval

The required order is:

1. authenticate session
2. validate `X-Company-Id` against `allowedCompanyIds`
3. evaluate module capability
4. apply resource scope to the database query or search index
5. project safe fields
6. construct citations from the projected records only
7. invoke the provider with separated system instructions and untrusted record data

Indexes and caches for Project, Intake, Task, Schedule, Approval, Board, Customer, Contact, Finance, Claim, Meeting, Drive, and Organization must include `companyId`. Finance requires server `FINANCE_ACCESS`. HR, Finance, and `RESTRICTED_LEGAL` data require an approved private/local provider capability before any content leaves the retrieval boundary.

## Provider and RAG Safety

- Server credentials, tokens, cookies, passwords, and connection strings never enter prompts or client responses.
- Retrieved document text is untrusted data. Instructions embedded in files or posts cannot override system or task instructions.
- Public-provider routing is denied for restricted legal, HR, and finance context unless policy explicitly permits the exact classification.
- Return typed errors: `AUTH_REQUIRED`, `COMPANY_SCOPE_REQUIRED`, `FORBIDDEN`, `RESOURCE_NOT_FOUND`, `BACKEND_REQUIRED`, `PROVIDER_NOT_CONFIGURED`, `PRIVATE_PROVIDER_REQUIRED`, `RETRYABLE_ERROR`, or `UNKNOWN_ERROR`.
- Include a safe correlation ID on blocked and failed responses.

## Streaming

The server may stream status and answer chunks only for work actually performed. Suggested events are `run.started`, `retrieval.completed`, `answer.delta`, `answer.completed`, `run.blocked`, `run.failed`, and `run.cancelled`. Do not emit fake progress. A completed event contains the final citation and action-candidate arrays.

## Retention and Audit

Retention must distinguish personal, normal business, and sensitive conversations. Audit candidates include actor, company, thread/run ID, question hash or approved redacted summary, retrieved source IDs, source count, action candidate, confirmation result, blocked reason, provider, model/version, and timestamp. Do not copy full restricted documents, secrets, or raw file bodies into audit events.

## Idempotency and Limits

- `createThread`, `sendMessage`, and `confirmActionCandidate` accept an idempotency key scoped by company and actor.
- repeated confirmation cannot create duplicate task, calendar, mail, or approval drafts
- enforce per-user and per-company rate limits
- cancellation is safe to retry
- stale thread/candidate revisions return a typed conflict

## Frontend Integration Acceptance

1. CON-COST and Viet QS threads, messages, retrieval results, and caches never mix.
2. Unauthorized finance and claim questions return no values, names, titles, files, or existence hints.
3. Sandbox and production never fall back to `DEMO_LOCAL`.
4. Citations resolve to existing authorized routes.
5. Action candidates remain non-mutating until explicit confirmation.
6. Drawer and full page use the same thread ID.
7. Meeting notes and STT remain a separate capability and route.
