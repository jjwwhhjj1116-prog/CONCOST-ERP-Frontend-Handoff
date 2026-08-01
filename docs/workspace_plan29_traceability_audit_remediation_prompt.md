# WORKSPACE PLAN 29 - Plan 1~28 요구사항 추적, GitHub 반영 검증, 증빙 기반 개선 통제 프롬프트

이 문서는 `workspace plan1`부터 `workspace plan28` 및 같은 번호의 Markdown Plan 문서 이후에 추가되는 스물아홉 번째 지시사항이다.

Plan 29의 목적은 새 기능을 즉시 늘리는 것이 아니다. 먼저 Plan 1~28의 최신 요구사항이 실제 GitHub `eumditravel-oss/workspace`의 `main`, 로컬 `F:\workspace`, GitHub Pages 배포 화면, 상태 저장소, JSON Handoff, 검증 결과에 일치하는지 증거로 판정한다. 그 뒤에만 확인된 결함과 운영상 필요한 개선을 작은 Patch Phase로 나누어 수정한다.

이 Plan의 최우선 목표는 Antigravity가 보고서나 커밋 메시지를 구현 증거로 오인하지 않도록 막는 것이다.

---

## 0. 절대 원칙

1. Plan 번호가 큰 문서의 요구사항이 작은 번호의 Plan보다 우선한다.
2. 동일 Plan 번호에 `.md`와 `.txt`가 모두 있으면 둘을 비교한다. 의미가 다르면 임의 선택하지 말고 `DOCUMENT_CONFLICT`로 기록하고 사용자에게 판단을 요청한다.
3. 최신 Plan의 요구사항도 이전 Plan의 보안, 권한, 승인 전 공식 일정 미반영, AuditLog, Notification, JSON 무결성 원칙을 명시적으로 폐기하지 않는 한 유지한다.
4. 문서, 리포트, 커밋 메시지, 코드 존재만으로 완료라고 판단하지 않는다.
5. 기능은 아래 증거 등급을 모두 충족할 때만 `PASS`로 판정한다.

```text
E0: 미확인
E1: 문서 또는 리포트에만 존재
E2: 코드 또는 Git 커밋에서 확인
E3: lint/typecheck/build 또는 정적 검증 통과
E4: 실제 브라우저 화면에서 사용자 행동으로 확인
E5: 새로고침/localStorage/JSON Export-Import 후에도 상태와 이력이 보존됨
```

6. E1 또는 E2만 있는 항목은 `PARTIAL` 또는 `VERIFY_REQUIRED`이며 완료라고 쓰지 않는다.
7. 각 Phase를 시작하기 전에 반드시 사용자에게 시작 승인을 요청한다. 승인 전에는 해당 Phase의 조사, 코드 수정, 데이터 변경, 테스트 실행을 시작하지 않는다.
8. 각 Phase가 끝나면 자체검수, 데이터/상태/권한 무결성 검토, 해당 Phase에서 가능한 검증을 수행하고 완료 보고를 작성한다. 그 후 다음 Phase 진행 승인을 요청한다.
9. 사용자 승인 없이 다음 Phase로 넘어가지 않는다.
10. 사용자 승인 없이 Git commit, GitHub 원격 push, GitHub Pages 배포를 하지 않는다.
11. S0 Blocker가 아닌 이슈는 검수 중 즉시 수정하지 않는다. Issue Matrix에 기록하고 설계/수정 승인 Phase 이후에만 고친다.
12. S0 Blocker로 검수 자체가 불가능할 때는 복구를 추측해 실행하지 말고, 재현 증거와 최소 복구안만 보고하여 별도 승인을 받는다.
13. 더미/운영 데이터, localStorage, JSON 파일, seed/fixture 데이터는 사용자 승인 없이 삭제, 초기화, 덮어쓰기, 자동 생성하지 않는다.
14. Plan 27의 보존 규칙을 유지한다. 사용자가 제공한 인사카드, 조직/권한 데이터, JSON Import 데이터, 실제 입력 데이터는 임의로 삭제하지 않는다.
15. Plan 28의 Excel 범위를 유지한다. `Roadmap_ESC`에서는 A열 공정 단계, B열 단계/세부 업무명, E열 기본 담당자 참고값만 대상이다. C/D열과 F~J열은 강제 반영하거나 자동 import하지 않으며, K열 이후 날짜 Bar는 참고용일 뿐 공식 일정으로 자동 반영하지 않는다.

---

## 1. Plan 29의 검수 범위

### 1-1. 기준 저장소와 배포 대상

```text
로컬 저장소: F:\workspace
원격 저장소: https://github.com/eumditravel-oss/workspace
기준 브랜치: origin/main
배포 대상: https://eumditravel-oss.github.io/workspace/
문서 기준 폴더: F:\workspace\docs
```

### 1-2. 반드시 대조할 영역

```text
1. Plan 1~28 요구사항 및 우선순위
2. 로컬 main과 origin/main의 커밋 및 파일 일치 여부
3. GitHub Pages 배포 commit/basePath/route refresh 여부
4. 전체 route, 탭, 모달, 권한별 CTA
5. Project, TaskCard, SchedulePlan/TaskWorkSegment, ApprovalRequest, Notification, AuditLog 관계
6. PM 배정 -> 작업자 선택 -> 일정 초안 -> 중간관리자 승인/반려 -> 재작성/재요청 -> 공식 일정 반영
7. Plan 26의 작업 가능 인력 추천, 일정 비교, 승인대기 preview, revision 이력
8. Plan 27의 더미 정리, 실제 충돌 계산, CEO/COO 일정표 제외, 월별 일정 인력 필터
9. Plan 28의 공정 템플릿, 카드형 UX, A/B/E Excel 참조, 승인/반려/재요청, JSON round-trip
10. KOR/VIET 표시 및 번역 원문/번역문 분리 저장
11. Sidebar overlay, 브랜드명, full-width 상세 화면, 반응형/접근성
12. 통합 JSON Export/Import의 완전성, schema 호환성, 비밀값 비노출
13. 코드 품질, 문서 인코딩, repository hygiene, 테스트 공백
```

