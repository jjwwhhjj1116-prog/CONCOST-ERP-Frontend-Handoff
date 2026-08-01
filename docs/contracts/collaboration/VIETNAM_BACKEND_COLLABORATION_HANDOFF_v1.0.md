# Vietnam Backend Collaboration Handoff v1.0

## Contract status

- Common: COMMON_CONTRACT_FROZEN_V1
- Project: PROJECT_CHAIN_CONTRACT_FROZEN_V1
- Collaboration: COLLABORATION_CONTRACT_FROZEN_V1
- Mail Provider: PROVIDER_TBD_CONTRACT_COMPLETE
- GOU authenticated capability: GOU_UNKNOWN_READ_ONLY_DEFERRED

## Delivery order

1. Common session/company/error/revision/idempotency/File lifecycle.
2. Task and APP Notification pilot.
3. Board and Calendar pilot.
4. Approval API_SANDBOX with server policy resolver.
5. Mail GOU Link/read-only and Provider API_SANDBOX.
6. Separately approved Provider and production cutover.

## Required capabilities

| Module | Required backend evidence |
|---|---|
| Mail | capabilities, provider adapter, retention policy, send idempotency and delivery status |
| Approval | Form/Policy/Step/Decision/Delegation separation, immutable ledger |
| Calendar | timezone, recurrence scope, visibility filtering and attendees |
| Tasks | checklist/comment/reminder persistence and scheduler deduplication |
| Board | official-notice publish policy and acknowledgement ledger |
| Notifications | immutable Event plus Delivery/Read/Preference separation |
| Search | permission-first Provider Registry and partial failure isolation |

## Acceptance

Contract tests cover company isolation, unauthorized metadata non-disclosure, revision, idempotency, File READY, Provider NOT_CONFIGURED, no hardcoded approver names, GOU read-only behavior and all final examples.
