# WORKSPACE PLAN 18 — 최종 리포트 증빙 검증, 실제 배포/코드 불일치 점검, 보수적 완료판 정리 프롬프트

이 프롬프트는 기존 `workspace plan1.txt`부터 `workspace plan17.txt` 이후에 추가되는 열여덟 번째 보강 지시사항이다.

중요 전제:

- Plan 번호가 뒤로 갈수록 더 최신 요구사항이다.
- Plan 18은 Plan 1~17을 대체하지 않는다.
- Plan 18은 기능을 무작정 추가하는 Plan이 아니라, **최종 리포트의 구현 주장과 실제 화면/코드/테스트 증빙을 대조하는 검증 전용 Plan**이다.
- 최종 리포트의 “완료”, “완비”, “완벽히”, “모든 기능 반영” 표현은 실제 코드, 실제 화면, 실제 테스트 결과, 실제 커밋 증빙이 있을 때만 유지한다.
- 증빙이 없으면 `구현 완료`가 아니라 `설계 반영`, `화면 일부 반영`, `검증 필요`, `추후 확장`, `미구현`으로 낮춰 표기한다.
- 사용자 승인 없이 다음 Phase로 넘어가지 않는다.
- 사용자 승인 없이 GitHub 원격 push를 하지 않는다.
- 사용자 승인 없이 대규모 리팩터링을 하지 않는다.

---

## 0. Plan 18의 목적

현재 `workspace_final_comprehensive_report.md`에는 Plan 1~17의 기능이 종합 정리되어 있다.  
하지만 해당 리포트는 실제 코드/화면/테스트 증빙과 대조되지 않으면 완료 증빙으로 볼 수 없다.

Plan 18의 목적은 다음이다.

1. Plan 1~17 전체 요구사항을 최신순 우선 원칙으로 재정렬한다.
2. `workspace_final_comprehensive_report.md`의 구현 주장 목록을 추출한다.
3. 실제 코드, route, store, selector, UI, JSON, scripts, QA Evidence, lint/build/test 결과와 대조한다.
4. 실제 배포 URL `https://eumditravel-oss.github.io/workspace/`에서 화면에 보이는 항목과 리포트 주장을 대조한다.
5. 불일치 항목을 `실제 미구현`, `화면만 구현`, `코드만 구현`, `검증 미완료`, `문구 과장`, `추후 확장`으로 분류한다.
6. 개선사항이 필요한 경우 기능 단위가 아니라 **검증 가능한 작은 Phase**로 쪼개 진행한다.
7. 최종 리포트를 과장 없이 보수적으로 정리한다.
8. Plan 18 완료 후 사용자에게 push 승인만 요청한다.

---

## 1. 현재 의심되는 검증 대상

아래 항목은 반드시 확인해야 한다.  
이 목록은 확정 버그 목록이 아니라 **검증 대상**이다.

### 1-1. 리포트 표현 과장 가능성

`workspace_final_comprehensive_report.md`에 다음 유형의 표현이 있으면 실제 증빙을 확인한다.

- `완벽히 분리`
- `완비`
- `모든 Zustand 스토어 데이터`
- `100% 클라이언트 사이드 상태로 완벽히 동작`
- `브라우저 상에서 완벽히 수행`
- `실제 기업 운영툴로 완성`

증빙이 없으면 아래처럼 낮춰 쓴다.

```text
구현 완료 → 실제 테스트 통과 항목만
화면 반영 → UI에서 확인되지만 동작 검증 전
설계 반영 → 타입/문서/구조만 존재
검증 필요 → 코드/화면 중 하나 또는 테스트 증빙 부족
추후 확장 → 백엔드, DB, 스토리지, 외부 알림 등
```

### 1-2. 실제 배포 화면 기준 검증 대상

현재 배포 URL에서 최소 다음 route를 확인한다.

```text
/workspace
/workspace/projects/intake
/workspace/projects
/workspace/approvals
/workspace/conflicts
/workspace/schedules
/workspace/notifications
/workspace/settings
/workspace/evaluation
```

각 route에서 다음을 확인한다.

- 화면 제목
- 탭 이름
- 컬럼 순서
- empty state 문구
- 데이터 소스 표시
- role/user selector 노출 방식
- JSON 불러오기/내보내기 버튼 동작 여부
- 권한별 접근 제한 여부
- 더미데이터 기본 노출 여부
- 알림/AuditLog 실제 생성 여부
- route 새로고침 시 GitHub Pages 404 여부
- 모바일/좁은 화면에서 가로 스크롤 또는 깨짐 여부

