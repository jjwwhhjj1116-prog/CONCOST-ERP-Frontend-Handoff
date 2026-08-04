# Contract Change Request RC3: Estimate Completion, Mail and Excel

## Status

`REQUESTED_NOT_APPLIED_TO_FROZEN_OPENAPI`

## Proposed changes

### Estimate completion

- Keep backend state `SUBMITTED`; expose the user label `작성완료`.
- Completion freezes the exact version, template hash and document hash.
- A correction creates a new DRAFT version under the same `sheetId`.
- Draft duplicate and draft delete require revision and idempotency controls.

### Mail handoff

Create a provider-neutral mail draft from an immutable estimate version with:

- `recipient`
- `subject`
- `body`
- `attachments[]` for XLSX and PDF file references
- `estimateRequestId`
- `sheetId`
- `version`
- `companyId`

Opening or saving a mail draft does not transition the estimate to `SENT`. Only a provider-confirmed send event with the same lineage may do so. Provider absence returns a capability error and never a success response.

### Excel import/export

Import must be a two-phase workflow:

1. Upload and preview: template detection, mapping, semantic diff, errors and security findings.
2. Confirm: create a new DRAFT version with optimistic revision and idempotency checks.

Reject macro-enabled files, external executable content, unsafe formula prefixes and formula-injection text. The server must preserve the semantic state needed for export-import round trips.

## Compatibility

This request adds capabilities without changing the meaning of existing frozen states, IDs, company scope, revisions, errors or file READY semantics. No official OpenAPI file is modified by the RC3 frontend task.
