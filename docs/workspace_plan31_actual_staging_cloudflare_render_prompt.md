# WORKSPACE PLAN 31 - Plan 30 재정렬, 실제 계정/API/DB 구현, Chrome 연결 Cloudflare + Render Staging 전환

Plan 31은 Plan 1~30 이후의 최신 지시사항이다. Plan 30 완료 보고가 주장한 범위와 실제 `71faf92` 커밋 범위가 일치하지 않았으므로, Plan 31은 이전 완료 표현을 전제로 하지 않는다. 증거가 있는 기능만 재사용하고, 없는 기능은 설계 또는 미구현으로 분류한 뒤 작은 승인 Phase로 구현한다.

## 0. Chrome 연결 및 외부 계정 사용 원칙

사용자는 현재 Chrome에서 아래 계정에 로그인되어 있다.

```text
Cloudflare: https://dash.cloudflare.com/d2ba2a0f46ac7b4fd11feda26ca45562/home
Render: https://dashboard.render.com/
```

따라서 Antigravity는 사용자에게 비밀번호나 로그인 정보를 요청하지 않고, Phase별 사용자 승인을 받은 뒤 현재 Chrome 세션을 사용해 Cloudflare/Render Dashboard를 열 수 있다.

절대 규칙:

```text
1. 승인 전 Dashboard 열람 외의 Create/Save/Apply/Deploy/Delete/Rotate/Import 동작 금지.
2. Cloudflare API token, Render API key, DB URL, password, session secret, SMTP/R2 credential을 읽어 채팅/코드/Git/JSON/리포트에 복사하지 말 것.
3. Secret 입력은 Dashboard의 secret field에서만 수행하고, 문서에는 key 이름과 설정 여부만 기록할 것.
4. Cloudflare/Render에서 보이는 기존 resource는 소유자, 이름, region, branch, status만 기록한다. 민감 값/connection string은 기록하지 않는다.
5. production resource 생성, domain 변경, Pages main auto-deploy 활성화, Render production deploy, DB migration, 실제 직원 invite 발송은 별도 명시 승인 Phase에서만 수행한다.
6. staging/preview와 production resource, domain, DATABASE_URL, API origin을 혼용하지 않는다.
```

## 1. Plan 31의 핵심 목표

1. Plan 30 재검수에서 확인된 공정 템플릿/승인/권한/JSON/증빙 결함을 실제 UI와 Store에서 완결한다.
2. 현재 Next/Zustand/localStorage 앱에 영구 서버 API와 PostgreSQL source of truth를 추가한다.
3. 직원별 invite-only 계정, session, 서버 권한 검증을 구현한다.
4. Cloudflare Pages + Render Web Service + Render Postgres의 staging 환경을 먼저 구축하고 실제 E2E/backup/restore를 증명한다.
5. production 전환과 실제 직원 계정 발급은 staging 검증 후 별도 승인으로만 진행한다.

## 2. 재확인할 결함과 완료 기준

```text
P31-001: Plan 30 문서가 untracked이며 71faf92에 포함되지 않음.
P31-002: Account/API/Postgres/Cloudflare/Render 구현 파일 및 설정이 없음.
P31-003: ProcessTemplateTab은 새 submit/reject/approve/resubmit Store action을 호출하지 않음.
P31-004: ProcessTemplateTab에 단계별 assignee, estimatedHours, description UI가 없음.
P31-005: processTemplateStore의 reviewerId/currentUserId 인자는 인증/role/ownership 검증이 아닌 caller-provided 값임.
P31-006: 새 GĐ 0~5 seed가 실제 Roadmap_ESC A/B/E의 단계/세부 업무/담당자 참고값과 일치하는지 증거 없음.
P31-007: JSON validation이 process template/stage/task/assignment/schedule 관계와 official TaskWorkSegment 관계를 검증하지 않음.
P31-008: Plan 29 final report는 현재 SHA/test/deployment state를 반영하지 않음.
P31-009: origin/main에는 71faf92가 아직 없음. push/deploy 전에 검증이 필요함.
P31-010: 자동 test script가 없고, build/typecheck만으로 E2E/security 완료를 주장할 수 없음.
```

Plan 31은 아래 기준이 충족되기 전 `완료`라고 쓰지 않는다.

