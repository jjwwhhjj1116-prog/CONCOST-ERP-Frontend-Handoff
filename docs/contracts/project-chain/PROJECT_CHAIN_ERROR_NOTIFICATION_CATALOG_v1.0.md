# PROJECT CHAIN ERROR AND NOTIFICATION CATALOG v1.0

## Errors

The top-level code uses the frozen common ErrorCode. Project-specific causes are carried in
`error.details.reasonCode`; therefore an unconfigured approver is
`VALIDATION_FAILED + APPROVER_NOT_CONFIGURED`, not a silent new common code.

| Condition | Common code | Project reason / behavior |
|---|---|---|
| Missing company | COMPANY_REQUIRED | No default company fallback |
| Forbidden company | COMPANY_FORBIDDEN | Cross-company access blocked |
| Stale revision | REVISION_CONFLICT | Return current revision |
| Reused key with different payload | IDEMPOTENCY_CONFLICT | Original result remains authoritative |
| Illegal state action | INVALID_TRANSITION | Return current state |
| File not READY | FILE_NOT_READY | Transition blocked |
| Approval policy unresolved | VALIDATION_FAILED | reasonCode=APPROVER_NOT_CONFIGURED; no current-user fallback |
| Missing action capability | ACTION_FORBIDDEN | Server authorization only |
| Invalid form | VALIDATION_FAILED | Localized fieldErrors |
| Provider unavailable | SERVICE_UNAVAILABLE | retryable where safe |

## Notifications

Required actors and explicitly assigned users receive IN_APP by default. Ordinary entire-team
new-Project broadcast defaults OFF. EMAIL, BROWSER and MOBILE are opt-in. Preference controls
delivery only; immutable event and audit records are retained independently.
