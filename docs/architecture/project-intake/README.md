# Project Intake Architecture

## Document Priority

When project-intake documents disagree, use this order:

1. `PI_POLICY_ORG_01_FINAL_DECISION.md`
2. `PI_API_01_PROJECT_INTAKE_SERVER_DESIGN_REVIEW_v1.1_FINAL.md`
3. Earlier v1 designs and audit documents
4. Conversation history and temporary drafts

## Current Status

- CON-COST v1 organization policy is frozen.
- Viet QS organization auto-assignment and Project Intake approval are OFF.
- Cross-company participation is excluded from v1 and deferred to `PI-XCO-01`.
- `PI-ENV-01` is required before implementation.
- `PI-BLK-03B` and `PI-API-01A` have not started.

## Hard Gate

Implementation requires all of the following:

- an isolated PostgreSQL validation environment;
- committed-migration deployment rehearsal;
- an actual database or approved snapshot audit;
- OrganizationUnit migration review;
- explicit user approval.

## Forbidden

- Project-name string relationships
- Department-specific Project copies
- Current-user or role-title approver fallback
- Rank-based automatic permissions
- Production authority for demo accounts
- `prisma db push` against an operational database
- `--accept-data-loss`
- Production credentials or real company data in validation

## Document Integrity

| Document | SHA-256 |
|---|---|
| `PI_POLICY_ORG_01_FINAL_DECISION.md` | `3E729082952101712995B07E49FD9F305DE3B445EC79263121F08C4DB0E152CA` |
| `PI_API_01_PROJECT_INTAKE_SERVER_DESIGN_REVIEW_v1.1_FINAL.md` | `B27204973A0E9AC0C66F4708DDBE960C469B832C512A0CBD3C71BF17CD1A193F` |

These hashes identify the externally approved source documents copied into this directory during `PI-DOC-01`.