```text
- PM이 공정 업무별 실제 작업자, 시작일, 종료일, 예상시간, 설명을 작성한다.
- managerId가 프로젝트/조직 관계로 서버 또는 검증된 Store에서 결정된다.
- manager 승인 전에는 ProcessSchedule, TaskWorkSegment, 직원 일정표에 공식 업무가 없다.
- 반려에는 사유/검토자/검토시각/revision/이전안 snapshot이 남고 PM은 새 revision으로 재요청한다.
- 승인은 중복 실행되지 않고, 승인 후에만 worker official schedule/TaskWorkSegment/notification/audit이 함께 생성된다.
- Roadmap_ESC A/B/E의 GĐ 0~5가 seed에 근거와 함께 반영되며 C/D/F~J/K+는 자동 일정으로 반영되지 않는다.
- browser guard뿐 아니라 API-level authorization이 WORKER/PM/manager/SUPER_ADMIN에 적용된다.
- account/session/password/token/DB/API secret은 source/Git/JSON/report에 없다.
- staging DB에서 migration/import/backup/restore/E2E가 확인된다.
```

## 3. 공통 운영 규칙

1. Plan 번호가 클수록 최신 요구사항이 우선한다. 단, 승인 전 공식 일정 미반영, 반려/재상신, Notification, AuditLog, Plan 27 데이터 보존, Plan 28 Excel A/B/E 제한은 유지한다.
2. 각 Phase 시작 전 사용자 승인 필수. 승인 전에는 해당 Phase의 조사, 테스트, 코드 변경, cloud 변경도 시작하지 않는다.
3. Phase 완료 시 자체검수, 데이터/상태/권한/보안 무결성 검토, 실제 증거를 보고하고 다음 Phase 승인만 요청한다.
4. 코드/commit/report만으로 PASS라고 쓰지 않는다. 증거 등급을 사용한다.

```text
E0 미확인
E1 문서/리포트만
E2 코드/commit만
E3 lint/typecheck/build/API test
E4 실제 UI/HTTP behavior
E5 refresh/login restart/DB reread/JSON round-trip/backup restore
```

5. E1/E2는 PASS가 아니다.
6. 사용자 승인 없이 다음 Phase, data delete, localStorage reset, DB migration, 계정 발급/비활성화, email 발송, Cloudflare/Render mutation, commit/push/deploy 금지.
7. user-provided personnel, organization, role, localStorage, JSON import 데이터는 승인 없이 삭제/overwrite/merge 금지.
8. public signup 금지. `SUPER_ADMIN`/`SYSTEM_ADMIN` invite-only 계정만 허용.
9. 실제 API는 body의 `reviewerId`, `managerId`, `pmId`, `assigneeId`, `role`, `official` 값을 신뢰하지 않고 session + DB relationship으로 확정한다.
10. 실제 secret은 Cloudflare/Render Dashboard에만 입력한다. `.env.example`에는 key 이름만 둔다.

## 4. Target Architecture

```text
Browser
  -> Cloudflare Pages (static Next.js frontend, preview/staging)
  -> Render Web Service (Node API, auth, validation, server permissions)
  -> Render Postgres (operational source of truth)

Optional after separate approval:
  -> Cloudflare R2 (private attachment/deliverable storage)
     Render API validates access, then returns short-lived signed URL
```

### Data authority

```text
Render Postgres: production/staging business data authority
Node API: all mutations, authorization, audit/notification transaction authority
Zustand: client cache/UI state only
localStorage: migration source/offline draft only, not final authority
JSON: versioned backup and explicit dry-run import only
```

### Domain/session policy

```text
app.<approved-domain> -> Cloudflare Pages
api.<approved-domain> -> Render API custom domain
```

Use same-site subdomains for production. Cookie defaults: HttpOnly, Secure, SameSite=Lax. Credentialed CORS must use exact allowlisted origins, never wildcard. Cross-site mode, if unavoidable, requires explicit `SameSite=None`, `Secure`, CORS, and CSRF E2E verification.

### Account model

```text
PersonnelCard: employee/organization/business identity
AccountUser: unique personnelId, unique login email, passwordHash, status, sessionVersion
Session: hash, expiry, revokedAt, device metadata
InviteToken/PasswordResetToken: hash, single use, expiry, revoked/used status
```

CEO/COO can authenticate and approve, but default practical schedule rows keep Plan 27 filtering policy.

### Mandatory API mutation sequence

```text
authenticate session
-> active account check
-> role + department/project ownership check
-> server state-transition validation
-> DB transaction: domain change + Notification + AuditLog
-> idempotency/concurrency check
-> server-authoritative response
```

## 5. Phase Completion Report Format

