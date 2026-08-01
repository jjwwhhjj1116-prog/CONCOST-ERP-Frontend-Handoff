# WORKSPACE PLAN 30 - Integrity Recovery, Accounts, Persistent API/DB, Cloudflare + Render

Plan 30 follows Plans 1 through 29. Later Plans take precedence, but no later Plan removes the earlier rules for approval before official scheduling, rejection/resubmission history, permissions, audit logs, notifications, JSON integrity, KOR/VIET separation, Plan 27 data preservation, or Plan 28 Excel limits.

## Purpose

Plan 30 has two mandatory outcomes:

1. Correct the verified Plan 29 workflow and evidence defects before treating the current implementation as operationally ready.
2. Move the application from browser-local Zustand/localStorage state to per-employee accounts, a server API, and a persistent PostgreSQL database, deployed through Cloudflare Pages and Render.

The work must not be treated as a visual-only upgrade. Account lifecycle, API authorization, approval transactions, data migration, backups, staging, and production release controls are part of the required system.

## Non-Negotiable Rules

1. Each Phase begins only after the user explicitly approves that exact Phase.
2. At the end of every Phase, Antigravity performs self-review plus data, state-transition, permission, and security integrity checks. It reports evidence and asks approval for the next Phase.
3. No user approval means no next Phase, source edit, data edit/delete, localStorage reset, account creation/disablement, mail delivery, DB migration, Cloudflare/Render configuration, Git commit, push, or deployment.
4. A report, commit message, or code path alone is not implementation proof.
5. Use evidence grades:

```text
E0 unverified
E1 document/report only
E2 code/commit only
E3 static validation: lint/typecheck/build/API test
E4 real browser or HTTP behavior
E5 persistence after refresh/login restart/DB re-read/JSON round-trip/backup restore
```

`E1` or `E2` is never `PASS`; use `PARTIAL` or `VERIFY_REQUIRED`.

6. Do not invent API keys, credentials, domains, user emails, or cloud account settings. Actual secrets stay only in Cloudflare/Render secret settings, never in source, Git, JSON export, QA reports, or chat.
7. Do not implement public signup. Accounts are created only through a `SUPER_ADMIN` or `SYSTEM_ADMIN` invite workflow.
8. Frontend role checks and Zustand guards are secondary. Every API mutation must verify the authenticated account, role, department/project ownership, and current DB state on the server.
9. Preserve user-provided personnel, organization, role, JSON-imported, and local operating data until a named Phase has user approval to migrate it.

## Verified Defects To Recheck First

```text
P30-001 S1: approvalStore.updateApprovalStatus trusts reviewerId and lacks a server-ready authorization guard.
P30-002 S1: ProcessTemplateTab does not set ProcessSchedule.assigneeId, estimated time, or description. Approval only creates TaskWorkSegment when assigneeId exists.
P30-003 S1: Process template seed loads only in DEMO_SEED_DATA, not guaranteed in actual operation modes.
P30-004 S1: Roadmap_ESC contains GĐ 0~5 (six stages), while the current seed has four generic stages and does not demonstrate A/B/E mapping.
P30-005 S2: ProcessTemplateAssignment/ProcessSchedule lack managerId, rejectionReason, revisionNo, previous assignment, and history snapshot fields. Rejected items are reused as DRAFT instead of revisioned.
P30-006 S2: PROCESS_SCHEDULE_APPROVAL can omit managerId, so manager notifications can be lost.
P30-007 S1: JSON Import validates projects/tasks but not Process template/stage/task/assignment/schedule reference integrity.
P30-008 S1: PLAN29_FINAL_ASSURANCE_REPORT.md has stale claims, mixed push state, NUL bytes, and a staged binary change.
P30-009 S1: No repository evidence confirms the required Plan 29 Phase 371 user approval before source changes/commit/push.
P30-010 S3: There is no test script; lint leaves warnings. Build success is insufficient workflow proof.
```

## Target Architecture

```text
Browser
  -> Cloudflare Pages: static Next.js frontend, CDN, preview deployments
  -> Render Web Service: Node.js API, authentication, authorization, validation
  -> Render Postgres: sole operational source of truth

Optional, only after explicit approval:
  -> Cloudflare R2: private attachments and deliverables
     Render API verifies authorization and issues short-lived presigned URLs
```

### Data Ownership

```text
Render Postgres: production source of truth
Server API: all mutation authority and authorization
Zustand: UI state and API cache only
localStorage: temporary draft/backward-compatibility migration source only
JSON Handoff: versioned backup/manual migration, never account secrets
```

### Domain and Session Policy