### 1-3. 코드 기준 검증 대상

실제 프로젝트 코드에서 다음 파일/구조를 확인한다.

```text
package.json
next.config.*
src/app/**/page.*
src/components/**
src/store/**
src/types/**
src/lib/**
src/selectors/**
src/scripts/**
json/**
docs/**
```

특히 다음 항목을 확인한다.

- `WorkspaceExportData` schema 존재 여부
- JSON import/export 실제 구현 여부
- `/json` 폴더 및 README 존재 여부
- `validate-json-data` / `import-json-data` / `export-current-state` 스크립트 존재 및 실행 여부
- `projectSourceType` 또는 동등 필드 존재 여부
- `CLIENT_ORDER`와 `INTERNAL_DEVELOPMENT` 분리 여부
- `RevisionRequest`와 `PostDeliveryWorkRequest` 분리 여부
- `ApprovalRequest`, `Notification`, `AuditLog` 실제 생성 지점
- `Permission Scope Function` 또는 selector 기반 권한 제한 여부
- `PersonnelCard`가 일정표/권한/조직 기준 데이터로 연결되어 있는지
- Data Quality scanner가 실제 데이터와 연결되어 있는지
- 권한 시뮬레이터가 실제 selector 결과를 사용하는지
- Excel Import Preview가 실제 적용 전 검증 구조를 갖는지
- SavedView, Attachment, VersionSnapshot 등 운영 안정화 엔티티가 구현/설계/미구현 중 어디에 해당하는지

---

## 2. Plan 1~17 최신순 우선 규칙

Antigravity는 충돌되는 요구사항이 있으면 다음 기준으로 판단한다.

```text
1순위: 사용자 최신 메시지
2순위: Plan 18
3순위: Plan 17
4순위: Plan 16
5순위: Plan 15
...
마지막: Plan 1
```

단, 최신 Plan이 기존 핵심 흐름을 명시적으로 폐기하지 않았다면 Plan 1의 기본 흐름은 유지한다.

```text
수주 → PM 배정 → 일정 작성 → 승인/반려 → 카드형 업무 진행 → 완료
```

---

## 3. Plan 18 Phase 구성

Plan 18은 Phase 137부터 시작한다.  
각 Phase는 반드시 독립적으로 검증 가능해야 하며, 완료 후 사용자 승인 없이는 다음 Phase로 넘어가지 않는다.

---

# Phase 137 — 기준 파일, 최신 요구사항, 리포트 주장 인벤토리 작성

## 목표

Plan 1~17과 `workspace_final_comprehensive_report.md`를 모두 읽고, 실제 검증 전에 기준표를 만든다.  
이 Phase에서는 코드 수정 금지.

## 작업

1. 작업 폴더 내 Plan 파일 목록을 확인한다.
2. 중복 Plan 파일이 있으면 파일명, 수정일, 크기를 보고한다.
3. Plan 번호가 뒤로 갈수록 최신이라는 우선순위를 적용한다.
4. Plan 1~17 핵심 요구사항을 최신 기준으로 1개 표에 정리한다.
5. `workspace_final_comprehensive_report.md`의 주장 항목을 전부 추출한다.
6. 각 주장에 고유 ID를 붙인다.

예시:

```text
RPT-001: Next.js 14+ App Router 사용
RPT-002: JSON Export/Import 모듈 완비
RPT-003: CLIENT_ORDER / INTERNAL_DEVELOPMENT 완벽 분리
RPT-004: 착수 전 → 진행 중 드래그 시 PM Dispatch Modal 강제
RPT-005: Notification 및 AuditLog 생성
```

## 금지사항

- 코드 수정 금지
- 리포트 수정 금지
- 기능 구현 금지
- 추측으로 완료 처리 금지

## 완료 조건

- Plan 파일 목록 작성
- 최신순 우선순위 확정
- 리포트 주장 ID 목록 작성
- 검증 대상 Matrix 초안 작성
- 다음 Phase에서 실제 화면/코드 대조가 가능함

## 완료 보고 형식

