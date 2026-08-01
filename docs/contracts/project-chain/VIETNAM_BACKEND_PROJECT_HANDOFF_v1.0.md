# VIETNAM BACKEND PROJECT HANDOFF v1.0

## Implementation Order

1. Implement FE-CONTRACT-01 security, company, error, revision, idempotency and FileDto rules.
2. Implement Estimate Request, immutable sheet versions and commercial-decision correction.
3. Implement Execution Plan capability and Intake four-step Draft/approval transaction.
4. Activate one canonical Project and issue projectNo in final approval.
5. Implement assignments, PM schedule, questions, QC, work logs, delivery and profitability.
6. Implement outbox notifications and channel preferences.
7. Add the read-only GOU bridge only after a real API/export is verified.

## Non-negotiable Invariants

- X-Company-Id and server authorization on every operation.
- Canonical IDs only; no name-string join or per-team Project copy.
- Revision and idempotency on mutations.
- Transactional final Intake approval and projectNo issuance.
- Immutable Estimate and Delivery versions.
- Backend-returned capabilities and approval policies; no title inference or fallback actor.
- Event/audit retention independent from notification delivery preferences.

Runtime, database, migration, deployment and provider implementation are not included in this
contract archive.
