# WORKSPACE PLAN 32
# Cloudflare Static Pages, Render/PostgreSQL, Real Account, and Authoritative Data Remediation

## 0. Document status and precedence

This is the corrective implementation plan that follows Plans 1 through 31. Later Plan requirements always take precedence. Where Plan 32 conflicts with an earlier Plan, Plan 32 governs only the corrective deployment, account, backend-authority, data-integrity, and evidence scope described here.

Repository: `F:\workspace`  
Remote: `https://github.com/eumditravel-oss/workspace`  
Current verified baseline at planning time: `0502b53` on `main` / `origin/main`.

## 1. Why this plan is required

The current deployment and implementation audit found the following evidence-backed issues. Do not call any of them complete until their corresponding Phase has passed its specified evidence gate.

| ID | Finding | Required correction |
| --- | --- | --- |
| P32-001 | `next.config.ts` uses `output: "export"`, while the current Cloudflare deployment invokes OpenNext and expects `.next/standalone`. | Choose one supported deployment model. Plan 32 defaults to Cloudflare Pages static export plus Render API. Do not configure both models for the same deployment. |
| P32-002 | `basePath: "/workspace"` is correct for GitHub Pages but not for a Cloudflare Pages domain root. | Use an explicit build-time environment-specific base path with no accidental empty-string fallback. |
| P32-003 | `server/node_modules` and `server/dist` are tracked; `.gitignore` contains NUL bytes; root lint fails. | Remove generated artifacts from Git tracking, repair `.gitignore` as UTF-8 text, and establish a passing quality gate. |
| P32-004 | Client auth starts as a mock super admin and retains client-side role switching; no real login/activation/logout UI is connected. | Replace mock authentication for deployed mode with server-authenticated accounts. |
| P32-005 | Prisma schema exists but migration history, Render build/start/migration configuration, and DB readiness validation do not. | Add reproducible PostgreSQL migration and Render staging deployment procedures. |
| P32-006 | Most Project, Task, Process Template, Schedule, and Approval actions still use client Zustand as the authority. | Make API/PostgreSQL authoritative in small, verified domain slices. |
| P32-007 | Required Plan 30/31 phase reports are absent. | Produce per-phase evidence reports and a final integrity matrix for every Plan 32 phase. |

## 2. Target architecture

Plan 32 default target:

```text
Browser
  -> Cloudflare Pages static Next.js export (`out/`)
  -> Render Express API (`https://api.<approved-domain>/api`)
  -> Render PostgreSQL (private DATABASE_URL only)