```text
[Phase 137 완료 보고]

1. 확인한 Plan 파일 목록
2. 중복 Plan 파일 여부
3. 최신순 우선순위 적용 결과
4. 리포트 주장 ID 목록
5. 검증 대상 Matrix 초안
6. 코드 수정 여부: 없음
7. 다음 단계: Phase 138 진행 승인 요청

Phase 138을 진행해도 될까요?
```

---

# Phase 138 — 실제 배포 화면 Route-by-Route 검증

## 목표

현재 GitHub Pages 배포 화면이 리포트 주장과 일치하는지 확인한다.  
이 Phase에서는 코드 수정 금지.

## 작업

다음 route를 실제 브라우저에서 확인한다.

```text
/workspace
/workspace/projects/intake
/workspace/projects
/workspace/approvals
/workspace/conflicts
/workspace/schedules
/workspace/notifications
/workspace/settings
/workspace/evaluation
```

각 route별로 아래 표를 작성한다.

```text
route
화면 제목
확인된 주요 UI
리포트 주장과 일치 여부
Plan 15~17 요구사항과 일치 여부
불일치 또는 의심사항
스크린샷 파일명 또는 확인 근거
```

## 중점 확인 항목

- 대시보드에 `월별 프로젝트 요약`과 월 선택이 있는가
- `/projects/intake`에 `수주 프로젝트 관리`, `개발팀 업무 리스트 관리` 탭이 있는가
- `/projects` 보드 탭 순서가 `개발팀 작업` → `외부 수주 프로젝트`인가
- 보드 컬럼 순서가 `착수 전` → `진행 중` → `완료` → `수정`인가
- `수정` 컬럼이 완료 오른쪽에 있는가
- 실사용 모드에서 더미 프로젝트가 기본 노출되지 않는가
- JSON 운영 상태와 JSON 불러오기/내보내기 버튼이 보이는가
- 인사카드/직원 목록 노출 방식이 화면을 과도하게 밀어내지 않는가
- 일정표가 직원 월간 그리드로 보이는가
- 설정 화면이 리포트의 “운영 설정 UI 제어” 주장과 실제로 일치하는가
- 알림/결재/충돌 데이터가 실제 workflow와 연결되어 있는가, 아니면 샘플 상태인가

## 금지사항

- 코드 수정 금지
- 배포 URL만 보고 “동작 완료”라고 단정 금지
- 버튼 존재만으로 기능 완료 처리 금지

## 완료 조건

- route별 검증표 작성
- 화면상 일치/불일치 목록 작성
- 실제 동작 검증이 필요한 항목 분리
- 다음 Phase에서 코드 대조 가능

## 완료 보고 형식

```text
[Phase 138 완료 보고]

1. 확인한 배포 URL
2. route별 검증 결과
3. 화면상 일치 항목
4. 화면상 불일치 항목
5. 화면은 있으나 동작 검증이 필요한 항목
6. 스크린샷/근거 파일
7. 코드 수정 여부: 없음
8. 다음 단계: Phase 139 진행 승인 요청

Phase 139를 진행해도 될까요?
```

---

# Phase 139 — 코드/데이터 구조 검증 및 리포트 주장 대조

## 목표

리포트 주장이 실제 코드에 존재하는지 확인한다.  
이 Phase에서는 코드 수정 금지.

## 작업

1. route 파일 확인
2. store 확인
3. type/interface 확인
4. selector 확인
5. component 확인
6. json 폴더 확인
7. scripts 확인
8. docs/QA Evidence 확인

각 리포트 주장 ID마다 아래 상태 중 하나를 부여한다.

```text
VERIFIED_CODE_AND_UI
VERIFIED_CODE_ONLY
VERIFIED_UI_ONLY
PARTIAL
DESIGN_ONLY
MISSING
UNTESTED
OUT_OF_SCOPE
```

## 필수 대조 항목

- JSON Handoff
- DataSourceMode
- PersonnelCard
- Organization
- Project Source Type
- Board Column Taxonomy
- Dispatch Workflow
- Schedule Request Workflow
- ApprovalRequest
- Notification
- AuditLog
- RevisionRequest
- PostDeliveryWorkRequest
- Schedule Conflict
- Employee Monthly Grid
- Evaluation Engine
- Data Quality Scanner
- Permission Simulator
- Admin Settings
- Excel Import Preview
- SavedView
- Attachment
- VersionSnapshot
- Soft Delete / Archive / Backup
- GitHub Pages basePath / routing

