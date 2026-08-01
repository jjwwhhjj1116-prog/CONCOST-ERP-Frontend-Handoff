# PROJECT CHAIN MOCK SCENARIOS v1.0

This is a future mock contract, not a runtime mock implementation.

## Success Flow

The 27 success Example Objects cover Estimate Request through Project Archive, including
company scope, immutable versions, Intake READY files, organization IDs, assigned PM, question
visibility, QC policy, delivery acknowledgement and restricted profitability.

## Error Flow

The 10 error Example Objects cover company, revision, idempotency, state, file, approver,
permission, validation and availability failures.

## Required Mock Invariants

- Server success is never fabricated when an endpoint is unavailable.
- Every mutation echoes a deterministic revision and respects Idempotency-Key.
- Company isolation and authorization are enforced before resource lookup.
- File status is explicit; READY is never assumed.
- Mock data contains no real employee, customer, project or credential data.
