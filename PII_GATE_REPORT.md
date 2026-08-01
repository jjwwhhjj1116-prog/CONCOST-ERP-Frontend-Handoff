# RC2 PII Gate Report

## Verdict

`PASS` - the release source contains synthetic demo identities only.

## Scope

- Tracked source, documentation, tests, scripts, OpenAPI examples, and approved binary assets
- Personnel fixtures and Prisma seed inputs
- Static demo authentication and company-scoped demo personas
- Spreadsheet cell values and document metadata
- Previously tracked browser screenshots and generated logs

## Result

- Personnel records: 94 synthetic records
- Companies represented: `CON_COST`, `VIET_QS`
- Reserved email domain: `example.invalid`
- Release gate findings: 0
- Secret findings: 0
- Personal profile images, signatures, and business-card images: 0
- Removed browser screenshots containing identity-like screen content: 20
- Sanitized spreadsheet workbooks: 3

The report intentionally does not reproduce any detected source value.

## Runtime safeguards

- Static credentials are accepted only in `DEMO_LOCAL`.
- `API_SANDBOX` and `PRODUCTION_SERVER` require server authentication.
- The production Prisma seed path is blocked.
- Synthetic seeding requires explicit opt-in.
- Login and session recovery synchronize company, locale, and API request scope.
- A non-administrator synthetic persona cannot switch to another company workspace.

## Validation

- Synthetic reference-integrity tests: PASS
- Static authentication boundary tests: PASS
- Sequential company-login isolation test: PASS
- Root tests: 106/106 PASS
- TypeScript: PASS
- ESLint: 0 errors
- Webpack production build: PASS
- Browser login, organization, finance, approval, mobile layout, and company switch regression: PASS
- Browser console errors: 0
- Release PII gate: PASS, 0 findings

## History boundary

The product development branch contains earlier identity-bearing history and must not be distributed. The release is exported to a new repository with one root commit and no parent history. Only that clean repository may be bundled for handoff.

## Real data

Real employee or company data must be imported by an authenticated backend process following `SECURE_REAL_DATA_IMPORT.md`. It must not be committed, embedded in frontend assets, or persisted as static demo authentication data.