## 금지사항

- 코드 존재만으로 동작 완료 처리 금지
- 타입만 있다고 구현 완료 처리 금지
- 컴포넌트 이름만 있다고 workflow 완료 처리 금지
- 리포트 수정 금지

## 완료 조건

- 리포트 주장별 코드 대조 Matrix 작성
- 미구현/부분구현/검증필요 항목 분리
- 다음 Phase에서 실제 동작 테스트 가능

## 완료 보고 형식

```text
[Phase 139 완료 보고]

1. 확인한 파일/폴더 목록
2. 리포트 주장별 코드 대조 Matrix
3. VERIFIED_CODE_AND_UI 항목
4. PARTIAL 항목
5. DESIGN_ONLY 항목
6. MISSING 항목
7. UNTESTED 항목
8. 코드 수정 여부: 없음
9. 다음 단계: Phase 140 진행 승인 요청

Phase 140을 진행해도 될까요?
```

---

# Phase 140 — JSON Handoff E2E 검증

## 목표

Plan 15~17에서 핵심으로 정의한 JSON 저장/불러오기/handoff가 실제로 동작하는지 검증한다.  
이 Phase에서 기능 수정은 금지하고, 검증만 수행한다.

## 작업

1. 현재 데이터 export 실행
2. export JSON schema 확인
3. Plan 17 데이터가 포함되는지 확인
4. 의도적으로 잘못된 JSON 생성 후 validation 차단 여부 확인
5. 정상 JSON import preview 확인
6. apply 후 보드/일정/결재/인사카드 복원 여부 확인
7. `/json` 폴더 handoff 흐름 문서 확인
8. 정적 GitHub Pages에서 repo 직접 저장으로 오해되는 문구가 없는지 확인

## 필수 포함 데이터

```text
projects
tasks
taskWorkSegments
personnelCards
organizations
approvalRequests
scheduleAdjustmentRequests
revisionRequests
postDeliveryWorkRequests
notifications
auditLogs
workspaceSettings
dataSourceMode
```

## 실행 명령

가능한 경우 다음 명령을 실제 실행한다.

```bash
npm.cmd run json:validate
npm.cmd run json:import
npm.cmd run lint
npm.cmd run build
```

명령이 없으면 실패로 처리하지 말고 `script 없음`으로 기록한다.

## 완료 조건

- export/import/preview/apply/validation 검증 결과 기록
- script 실행 결과 기록
- 실패 시 원인 기록
- 수정 필요 항목을 다음 Phase 후보로 분리

## 완료 보고 형식

```text
[Phase 140 완료 보고]

1. JSON export 결과
2. JSON schema 확인 결과
3. Plan 17 데이터 포함 여부
4. validation 차단 테스트 결과
5. import preview/apply 결과
6. /json handoff 문서 확인 결과
7. 실행한 명령어와 결과
8. 실패/미확인 항목
9. 코드 수정 여부: 없음
10. 다음 단계: Phase 141 진행 승인 요청

Phase 141을 진행해도 될까요?
```

---

# Phase 141 — 핵심 Workflow E2E 검증

## 목표

리포트에서 주장한 PM 하달, 작업자 일정 조정, 결재, 수정 컬럼 workflow가 실제로 연결되어 있는지 검증한다.  
이 Phase에서는 필요한 경우에만 테스트 데이터 생성/삭제를 수행하고, 코드 수정은 금지한다.

## 테스트 시나리오

### Scenario A — 외부 수주 프로젝트

```text
1. 수주 프로젝트 생성
2. PM 배정
3. 보드 착수 전 자동 진입 확인
4. 착수 전 → 진행 중 이동 시 PM Dispatch Modal 강제 확인
5. TaskCard 생성
6. 작업자 지정
7. 일정 지정
8. 진행 중 확정
9. Notification 생성 확인
10. AuditLog 생성 확인
```

### Scenario B — 개발팀 업무

```text
1. 개발팀 업무 생성
2. targetDate 기준 관리 확인
3. 외부 deliveryDate 강제 여부 확인
4. 보드 착수 전 자동 진입 확인
5. 개발팀 작업 탭에만 표시되는지 확인
6. 수주 실적에 섞이지 않는지 확인
```

### Scenario C — 작업자 일정 조정