### 1-3. 사전 관찰 항목 - 확정 전 검증 필요

아래는 Plan 29 작성 시점의 정적 조사 결과다. 완료/오류 확정이 아니며 반드시 해당 Phase에서 증거로 재판정한다.

```text
OBS-29-001: origin/main에 Office 임시 잠금 파일
  ~$Lo_trinh_ESC 2 (Translated)(1).xlsx
  가 Git 추적 대상으로 확인됨. repository hygiene와 배포 용량 관점에서 제거 또는 ignore 필요 여부를 판단한다.

OBS-29-002: processTemplateStore의 기본 templates/stages/tasks 배열은 빈 배열로 시작한다.
  Plan 28의 ESC 공정 기본 템플릿 seed가 최초 실행 시 실제로 제공되는지, JSON Import에만 의존하는지 확인한다.

OBS-29-003: ProcessTemplateTab의 적용 후 상세 표시는 table 중심이다.
  Plan 28의 "기존 카드형 UI 유지 + 공정 단계 카드 그룹" 기준과 실제 UX가 일치하는지 브라우저에서 판정한다.

OBS-29-004: ProcessTemplateAssignment와 ProcessSchedule의 반려 사유, managerId,
  revisionNo/previous assignment/version history 보존이 Plan 25/26 수준을 충족하는지 확인이 필요하다.

OBS-29-005: package.json에 test script가 확인되지 않는다.
  현재 자동 검증 범위와 필요한 최소 테스트 추가 범위를 정리한다.

OBS-29-006: 일부 Plan 문서가 UTF-8로 안정적으로 렌더링되는지 확인이 필요하다.
  내용이 손상되었거나 인코딩이 섞인 문서는 요구사항 추적의 근거로 사용할 수 없으므로 별도 기록한다.
```

---

## 2. 판정 및 보고 형식

### 2-1. 상태값

```text
PASS              E4/E5까지 증명됨
PARTIAL           일부만 동작하거나 증거가 부족함
FAIL              요구사항과 실제 동작이 다름
BLOCKED           S0 또는 외부 조건 때문에 검증 불가
VERIFY_REQUIRED   코드/문서만 확인됨
OUT_OF_SCOPE      최신 Plan에서 명시적으로 제외됨
```

### 2-2. 이슈 심각도

```text
S0 Blocker   사이트 접근/핵심 데이터 보존/검수 자체 불가
S1 Critical  승인, 권한, 공식 일정, 데이터 손상, JSON 복원 무결성 위반
S2 Major     핵심 사용자 workflow가 끊기거나 요구사항이 실사용 불가
S3 Minor     UX, 가독성, 오류 문구, 제한된 화면 회귀
S4 Enhancement 운영 효율 또는 품질 향상 제안
```

### 2-3. 모든 이슈의 필수 필드

```text
Issue ID
발견 Phase
관련 Plan/요구사항 ID
관련 route/role
예상 동작
실제 동작
재현 절차
증거 (화면, console, network, 코드 위치, JSON 샘플, commit SHA)
현재 증거 등급
심각도
Root Cause 가설
영향 범위
수정 제안
수정 전 사용자 승인 필요 여부
```

### 2-4. 완료 보고의 고정 형식

각 Phase 종료 시 아래 형식을 지킨다.

```text
[Plan 29 / Phase N 완료 보고]

1. Phase 목표와 실제 수행 범위
2. 확인한 문서/route/코드/commit/데이터 경로
3. 증거와 판정 (PASS/PARTIAL/FAIL/BLOCKED/VERIFY_REQUIRED)
4. 자체검수 결과
5. 데이터 무결성 검토 결과
6. 상태 전이/권한 검토 결과
7. 변경 여부 (조사 Phase는 "변경 없음"을 명시)
8. 발견 이슈와 심각도
9. 남은 리스크 및 다음 Phase 의존성
10. 다음 Phase 시작 승인 요청

Phase N+1을 진행해도 될까요?
```

조사 Phase에서 코드, 데이터, 문서를 수정하지 않았다면 반드시 `변경 없음`을 적는다. `완료`, `완벽`, `정상` 같은 표현은 판정표와 증거 링크 없이 사용하지 않는다.

---

## 3. Phase 구성

### 검증 및 설계 구간 - 코드/데이터 수정 금지

#### Phase 344 - Plan 29 시작 Baseline 및 작업 금지 상태 확인

목표:
- 현재 브랜치, HEAD, origin/main, worktree, uncommitted change, Node/Next.js 버전, package script를 기록한다.
- 문서/코드/배포/데이터 검증 범위와 금지사항을 확인한다.

작업:
1. `git status -sb`, HEAD, origin/main SHA, remote URL 기록
2. `docs`, `qa`, `src`, `scripts`, `json`, `dummy` 인벤토리 작성
3. AGENTS.md와 package.json 확인
4. Plan 20~28 산출물 존재 여부와 경로 기록
5. 코드 수정/데이터 변경/commit/push가 없음을 확인

금지:
- 코드, 문서, JSON, localStorage, seed, fixture, 설정 수정 금지
- build, lint, dev server 실행 금지

산출물:
```text
qa/plan29/reports/PHASE344_BASELINE.md
```

#### Phase 345 - Plan 1~28 문서 인벤토리 및 인코딩 검증

목표:
- 모든 Plan 문서의 실제 파일, 번호, 형식, SHA, 인코딩 상태를 목록화한다.

