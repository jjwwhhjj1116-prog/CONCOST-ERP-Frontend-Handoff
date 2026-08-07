# RC3 Business Card and Contact OS Backend Delta

Status: `BACKEND_CAPABILITY_PENDING`

This document defines the backend capabilities required by the reviewed business-card workflow. It does not modify the frozen OpenAPI contract.

## Product Boundary

The backend must keep these resources separate:

- `BusinessCardUploadSession`: short-lived, single-use mobile upload authorization
- `FileReference`: file metadata, scan state, checksum, and storage locator
- `BusinessCardRecord`: immutable capture and review lineage
- `OcrJob`: provider request, provider state, confidence, and raw result reference
- `Contact`: canonical reviewed person used by Sales
- `Customer`: canonical counterparty linked to Contacts and Opportunities
- `ContactMergeRequest`: field-level merge proposal and decision
- `GoogleContactsOptIn`: optional one-way ERP-to-Google request

An OCR result is never a Contact until a person completes review and explicitly registers or merges it.

## Mandatory Scope and Security

Every request must validate, in order:

1. authenticated user
2. required `X-Company-Id`
3. `allowedCompanyIds`
4. resource `companyId`
5. operation permission
6. revision and idempotency
7. safe response projection

Missing company scope returns `400`. Unauthorized company scope returns `403`. The server must not fall back to a default company or return duplicate candidates from another company.

Business-card images contain personal data. Store image binary only in approved file storage. Browser Local Storage, response payloads, logs, audit bodies, and notifications must contain metadata or a safe `fileReferenceId`, never image Base64 or provider credentials.

## Required Commands and Queries

| Capability | Suggested operation | Required result |
|---|---|---|
| Create one-time upload session | `POST /api/v1/business-card-upload-sessions` | company-scoped session, expiry, one-use token |
| Complete mobile upload | `POST /api/v1/business-card-upload-sessions/{id}/files` | `FileReference` in scan pipeline |
| List inbox | `GET /api/v1/business-cards/inbox` | permission-filtered metadata and review state |
| Request OCR | `POST /api/v1/business-cards/{id}/ocr-jobs` | provider capability or typed provider error |
| Save human review | `PATCH /api/v1/business-cards/{id}/review` | revisioned reviewed fields and confidence |
| Find duplicates | `POST /api/v1/contacts/duplicate-candidates` | current-company candidates only |
| Register or merge | `POST /api/v1/business-cards/register` | Contact, Customer, card record, revision, merge result |
| Archive Contact | `POST /api/v1/contacts/{id}/archive` | inactive Contact with audit record |
| Request Google opt-in | `POST /api/v1/contacts/{id}/google-opt-in` | pending capability state, never synthetic sync success |

The frontend adapter currently maps registration to `POST /api/v1/business-cards/register`. If the frozen contract uses another operation, the backend adapter must translate without changing the frontend workflow until a contract change is approved.

## Registration Command

Input minimum:

- `companyId` from protected request scope
- reviewed card fields
- capture source and file metadata/reference
- OCR mode and per-field confidence
- decision: new Contact, merge Contact, or different person
- selected field merge mask
- optional canonical `customerId`
- owner, tags, memo
- Google Contacts opt-in flag
- expected revision and idempotency key

Atomic result minimum:

- canonical `contactId`
- canonical `customerId`
- immutable `businessCardId`
- `merged`
- `revision`
- audit/event IDs

For merge, the existing `contactId` remains unchanged. Blank incoming values must not erase existing values. Only explicitly selected fields may overwrite. Registration also appends a customer timeline event with the card record ID.

## Inbox State Machine

```text
RECEIVED
  -> OCR_PENDING
  -> REVIEW_REQUIRED
  -> DUPLICATE_REVIEW or READY_TO_CREATE
  -> READY_TO_CREATE
  -> COMPLETED

Any active state -> FAILED
FAILED -> OCR_PENDING
```

Skipping human review is forbidden. Repeated registration with the same idempotency key must return the original result without creating another Contact, Customer, BusinessCardRecord, or timeline event.

## Provider Rules

- No OCR provider: return `PROVIDER_NOT_CONFIGURED`; do not return OCR success.
- OCR provider failure: retain the File Reference and review draft, then return a retryable typed error.
- No Contact adapter in Sandbox or Production: return `BACKEND_REQUIRED`; do not fall back to DEMO_LOCAL.
- Google opt-in without provider: retain `OPT_IN_PENDING` or `PROVIDER_REQUIRED`; do not report `SYNCED`.
- Cross-device upload without a server session: show capability unavailable; do not present a permanent anonymous URL.

## Legacy Demo Data

The previous browser Contact store has no `companyId`. It must never be silently migrated. The frontend quarantines those records for explicit company review. A backend import, if later approved, must require:

- selected company
- reviewer identity
- duplicate preview
- per-record acceptance
- audit event
- no raw image transfer from browser persistence

## Audit and Notifications

Record actor, company, resource IDs, revision, before/after field values, reason, timestamp, provider capability, and idempotency result for:

- upload received
- OCR requested/completed/failed
- human review saved
- duplicate decision
- Contact created or field-merged
- Customer created or linked
- Contact archived
- Google opt-in requested/completed/failed

Do not copy image binary, secrets, full provider responses, or restricted personal data into notification text.

## Frontend Readiness

The RC3 frontend already provides:

- four-step human-reviewed Wizard
- editable OCR fields and confidence display
- direct entry without OCR
- company-scoped duplicate candidates
- field-level blank-safe merge
- separate BusinessCardRecord and canonical Contact state
- Customer and Sales Timeline linkage
- completion routes to Contact, Customer 360, Opportunity, and Mail Draft
- inbox state display and one-time mobile session UI
- archive/inactive Contact action
- Korean, Vietnamese, and English core copy

Until the operations above are implemented, DEMO_LOCAL remains a clearly labeled simulation and all server modes remain `BACKEND_REQUIRED`.