```text
1. 작업자 계정/권한으로 전환
2. 본인 task만 보이는지 확인
3. 일정 연장/추가 일정/세부 조정 요청
4. 요청 직후 원본 task dueDate 변경 없음 확인
5. ApprovalRequest 생성 확인
6. PM/부서장 승인 후 원본 데이터 동기화 확인
7. 반려 시 원본 유지 확인
```

### Scenario D — 수정 workflow

```text
1. 완료 프로젝트 선택
2. RevisionRequest 생성
3. 수정 컬럼으로 이동 확인
4. PostDeliveryWorkRequest와 데이터가 섞이지 않는지 확인
5. 수정 완료 처리
6. 완료 컬럼 복귀 확인
```

## 완료 조건

- 각 scenario의 성공/실패 기록
- 실제 생성된 데이터 ID 기록
- 테스트 데이터 정리 또는 보존 여부 기록
- Notification/AuditLog 생성 여부 확인
- 미작동 기능은 구현하지 말고 다음 Phase 후보로 기록

## 완료 보고 형식

```text
[Phase 141 완료 보고]

1. Scenario A 결과
2. Scenario B 결과
3. Scenario C 결과
4. Scenario D 결과
5. Notification 검증 결과
6. AuditLog 검증 결과
7. 원본 데이터 방어 로직 검증 결과
8. 실패/미확인 항목
9. 코드 수정 여부: 없음
10. 다음 단계: Phase 142 진행 승인 요청

Phase 142를 진행해도 될까요?
```

---

# Phase 142 — 권한/인사카드/조직/일정표 검증

## 목표

인사카드, 조직구조, 권한 스코프, 직원 일정표가 실제로 같은 기준 데이터를 사용하는지 검증한다.  
이 Phase에서는 코드 수정 금지.

## 작업

1. PersonnelCard canonical field 확인
2. CON-COST / VIET_QS 조직 구조 확인
3. systemRole과 organizationRank 분리 확인
4. active/inactive 직원 처리 확인
5. 직원 일정표가 ACTIVE PersonnelCard 기준인지 확인
6. SUPER_ADMIN, DEPARTMENT_MANAGER, PM, WORKER 권한별 화면 노출 확인
7. WORKER가 타 부서/PM/중간관리자 개인일정을 볼 수 없는지 확인
8. PM이 담당 프로젝트 범위만 보는지 확인
9. 중간관리자가 본인 부서 범위만 보는지 확인
10. 권한 시뮬레이터가 실제 selector와 같은 결과를 쓰는지 확인

## 완료 조건

- 권한별 접근 Matrix 작성
- 인사카드-조직-일정표 연결 확인
- 권한 우회 가능성 기록
- 미작동 항목은 구현하지 말고 다음 Phase 후보로 기록

## 완료 보고 형식

```text
[Phase 142 완료 보고]

1. PersonnelCard 검증 결과
2. 조직구조 검증 결과
3. systemRole/organizationRank 분리 검증 결과
4. 직원 일정표 연결 검증 결과
5. 권한별 접근 Matrix
6. 권한 시뮬레이터 검증 결과
7. 권한 우회 가능성
8. 코드 수정 여부: 없음
9. 다음 단계: Phase 143 진행 승인 요청

Phase 143을 진행해도 될까요?
```

---

# Phase 143 — 운영 안정화 기능 검증: Data Quality, Import Preview, SavedView, Attachment, Backup

## 목표

Plan 4, 9, 13에서 요구한 운영 안정화 기능이 실제 구현/설계/미구현 중 어디에 해당하는지 분류한다.  
이 Phase에서는 코드 수정 금지.

## 검증 항목

```text
Data Quality Dashboard
Excel Import Preview
BLOCKER/WARNING/INFO 분류
sourceRow/sourceColumn 추적
대량 수정 Preview/Apply
SavedView
검색/필터
Attachment URL 기반 산출물
Soft Delete
Archive
Backup
VersionSnapshot
Change Request 전후 비교
부재중/대리승인/퇴사자 재배정
알림 묶음/요약 알림
```

## 분류 기준

```text
IMPLEMENTED_AND_TESTED
IMPLEMENTED_NOT_TESTED
DESIGN_ONLY
MISSING
DEFERRED
NOT_IN_MVP
```

## 완료 조건