작업:
1. `workspace plan1`부터 `workspace plan28` 및 대응 Markdown 문서 확인
2. 같은 번호의 `.md`/`.txt` 내용 차이를 비교
3. UTF-8/UTF-8 BOM/기타 인코딩과 깨진 문자 여부 확인
4. 내용을 읽을 수 없는 문서는 `DOCUMENT_CONFLICT` 또는 `DOCUMENT_ENCODING_RISK`로 분류
5. 문서 자체의 수정은 하지 않고 복구 후보만 기록

산출물:
```text
qa/plan29/reports/PHASE345_PLAN_DOCUMENT_INVENTORY.md
```

#### Phase 346 - 최신 Plan 우선 Requirements Traceability Matrix 작성

목표:
- Plan 1~28 요구사항을 중복 제거하지 않고 출처와 우선순위를 보존한 Matrix로 정리한다.

작업:
1. 요구사항마다 `REQ-ID`, 출처 Plan, 우선순위, 관련 엔티티, route, role, 완료 증거 기준을 지정
2. 충돌 시 가장 높은 Plan 번호를 적용하되, 이전 Plan의 안전/무결성 조건 보존 여부를 표시
3. Plan 19, 25, 26, 27, 28 요구사항을 별도 핵심 영역으로 표시
4. `IMPLEMENTED`, `DESIGNED_ONLY`, `VERIFY_REQUIRED`, `OUT_OF_SCOPE`를 구분

산출물:
```text
qa/plan29/reports/PLAN29_REQUIREMENTS_TRACEABILITY_MATRIX.md
```

#### Phase 347 - GitHub main 반영 및 로컬 동기화 검증

목표:
- GitHub `eumditravel-oss/workspace`의 main과 로컬 `F:\workspace`의 관계를 실제 SHA와 파일 비교로 검증한다.

작업:
1. origin/main의 최신 SHA, 최근 커밋, Plan 19~28 관련 커밋 조사
2. 로컬 HEAD와 origin/main SHA 비교
3. worktree 변경/누락 파일 확인
4. Plan별 보고 커밋이 실제 구현 파일을 포함하는지 `git show`로 확인
5. GitHub Pages workflow, basePath, deploy artifact 구조를 기록

금지:
- fetch/pull/rebase/reset/commit/push 금지

산출물:
```text
qa/plan29/reports/PHASE347_GITHUB_REFLECTION_AUDIT.md
```

#### Phase 348 - Repository Hygiene 및 배포 입력물 검증

목표:
- 배포/저장소 품질을 해치는 임시 파일, 대형 바이너리, 노출 가능 비밀값, 문서 손상을 조사한다.

작업:
1. 추적 중인 `~$` Office lock file, build artifact, 임시 파일, 중복 Excel, 불필요한 `.tmp` 파일 조사
2. `.gitignore`와 실제 추적 파일을 대조
3. `.env`, API key, 번역 provider 설정의 하드코딩 여부 조사
4. 삭제가 필요한 항목은 `DELETE_CANDIDATE`로만 기록하고 변경하지 않음
5. GitHub Pages에 필요한 정적 입력물과 불필요한 파일을 구분

산출물:
```text
qa/plan29/reports/PHASE348_REPOSITORY_HYGIENE_AUDIT.md
```

#### Phase 349 - 정적 품질 Baseline

목표:
- 실제 검증 명령과 현재 자동 테스트 공백을 기준선으로 기록한다.

작업:
1. 프로젝트 규칙과 Next.js 버전에 맞는 lint/typecheck/build 명령 확인
2. test script, Playwright/Cypress/Vitest/Jest 존재 여부 확인
3. 현재 오류를 숨기지 않고 명령별 stdout/stderr/exit code를 증빙으로 저장
4. build 산출물은 검증용이며 commit/push하지 않음

주의:
- 이 Phase에서 source 수정 금지
- 명령 실패는 다음 Phase로 숨기지 말고 Issue Matrix에 등록

산출물:
```text
qa/plan29/reports/PHASE349_STATIC_QUALITY_BASELINE.md
```

#### Phase 350 - Route, 메뉴, 탭, 모달, CTA 인벤토리

목표:
- 사용자가 실제로 접근 가능한 모든 기능 화면을 inventory로 만든다.

작업:
1. Sidebar/Header/route tree에서 모든 route 추출
2. 각 route의 탭, 모달, primary CTA, role별 노출 조건 기록
3. `/projects/intake`, `/projects`, `/approvals`, `/schedules`, `/conflicts`, `/notifications`, `/settings/*`, `/tasks/my`, `/evaluation`을 반드시 포함
4. 클릭 가능하지만 동작하지 않는 CTA 후보를 표시

산출물:
```text
qa/plan29/reports/PHASE350_UI_ROUTE_CTA_INVENTORY.md
```

#### Phase 351 - 핵심 데이터 모델 및 Store 관계 무결성 검증

목표:
- Plan 1의 핵심 엔티티와 Plan 25~28 확장 엔티티의 참조/상태/영속성을 검토한다.

검증 대상:
```text
User/PersonnelCard, Department, Project, TaskCard, TaskWorkSegment,
SchedulePlan/PersonalSchedule, ApprovalRequest, Notification, AuditLog,
ProcessTemplate, ProcessStage, ProcessTask, ProcessTemplateAssignment, ProcessSchedule
```

작업:
1. 필수 ID 관계, orphan 가능성, persist key, import/export 연결 확인
2. `TaskCard`와 `ProcessTemplateAssignment`의 소유 관계 확인
3. `ProcessSchedule.isOfficial`과 실제 직원 일정/TaskWorkSegment의 공식 반영 관계 확인
4. manager/PM/worker 식별자, revision/rejection/history 필드 충족 여부 확인
5. Observation 29-004를 PASS/PARTIAL/FAIL로 재판정