```text
[Plan 31 / Phase N 완료 보고]

1. 목표와 실제 수행 범위
2. 사용자 승인 범위
3. 확인/수정한 source, route, data, Cloudflare, Render 대상
4. E0~E5 증거와 PASS/PARTIAL/FAIL/BLOCKED 판정
5. 데이터 무결성 검토
6. 상태 전이/권한/보안 검토
7. migration/rollback 영향
8. lint/typecheck/build/test/E2E 결과
9. 발견 이슈와 severity
10. 변경 여부와 Git 상태
11. 다음 Phase 승인 요청

Phase N+1을 진행해도 될까요?
```

## 6. Phases

### A. Rebaseline and Design: No Source/Data/Cloud Mutation

### Phase 445 - Plan 31 Baseline

- Record local HEAD, origin/main, staged/untracked files, Plan 30 docs status, deployed SHA, branch protection, and current package scripts.
- Confirm that 71faf92 is local-only and no cloud change is made.

### Phase 446 - Plan 30 Completion Claim Audit

- Compare the Plan 30 prompt, 71faf92 stat, Plan 29 report, and actual server/cloud artifacts.
- Produce a `NOT_IMPLEMENTED / PARTIAL / VERIFIED` matrix for accounts, API, DB, Cloudflare, Render, process UI, approval, JSON, and report hygiene.

### Phase 447 - P31-001~010 Reproduction and Root Cause Matrix

- Reproduce each issue in code and, where safe, browser.
- Record expected/actual/role/route/source/evidence/severity/root cause/fix candidate.

### Phase 448 - Roadmap_ESC A/B/E Mapping Specification

- Read `Roadmap_ESC` directly and list exact GĐ 0~5 stage names, B column tasks, E column reference assignees.
- Mark C/D/F~J/K+ explicitly excluded.
- Do not write seed code or import data.

### Phase 449 - Local Process Workflow Design Freeze

- Design exact ProcessTemplateAssignment revision entity, ProcessSchedule fields, manager selection, worker selector, status transition, duplicate guard, officialization, audit, and notification behavior.

### Phase 450 - Backend/Database/Account Design Freeze

- Decide the minimum Node API runtime, one ORM/migration tool, one schema validator, database schema, AccountUser lifecycle, session model, API contract, CORS/CSRF/rate limit, backup/restore strategy.
- No backend source creation yet.

### Phase 451 - Chrome Dashboard Read-only Inventory

- With user approval, open the connected Cloudflare and Render dashboard sessions in Chrome.
- Record existing relevant resource names, region, branch, status, Pages project, domains, and database/service existence without exposing secret values.
- Do not click Create, Save, Apply, Deploy, Delete, Rotate, or Import.

### Phase 452 - Staging Deployment and Domain Design

- Define staging branch, Pages preview behavior, Render staging API/Postgres, API origin, cookie domain, CORS allowlist, health endpoints, build/output path, and production auto-deploy hold.

### Phase 453 - Implementation Scope Approval Request

Required report:

```text
[Plan 31 / Phase 453 승인 요청]
1. P31 issue matrix final status
2. Local workflow repair scope
3. Backend/account/DB implementation decision
4. Cloudflare/Render staging plan
5. USER_DECISION_REQUIRED: mail provider, R2, error tracking, production domain
6. data migration and rollback risks
7. Phase 454 onward will modify source only after approval
```

### B. Local Workflow Repair: Requires Phase 453 Approval

### Phase 454 - Plan 29/30 Report and Document Integrity Repair

- Repair only approved reports as UTF-8, real SHA, real test/deployment state, and accurate evidence.
- Add Plan 30/31 docs to the intended commit scope only after user commit approval.
- Do not rewrite history or conceal missing approval evidence.

### Phase 455 - Process Revision Model and Store Guard Repair

- Implement manager/reviewer/rejection/revision/previous assignment/snapshot fields and backward-compatible migration.
- Guard every Store mutation with current authenticated local user/role/project relationship until API becomes authoritative.

### Phase 456 - Exact Roadmap_ESC Seed Repair

- Generate six stages and tasks only from the Phase 448 approved mapping.
- Preserve original language/reference metadata when needed.
- Do not auto-apply templates or create official schedules.

### Phase 457 - PM Process Planner UI Repair

- Connect UI to approved Store actions.
- Add worker selection, recommended/blocked/warning reasons, start/end, estimated hours, description, draft validation, KOR/VIET readability, and no-overlap UI.

### Phase 458 - Manager Approval/Rejection/Officialization Repair

- Resolve manager from authorized project relation.
- Create manager notification, mandatory rejection reason, new revision request, historical comparison, official schedule transaction behavior, worker notification, and audit trail.

### Phase 459 - Process JSON Integrity Repair