- 운영 안정화 기능별 상태표 작성
- MVP/확장 범위 구분
- 리포트 수정 필요 문구 목록 작성
- 다음 Phase에서 리포트 정정 가능

## 완료 보고 형식

```text
[Phase 143 완료 보고]

1. 운영 안정화 기능 상태표
2. IMPLEMENTED_AND_TESTED 항목
3. DESIGN_ONLY 항목
4. MISSING 항목
5. DEFERRED/NOT_IN_MVP 항목
6. 리포트 수정 필요 문구
7. 코드 수정 여부: 없음
8. 다음 단계: Phase 144 진행 승인 요청

Phase 144를 진행해도 될까요?
```

---

# Phase 144 — 최소 UI/문구/리포트 불일치 수정 Patch

## 목표

Phase 137~143에서 확인된 불일치 중, 대규모 기능 개발 없이 고칠 수 있는 UI 문구, 리포트 표현, route 노출, empty state, 안내 문구만 수정한다.

## 수정 허용 범위

- 과장된 리포트 문구 보수화
- `구현 완료 / 화면 반영 / 설계 반영 / 검증 필요 / 추후 확장` 표기 추가
- 정적 GitHub Pages JSON 저장 한계 안내 문구 보강
- empty state 문구 개선
- 더미데이터/JSON 운영 모드 안내 개선
- 메뉴/탭/컬럼 오탈자 수정
- settings 화면의 “백엔드 연동 이후 반영” 문구와 리포트 주장 불일치 정리
- 사용자 선택 드롭다운이 헤더에 과도하게 노출되는 UI 개선
- route 새로고침 404가 있으면 `404.html` 또는 static export 안내 보강

## 수정 금지 범위

- 새 workflow 대규모 구현
- store 전면 개편
- 권한 구조 전면 리팩터링
- DB/API 연동
- 파일 업로드/S3 구현
- 외부 알림 연동
- 승인 없이 새 기능 추가

## 완료 조건

- 최소 수정만 반영
- 리포트 과장 표현 제거
- UI 안내 문구 개선
- lint/build 실행
- Git diff가 Phase 목적에 맞음

## 완료 보고 형식

```text
[Phase 144 완료 보고]

1. 수정한 파일 목록
2. 수정한 리포트 문구
3. 수정한 UI/안내 문구
4. 수정하지 않고 다음 Phase 후보로 넘긴 항목
5. lint 결과
6. build 결과
7. Git diff 요약
8. 커밋 메시지 및 커밋 해시
9. 다음 단계: Phase 145 진행 승인 요청

Phase 145를 진행해도 될까요?
```

커밋 메시지:

```text
phase-144: correct final report wording and minimal validation ui gaps
```

---

# Phase 145 — Plan 18 최종 QA Evidence Matrix 및 Push 승인 요청

## 목표

Plan 18 검증 결과를 최종 문서화하고 사용자에게 push 승인 요청을 한다.  
이 Phase에서는 새 기능 구현 금지.

## 작업

1. `docs/workspace_plan18_verification_matrix.md` 작성 또는 업데이트
2. `docs/integrated-workspace-report.md` 또는 기존 최종 리포트 보수화
3. route별 화면 검증 결과 반영
4. 코드 대조 Matrix 반영
5. JSON Handoff E2E 검증 결과 반영
6. Workflow E2E 검증 결과 반영
7. 권한 Matrix 반영
8. 운영 안정화 기능 구현/설계/미구현 구분 반영
9. lint/build/test 결과 반영
10. Git 상태 확인
11. 커밋 로그 확인
12. GitHub Pages 배포 URL 확인
13. 남은 리스크 작성
14. 사용자에게 push 승인 요청

## 최종 리포트 결론 문구 기준

금지 문구:

```text
완벽히 수행
모든 기능 완비
운영툴로 완성
100% 완료
프로덕션 준비 완료
```

권장 문구:

```text
현재 Workspace는 GitHub Pages 기반의 프론트엔드 프로토타입으로,
수주/개발 업무 분리, 프로젝트 보드, JSON 운영 모드, 일정표, 결재/충돌/평가 화면 등 핵심 UI와 일부 workflow를 제공한다.
다만 실제 운영 전에는 JSON handoff E2E, 권한 selector, 알림/AuditLog 영구화, Data Quality, 백엔드 DB, 파일 스토리지, 외부 알림 연동에 대한 추가 검증 또는 구현이 필요하다.
```