산출물:
```text
qa/plan29/reports/PHASE351_DATA_MODEL_STORE_INTEGRITY.md
```

#### Phase 352 - 권한 및 상태 전이 정책 검증

목표:
- UI 숨김뿐 아니라 Store/action 수준에서 권한과 상태 전이가 차단되는지 확인한다.

검증 대상:
```text
SUPER_ADMIN, DEPARTMENT_MANAGER, PM, WORKER
PM 지정, 작업자 선택, 일정 초안, 승인 요청, 승인, 반려,
재작성/재요청, 공식 일정 반영, 카드 drag/drop, 완료/수정 전환
```

산출물:
```text
qa/plan29/reports/PHASE352_PERMISSION_STATE_TRANSITION_AUDIT.md
```

#### Phase 353 - Plan 25/26 일정 승인 및 공식 일정 반영 검증

목표:
- PM 일정 초안이 승인 전에는 공식 일정표/작업자 업무에 들어가지 않고 승인 후에만 반영되는지 검증한다.

작업:
1. PM 배정 -> 작업자 선택 -> draft -> approval request의 각 store action 추적
2. 승인 전/후 Project, TaskCard, TaskWorkSegment, SchedulePlan, Notification, AuditLog 변화 비교
3. 승인 중복/다른 사용자의 우회 처리 가능성 확인
4. 승인대기 preview가 공식 일정과 섞이지 않는지 확인

산출물:
```text
qa/plan29/reports/PHASE353_SCHEDULE_APPROVAL_OFFICIALIZATION_AUDIT.md
```

#### Phase 354 - 반려, 수정, 재승인 및 Revision 이력 검증

목표:
- 중간관리자 반려 후 PM 재작성/재요청이 사유와 이전 이력을 보존한 채 동작하는지 검증한다.

작업:
1. rejectionReason 필수 여부 확인
2. reviewedBy/reviewedAt, revisionNo/previous ID/history/snapshot 정책 확인
3. 반려안이 공식 일정으로 표시되지 않는지 확인
4. PM이 반려 사유를 확인하고 수정하여 새 승인 요청을 생성할 수 있는지 확인
5. Plan 25, 26, 28의 재승인 요구사항을 하나의 상태 전이표로 대조

산출물:
```text
qa/plan29/reports/PHASE354_REJECTION_RESUBMISSION_HISTORY_AUDIT.md
```

#### Phase 355 - Plan 28 Excel A/B/E 매핑 및 Template Seed 검증

목표:
- `Lo_trinh_ESC 2 (Translated)(1).xlsx`의 `Roadmap_ESC` 시트에서 A/B/E만 참조했다는 사실과 기본 템플릿의 실사용 가능 여부를 검증한다.

작업:
1. Excel sheet/column/header/row mapping을 증빙으로 기록
2. C/D, F~J, K 이후가 데이터 모델 또는 자동 일정에 부당하게 반영되지 않았는지 확인
3. template/stage/process task seed의 존재, 최초 실행 표시, idempotency, 중복 생성 여부 확인
4. E열 기본 담당자 참고값이 실제 사용자 자동 배정이 아닌 참고 정보인지 확인
5. Observation 29-002를 재판정

금지:
- Excel import 구현, seed 생성, 데이터 수정 금지

산출물:
```text
qa/plan29/reports/PHASE355_PROCESS_TEMPLATE_EXCEL_MAPPING_AUDIT.md
```

#### Phase 356 - Plan 28 카드형 공정 단계 UX 검증

목표:
- 기존 업무 리스트 카드 UI를 유지하면서 공정 단계와 세부 업무가 카드 그룹으로 읽히는지 실제 화면에서 검증한다.

작업:
1. 업무 리스트 카드에서 `[공정 템플릿 적용]` 진입점 확인
2. template 선택, 미리보기, 적용 후 summary 표시 확인
3. 상세 화면의 단계 그룹/하위 업무가 표 복제가 아닌 카드형 UX인지 확인
4. 단계 수, 완료 단계, 진행률, PM, 참여 인력, 승인 상태, 기간 정보의 가독성 확인
5. KOR/VIET 표시와 좁은 화면에서 텍스트/컨트롤 겹침 확인
6. Observation 29-003을 재판정

산출물:
```text
qa/plan29/reports/PHASE356_PROCESS_TEMPLATE_CARD_UX_AUDIT.md
```

#### Phase 357 - Plan 28 PM 공정 일정 작성 및 승인 연결 검증

목표:
- ProcessSchedule이 PM 작성 -> manager 승인/반려 -> 재작성/재요청 -> 공식 일정 반영의 기존 workflow에 실제로 연결되는지 검증한다.

작업:
1. PM이 담당자, 시작/종료일, 예상 소요시간, 설명을 작성하는지 확인
2. 경고/추천/부하/충돌 조회가 Plan 26 정책과 연결되는지 확인
3. 승인 요청 시 `PROCESS_SCHEDULE_APPROVAL`과 assignment/schedule 관계 확인
4. 승인 시 ProcessSchedule만 official로 바뀌는지, 직원 공식 일정/TaskWorkSegment/통합 일정표에도 반영되는지 확인
5. 반려 시 사유/이력/재작성 UI가 있는지 확인
6. 승인을 건너뛰는 공식화 또는 진행 상태 우회가 있는지 확인

산출물:
```text
qa/plan29/reports/PHASE357_PROCESS_TEMPLATE_APPROVAL_INTEGRITY_AUDIT.md
```

#### Phase 358 - JSON Export Schema 및 민감정보 검증

목표:
- 현재 Export가 모든 필수 상태를 포함하고 비밀값을 노출하지 않는지 확인한다.

