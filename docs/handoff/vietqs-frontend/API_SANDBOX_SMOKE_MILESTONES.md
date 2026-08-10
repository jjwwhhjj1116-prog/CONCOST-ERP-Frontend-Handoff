# API Sandbox Smoke Milestones

## Result Contract

- `NOT_TESTED`: no explicit probe evidence exists.
- `BLOCKED`: a required adapter or provider is unavailable.
- `FAIL`: a probe or declared integration returned an error.
- `PASS`: every capability is `READY` and an explicit probe passed.

`DEMO_LOCAL` never certifies an API Sandbox milestone. A build-time readiness
flag is not probe evidence.

| Milestone | Scope | Minimum evidence | Blocking rule |
|---|---|---|---|
| M0 | Runtime | immutable runtime and safe API base | invalid/missing server-mode API base |
| M1 | Auth/Company | session, allowed company, required company header, 400/403 | missing auth/company adapter |
| M2 | Project Core | canonical project read/write, idempotency, revision | project adapter unavailable |
| M3 | File/Drive | upload metadata, scan, READY, folder binding | adapter or Shared Drive missing |
| M4 | Approval/Mail | permission-first list, policy, provider send/decision | adapter/policy/provider missing |
| M5 | Card/Contact | OCR job, review, duplicate, company-scoped Contact | adapter/OCR provider missing |
| M6 | Sales/Finance | scoped CRM, finance access, ledger, export | adapter or finance capability missing |
| M7 | Claim/AI | evidence, provenance, consent, review, delivery | adapter/private provider missing |

## Execution Sequence

Run M0 through M7 in order. A blocked milestone does not authorize skipping its
security dependency. Record request/correlation IDs but redact credentials and
business payloads. Every mutation probe uses a synthetic company-scoped fixture,
an idempotency key, revision, and cleanup contract owned by the backend team.