```

Rules:

1. Cloudflare Pages static export is the default. Its build output is `out/`; it must not use OpenNext or a Worker entrypoint.
2. Do not convert the app to Cloudflare Workers/OpenNext unless the user explicitly approves a separate architecture decision. If that route is chosen later, it needs its own adapter, Wrangler, compatibility, and preview phases.
3. GitHub Pages and Cloudflare Pages must use separate build-time `basePath` values. GitHub Pages may retain `/workspace`; Cloudflare Pages must normally build with an empty base path.
4. Public client configuration may contain only `NEXT_PUBLIC_*` values that are safe to expose, such as the API base URL and base path. Never put database passwords, session secrets, Cloudflare tokens, Render API keys, invite token values, or private URLs in source, exported JSON, screenshots, reports, logs, or Git.
5. The `*.pages.dev` frontend and `*.onrender.com` API are different sites. Do not claim cross-site cookie sessions are production-ready until a same-site custom-domain strategy or an explicitly approved alternative authentication strategy has passed browser tests.
6. PostgreSQL and API state become authoritative only after the relevant domain slice has passed migration, API, frontend, rollback, and E2E gates. Never silently merge server data with stale Zustand/localStorage data.

## 3. Approval and evidence protocol: mandatory for every phase

Before every phase, Antigravity must send exactly this form and then wait:

```text
[Plan 32 / Phase NNN 시작 승인 요청]
- 목표:
- 변경 여부: 조사만 / 코드 변경 / 데이터 변경 / 대시보드 변경
- 영향 범위:
- 실행 전 확인 사항:
- 롤백 또는 보존 방식:
- 승인 전에는 이 Phase를 실행하지 않겠습니다.
```

After a user approves and the phase is complete, Antigravity must perform the phase integrity checks before reporting. It must then send:

```text
[Plan 32 / Phase NNN 완료 보고]
- 판정: PASS / PARTIAL / FAIL / BLOCKED
- 실제 수행 내용:
- 변경 파일 또는 대시보드 항목:
- 실행한 명령과 결과 요약:
- 실제 검증 증빙: route/API/test/build/log/screenshot path
- 데이터 변경 여부 및 복구 방법:
- 발견 이슈 및 미해결 위험:
- 다음 Phase는 승인 전 실행하지 않겠습니다.
- 다음 Phase NNN+1 진행 승인 요청:
```

Universal constraints:

- A report, source comment, or a previous commit is not evidence of completion. Verify the actual file, runtime, dashboard state, or database result required by the phase.
- Each phase requires its own user approval. Never batch approvals, silently continue, or begin the next phase after a report.
- No `git commit`, `git push`, Cloudflare deployment, Render service/database creation, database migration, environment-variable mutation, secret creation, production data mutation, data deletion, or DNS change without the phase-specific approval.
- Chrome already has Cloudflare and Render accounts authenticated. Use the existing session only in an approved dashboard phase. Never ask for, export, display, copy, log, or commit credentials/secrets/tokens.
- Dashboard inspection is read-only until its dedicated change phase is approved. Capture setting names and redacted values only.
- Do not use `git reset --hard`, destructive cleanup, broad localStorage clearing, database reset, or deletion of user-created JSON without an explicitly approved, scoped rollback phase.
- All reports must be written under `qa/plan32/reports/` using UTF-8 without BOM/NUL bytes. Include the committed SHA only after it is verified with `git rev-parse HEAD`.

## 4. Required quality gates

No deployment or production approval is allowed unless the relevant gate passes:

```text
1. git diff --check
2. root TypeScript check
3. server TypeScript check
4. root lint using an intentional configuration that excludes generated server output
5. clean frontend static build from a non-stale build directory
6. server build from a clean dependency install
7. Prisma migration status and database readiness check
8. API authorization tests for allowed and forbidden roles
9. browser E2E test using real staging accounts
10. Cloudflare Pages route reload and static asset checks
11. JSON export/import schema and referential-integrity checks
12. regression checks for approved process schedule, rejected revision, resubmission, and official schedule creation
```

`tsc` alone is insufficient. Lint failure, missing migration, browser failure, missing evidence, or an unresolved security issue yields `PARTIAL`, `FAIL`, or `BLOCKED`, not `PASS`.

## 5. Phase plan

### Phase 499 - Start request only

Goal: Request permission to begin Plan 32.  
Allowed: Write the start approval request only.  
Forbidden: Every command, file read, code change, dashboard access, and data operation.

### Phase 500 - Read-only repository and deployment baseline

Goal: Record `git status`, local/remote SHA, tracked generated files, lockfiles, deployment configuration, and current Cloudflare failure evidence.  
Forbidden: Code, dashboard, data, or Git mutation.  
Evidence: `qa/plan32/reports/PHASE500_BASELINE.md`.

### Phase 501 - Plan 1-31 precedence and constraint matrix

Goal: Read all Plan documents, identify latest applicable requirements, and map them to Plan 32 without inventing requirements.  
Forbidden: Implementation.  
Evidence: plan-to-requirement matrix with source file paths.

### Phase 502 - Issue matrix and severity confirmation

Goal: Reproduce or verify P32-001 through P32-007 against source, Git history, logs, and runtime artifacts.  
Forbidden: Fixes.  
Evidence: one row per issue with reproducible evidence and proposed owner phase.

### Phase 503 - Deployment architecture decision record

Goal: Confirm that this Plan uses Cloudflare Pages static export plus Render API/PostgreSQL. Explicitly document why OpenNext/Workers is not active.  
Forbidden: Dashboard change or package installation.  
Evidence: ADR including the exact Cloudflare build command/output directory and API URL ownership.

### Phase 504 - Base-path and environment configuration design

Goal: Design GitHub Pages and Cloudflare Pages build-time configuration without using an `||` fallback that converts an intentional empty base path into `/workspace`.  
Forbidden: Code change.  
Evidence: environment table, expected routes, asset URLs, and rollback plan.

### Phase 505 - Authentication, cookie, CORS, and domain feasibility design

Goal: Determine whether an approved custom domain can make app/API same-site. If not, report the browser-session limitation and present an approved alternative before implementation.  
Forbidden: Secret creation, dashboard mutation, auth code change.  
Evidence: redacted domain/CORS/cookie strategy, CSRF strategy, session expiry/revocation policy.

### Phase 506 - Data migration and rollback design

Goal: Inventory local Zustand/JSON data, define IDs and ownership, backup format, import validation, idempotency, rollback, and user-data preservation.  
Forbidden: Data migration, deletion, DB creation.  
Evidence: migration runbook draft and data-loss risk matrix.

### Phase 507 - Remediation scope approval checkpoint

Goal: Consolidate Phases 500-506 and request user approval for code and repository hygiene work.  
Forbidden: Changes.  
Evidence: approved scope, explicit exclusions, and phase order.

### Phase 508 - Repair `.gitignore` encoding and generated-file policy

Goal: Replace the NUL-containing `.gitignore` with valid UTF-8 text, preserving intended ignore rules and adding server build/dependency artifacts.  
Required checks: no NUL byte, `git check-ignore` behavior verified.  
Forbidden: Removing already tracked generated files in this phase.

### Phase 509 - Remove generated artifacts from Git tracking

Goal: Remove only tracked `server/node_modules` and `server/dist` files from the index while preserving the local working copies until a clean-install test passes.  
Required checks: no unrelated file removal, `git ls-files` confirms zero generated artifact paths.  
Forbidden: `git reset --hard`, lockfile deletion, user-data deletion.

### Phase 510 - Server dependency and runtime metadata repair

Goal: Make `@prisma/client` a runtime dependency, keep Prisma CLI appropriate for build/migration, pin a supported Node range, and add reproducible `build`, `start`, `prisma:generate`, `prisma:migrate:deploy`, and check scripts.  
Forbidden: Dashboard or DB mutation.  
Required checks: clean `npm ci` in `server/`, Prisma client generation, server TypeScript check.

### Phase 511 - Lint boundary and quality configuration repair

Goal: Ensure lint checks source only and does not lint generated `server/dist`; address genuine errors introduced by Plan 30/31 without masking them through broad ignores.  
Required checks: root lint passes, server lint policy documented, warnings listed separately.  
Forbidden: disabling rules globally to hide new errors.

### Phase 512 - Clean build reproducibility

Goal: Diagnose the `.next/trace-build` lock without deleting unrelated processes. Perform an approved scoped clean build and verify `out/` from the current source.  
Required checks: build exit code 0, `out/` contents, `standalone` absence documented as expected for static export.

### Phase 513 - Implement environment-specific base path

Goal: Implement the approved base-path design for GitHub Pages and Cloudflare Pages builds.  
Required checks: root route, nested route, refresh, and `/_next/` asset URLs under both build configurations.  
Forbidden: changing the GitHub Pages production configuration without explicit evidence.

### Phase 514 - Static Cloudflare deployment configuration files

Goal: Add only the minimal repository configuration needed for Cloudflare Pages static export. Do not add OpenNext, Wrangler, worker entrypoints, or Worker bindings.  
Required checks: configuration review against the architecture decision.

### Phase 515 - Cloudflare dashboard read-only inventory

Goal: Using the existing Chrome session, inspect and document the current project type, Git integration, branch, build command, build output directory, root directory, environment-variable names, domains, and failed build ID.  
Forbidden: clicking save, retry, delete, create, or changing secrets.  
Evidence: redacted screenshot paths and setting-name matrix.

### Phase 516 - Cloudflare Pages staging change approval checkpoint

Goal: Present exact proposed Cloudflare Pages staging settings, affected project name, branch, domain, public variable names, and rollback method.  
Forbidden: dashboard change.  
This Phase ends by asking approval for Phase 517 only.

### Phase 517 - Create or reconfigure Cloudflare Pages staging deployment

Goal: After approval, configure a Pages static deployment: framework `Next.js (Static HTML Export)`, build command `npm run build` or approved equivalent, output directory `out`, and the approved staging branch.  
Forbidden: production domain or DNS changes.  
Evidence: build log proving no OpenNext step and successful asset upload.

### Phase 518 - Cloudflare staging static route smoke test

Goal: Verify home, nested routes, hard refresh, 404 behavior, JS/CSS assets, and base-path behavior on the Pages staging URL.  
Evidence: browser console/network report.  
Forbidden: marking API integration complete.

### Phase 519 - Render deployment design

Goal: Define Render service root directory, build command, start command, health check path, Node version, environment names, PostgreSQL attachment, and rollback strategy.  
Forbidden: Render dashboard mutation.  
Evidence: `render.yaml` or equivalent source-controlled design, with no secret values.

### Phase 520 - Prisma migration baseline creation

Goal: Convert the approved Prisma schema into an initial migration suitable for a new staging PostgreSQL database.  
Required checks: migration is committed source, schema validation passes, no database is touched yet.

### Phase 521 - API readiness and error contract repair

Goal: Make `/readyz` perform a bounded real database query, add request IDs/error normalization, and verify health endpoints do not disclose secrets.  
Required checks: unit/integration evidence with DB unavailable and available cases.

### Phase 522 - Render dashboard read-only inventory

Goal: Inspect the existing Render account with Chrome: service existence, root directory, deploy source, build/start commands, health check, environment-variable names, PostgreSQL availability, and logs.  
Forbidden: create/delete/deploy/secret change.  
Evidence: redacted report.

### Phase 523 - Render staging resource approval checkpoint

Goal: Present the exact staging Web Service and PostgreSQL actions, public URL impact, recurring cost implications, backup/rollback method, and environment-variable names.  
Forbidden: dashboard change.

### Phase 524 - Create/configure Render staging Web Service and PostgreSQL

Goal: After approval, configure only the staging service/database using source-controlled commands. Set private secrets in Render only; do not read them back into reports.  
Required checks: deploy log, private database attachment, and no secret exposure.

### Phase 525 - Staging migration and database readiness verification

Goal: Run the approved migration once against staging, verify migration status and `/readyz`, and record schema version.  
Forbidden: production database access or reset.  
Required checks: idempotent repeat behavior or documented safe failure.

### Phase 526 - Session, CORS, CSRF, and rate-limit hardening

Goal: Implement the approved server-side authentication security model: origin allowlist, secure cookie configuration, session expiry/revocation, CSRF defense for cookie-authenticated mutations, and rate limits for login, invite, and activation.  
Required checks: allowed origin, denied origin, unauthenticated, forbidden role, expired session, and CSRF-negative test cases.

### Phase 527 - Real login, invitation activation, and logout UI

Goal: Add real UI flows for login, invitation activation/password creation, logged-in session restoration, and server logout. Remove mock super-admin default and deployed-mode client `loginAs` access.  
Required checks: no active session starts unauthenticated; test account can activate, log in, refresh, log out, and cannot become another role through browser state.

### Phase 528 - API authorization coverage

Goal: Ensure every state-changing Project, Task, Process, Approval, Import, Notification, and invite endpoint uses server-derived identity and role/ownership guards.  
Required checks: endpoint authorization matrix and negative tests.  
Forbidden: trusting `pmId`, `managerId`, reviewer ID, or role sent by the client.

### Phase 529 - Authoritative Project and Task API slice

Goal: Move Project and Task read/write operations from client-only Zustand to API/PostgreSQL, including optimistic-state failure recovery and audit logs.  
Required checks: reload persistence, two-browser consistency, forbidden mutation rejection, rollback on API failure.

### Phase 530 - Authoritative Process Template API slice

Goal: Move template, stage, task, assignment, and schedule read/write flows to API/PostgreSQL. Validate all relational IDs and enforce server-side assignment ownership.  
Required checks: template application, assignee/date/hours/description persistence, invalid ID rejection.

### Phase 531 - Approval, rejection, resubmission, and officialization transaction

Goal: Implement an atomic server workflow: draft -> pending -> approved/rejected -> revised pending; preserve immutable revision history; create official work/schedule records only after approval.  
Required checks: duplicate approval block, manager authorization, mandatory rejection reason, PM-only resubmission, no official schedule before approval, atomic rollback on failure.

### Phase 532 - Notifications, audit log, and JSON handoff authority

Goal: Persist workflow notifications/audit records server-side and make JSON export/import schema-validating, referentially safe, versioned, and explicit about server authority.  
Required checks: export/import round trip, rejected revision history, unknown-reference rejection, backup before import, audit evidence.

### Phase 533 - Existing data migration dry run

Goal: Use the approved backup and migration plan to dry-run only on staging copies. Classify invalid data without silently dropping it.  
Forbidden: production migration or deletion.  
Evidence: counts before/after, rejected-record file, rollback proof.

### Phase 534 - Staging account creation and role matrix

Goal: Create only approved staging test accounts for super admin, manager, PM, worker, and disabled user. Do not create production accounts.  
Required checks: all are invitation-based; credentials remain private; role matrix documented by test ID only.

### Phase 535 - Account and authorization E2E

Goal: Browser-test activation, login, logout, refresh, session expiry, disabled account, role restrictions, direct API attempts, and no mock-role bypass.  
Evidence: redacted test results and screenshots.

### Phase 536 - PM process schedule E2E

Goal: Browser-test PM template apply -> worker assignment -> detailed schedule -> manager review -> rejection reason -> PM revision -> resubmission -> approval -> official employee schedule.  
Required checks: revision/audit/notification records and no pre-approval official work segment.

### Phase 537 - Cloudflare/Render integrated staging E2E

Goal: Test the deployed Pages frontend against Render staging API/DB, including API base URL, CORS/session strategy, hard refresh, and persisted data from two browser sessions.  
Required checks: network evidence that no production endpoint or localhost fallback is used.

### Phase 538 - Regression and accessibility verification

Goal: Recheck existing project board, intake, approvals, schedules, conflicts, JSON functions, KOR/VIET UI, responsive layout, and route reloads.  
Forbidden: new feature additions unrelated to discovered regressions.

### Phase 539 - Full quality gate

Goal: Run every required quality gate from Section 4 on clean staging-oriented conditions.  
Required outcome: all pass; otherwise report `PARTIAL` or `FAIL` with exact evidence.  
Forbidden: suppressing tests/lint or changing settings solely to make a command pass.

### Phase 540 - Operations, backup, and incident runbook

Goal: Write operational instructions for deploy rollback, migration rollback, JSON backup, account revocation, secret rotation, Cloudflare rollback, Render rollback, error monitoring, and recovery ownership.  
Forbidden: production configuration change.

### Phase 541 - Production readiness decision report

Goal: Compare every Plan 32 acceptance criterion to actual staging evidence. List blockers and explicitly decide whether production is ready.  
Forbidden: production deploy, account creation, DB migration, domain/DNS change.

### Phase 542 - Production change approval checkpoint

Goal: Present the exact production actions, public domains, configuration names, migration version, data backup, rollback steps, expected downtime, cost impact, and verification checklist.  
Forbidden: any production action before the user approves this phase and each proposed production operation.

### Phase 543 - Production implementation and smoke test

Goal: Execute only the user-approved production actions in the approved order.  
Required checks: deployment health, DB readiness, public route assets, authenticated smoke test, no staging/prod endpoint mix-up, rollback readiness.  
Stop immediately and report if any acceptance check fails.

### Phase 544 - Final integrity report and commit approval request

Goal: Produce `qa/plan32/reports/PLAN32_FINAL_INTEGRITY_REPORT.md` and a machine-readable evidence matrix. Include all phases, actual test commands/results, dashboard change records, migrations, artifacts removed, SHAs, unresolved risks, and production status.  
Then provide `git diff --check`, changed-file list, and proposed commit message.  
Forbidden: commit or push.

### Phase 545 - Commit approval and execution

Goal: Commit only after explicit user approval.  
Required checks: re-run `git status`, `git diff --check`, and record the resulting SHA.  
Forbidden: push.

### Phase 546 - Push approval and execution

Goal: Push only after a separate explicit user approval.  
Required checks: remote branch, exact SHA, and CI/deploy status.  
Report the final remote SHA and any automatic deployment result.

## 6. Antigravity start prompt

Paste the following into Google Antigravity:

```text
현재 F:\workspace 프로젝트의 Plan 32 작업을 시작한다.