필수 데이터:
```text
ProcessTemplate, ProcessStage, ProcessTask, ProcessTemplateAssignment,
ProcessSchedule, ApprovalRequest, rejection/resubmission history,
TaskCard/TaskWorkSegment, PersonnelCard, Project, PersonalSchedule,
Notification, AuditLog, settings, translation source/translation state
```

작업:
1. schemaVersion, export metadata, timestamp, mode, data shape 확인
2. secret/API key/provider key sanitization 확인
3. 데이터 링크가 JSON에서 유지되는지 확인
4. export filename과 실제 다운로드 검증 방법 설계

산출물:
```text
qa/plan29/reports/PHASE358_JSON_EXPORT_SCHEMA_AUDIT.md
```

#### Phase 359 - JSON Import 및 Round-trip 복원 검증

목표:
- Export한 상태를 별도 안전 테스트 프로필에서 Import했을 때 workflow 이력과 공식/임시 구분이 유지되는지 검증한다.

작업:
1. 원본 프로필을 보존한 뒤 별도 브라우저 profile 또는 isolated localStorage에서 테스트
2. export -> import -> refresh -> export 비교
3. process templates, approval/rejection/revision, official schedule, CEO/COO, dummy cleanup 상태 확인
4. 오류 시 원본 운영 데이터를 건드리지 말고 증거만 기록

산출물:
```text
qa/plan29/reports/PHASE359_JSON_ROUND_TRIP_AUDIT.md
```

#### Phase 360 - Plan 27 더미/충돌/월별 일정표 정책 재검증

목표:
- 허위 conflict가 제거되었고 실제 conflict 계산은 유지되며, 일정표 인력 필터 정책이 정확한지 검증한다.

작업:
1. mock/seed/localStorage/import/fixture에서 dummy 유입 경로 분리
2. CEO [DEMO] CONCOST Executive 001, COO [DEMO] CONCOST Executive 002가 기본 실무 일정 행에서는 제외되고 권한/결재/인사카드에서는 유지되는지 확인
3. 해당 월에 승인된 일정 또는 leave/off 일정이 있는 실무자만 기본 표시되는지 확인
4. manager/executive/pending/rejected filter가 권한에 맞는지 확인
5. dummy conflict와 실제 충돌의 source/type가 구분되는지 확인

산출물:
```text
qa/plan29/reports/PHASE360_SCHEDULE_CONFLICT_DATA_POLICY_AUDIT.md
```

#### Phase 361 - KOR/VIET UI 및 번역 데이터 무결성 검증

목표:
- UI 언어 전환, 원문/번역 분리, 번역 검토 상태, public no-key provider fallback이 Plan 19 기준을 지키는지 확인한다.

작업:
1. KOR/VIET 전환 범위와 fallback label 확인
2. 한국어 입력 -> 베트남어 보조 번역, 베트남어 입력 -> 한국어 보조 번역 흐름 확인
3. 원문 덮어쓰기 방지, 자동번역 검토 필요 표시 확인
4. provider key 하드코딩/무단 수집이 없는지 확인
5. 번역 데이터가 JSON round-trip에 남는지 확인

산출물:
```text
qa/plan29/reports/PHASE361_I18N_TRANSLATION_INTEGRITY_AUDIT.md
```

#### Phase 362 - 공통 UI, 브랜드, 반응형, 접근성 검증

목표:
- Plan 22~24의 sidebar overlay, `CON-COST&Viet_QS OS` 브랜드, full-width, 기본 탭, 달력 폭 요구사항을 실제 화면으로 검증한다.

작업:
1. collapsed/hover/focus/mobile sidebar의 overlay와 layout shift 확인
2. expanded/collapsed 브랜드 텍스트 줄바꿈, 재렌더, clipping, accessibility label 확인
3. `/projects/intake` 기본 탭이 개발팀 업무 리스트 관리인지 확인
4. 통합 일정표의 가로 폭, 스크롤, 좌우 빈공간, responsive view 확인
5. 상세 페이지/모달의 full-width, long text, keyboard focus, tooltip, contrast 확인

산출물:
```text
qa/plan29/reports/PHASE362_UI_RESPONSIVE_ACCESSIBILITY_AUDIT.md
```

#### Phase 363 - E2E 검증 A: 외부 수주 프로젝트

목표:
- Plan 1 핵심 외부 수주 flow를 실제 브라우저에서 역할 전환과 새로고침을 포함해 재현한다.

시나리오:
```text
수주 등록 -> 중간관리자 PM 지정 -> PM 작업자/일정 작성 -> 승인 요청
-> 중간관리자 반려(사유 필수) -> PM 수정/재요청 -> 중간관리자 승인
-> 공식 일정/작업자 업무/알림/AuditLog 확인 -> JSON Export
```

산출물:
```text
qa/plan29/reports/PHASE363_E2E_EXTERNAL_PROJECT.md
```

#### Phase 364 - E2E 검증 B: 개발팀 업무

목표:
- 내부 개발팀 업무가 외부 수주와 동일한 승인 무결성을 유지하는지 검증한다.

시나리오:
```text
개발팀 업무 생성 -> PM 지정 -> 작업자/일정 -> 승인 -> 보드/일정표/내 업무 확인
-> 진행/검토/완료 상태 전이 -> 로그/알림/JSON 확인
```

산출물:
```text
qa/plan29/reports/PHASE364_E2E_INTERNAL_DEVELOPMENT.md
```

#### Phase 365 - E2E 검증 C: 공정 템플릿

목표:
- Plan 28의 사용자가 선택한 템플릿 적용과 공정 승인/반려/재요청/공식 반영이 실제로 완결되는지 검증한다.

