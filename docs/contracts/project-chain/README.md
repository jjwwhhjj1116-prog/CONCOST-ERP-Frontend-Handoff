# Project Chain Frontend-Backend Contract

## Contract Version

- Contract: `PROJECT_CHAIN_CONTRACT_FROZEN_V1`
- Common dependency: `COMMON_CONTRACT_FROZEN_V1`

## Evidence

- offday2 source commit: `4406d2607ace6b64e8a165e4aae8d67e082b992b`
- Current GOU boundary: read-only metadata bridge
- Approved user decisions: DEC-01 through DEC-15

## Backend Handoff Order

1. Common contract and company scope
2. Estimate request and immutable estimate versions
3. Commercial decision and execution plan
4. Four-step project intake and project activation
5. Assignment, PM schedule and project operations
6. QC, delivery acknowledgement, work logs and profitability
7. Completion and archive gates

## Implementation Status

- Runtime implementation: not included
- Backend implementation: not included
- Mock runtime implementation: not included
- Database migration: not included

## Contract Priority

The common contract controls authentication, workspace scope, errors, security, files and
shared envelopes. This project-chain contract controls estimate-to-archive domain behavior.
Conflicts require an explicit contract change request; they must not be resolved in runtime code.

## Change Control

Issued contract artifacts are immutable. A change requires a new contract version, decision
record, compatibility assessment, validated examples and an independent documentation commit.

## Next Contract

- FE-CONTRACT-03
- FE-CONTRACT-04
- FE-MOCK-01
- FE-HANDOFF-01
