# HR, Organization and Account Contract v1.0

## Source precedence

- Current operation: GOU is HR/Organization SSOT.
- Initial build: approved Excel is an import snapshot, never live SSOT.
- Pilot: new HR Backend is Pilot source while GOU remains operational source.
- Post-cutover: new HR Backend becomes SSOT only through an approved cutover gate.

sourceSystem, sourceVersion, sourceUpdatedAt, lastSyncedAt, syncStatus, conflict and readOnly are mandatory. Name matching is forbidden.

Primary Membership is exactly one; Secondary, Acting and Temporary memberships are explicit. Employment status, Account status and Business Role assignment are separate. Rank/title never grants HR, Finance or approval permission. Demo accounts are excluded from operational authority.

Leave/absence v1 is a read-only GOU overlay. Leave application, attendance, accrual, payroll and dual write are `PILOT_PHASE_DEFERRED`.