시나리오:
```text
업무 카드 선택 -> 공정 템플릿 적용 -> PM이 단계별 담당자/일정 작성
-> manager 승인 요청 -> 반려 사유 -> PM 수정/재요청 -> 승인
-> 공식 일정표/작업자 업무/ProcessSchedule/JSON round-trip 확인
```

산출물:
```text
qa/plan29/reports/PHASE365_E2E_PROCESS_TEMPLATE.md
```

#### Phase 366 - 역할 격리 및 우회 경로 E2E 검증

목표:
- 권한 없는 사용자의 UI 조작과 Store action 우회를 모두 검증한다.

작업:
1. WORKER가 타인 업무/승인/PM 배정/공식 일정 반영을 시도
2. PM이 타 프로젝트 및 최종 승인을 시도
3. manager가 부서 범위를 벗어난 결재를 시도
4. 승인 전 `PRE_WORK/READY -> IN_PROGRESS`, 완료 역행, 단계 건너뛰기를 시도
5. UI guard와 Store guard가 각각 동작하는지 확인

산출물:
```text
qa/plan29/reports/PHASE366_ROLE_ISOLATION_BYPASS_AUDIT.md
```

#### Phase 367 - 알림, AuditLog, 상태 변경 추적 E2E 검증

목표:
- 핵심 변경이 중복 없이 적절한 대상에게 알림되고, 복원 가능한 AuditLog를 남기는지 확인한다.

검증 대상:
```text
PM 배정, draft 저장, 승인 요청, 승인, 반려, 재요청, 공식 일정 반영,
공정 템플릿 적용, 상태/순서 변경, 추가 업무/연장 요청
```

산출물:
```text
qa/plan29/reports/PHASE367_NOTIFICATION_AUDITLOG_E2E.md
```

#### Phase 368 - 요구사항 증거 Matrix 완성

목표:
- Phase 344~367의 증거를 Requirements Traceability Matrix에 반영한다.

작업:
1. 모든 REQ-ID에 증거 등급과 PASS/PARTIAL/FAIL/BLOCKED 기록
2. 코드만 있는 기능, 보고서만 있는 기능, 화면에서 실제 동작하는 기능을 분리
3. GitHub 반영 여부와 배포 반영 여부를 각각 표시
4. 계획상 제외 항목은 근거를 명시

산출물:
```text
qa/plan29/reports/PLAN29_EVIDENCE_MATRIX.md
```

#### Phase 369 - Issue Matrix, Root Cause, 개선 Backlog 통합

목표:
- 중복 증상을 같은 원인으로 병합하고 수정 우선순위를 결정한다.

작업:
1. 모든 이슈를 S0~S4로 재분류
2. root cause 별로 병합
3. 요구사항 불일치, 데이터 무결성, UI, 테스트, 배포, 문서 위생을 분리
4. "지금 수정", "별도 Plan", "사용자 결정 필요"로 구분
5. 사전 관찰 항목 OBS-29-001~006의 최종 판정을 기록

산출물:
```text
qa/plan29/reports/PLAN29_ISSUE_MATRIX_AND_BACKLOG.md
```

#### Phase 370 - 수정 설계 및 테스트 명세 확정

목표:
- 발견한 이슈만 고치도록 Patch 단위, 영향 파일, rollback 기준, 테스트를 확정한다.

작업:
1. 각 S0/S1/S2 이슈마다 한 개의 최소 Patch Phase를 정의
2. 변경할 타입/store/component/selector/JSON schema와 영향 범위를 명시
3. migration, existing localStorage, imported JSON 호환 전략 작성
4. 변경 전/후 테스트 시나리오와 rollback 기준 작성
5. 기능 추가 제안은 S4 backlog에만 두고 이번 Patch 범위와 분리

금지:
- 코드 수정 금지

산출물:
```text
qa/plan29/reports/PLAN29_APPROVED_PATCH_DESIGN.md
```

#### Phase 371 - 수정 대상 확정 사용자 승인 요청

목표:
- 검증 결과와 Patch 순서를 사용자에게 제시하고 코드 수정 시작 승인을 받는다.

완료 보고는 반드시 아래처럼 작성한다.

```text
[Plan 29 / Phase 371 승인 요청]

1. PASS/PARTIAL/FAIL 요약
2. S0/S1/S2 이슈 목록과 근거
3. 이번 Plan에서 수정할 Patch 목록
4. 별도 Plan으로 분리할 개선 제안
5. 데이터 migration/cleanup 필요 여부
6. Phase 372부터 코드 수정이 시작됩니다.
7. 승인 전에는 어떠한 코드/문서/데이터도 수정하지 않겠습니다.
```

### 수정 구간 - 승인된 Issue만 작은 단위로 수정

아래 Phase는 Phase 371에서 사용자가 승인한 Patch만 실행한다. 이슈가 없거나 범위에서 제외된 Phase는 실행하지 않고 `NOT_REQUIRED`로 보고한다.

#### Phase 372 - Repository Hygiene 및 문서 인코딩 Patch

대상 예시:
- 추적된 Office lock file 제거와 `.gitignore` 보강
- 확정된 문서 인코딩 복구
- 배포와 무관한 임시 artifact 정리

완료 조건:
- 사용자 승인한 파일만 변경
- 원본 Excel/사용자 데이터 보존
- `git diff --check` 통과

#### Phase 373 - 공정 템플릿 데이터 모델 및 Seed Patch

대상 예시:
- Plan 28 A/B/E 기반 template/stage/task seed의 idempotent 초기화
- defaultAssignee reference 보존
- ProcessTemplateAssignment/ProcessSchedule의 required lifecycle field 보강
- 기존 persisted/imported state migration

완료 조건:
- 템플릿은 자동 적용되지 않음
- C/D/F~J/K+ 데이터는 자동 공식 일정으로 들어가지 않음
- 기존 JSON과 localStorage가 손상되지 않음

