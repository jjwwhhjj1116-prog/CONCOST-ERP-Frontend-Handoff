# RC3 Sales and Finance Operational MVP Backend Delta

Status: `BACKEND_CAPABILITY_PENDING`

This document records the backend capabilities required by the RC3 Sales and Finance frontend. It does not change the frozen OpenAPI contract.

## Common Boundary

Every operation must validate, in order:

1. authenticated user
2. `X-Company-Id`
3. `allowedCompanyIds`
4. resource company and organization scope
5. operation permission or capability
6. revision and idempotency requirements
7. safe response projection

Do not fall back to a default company. Query and cache keys must include `companyId`. Mutation audit events must retain actor, before/after values, revision, and timestamp without copying secrets or full restricted documents.

## Sales Capabilities

- customer, contact, and contact-duplicate CRUD/review
- customer activity timeline and activity CRUD
- opportunity list, detail, stage transition, archive, and restore
- business-card OCR result to reviewed Contact command
- Contact merge request with Data Steward or Sales Manager approval
- Contact XLSX/CSV import preview, validation, confirm, and export
- optional one-way ERP-to-Google Contacts opt-in capability
- Opportunity-to-Estimate Request command using the canonical project chain
- Mail Draft, Calendar, and Task candidate creation

Required lineage:

```text
businessCardJobId -> contactId -> customerId -> opportunityId
opportunityId -> estimateRequestId -> estimateSheetId -> commercialDecisionId -> projectId
```

The server must preserve one canonical ID per entity and must not join by display name.

## Finance Capabilities

- finance dashboard projection and company-scoped ledger paging/filtering
- receivable, payable, expense, and budget entry CRUD
- canonical `projectId` and immutable `projectNo` linkage
- partial collection/payment command with remaining-balance calculation
- evidence File reference validation; only `READY` files may be linked
- approval Draft candidate creation
- tax-invoice Provider capability and explicit not-configured state
- approved bank/card import and reconciliation workflow
- treasury balance projection only after Provider authorization
- monthly closing checklist, close, reopen, and audit
- finance XLSX/CSV import preview, validation, confirm, and export

Finance write operations require `FINANCE_ACCESS`. Finance read projections must also enforce the approved access policy and field-level sensitivity.

## Provider Rules

- Provider not configured: return capability state; do not return success
- Provider error: retain user input and return a retryable typed error
- bank/card/tax credentials: backend secret storage only
- Google OAuth and Drive credentials: never expose to the frontend
- external callbacks: verify signature, company binding, replay protection, and idempotency

## Frontend Adapter Expectations

The frontend needs:

- typed loading, empty, forbidden, validation, conflict, provider-missing, and retryable-error states
- response revision and resource IDs
- idempotency result for retried mutations
- company-scoped pagination cursors
- safe projected DTOs with no unauthorized amount or metadata fields
- audit/event IDs for customer, opportunity, payment, evidence, and closing changes

Until these adapters are available, Sandbox and Production mutations must remain `BACKEND_REQUIRED` and must never fall back to the session store.