## 완료 조건

- Plan 18 검증 Matrix 존재
- 최종 리포트가 보수적으로 정리됨
- 실제 검증 결과가 반영됨
- 실패/미확인 항목이 숨겨지지 않음
- lint/build/test 결과가 기록됨
- Git 상태가 정리됨
- 사용자에게 push 승인 요청

## 완료 보고 형식

```text
[Phase 145 완료 보고]

1. Plan 18 전체 검증 요약
2. 작성/수정한 문서
3. route별 화면 검증 결과
4. 코드 대조 Matrix 결과
5. JSON Handoff E2E 결과
6. Workflow E2E 결과
7. 권한/인사카드/조직 검증 결과
8. 운영 안정화 기능 상태
9. 수정한 리포트 결론
10. lint/build/test 결과
11. 커밋 메시지 및 커밋 해시
12. 남은 리스크
13. Git 상태
14. GitHub Pages URL 확인 결과
15. GitHub push 승인 요청

원격 저장소에 push를 진행해도 될까요?
```

---

## 4. Plan 18 추가 금지사항

- 리포트에 적혀 있다는 이유로 완료 처리하지 마라.
- 배포 화면에 버튼이 있다는 이유만으로 동작 완료 처리하지 마라.
- 타입 또는 interface가 있다는 이유만으로 workflow 완료 처리하지 마라.
- 샘플 데이터가 보인다고 실제 JSON 운영 데이터라고 단정하지 마라.
- 알림 페이지가 있다고 Notification 생성이 완료되었다고 단정하지 마라.
- 결재 페이지가 있다고 승인 routing이 완료되었다고 단정하지 마라.
- 권한 시뮬레이터 UI가 있다고 실제 permission selector와 연결되었다고 단정하지 마라.
- lint/build/test를 실행하지 않고 PASS라고 쓰지 마라.
- test script가 없으면 `test script 없음`이라고 기록하라.
- Git 커밋 해시를 실제 커밋 없이 쓰지 마라.
- GitHub Pages 배포 완료를 실제 URL 확인 없이 쓰지 마라.
- 사용자 승인 없이 다음 Phase를 시작하지 마라.
- 사용자 승인 없이 원격 push하지 마라.

---

# Antigravity 실행용 시작 프롬프트

아래 내용을 Antigravity 채팅창에 그대로 입력한다.

```text
현재 F:\workspace 프로젝트의 Plan 18 작업을 시작한다.

중요 전제:
- Plan 단계가 뒤로 갈수록 더 최신 요구사항이다.
- Plan 18은 새 기능 추가가 아니라, Plan 1~17 요구사항과 workspace_final_comprehensive_report.md의 구현 주장을 실제 화면/코드/테스트 증빙과 대조하는 검증 전용 Plan이다.
- 리포트의 “완료”, “완벽히”, “완비”, “100%” 표현은 실제 코드, 실제 배포 화면, 실제 테스트 결과, 실제 커밋 증빙이 있을 때만 유지한다.
- 증빙이 없으면 구현 완료가 아니라 설계 반영/화면 일부 반영/검증 필요/추후 확장으로 낮춰 표기한다.
- 사용자 승인 없이 다음 Phase로 넘어가지 말고, 사용자 승인 없이 GitHub 원격 push하지 마라.

먼저 Phase 137만 진행한다.
코드 수정, 리포트 수정, 기능 구현은 하지 마라.

Phase 137 목표:
1. 작업 폴더 내 Plan 파일 목록 확인
2. 중복 Plan 파일 감지
3. Plan 1~17 최신순 우선순위 정리
4. workspace_final_comprehensive_report.md의 주장 항목 전부 추출
5. 각 주장에 RPT-001 형식의 ID 부여
6. 검증 대상 Matrix 초안 작성
7. Phase 138 진행 승인 요청

Phase 137 완료 보고 형식:

[Phase 137 완료 보고]

1. 확인한 Plan 파일 목록
2. 중복 Plan 파일 여부
3. 최신순 우선순위 적용 결과
4. 리포트 주장 ID 목록
5. 검증 대상 Matrix 초안
6. 코드 수정 여부: 없음
7. 다음 단계: Phase 138 진행 승인 요청

Phase 138을 진행해도 될까요?
```
