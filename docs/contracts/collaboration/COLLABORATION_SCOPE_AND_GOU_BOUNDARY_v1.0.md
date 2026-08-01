# Collaboration Scope and GOU Boundary v1.0

Status: **COLLABORATION_CONTRACT_FROZEN_V1**

## Evidence baseline

- ERP: `feat/login-board-refresh@2f00ba591f84b361080d977b3424eef44c0844ca`.
- Behavioral reference only: `Groupware-System-3@0d73cf4990c026f07588cd2a42e82230cc63cb43`.
- Common dependency: `COMMON_CONTRACT_FROZEN_V1`.
- Project dependency: `PROJECT_CHAIN_CONTRACT_FROZEN_V1`.
- Current GOU: operational collaboration SSOT.
- Runtime, Server, Prisma, Migration, DB and Mock implementation: out of scope.

## Ownership boundary

| Module | Current operational owner | ERP pre-cutover mode | Final classification | Write rule |
|---|---|---|---|---|
| Mail | GOU | GOU_LINK or READ_ONLY_MIRROR; Provider NOT_CONFIGURED | PROVIDER_TBD_CONTRACT_COMPLETE | Send disabled/error until Provider READY; no dual write |
| Approval | GOU | metadata/deep-link read-only, then API_SANDBOX | BACKEND_CAPABILITY_PENDING | Pilot decisions never update GOU |
| Calendar | GOU for official company calendar | approved read-only metadata, ERP sandbox events | BACKEND_CAPABILITY_PENDING | source ownership explicit |
| Tasks | GOU/project process | ERP APP pilot | PILOT_PHASE_DEFERRED | server persistence required |
| Board | GOU for operational notices | read-only notice metadata, ERP pilot board | PILOT_PHASE_DEFERRED | official notice approval required |
| Notifications | source providers | ERP Event/Delivery/Read/Preference contract | BACKEND_CAPABILITY_PENDING | preference controls delivery only |
| Search | each source remains owner | permission-filtered federation | BACKEND_CAPABILITY_PENDING | read-only projection |

## Company and resource scope

Every endpoint requires `X-Company-Id`. The backend validates allowed companies, organization/project membership and action permission before querying or projecting data. Administrators receive no implicit cross-company union. Cache keys include company, actor permission fingerprint, locale and query.

## GOU read-only order

1. Company notices/board metadata and company calendar metadata.
2. Approval metadata/status, counts and deep links.
3. Mail account/deep link and only explicitly approved Mail metadata.

If authenticated GOU capability evidence is unavailable, the state is `GOU_UNKNOWN_READ_ONLY_DEFERRED`. ERP never modifies GOU and never reports mirror freshness without `lastSyncedAt` and `syncStatus`.