Production must use a user-approved domain with same-site subdomains:

```text
app.<domain> -> Cloudflare Pages
api.<domain> -> Render API custom domain
```

Do not make `pages.dev` + `onrender.com` cross-site cookies the primary production configuration. Use `HttpOnly`, `Secure`, `SameSite=Lax` cookies by default; if cross-site is unavoidable, explicitly validate `SameSite=None`, credentialed CORS, and CSRF defense.

### Account Model

```text
PersonnelCard: employee/organization/schedule-display data
AccountUser: login email, passwordHash, active state, sessionVersion, personnelId unique FK
Session: hash only, expiry, revoke state, device metadata
InviteToken/PasswordResetToken: hash only, single use, expiry, revoke state
```

CEO/COO can have accounts and approval authority while remaining excluded from the default worker schedule rows unless they have qualifying schedules and an authorized view requests them.

### Required Server Mutation Sequence

```text
authenticate session
-> verify active account
-> verify role + department/project ownership
-> validate current state transition and request body schema
-> transaction: domain update + Notification + AuditLog
-> idempotency/concurrency check
-> response with server-authoritative state
```

Never trust request-body `reviewerId`, `managerId`, `pmId`, `assigneeId`, `role`, `official` flag, or approval status.

### Database Scope

```text
Organization, Department, PersonnelCard, AccountUser, RoleAssignment
Session, InviteToken, PasswordResetToken
Project, TaskCard, TaskWorkSegment, PersonalSchedule, SchedulePlan
ApprovalRequest, ApprovalRevision, ScheduleAssignment
ProcessTemplate, ProcessStage, ProcessTask, ProcessTemplateAssignment, ProcessSchedule
Notification, AuditLog, ImportRun, ImportIssue, ExportSnapshot
AttachmentMetadata only if R2 is approved
```

Use PostgreSQL foreign keys, check constraints, unique constraints, indexes, versioned migrations, transactions, and optimistic concurrency or idempotency for approval officialization.

### Cloudflare and Render Rules

```text
Cloudflare Pages:
- Git integration can deploy on every branch push.
- During Plan 30, connect only staging/preview first.
- Keep production main auto-deploy disabled until a dedicated user approval.
- Restrict the Cloudflare GitHub App to this repository only.

Render:
- API binds 0.0.0.0:$PORT.
- Use Render Postgres, not the ephemeral service filesystem, for operating data.
- Keep API and database in the same approved region/environment.
- Configure /healthz and DB-backed /readyz separately.
- DATABASE_URL, SESSION_SECRET, mail, R2, and monitoring credentials exist only as Render secrets.
```

## Account and Security Requirements

```text
- Invite-only initial account issuance by SUPER_ADMIN/SYSTEM_ADMIN
- Argon2id or another approved strong password hash; no plaintext password/token persistence
- Login rate limiting, generic failure messages, audit records, and session revocation
- Role/department/project authorization at API level
- Explicit CORS allowlist; no wildcard origin with credentials
- CSRF protection for cookie-authenticated mutations
- Request validation on every API route
- Rate limiting, request ID, health checks, structured error logging
- JSON exports exclude passwordHash, sessions, invite/reset tokens, provider keys, DB URLs, and all secrets
```

## Phase Completion Template

Every completion report must use this template:

```text
[Plan 30 / Phase N 완료 보고]

1. 목표와 실제 수행 범위
2. 사용자 승인 범위
3. 조사/수정한 파일, route, DB, Cloudflare, Render 대상
4. E0~E5 증거와 PASS/PARTIAL/FAIL/BLOCKED 판정
5. 데이터 무결성 검토
6. 권한/상태 전이/보안 검토
7. migration/rollback 영향
8. lint/typecheck/build/test/E2E 결과
9. 발견 이슈와 심각도
10. 변경 여부와 Git 상태
11. 다음 Phase 시작 승인 요청

Phase N+1을 진행해도 될까요?
```

## Phases

### A. Evidence Recovery and Design: No Code, Data, Account, or Cloud Changes

**Phase 391 - Baseline Freeze**

- Record local HEAD, origin/main, worktree, staged report state, current deployment references, and package scripts.
- No build, source, report, cloud, or data changes.

**Phase 392 - Plan 29 Evidence Compliance Gap**

- Compare Plan 29 required approvals and phase definitions against Git history and reports.
- Classify missing approval evidence, stale claims, NUL-byte corruption, and phase-number drift.

**Phase 393 - P30-001~010 Reproduction Matrix**

- Re-evaluate every listed defect with source, route, role, expected/actual behavior, severity, and evidence grade.