Plan 문서:
<USER_HOME>\Documents\Codex\referenced-output\workspace_plan32_cloudflare_render_account_authoritative_data_remediation_prompt.md

중요 전제:
- Plan 단계는 뒤로 갈수록 최신 요구사항이 우선이다.
- Plan 32는 Plan 30/31의 실제 이행 결과를 교정하는 작업이며, Cloudflare Pages static export + Render API/PostgreSQL 구조를 기본으로 한다.
- 현재 Cloudflare 배포 오류는 `output: "export"` 정적 빌드와 OpenNext Worker 번들 방식이 혼용된 문제다. OpenNext/Workers와 Pages static 설정을 같은 배포에 혼용하지 마라.
- GitHub Pages의 `/workspace` basePath와 Cloudflare Pages 도메인 루트 basePath를 환경별로 안전하게 분리하라.
- 직원별 실계정, 로그인, 초대 수락, 권한 검증, 프로젝트/공정/승인 데이터의 API/PostgreSQL 권위 전환이 완료되기 전에는 운영 완료라고 쓰지 마라.
- Chrome에는 Cloudflare와 Render 계정이 로그인되어 있다. 승인된 dashboard phase에서만 사용하며, 비밀번호, API key, DATABASE_URL, cookie/session secret, invite token을 화면/로그/소스/리포트/Git에 노출하지 마라.
- 모든 Phase 시작 전에 사용자 승인을 요청하고, 완료 시 무결성 검토와 증빙 보고를 마친 뒤 다음 Phase 승인을 요청하라.
- 승인 없이 다음 Phase, 코드 수정, 데이터 변경, Cloudflare/Render dashboard 변경, DB migration, commit, push를 실행하지 마라.

먼저 [Plan 32 / Phase 499 시작 승인 요청]만 작성하라.
아직 Phase 499을 실행하지 마라.
```
