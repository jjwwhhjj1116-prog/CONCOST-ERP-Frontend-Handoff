# Contract Change Request RC3: Input Memory Management

## Status

`REQUESTED_NOT_APPLIED_TO_FROZEN_OPENAPI`

## Purpose

Provide company-scoped suggestions for controlled, non-sensitive estimate fields without converting browser storage into production persistence.

## Proposed resource contract

An input suggestion is uniquely scoped by:

- `companyId`
- `moduleKey`
- `fieldKey`
- normalized value

It includes an opaque ID, display value, aggregate usage count, user usage count, last-used timestamp and ranking score.

Required actions are search, add/use, select/use and delete. Search supports query, recent and usage ordering. All operations require `X-Company-Id`; missing company is 400 and unauthorized company is 403.

## Field policy

Allowed initial estimate fields:

- vendor
- workCategory
- usage
- estimateType
- unitWork

Disallowed fields include email, phone, mobile, fax, address, memo, note, content, personal name/contact, password, token, secret and credential. The backend owns the final allowlist and must not accept an arbitrary field supplied by the browser.

## Runtime behavior

- `DEMO_LOCAL`: company-separated local suggestions are permitted and visibly demo-only.
- `API_SANDBOX` and `PRODUCTION_SERVER`: API failure is an error; there is no localStorage success fallback.
- Company changes invalidate previous-company query results and cache keys.
- Delete and administrative dictionary actions are company-scoped and audited.

No frozen OpenAPI file is modified until this request is approved.