**Phase 394 - Data Ownership Inventory**

- Inventory every Zustand persist key, seed, JSON input/output, localStorage key, and user data source.
- Classify `DEMO`, `JSON_OPERATION`, `USER_LOCAL`, `IMPORT`, and `FUTURE_DB`; do not delete anything.

**Phase 395 - Account/Personnel/Role Policy**

- Define account candidate states: `READY`, `MISSING_EMAIL`, `INACTIVE`, `NEEDS_CONFIRMATION`.
- Define invite, activation, deactivation, resignation, reset, role-change, and CEO/COO rules.
- Do not create accounts or send mail.

**Phase 396 - Cloudflare + Render Topology and Domain Design**

- Inspect the current Next static-export/basePath behavior.
- Define staging/prod domains, Pages output requirements, API origin, cookie/CORS policy, Render region, service visibility, and branch strategy.

**Phase 397 - PostgreSQL Schema and Migration Design**

- Map current types to relational entities, keys, indexes, constraints, revision history, transactions, import runs, and rollback.

**Phase 398 - API/Auth/Authorization Contract**

- Define `/auth`, `/me`, personnel, project, task, schedule, approval, process-template, notification, audit, handoff, `/healthz`, and `/readyz` contracts.
- Define request schemas and server authorization rules.

**Phase 399 - Security, Secrets, Backup, and Observability Design**

- Create a secret-name/location matrix, CORS/CSRF/rate-limit policy, backup/restore frequency, error logging, and mail/R2/monitoring decision list.

**Phase 400 - Test, Acceptance, and Rollback Runbook Design**

- Define account, role bypass, workflow, process-template, JSON, backup/restore, CORS/session, staging, and production smoke scenarios.

**Phase 401 - User Approval for Plan 30 Implementation**

Required report:

```text
[Plan 30 / Phase 401 승인 요청]
1. P30-001~010 final findings
2. Approved fix scope and excluded scope
3. Account/API/DB architecture decision
4. Cloudflare/Render staging and production actions requiring user ownership
5. Mail/R2/monitoring USER_DECISION_REQUIRED items
6. Migration and rollback risks
7. Phase 402 begins source changes only after approval
```

### B. Local Workflow Repairs: Only After Phase 401 Approval

**Phase 402 - Plan 29 Report and Repository Hygiene Repair**

- Repair the final report as UTF-8 only; remove mixed/NUL content.
- State actual SHA, real build/test result, actual deployment state, and unexecuted phases without changing history.
- Remove Office lock/temp artifacts only if explicitly approved.

**Phase 403 - Process Revision Data Model**

- Add `managerId`, `rejectionReason`, `reviewedBy`, `reviewedAt`, `revisionNo`, `previousAssignmentId`, `parentAssignmentId`, `approvalRequestId`, and revision snapshot/history as required.
- Supply a backward-compatible persisted-state/old-JSON migration.

**Phase 404 - Process Store Guard and State Transition Repair**

- Guard apply, edit, draft, submit, reject, resubmit, and officialization operations.
- Prevent duplicate approvals and unauthorized store actions; record notification/audit events.

**Phase 405 - Exact Roadmap_ESC A/B/E Seed Repair**

- Build the six stages GĐ 0 to GĐ 5 and corresponding tasks from actual Roadmap_ESC A/B/E data.
- Do not import C/D, F~J, or K+ bars; E is reference only, not automatic employee assignment.
- Seed must be idempotent, available by documented operating mode, and never automatically applied to a card.

**Phase 406 - PM Process Planner UI**

- Add worker search/selection, active/department/leave/Off/load/conflict signals, start/end dates, estimated hours, description, draft save, and validation.
- Keep the card-based process-stage UI; do not replace the main work list with an Excel grid.

**Phase 407 - Manager Approval, Rejection, Resubmission, Officialization**

- Link manager notification, mandatory rejection reason, new revision/request, compare view, transaction/idempotency, ProcessSchedule officialization, TaskWorkSegment, worker schedule, Notification, and AuditLog.
- Draft/pending/rejected schedules remain outside official worker schedules.

**Phase 408 - JSON Handoff Process Validation**

- Validate all process/approval/revision references and official schedule consistency.
- Implement dry-run failure without mutation; export no account/session/provider secrets.

**Phase 409 - Local E2E and Plan 29 Evidence Rebaseline**

- Re-run the rejected/revised process flow, permissions, official scheduling, and JSON round-trip.
- Rebuild the evidence report from actual results only.

### C. Server and Database: New Phase Approval Required After Phase 409

**Phase 410 - Backend Workspace Decision and Approval**