#### Phase 374 - 카드형 공정 단계 UX Patch

대상 예시:
- `[공정 템플릿 적용]` CTA와 preview
- 단계 그룹 카드와 하위 업무 카드
- 카드 summary, 진행률, 상태, bilingual 표시
- table-only 상세를 Plan 28의 카드형 기준에 맞게 보정

완료 조건:
- 기존 업무 리스트의 카드형 UI를 제거하지 않음
- 모바일/desktop에서 텍스트와 controls가 겹치지 않음

#### Phase 375 - PM 공정 일정 작성 및 인력 추천 Patch

대상 예시:
- PM 권한 검증
- 단계별 담당자, 시작/종료일, 예상 시간, 설명 편집
- Plan 26 규칙 기반 인력 추천/충돌/부하 경고 연결

완료 조건:
- PM만 자신의 프로젝트를 편집
- 승인 전은 draft/pending이며 공식 일정으로 노출되지 않음

#### Phase 376 - 승인/반려/재승인/공식 반영 Patch

대상 예시:
- manager approval/rejection controls 및 사유 필수
- revision/history/snapshot 보존
- 승인 후 official ProcessSchedule + worker schedule/TaskWorkSegment 동기화
- 중복 승인/우회 상태 전이 차단

완료 조건:
- 반려된 일정은 공식 일정에 표시되지 않음
- PM 재작성/재요청 후 이전 이력이 남음
- 승인 후에만 공식 일정/작업자 업무에 반영됨

#### Phase 377 - JSON Handoff 및 migration Patch

대상 예시:
- ProcessTemplate/Stage/Task/Assignment/Schedule, ApprovalRequest, revision history 누락 보완
- import schema/migration/validation 오류 보완
- translation secret sanitization 보완

완료 조건:
- isolated profile round-trip 통과
- original/translated text, approval state, official/pending state 보존
- API key/secret export 금지

#### Phase 378 - 권한, conflict, schedule filter Patch

대상 예시:
- Plan 27의 CEO/COO 기본 제외 및 월별 일정 인력 selector
- mock conflict isolation
- Store-level permission/state guard

완료 조건:
- 실제 일정/휴가 충돌 감지는 유지
- user-provided personnel data 삭제 금지

#### Phase 379 - 기타 S1/S2 핵심 workflow Patch

대상 예시:
- Phase 369에서 확정된 PM/manager/worker workflow 결함
- approval/notification/audit duplication 또는 누락
- GitHub Pages route/basePath regressions

완료 조건:
- Phase 370의 범위를 벗어난 신규 기능 추가 금지

#### Phase 380 - S3 UI/UX 및 접근성 Patch

대상 예시:
- Sidebar overlay/brand rendering
- full-width layout/calendar readability
- empty state, long text, keyboard focus, tooltip, contrast

완료 조건:
- 핵심 workflow를 변경하지 않음
- desktop/mobile screenshot 검증 통과

#### Phase 381 - 자동 검증 보강

목표:
- 현재 test script 공백이 확인된 경우, 가장 위험한 순수 함수/selector/state transition에 집중한 최소 테스트를 추가한다.

원칙:
- UI 전체를 추측으로 mock하지 않는다.
- approval state transition, official schedule selector, process mapping, JSON migration처럼 회귀 위험이 큰 영역을 우선한다.

#### Phase 382 - 수정 후 E2E 재검증 A: 외부/내부 workflow

목표:
- Phase 363/364에서 FAIL/PARTIAL이었던 시나리오만 같은 데이터 조건으로 재검증한다.

#### Phase 383 - 수정 후 E2E 재검증 B: 공정 템플릿/반려 재요청/JSON

목표:
- Phase 365, 354, 359에서 FAIL/PARTIAL이었던 시나리오를 재검증한다.

#### Phase 384 - 수정 후 권한/충돌/UI 회귀 검증

목표:
- Phase 360~362, 366~367에서 영향을 받은 항목을 재검증한다.

#### Phase 385 - 최종 Static Quality 및 배포 전 검증

목표:
- lint, typecheck, build, console, route refresh, GitHub Pages basePath를 실제 결과로 확인한다.

완료 조건:
- 실패를 숨기지 않음
- 생성된 build artifact는 승인 전 commit하지 않음

#### Phase 386 - Plan 29 최종 증거 리포트

산출물:
```text
qa/plan29/reports/PLAN29_FINAL_ASSURANCE_REPORT.md
```

포함 항목:
1. Plan 1~28 Requirements Traceability Matrix 최종 상태
2. GitHub main/로컬/배포 반영 증거
3. 수정 전후 Issue Matrix
4. 각 Patch의 파일/테스트/무결성 결과
5. JSON round-trip 결과
6. E2E 결과
7. 미해결 리스크와 별도 Plan 제안
8. commit/push 전 사용자 승인 필요 문구

#### Phase 387 - Git Diff, Commit 대상 검토 및 Commit 승인 요청

작업:
1. `git status`, `git diff --check`, 변경 파일, 테스트 결과 확인
2. 사용자 변경과 Plan 29 변경을 분리
3. commit message 제안
4. 사용자에게 commit 승인 요청
5. 승인 전 commit 금지

완료 보고:
```text
[Plan 29 / Phase 387 승인 요청]
- commit 대상 파일:
- 제외할 사용자 변경:
- 검증 결과:
- 제안 commit message:
- 승인 전에는 commit하지 않겠습니다.
```

#### Phase 388 - 승인된 Git Commit 생성 및 Commit 무결성 검토

작업:
1. Phase 387에서 사용자가 승인한 파일만 stage
2. commit 생성
3. commit SHA, `git show --stat`, worktree 상태 기록
4. remote push는 하지 않음

