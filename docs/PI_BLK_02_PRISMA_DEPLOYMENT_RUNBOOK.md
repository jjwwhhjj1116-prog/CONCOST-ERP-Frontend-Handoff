# PI-BLK-02 Prisma Deployment Runbook

## Scope

This runbook separates Prisma schema preparation from server startup. It does
not authorize a production migration, change `schema.prisma`, edit migration
SQL, seed production data, or perform PI-API-01A work.

## Deployment Contract

- `npm run start` starts `dist/server.js` only.
- `npm run db:generate` and `npm run db:validate` do not mutate a database.
- `npm run db:migrate:status` inspects migration state.
- `npm run db:migrate:deploy` is the only production migration command.
- `npm run db:migrate:dev` is allowed only for a development database.
- `npm run db:seed` is allowed only for development and isolated test
  databases.
- Schema push, migration reset, and production seed are not supported.
- A production deploy requires `DATABASE_ENVIRONMENT=production` and the
  short-lived release approval `PRISMA_MIGRATION_APPROVED=true`.
- A test deploy requires `DATABASE_URL` to be exactly the same value as
  `TEST_DATABASE_URL`.
- A non-production command is rejected when its target equals
  `PRODUCTION_DATABASE_URL`.
- Migration failure returns a non-zero status. The release system must stop
  before starting the new application version.

## Environment Separation

| Environment | Required variables | Allowed mutation |
|---|---|---|
| Development | `DATABASE_ENVIRONMENT=development`, `DATABASE_URL` | `migrate dev`, `migrate deploy`, seed |
| Test | `DATABASE_ENVIRONMENT=test`, `DATABASE_URL`, matching `TEST_DATABASE_URL` | `migrate deploy`, seed |
| Production | `DATABASE_ENVIRONMENT=production`, `DATABASE_URL` | approved `migrate deploy` only |

`PRODUCTION_DATABASE_URL` should be supplied to non-production release jobs
when the secret manager can expose it safely. The guard compares
host/port/database identity while ignoring credentials, and never prints the
URL.

## Release Phase

The repository has no verified server deployment workflow, Render manifest,
container entrypoint, or release hook. GitHub Actions currently deploys only
the static Next.js site.

The selected policy is a release-phase migration:

1. Back up the target database using the hosting provider's supported backup
   mechanism.
2. Set the three production variables described above through the deployment
   secret manager.
3. Run `npm run release:database` from `server/`.
4. Stop the release if any command exits non-zero.
5. Start or roll out the application with `npm run start`.
6. Perform the post-deploy checks in this document.

Wiring step 3 into the actual hosting platform is **BLOCKED** until the server
deployment platform and its release-hook contract are identified.

## Initial Baseline Gate

The historical production start used schema synchronization and seed rather
than migration history. The production database may therefore contain tables
without matching rows in `_prisma_migrations`.

Before the first production `migrate deploy`:

1. Obtain an isolated copy of the production database.
2. Run `npm run db:migrate:status` against the copy.
3. Compare `_prisma_migrations` names and checksums with every repository
   migration.
4. Compare the actual schema with `server/prisma/schema.prisma`.
5. If tables exist without migration history, do not deploy blindly.
6. Create a reviewed baseline plan. Use `prisma migrate resolve --applied`
   only for migrations whose effects and checksums have been independently
   verified by the database owner.
7. Test the complete release command against the isolated copy.

Production migration history is currently **UNKNOWN** because no database
connection is available in this environment.

## Repository Migration Classification

The classification below describes repository SQL, not the unknown production
database state. Every migration can still fail when its objects already exist
because an earlier deployment used schema synchronization.