- Decide the minimal folder/package boundary, Node API runtime, one ORM/migration tool, and one schema-validation approach without rewriting the frontend.

**Phase 411 - API Skeleton and Health Endpoints**

- Implement structured config, request IDs, global error handling, `/healthz`, and `/readyz`.

**Phase 412 - Database Schema and Versioned Migrations**

- Implement the approved PostgreSQL schema, constraints, migration checks, and local disposable DB validation.

**Phase 413 - Authentication, Session, Invite, and Reset**

- Implement secure password hash, secure session, token hashes, expiry, revoke, rate limit, and audit events.

**Phase 414 - Server Permission and Ownership Guards**

- Enforce worker/PM/manager/admin permissions server-side for all mutations and state transitions.

**Phase 415 - Project, Task, Schedule, and Approval API**

- Move Plan 1/25/26 workflow into transactions with official-schedule rules.

**Phase 416 - Process Template API**

- Move Plan 28 template, planner, revision, approval, and officialization behavior server-side.

**Phase 417 - Notification/Audit Outbox**

- Ensure mutation, Notification, and AuditLog are written consistently without duplicated side effects.

**Phase 418 - Versioned Handoff/Migration API**

- Implement export, import dry-run, issue report, explicit apply, and ImportRun/AuditLog.

**Phase 419 - Frontend API Client and Data Ownership Switch**

- Use API data as the source of truth; retain Zustand only for UI/cache with explicit local/API feature mode and safe error behavior.

**Phase 420 - Account Administration UI**

- Add invite, status, role, reset request, and session-revoke controls to personnel management without exposing plaintext credentials.

### D. Staging Cloud Setup: Separate Approval Before Each Cloud Action

**Phase 421 - Cloudflare Pages Staging Configuration Approval**

- Present Pages Git scope, staging branch, preview settings, build/output directory, and environment key names. Production auto-deploy stays off.

**Phase 422 - Render Staging API/Postgres Configuration Approval**

- Present service type, region, branch, build/start, health check, environment group, secret key names, and DB plan. Do not expose values.

**Phase 423 - Create Render Staging API/Postgres**

- Create approved resources only; verify `0.0.0.0:$PORT`, health/readiness, same-region connectivity, and absence of secrets in Git.

**Phase 424 - Create Cloudflare Pages Staging**

- Connect staging/preview only; verify static build, `NEXT_PUBLIC_API_BASE_URL`, route refresh, CORS, cookies, and no production API/DB crossover.

**Phase 425 - Staging Data Migration Dry-run**

- Validate source JSON/local backup, duplicate/orphan/PII risks, counts, and rollback snapshot without writing staging or production data.

**Phase 426 - Approved Staging Data Import**

- Import only approved data; record ImportRun, counts, constraints, audit, and rollback point.

**Phase 427 - Staging Account Test Set**

- Use approved test personnel only to validate invite/login/logout/deactivate/role/session revoke. Do not issue real employee accounts.

**Phase 428 - Staging Core E2E**

- Validate external intake, internal work, worker recommendation, rejection/resubmission, process template approval, official schedules, KOR/VIET, JSON, and audit/notification.

**Phase 429 - Staging Security and Resilience**

- Validate role bypass, invalid payload, CORS, CSRF, rate limiting, secret scan, backup/restore, migration rollback, and deploy persistence.

**Phase 430 - Optional R2 Approval**

- Decide whether attachments require Cloudflare R2. Define private bucket, server-only credentials, signed GET/PUT URLs, object metadata, size/type/path scope, CORS, and retention.

**Phase 431 - Optional R2 Implementation**

- Execute only if Phase 430 is explicitly approved.

### E. Production: Requires Explicit Production Approval

**Phase 432 - Production Readiness Approval**

- Require staging E2E, security, backup/restore, migration dry-run, secret scan, domain/session/CORS, auto-deploy, and account-mail policy evidence.

**Phase 433 - Production Cloudflare/Render Configuration**

- Configure only approved production Pages/API/Postgres/domain/secrets/health settings. No data or employee accounts yet.

**Phase 434 - Production Backup and Migration Dry-run**

- Back up, dry-run, count, validate references, and show skipped/duplicate/orphan records.

**Phase 435 - Production Data Migration Approval**

- Ask approval with exact source version, counts, exclusions, rollback snapshot, and expected downtime/compatibility impact.

**Phase 436 - Approved Production Data Migration**

- Run only the approved import; verify counts, FKs, audit records, and rollback readiness.

**Phase 437 - Approved Real Employee Account Issuance**

