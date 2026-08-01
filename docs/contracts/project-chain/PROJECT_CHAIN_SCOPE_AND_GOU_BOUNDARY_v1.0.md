# PROJECT CHAIN SCOPE AND GOU BOUNDARY v1.0

## Contract Scope

The project chain is Estimate Request -> immutable Estimate Sheet Version -> Commercial
Decision -> Execution Plan -> four-step Project Intake -> canonical Project -> Assignment
and PM Schedule -> operations -> QC -> immutable Delivery and acknowledgement -> completion
and archive.

Every server request is scoped by `X-Company-Id`, authorization and canonical opaque IDs.
Project-name joins, department-name joins and per-team Project copies are forbidden.

## GOU Coexistence

GOU remains the current legacy groupware. v1 may expose only a read-only metadata bridge:
sourceSystem, externalId, legacy Project number/name/status, manager display, major schedule,
legacyLink, lastSyncedAt, syncStatus and readOnly=true.

The bridge is `UNKNOWN` until a real GOU API or approved export is verified. Dual write,
full attachment import, full approval/mail import and editing GOU Project data from the new
ERP are out of scope.

## Official Business Data UI

The official name is **수주·실적 데이터 관리**. It manages estimate, client/vendor,
Project, billing, sales and receipt performance records. It is not a database server,
SQL console, direct table editor or administrator DB console.