| Migration | Classification | Notes |
|---|---|---|
| `20260720000100_add_estimate_request_management` | ADDITIVE | Creates request tables, indexes, and foreign keys |
| `20260720000200_add_estimate_sheet_engine` | ADDITIVE | Creates sheet tables, unique indexes, and foreign keys |
| `20260720000300_add_estimate_submission_management` | ADDITIVE | Creates submission table and constraints |
| `20260721000100_add_estimate_database_management` | ADDITIVE | Creates estimate DB tables and indexes |
| `20260721000200_add_commercial_decision_conversion` | ADDITIVE | Creates decision and intake tables |
| `20260721000300_add_project_intake_management` | ADDITIVE | Adds nullable intake columns and history table |
| `20260721000400_add_project_pm_schedule` | ADDITIVE | Creates PM schedule tables |
| `20260721000500_add_project_operations` | ADDITIVE | Creates project operation tables |
| `20260721000600_add_project_qc` | ADDITIVE | Creates QC tables and constraints |
| `20260721000700_add_project_delivery_daily` | ADDITIVE | Creates delivery and daily-report tables |
| `20260721000800_add_project_profit_analysis` | ADDITIVE | Creates profit-analysis tables and constraints |
| `20260723000100_add_input_suggestions` | ADDITIVE | Creates company-scoped input suggestion tables |
| `20260724000100_add_estimate_company_scope` | DATA_BACKFILL_REQUIRED | Adds nullable company columns and indexes |

No repository migration contains destructive DDL or data-deleting DML.
`ALTER TABLE`, index creation, uniqueness, and foreign-key validation can still
lock tables or fail on an unknown pre-existing schema.

## PI-DATA-01 Company Scope Audit

Do not execute this audit against production from a developer workstation.
The database owner must run it read-only after a backup and record only
aggregate results.

```sql
SELECT COUNT(*) AS estimate_request_company_nulls
FROM "EstimateRequest"
WHERE "companyId" IS NULL;

SELECT COUNT(*) AS commercial_decision_company_nulls
FROM "CommercialDecision"
WHERE "companyId" IS NULL;

SELECT er."companyId", COUNT(*) AS row_count
FROM "EstimateRequest" er
GROUP BY er."companyId"
ORDER BY er."companyId";

SELECT cd."companyId", COUNT(*) AS row_count
FROM "CommercialDecision" cd
GROUP BY cd."companyId"
ORDER BY cd."companyId";

SELECT cd."id", cd."companyId" AS decision_company,
       er."companyId" AS request_company
FROM "CommercialDecision" cd
JOIN "EstimateRequest" er ON er."id" = cd."estimateRequestId"
WHERE cd."companyId" IS DISTINCT FROM er."companyId";

SELECT cd."id", cd."companyId" AS decision_company,
       p."companyId" AS project_company
FROM "CommercialDecision" cd
JOIN "Project" p ON p."id" = cd."projectId"
WHERE cd."companyId" IS DISTINCT FROM p."companyId";
```

PI-DATA-01 must define the authoritative company source, conflict quarantine,
backfill batches, audit records, retry behavior, and rollback before either
nullable column is made required.

## Pre-Deployment Checklist

- Working tree and release commit are identified.
- Backup is complete and restore time is known.
- Migration history and checksums match the reviewed baseline.
- PI-DATA-01 aggregate audit is recorded.
- No unresolved failed row exists in `_prisma_migrations`.
- The isolated production copy passed `npm run release:database`.
- The release job has a statement timeout and lock monitoring.
- The approval variable is issued only for this release.

## Post-Deployment Checks

- `npm run db:migrate:status` reports no pending or failed migration.
- Server health check succeeds after application rollout.
- Estimate request, commercial decision, project, and intake reads remain
  company-scoped.
- No new null or cross-company row is introduced.
- Application logs contain no migration command or seed execution.
- The approval variable is removed.

## Rollback

Prisma migration SQL has no automatic down migration.

- If migration execution fails, do not start the new application version.
- If an additive migration succeeded but application rollout failed, roll back
  application code while leaving compatible additive objects in place.
- If data integrity was changed, stop writes and use the reviewed compensating
  script or provider backup restore. Do not improvise data deletion.
- Never use development migration, schema push, reset, or seed as rollback.

## Verification Status

| Check | Status |
|---|---|
| Production start is server-only | PASS |
| Dangerous production synchronization removed | PASS |
| Production dev/reset/seed blocked by supported command set | PASS |
| Migration failure propagates to release caller | PASS |
| Prisma schema validate and client generation | PASS |
| Migration deploy against isolated PostgreSQL test DB | BLOCKED: no test DB URL |
| Production migration history comparison | BLOCKED: no production DB access |
| Hosting release-hook integration | BLOCKED: platform configuration unknown |