- Issue invites only for the user-approved personnel/email/role/department list. Never record token or password plaintext.

**Phase 438 - Production Smoke and Evidence**

- Verify domains, login, core workflow, server permission, schedule visibility, JSON export, logs, health, and DB persistence.

**Phase 439 - Operations Runbooks**

- Create account administration, Cloudflare/Render deployment, database backup/restore, security incident, and release rollback documentation.

**Phase 440 - Final Assurance Report**

- Create `qa/plan30/reports/PLAN30_FINAL_ACCOUNT_SERVER_DB_ASSURANCE.md` with actual evidence, actual SHA, test results, deployment state, remaining risks, and no unsupported PASS claims.

**Phase 441 - Commit Approval Request**

- Present changed/excluded files, secret scan, `git diff --check`, lint/typecheck/build/test/E2E results, and proposed commit message. Do not commit.

**Phase 442 - Approved Commit**

- Stage only approved files; record SHA and worktree. Do not push/deploy.

**Phase 443 - Push/Deploy/Migration Approval Request**

- Present exact branch, Cloudflare/Render impact, DB migration decision, rollback point, and production effect. Do not push/deploy.

**Phase 444 - Approved Push/Deploy Verification**

- Push/deploy only after approval. Verify actual deployed SHA, health, target-domain smoke tests, DB migration result, and report evidence.

## Completion Criteria

Plan 30 is complete only when all approved scope meets these conditions:

```text
- Plan 29 evidence is accurate, UTF-8 clean, and does not claim unexecuted work.
- Roadmap_ESC A/B/E produces the user-selectable six-stage template; excluded columns never become automatic schedules.
- PM can select workers and write process schedules; manager approval alone officializes them.
- Rejection reason and immutable revision history survive resubmission and JSON round-trip.
- Store/API permission bypass is blocked at the server.
- AccountUser lifecycle is safely linked to PersonnelCard without public signup or plaintext secrets.
- Render Postgres is the operational source of truth and survives deploy/restore testing.
- Cloudflare Pages and Render API use approved domain, session, CORS, CSRF, and deployment controls.
- Staging E2E and security checks pass before production changes.
- Production data/account changes occur only through explicitly approved, reversible phases.
- Commit/push/deploy/migration evidence reflects actual SHA and test results.
```

## Google Antigravity Start Prompt

```text
현재 F:\workspace 프로젝트의 Plan 30 작업을 시작한다.

정본 문서:
F:\workspace\docs\workspace_plan30_account_server_db_cloudflare_render_prompt.md

중요 전제:
- Plan 번호가 클수록 최신 요구사항이 우선이다. 승인 전 공식 일정 미반영, 반려/재상신 이력, server 권한 검증, Notification, AuditLog, JSON, KOR/VIET, Plan 27 데이터 보존, Plan 28 Excel A/B/E 제한은 유지한다.
- Plan 30은 Plan 29의 증빙/공정 일정/권한/JSON 결함을 복구하고, 직원 계정 + server API + Render Postgres + Cloudflare Pages 구조로 단계적 전환하는 Plan이다.
- E0~E5 증거 등급을 사용하고 E1/E2만 있으면 PASS로 쓰지 마라.
- 각 Phase 시작 전에 반드시 사용자 승인을 요청하고, 완료 후 무결성 검토와 증거 보고를 작성한 뒤 다음 Phase 승인을 요청하라.
- 사용자 승인 없이 다음 Phase, 코드 수정, 데이터 변경/삭제, localStorage 초기화, DB migration, 계정 생성/비활성화, mail 발송, Cloudflare 설정, Render 설정, Git commit, GitHub push, deploy를 실행하지 마라.
- 실제 비밀번호, DB URL, session secret, API key, Cloudflare/Render/R2 token, SMTP key를 source/Git/JSON/report/chat에 기록하지 마라.
- Cloudflare Pages와 Render Git auto-deploy는 staging/preview만 먼저 사용하고 main production auto-deploy는 사용자 최종 승인 전 활성화하지 마라.
- public signup은 구현하지 마라. 계정은 SUPER_ADMIN/SYSTEM_ADMIN invite-only 방식으로만 발급한다.
- API는 reviewerId, managerId, pmId, assigneeId, role을 request body에서 신뢰하지 말고 인증 session과 DB 관계로 검증하라.
- Plan 28 공정 템플릿은 Roadmap_ESC A/B/E만 참조하고 C/D, F~J, K 이후 날짜 Bar를 자동 공식 일정으로 반영하지 마라.

먼저 Phase 391의 시작 승인 요청만 작성하라.
아직 Phase 391을 실행하지 마라.
```