- Validate template-stage-task-assignment-schedule-taskWorkSegment references, official status, manager/PM/worker relationships, revision history, and schema migrations.
- Support dry-run failure with zero mutation.

### Phase 460 - Local Automated Tests

- Add a minimum test runner and focused tests for state transitions, authorization guards, Excel mapping, JSON reference validation, officialization idempotency, and resubmission history.

### Phase 461 - Local E2E and Evidence Rebaseline

- Test PM worker selection -> draft -> request -> reject -> new revision -> approve -> official schedule/worker task/audit/notification -> JSON round-trip.
- Test worker/PM/manager bypass attempts and Plan 27 schedule filters.

### Phase 462 - Local Repair Commit Approval Request

- Present exact changed files, excluded user changes, tests, `git diff --check`, secret scan, and commit message. Do not commit.

### Phase 463 - Approved Local Repair Commit

- Commit only approved files. Record SHA and clean/remaining worktree. Do not push or deploy.

### C. API, Account, and Database: Separate Approval After Local E2E

### Phase 464 - Backend Implementation Approval Request

- Present source layout, chosen runtime/ORM/schema validator, dependencies, database migration sequence, and API increment strategy.

### Phase 465 - API Skeleton and Operational Endpoints

- Create backend package, configuration validation, request IDs, structured errors, `/healthz`, and DB-aware `/readyz`.

### Phase 466 - PostgreSQL Schema and Versioned Migration

- Implement AccountUser/session/token/personnel/project/task/schedule/approval/process/audit/notification/import schema with FK/index/check constraints.

### Phase 467 - Authentication and Invite-only Account Lifecycle

- Implement password hashing, session cookie, hashed invite/reset tokens, expiry, revoke, login rate limit, audit, activation/deactivation, and no public signup.

### Phase 468 - Server Authorization and Ownership Guards

- Enforce roles/department/project state transitions server-side. Do not trust client IDs or role values.

### Phase 469 - Project/Task/Schedule/Approval API

- Move core Plan 1/25/26 workflow into DB transactions, including official schedule restrictions.

### Phase 470 - Process Template API

- Move Plan 28 process planner/revision/approval/officialization logic server-side with concurrency/idempotency controls.

### Phase 471 - Notification/Audit Outbox API

- Write domain mutation, notification, audit, and delivery retry intent consistently in one transaction boundary.

### Phase 472 - JSON Export/Import/Migration API

- Implement versioned export and `dry-run -> issue report -> explicit apply -> ImportRun/AuditLog` import.

### Phase 473 - Frontend API Data Ownership Switch

- Make API data authoritative; retain Zustand for cache/UI only. Add safe local/API feature mode and non-destructive error behavior.

### Phase 474 - Account Administration UI

- Add invite/status/role/reset/session-revoke controls to personnel management. No plaintext password/token display or download.

### Phase 475 - API/DB Security and Integration Tests

- Test auth, sessions, role bypass, ownership, CORS/CSRF, invalid input, JSON migration, approval transaction, and audit/notification behavior.

### D. Cloudflare + Render Staging: Chrome Write Actions Require Phase Approval

### Phase 476 - Cloudflare Pages Staging Mutation Approval

- Present exact Pages project name, Git repository scope, staging branch, preview setting, build command, output directory, public API origin key, and production auto-deploy disabled state.

### Phase 477 - Render Staging Mutation Approval

- Present exact API service name/type, region, branch, build/start commands, health check, Postgres service name/region, environment key names, and secret ownership. No values in report.

### Phase 478 - Create Render Staging Postgres and API

- Use connected Chrome Dashboard only after approval.
- Create staging resources, configure non-secret values, store secrets in Dashboard only, and verify API `0.0.0.0:$PORT`, health, readiness, DB connectivity.

### Phase 479 - Create Cloudflare Pages Staging

- Connect staging/preview only; verify static build/output, preview URL, API origin, route refresh, CORS, cookie behavior, and production isolation.

### Phase 480 - Staging Data Migration Dry-run

- Validate JSON/local backup source, counts, duplicates, orphan links, PII risks, and rollback snapshot with no staging or production writes.

### Phase 481 - Approved Staging Data Import

- Apply approved data only, record ImportRun/audit/counts/constraints/rollback point.

### Phase 482 - Staging Test Account Lifecycle

- Use approved test personnel only for invite/login/logout/deactivate/role change/session revoke. No actual employee invite.

### Phase 483 - Staging E2E and Security Verification

- Verify external intake, internal work, process template flow, rejection/resubmission, official schedule, KOR/VIET, JSON, browser/API permission bypass, CORS/CSRF/rate limit, backup/restore, and deploy persistence.