#### Phase 389 - GitHub 원격 Push 승인 요청

완료 보고:
```text
[Plan 29 / Phase 389 승인 요청]
- local commit SHA:
- push 대상: origin/main 또는 사용자가 지정한 branch
- GitHub 반영 예상 파일:
- build/test/E2E 결과:
- 승인 전에는 push하지 않겠습니다.
```

#### Phase 390 - 승인된 원격 Push 및 GitHub/배포 반영 재검증

작업:
1. 사용자 승인 후에만 push
2. origin SHA와 local SHA 일치 확인
3. GitHub Actions/GitHub Pages 배포 상태 확인
4. 배포된 화면에서 영향 route smoke test
5. 최종 SHA와 배포 증거를 Plan 29 report에 추가

---

## 4. Plan 29 최종 완료 기준

Plan 29는 아래 조건을 모두 만족할 때만 완료다.

```text
1. Plan 1~28 문서와 최신 우선순위가 Matrix로 정리되었다.
2. 로컬 main과 origin/main, 배포 상태를 서로 분리해 증거로 확인했다.
3. 코드만 존재하는 기능과 실제 화면에서 동작하는 기능을 구분했다.
4. Plan 25/26의 PM-승인-반려-재요청-공식반영 workflow를 실제 E2E로 검증했다.
5. Plan 27의 dummy/conflict/CEO-COO/month selector 정책을 검증했다.
6. Plan 28의 A/B/E Excel 참조, 카드형 UX, PM 일정, 승인/반려, JSON round-trip을 검증했다.
7. 승인 전 일정이 공식 일정표나 worker 업무에 노출되지 않는 것이 확인되었다.
8. 반려 사유와 revision 이력이 보존되는 것이 확인되었다.
9. JSON Export/Import가 process 및 approval data를 복원하고 비밀값을 노출하지 않는다.
10. 모든 발견 이슈에 증거, severity, root cause, 수정 범위가 있다.
11. 사용자가 승인한 Patch만 수정되었다.
12. 수정 후 관련 E2E, 권한, JSON, UI 회귀 검증이 재실행되었다.
13. lint/typecheck/build 결과가 실제 출력 기준으로 기록되었다.
14. 사용자 승인 전 commit/push/deploy하지 않았다.
15. 최종 report가 구현/설계/검증 필요를 과장 없이 구분한다.
```

---

## 5. Antigravity 실행 시작 프롬프트

아래 문구를 그대로 Google Antigravity에 입력한다.

```text
현재 F:\workspace 프로젝트의 Plan 29 작업을 시작한다.

중요 전제:
- Plan 번호가 클수록 최신 요구사항이 우선이다. 단, 최신 Plan이 명시적으로 폐기하지 않은 이전 Plan의 권한, 승인 전 공식 일정 미반영, Notification, AuditLog, JSON 무결성 원칙은 유지한다.
- Plan 29는 즉시 새 기능을 구현하는 Plan이 아니다. Plan 1~28 요구사항이 GitHub main, 로컬 F:\workspace, GitHub Pages 배포 화면, 상태 저장소, JSON Export/Import, 실제 E2E에서 일치하는지 증거로 검증한 뒤 확인된 결함만 작은 Patch Phase로 수정하는 품질 보증 Plan이다.
- 보고서, 커밋 메시지, 코드 존재만으로 완료라고 판단하지 마라. 실제 화면에서 사용자 행동으로 확인하고 새로고침/JSON round-trip까지 보존될 때만 PASS로 판단한다.
- 증거 등급은 E0 미확인, E1 문서만, E2 코드만, E3 static 검증, E4 실제 UI, E5 새로고침/JSON 보존으로 구분하라. E1/E2만 있는 항목은 PASS가 아니다.
- 동일 번호의 md/txt Plan이 서로 다르거나 문서 인코딩이 깨지면 임의로 해석하지 말고 DOCUMENT_CONFLICT 또는 DOCUMENT_ENCODING_RISK로 보고하라.
- 각 Phase 시작 전에 반드시 나에게 승인 요청을 하고, 내가 승인하기 전에는 그 Phase를 실행하지 마라.
- 각 Phase 종료 시 자체검수, 데이터/상태/권한 무결성 검토, 가능한 검증을 완료한 뒤 증거와 함께 완료 보고를 작성하고 다음 Phase 승인을 요청하라.
- 사용자 승인 없이 다음 Phase, 코드 수정, 데이터 수정/삭제, localStorage 초기화, Excel import 구현, Git commit, GitHub 원격 push, 배포를 실행하지 마라.
- S0 Blocker가 아닌 이슈는 검수 중 바로 고치지 말고 Issue Matrix에 기록하라. Phase 371에서 내가 수정 범위를 승인한 뒤에만 Patch Phase를 실행하라.
- Plan 27 규칙을 유지한다. 사용자가 제공한 인사카드, 조직/권한 데이터, JSON import 데이터, 실제 입력 데이터는 임의 삭제하지 마라.
- Plan 28 규칙을 유지한다. Roadmap_ESC에서는 A열 공정 단계, B열 단계/세부 업무명, E열 기본 담당자 참고값만 대상으로 하며 C/D, F~J는 자동 반영하지 말고 K열 이후 날짜 Bar는 공식 일정으로 자동 반영하지 마라.
- Plan 28의 공정 템플릿은 사용자가 업무 카드에서 선택할 때만 적용되어야 하며, PM이 작성한 일정은 중간관리자 승인 전까지 공식 일정표/작업자 업무에 반영되면 안 된다. 반려 시 PM은 사유를 확인하고 수정 후 재승인 요청할 수 있어야 하며 이력은 보존되어야 한다.

먼저 Phase 344의 시작 승인 요청만 작성하라.
아직 Phase 344를 실행하지 마라.
```
