# RC3 Freeze Manifest

## Identity

| Item | Frozen value |
|---|---|
| Repository | `jjwwhhjj1116-prog/CONCOST-ERP-Frontend-Handoff` |
| Source branch | `preview/frontend-rc3` |
| Source commit | `3ccaf2bf5a6be4c4d23ac8d0a748435ff8a8504f` |
| Candidate branch | `release/frontend-rc3-freeze-candidate` |
| Candidate tag | `frontend-rc3-freeze-candidate-2026-08-10` |
| Runtime contract | `DEMO_LOCAL`, `API_SANDBOX`, `PRODUCTION_SERVER` |
| Contract set | Frozen Common, Project Chain, Collaboration, and Business contracts |

The candidate branch and annotated tag may be created only after the harness,
regression, build, security, and public preview gates pass. The tag must not be
moved or recreated. The RC2 tag remains immutable.

## Included Boundary

- The validated RC3 frontend workflows at the source commit.
- A read-only Integration Capability Registry and administrator diagnostics UI.
- M0-M7 API Sandbox milestone definitions, safe request correlation metadata,
  typed integration errors, and company-scope diagnostics.
- Viet QS reading order, capability matrix, cumulative delta index, and drift
  register references.

## Explicit Exclusions

- Product features or business-rule changes.
- Backend, database, provider, deployment, or OpenAPI implementation.
- A claim that any backend milestone passed without an explicit probe.
- Secrets, tokens, cookies, request/response bodies, or personal data in the
  diagnostics surface.

## Release Gates

1. Existing tests do not decrease from 179.
2. TypeScript, ESLint, Webpack build, PII, secret, and diff checks pass.
3. Admin-only diagnostics is verified at desktop and mobile sizes.
4. `DEMO_LOCAL` milestones remain `NOT_TESTED`.
5. Missing sandbox/production adapters remain `BLOCKED`, never demo fallback.
6. Feature, candidate, tag, and preview refs point to the same validated commit.