### Phase 484 - Optional R2 Decision Approval

- Decide whether attachments need private Cloudflare R2. If approved, define server-only credentials, signed URL limits, metadata, CORS, retention, and deletion authority.

### Phase 485 - Optional R2 Staging Implementation

- Execute only after Phase 484 approval.

### E. Production: Explicit Production Approval Only

### Phase 486 - Production Readiness Approval

- Require passing staging evidence, backup/restore, data dry-run, secret scan, production domain/session/CORS, email policy, and auto-deploy decision.

### Phase 487 - Production Cloudflare/Render Setup

- Create only approved production Pages/API/Postgres/domain/secret/health settings. No data/account migration yet.

### Phase 488 - Production Backup and Migration Dry-run

- Back up source data, dry-run, validate counts/references, and report exclusions/duplicates/orphans.

### Phase 489 - Production Data Migration Approval

- Present exact data source version, row counts, rollback snapshot, and expected impact. Do not write until approved.

### Phase 490 - Approved Production Data Migration

- Run only approved migration; verify FK/count/audit/rollback state.

### Phase 491 - Actual Employee Account Issuance Approval

- Present the personnel/email/role/department invite list. Do not issue any invitation until approved.

### Phase 492 - Approved Employee Account Invitations

- Issue only approved invite records; never expose plaintext tokens/passwords.

### Phase 493 - Production Smoke/E2E Evidence

- Verify app/API domain, login, roles, core workflow, official schedules, audit, JSON export, health, DB persistence, and error behavior.

### Phase 494 - Operations Runbook and Final Assurance

- Create account admin, Cloudflare/Render deployment, backup/restore, incident, release rollback docs and `qa/plan31/reports/PLAN31_FINAL_ASSURANCE.md` with actual evidence only.

### Phase 495 - Commit Approval Request

- Present exact file scope, secret scan, diff check, tests, E2E, deployment state, and proposed commit. No commit.

### Phase 496 - Approved Commit

- Commit only approved files. Record SHA and worktree. No push/deploy.

### Phase 497 - Push/Deploy/Migration Approval Request

- Present exact target branch, Cloudflare/Render impact, DB migration action, rollback point, and production effect. No push/deploy.

### Phase 498 - Approved Push/Deploy Verification

- Push/deploy only after approval. Verify actual deployed SHA, health, target domain, DB migration, and production smoke evidence.

## 7. Google Antigravity Start Prompt

```text
현재 F:\workspace 프로젝트의 Plan 31 작업을 시작한다.

정본 문서:
<USER_HOME>\Documents\Codex\referenced-output\workspace_plan31_actual_staging_cloudflare_render_prompt.md

Chrome에는 아래 Cloudflare/Render 계정이 이미 로그인되어 있다.
- https://dash.cloudflare.com/d2ba2a0f46ac7b4fd11feda26ca45562/home
- https://dashboard.render.com/

중요 전제:
- Plan 30 완료 보고를 그대로 신뢰하지 말고, 71faf92와 현재 local/origin/docs/code/report 상태를 증거로 재검증한다.
- Chrome 로그인 세션으로 Cloudflare/Render Dashboard를 사용할 수 있지만, 승인 전에는 read-only 조사만 가능하다. Create/Save/Apply/Deploy/Delete/Rotate/Import는 해당 Cloud Phase의 사용자 승인 후에만 실행한다.
- 비밀번호, API key, DB URL, session secret, Cloudflare/Render/R2/SMTP token을 채팅/source/Git/JSON/report에 기록하지 마라. 실제 값은 Dashboard secret field에만 입력한다.
- 각 Phase 시작 전 반드시 사용자 승인을 요청하고, 완료 후 자체검수/무결성 검토/증거 보고를 작성하고 다음 Phase 승인을 요청하라.
- 승인 없이 source/data/localStorage/DB/account/cloud/Git/push/deploy를 변경하지 마라.
- public signup을 만들지 말고 SUPER_ADMIN/SYSTEM_ADMIN invite-only 계정 정책을 유지하라.
- API는 reviewerId, managerId, pmId, assigneeId, role 같은 client body 값을 신뢰하지 말고 session과 DB relationship으로 검증하라.
- Plan 28 Excel은 Roadmap_ESC A/B/E만 참조하고 C/D, F~J, K 이후 날짜 Bar를 자동 공식 일정으로 반영하지 마라.

먼저 Phase 445 시작 승인 요청만 작성하라.
아직 Phase 445를 실행하지 마라.
```
