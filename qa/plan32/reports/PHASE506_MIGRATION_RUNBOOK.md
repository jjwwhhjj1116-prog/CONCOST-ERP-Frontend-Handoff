# Data Migration and Rollback Design

> **Archived draft:** The execution commands that previously appeared in this
> document are retired. They did not distinguish development, test, and
> production databases and included a destructive reset path.
>
> Use `docs/PI_BLK_02_PRISMA_DEPLOYMENT_RUNBOOK.md` as the only current
> migration and rollback procedure.

## Historical Scope

This document originally described moving client-side mock data to PostgreSQL.
Its assumptions about a fresh staging database and disposable data have not
been verified against the current deployment.

## Current Safety Rules

- Do not seed, reset, or synchronize a production database from application
  startup.
- Do not assume that a database is fresh or disposable.
- Do not discard legacy IDs without an approved lineage and backfill plan.
- Run production migrations only through the reviewed release-phase command.
- Require a backup, migration-history comparison, isolated restore test, and
  explicit production approval.
- Stop the release when migration execution returns a non-zero status.

The active runbook contains the repository migration classification,
PI-DATA-01 company-scope audit, baseline procedure, validation checks, and
rollback policy.
