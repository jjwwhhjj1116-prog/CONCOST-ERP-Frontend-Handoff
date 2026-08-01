# Secure Real Personnel Data Import

## Ownership

Real personnel data is backend-owned. The frontend release does not import an
employee spreadsheet, create production accounts, or persist HR records.

## Required Backend Flow

1. Accept an authenticated administrator upload through a short-lived session.
2. Verify company scope and server-side permission before reading file metadata.
3. Virus-scan and quarantine the original file.
4. Parse into a review draft without creating personnel or accounts.
5. Validate required fields, duplicates, company membership, organization IDs,
   manager references, and approval-role assignments.
6. Display a redacted review summary to an authorized data steward.
7. Require explicit approval with revision and idempotency controls.
8. Commit the approved batch transactionally and write an audit event.
9. Store or destroy the original file according to the approved HR retention
   policy; never place it in source control or browser storage.

## Security Requirements

- TLS in transit and approved encryption at rest
- company-scoped authorization on every request
- least-privilege import and review roles
- no secrets, raw credentials, or password hashes in import files
- no production seed from frontend fixture data
- no employee data in logs, error telemetry, screenshots, or release packages
- field-level validation and redaction for phone, address, birth date, photos,
  signatures, and government identifiers

## Disabled Local Tool

`tools/import_personnel_from_excel.py` is a release stub and exits without
reading a local file. Viet QS should implement the workflow as a backend
capability and connect it through the approved API contract.
