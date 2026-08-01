# Workspace 통합 마스터 리포트 (Plan 1 ~ Plan 17 최종본)

본 문서는 **EUMDI OS Workspace** 프로젝트의 기획 및 구현 내역(Plan 1부터 Plan 17까지)을 하나도 빠짐없이 종합한 최종 마스터 리포트입니다. 초기 MVP 아키텍처 구성부터 실무 기반의 PM 하달 및 결재 워크플로우 통제(Plan 17)까지, 현재 시스템에 반영된 모든 기능과 인프라 구조를 상세히 기술합니다.

---

## 1. 기반 아키텍처 및 코어 시스템

### 1.1. 기술 스택
- **프레임워크**: Next.js 14+ (App Router)
- **스타일링**: Tailwind CSS, Lucide Icons
- **상태 관리**: Zustand (클라이언트 사이드 전역 상태 및 `localStorage` 기반 Persist). `authStore`, `projectStore`, `taskStore`, `uiStore` 등 기능별 스토어 모듈화.
- **운영 환경**: 서버리스/정적 웹 호스팅(GitHub Pages) 대응을 위한 클라이언트 런타임 아키텍처 구현 (일부 백엔드 종속 기능 제한적).
- **반응형 UI 체계**: 접기/펴기(Compact/Expanded)가 가능한 유연한 좌측 사이드바 및 화면 크기에 맞춘 Grid/List 반응형 레이아웃 구현.

### 1.2. 조직 및 계정 체계 (Personnel & Organization)
- **멀티 컴퍼니 지원**: `CON_COST`(한국 본사)와 `VIET_QS`(베트남 지사)로 회사를 구분.
- **부서 및 직급**: 건축, 구조(Slab/Wall 등), 토목 등 부서(Department)와 파트(SubDepartment) 분리. CEO부터 Trainee까지 직급(Organization Rank) 체계화.
- **권한(Role) 모델**: 
  - `SUPER_ADMIN` / `SYSTEM_ADMIN`: 전체 시스템 제어 및 운영 설정 접근.
  - `DEPARTMENT_MANAGER`: 소속 부서원 일정 및 평가 열람, 부서 단위 결재.
  - `PM`: 담당 프로젝트 스케줄링, 업무 하달(Dispatch), 완료 검토.
  - `WORKER`: 개인 할당 업무 처리, 일정 변경 요청.

### 1.3. JSON Handoff 아키텍처 (운영 대비)
- 백엔드 DB 부재를 극복하기 위해 **JSON Export/Import** 스크립트 모듈 지원.
- `WorkspaceExportData` 규격을 통해 프로젝트, 업무, 결재, 알림, 설정 등 모든 Zustand 스토어 데이터를 단일 JSON 파일로 직렬화.
- 데이터 정합성 검사(Validation) 스크립트는 존재하나, 현재 Zod 레벨의 엄격한 스키마 검증 및 UI 단의 완벽한 미리보기(Preview) 덮어쓰기 로직은 추가 구현이 필요합니다.

---

## 2. 프로젝트 관리 (Project & Board)

### 2.1. 수주 및 개발 분리 (Intake)
- **Project Source Type**: 클라이언트로부터 수주한 `CLIENT_ORDER`와 내부 R&D 및 시스템 구축을 위한 `INTERNAL_DEVELOPMENT`를 완벽히 분리.
- **독립된 탭**: `/projects/intake`에서 '수주 프로젝트 관리'와 '개발팀 업무 리스트 관리'를 분리하여 관리.
- **납품일 제약 분리**: 개발팀 업무는 외부 납품일(Delivery Date)에 구애받지 않고 내부 목표일(Target Date)로 관리.

### 2.2. 프로젝트 보드 (Kanban)
- **탭 정렬**: `개발팀 작업` ➡️ `외부 수주 프로젝트` 순서로 상단 탭 렌더링.
- **4단 컬럼**: 
  1. `착수 전 (PRE_WORK)`
  2. `진행 중 (IN_PROGRESS)`
  3. `완료 (COMPLETED)`
  4. `수정 (REVISION)`
- **자동 진입 로직**: 신규 프로젝트(수주/개발 무관) 생성 시 즉시 `착수 전` 컬럼으로 자동 배치.
- **납품일 임박도 현황판**: 납품 D-Day(Due Today, 1 Week, 2 Weeks 등) 배지 시각화 및 그리드 레이아웃.

---

## 3. 핵심 업무 흐름 (Workflow & Dispatch)

### 3.1. PM 업무 하달 (Dispatch Workflow)
- **단순 상태 변경 금지**: `착수 전`에서 `진행 중`으로 드래그 시, 프로젝트의 상태만 바뀌는 것을 차단.
- **PmDispatchModal 트리거**: 드래그 즉시 하달 모달이 강제 호출되며, PM이 세부 업무(TaskCard)를 분할하고 실제 작업자(Worker)와 일정을 지정해야만 `진행 중`으로 확정.
- 이 과정에서 작업자에게 **알림(Notification)**이 발송됩니다. (단, **AuditLog**는 브라우저 콘솔 출력 레벨로만 지원되며 영구 저장소는 미구현 상태입니다.)

### 3.2. 작업자 일정 조정 및 결재 (Schedule Request)
- 작업자는 할당받은 업무에 대해 `ScheduleRequestModal`을 통해 일정 연장 또는 추가 조정을 요청.
- **데이터 방어 로직**: 요청 즉시 원본 Task의 마감일(dueDate)이나 상태가 변조되지 않으며, `ApprovalRequest` 상태로 대기(PENDING).
- PM 또는 부서장이 결재 승인(APPROVED)을 해야만 비로소 원본 데이터가 안전하게 동기화.

### 3.3. 사후 업무 프로세스
- **클라이언트 수정 요청 (Revision)**: 완료된 프로젝트에 수정 발생 시 `RevisionRequest`를 생성. 보드 렌더러가 이를 감지하여 프로젝트를 `수정(REVISION)` 컬럼으로 즉시 자동 이동. 수정 완료 시 다시 `완료` 컬럼으로 원복.
- **내부 추가 업무 (Post-Delivery Work)**: 내부 검토 후 추가 보완이 필요한 경우 `PostDeliveryWorkRequest` 생성 및 관리.

---

## 4. 업무 포털 및 통합 워크플로우

### 4.1. 대시보드 (Dashboard)
- **권한별 맞춤 뷰**: 로그인한 사용자의 권한(`SUPER_ADMIN`, `PM`, `WORKER` 등)에 따라 개인 할당 업무, 부서 전체 현황, 회사 전체 프로젝트 진행률을 차등 제공.
- **월별 통계 조회**: 좌측 상단 월 선택기(Month Picker)를 통해 과거 또는 미래 월의 수주 및 개발 업무 현황, 리소스 배분 상태를 교차 필터링하여 조회.

### 4.2. 결재 체계 및 보관함 (Approvals)
- **결재 라우팅**: 일정 연장 요청이나 주요 데이터 변경 발생 시 `PENDING` ➡️ `PM_REVIEWING` ➡️ `MANAGER_REVIEWING` ➡️ `APPROVED` 순차 결재.
- **전용 보관함**: `/approvals` 탭에서 자신이 승인권자로 지정된 결재 대기 건들을 모아보고, 일괄 승인/반려(Reject) 처리. 

### 4.3. 일정표 및 충돌 관리 (Calendar & Conflicts)
- **VN Excel Seed 연동**: 베트남 지사의 월별 엑셀 스케줄표 형식을 파싱하여 `TaskWorkSegment` 형태의 개인 일정표 렌더링 지원.
- **연속 업무 그룹핑**: 동일 Project, Scope, Assignee의 연속된 일자를 하나의 `TaskCard`로 자동 묶음 처리.
- **일정 충돌 감지 및 해결 (Conflicts)**: 개인의 하루 업무 할당량이 기준(예: 8시간)을 초과하거나 중복된 경우, 시스템이 이를 감지하여 `/conflicts` 전용 탭에 노출. PM 및 부서장이 해당 충돌을 모니터링하고 조정 가능.

### 4.4. 작업자 전용 뷰 및 알림 센터
- **내 업무 (My Tasks)**: `/tasks/my` 탭을 통해 작업자(Worker)는 본인에게 할당된 업무만 모아서 볼 수 있는 전용 칸반(Kanban) 뷰 제공.
- **알림 센터 (Notifications)**: PM 하달, 결재 승인/반려, 수정 요청 등 주요 이벤트 발생 시 우측 상단 헤더 종소리 아이콘 및 `/notifications` 페이지를 통해 내역을 확인하고 읽음(Read) 처리 가능.

---

## 5. 성과 평가 엔진 (QC & Evaluation)

- **면적 기반 공수 보정**: 기준 면적(예: 50,000평) 대비 실제 프로젝트 면적을 바탕으로 작업자의 공수(Workload) 및 난이도 보정 계수 자동 산출.
- **QC 결함 페널티 (Weighting)**: QC(품질 검수) 과정에서 발견된 오류 유형별로 10%~100% 가중치를 부과하여 최종 평가 점수(Score)에서 삭감.
- **평가 대시보드 (`/evaluation`)**: 완료된 프로젝트에 대해 관리자가 QC 오류를 입력하고 최종 성과를 열람/확정할 수 있는 전용 평가 UI.
- **예외 처리 (Zero Division)**: 작업량이 0인 직원에 대한 에러율 계산 시 `NaN` 또는 무한대(Infinity)가 발생하지 않도록 수학적 방어 로직 탑재.
- **평가 잠금 (Lock)**: 특정 시점 이후 평가가 확정되면 추가적인 QC 오류 등록을 차단하는 결산 기능.

---

## 6. 시스템 관리 및 검증 도구 (Admin Tools)

- **사원 및 조직도 관리 (Personnel)**: `/settings/personnel` 탭에서 신규 입사자 등록, 상태 변경(휴직/퇴사), 직급 및 권한 레벨 조정, 소속 부서 이동 등을 관리.
- **운영 설정 (Settings)**: 긴급 납품일 기준(일수), Scope 정규화 맵핑 딕셔너리, 보드 기본 뷰 등 시스템 코어 설정값을 UI에서 제어(`settingStore`).
- **권한 시뮬레이터 (Impersonation)**: 최고 관리자가 타 직원의 계정 뷰포인트로 일시적 전환하여 접근 권한(Role)을 디버깅 및 시각적 검증.
- **운영 검증 모드 전환**: 시스템 헤더에서 `DAILY_WORK`(일상 업무 모드)와 `ADMIN_VALIDATION`(관리자 검증 모드)을 토글하여, 관리자 전용 숨김 메뉴 활성화 및 안전한 더미 데이터 주입 모드 활성화.
- **데이터 품질 검사기 (Data Quality)**: 고아(Orphan) 태스크, 납품일-배지 불일치, 완료 프로젝트 내 미결 요청 방치 등 무결성이 깨진 데이터를 식별하고 경고하는 대시보드.
- **일괄 마감 (Bulk Action)**: 납품일이 지난 프로젝트 중 미결 업무가 없는 항목을 일괄 `COMPLETED`로 전환하는 Danger Zone 기능.

---

## 7. 향후 보강 대상 (Known Limitations & Next Steps)

현재 시스템은 100% 클라이언트 사이드(Frontend-only) 상태로 완벽히 동작하도록 최적화되어 있으나, 실서버 운영을 위해 향후 다음 항목들이 요구됩니다.

1. **Backend Database 연동**: Zustand Store 및 JSON Handoff를 RDBMS(PostgreSQL 등) 및 REST API 기반으로 마이그레이션.
2. **알림(Notification) 및 AuditLog 영구화**: 현재 런타임/콘솔에 의존하는 알림 및 Audit 로그를 서버 통신을 통해 영구 저장하고 이메일, 메신저(Slack/Teams)와 연동.
3. **보안 및 세션 만료**: 장기 미접속 시 자동 로그아웃을 처리하는 JWT/Session 매니지먼트.
4. **산출물 (File Attachment)**: 파일 첨부 기능은 데이터 모델(Design) 수준으로만 설계되어 있으며, 실제 S3 클라우드 스토리지 연동 및 파일 업로드 UI는 미구현 상태입니다.

---

**[결론]**
현재 Workspace는 GitHub Pages 기반의 프론트엔드 프로토타입으로, 수주/개발 업무 분리, 프로젝트 보드, JSON 운영 모드, 일정표, 결재/충돌/평가 화면 등 핵심 UI와 일부 workflow를 제공합니다. 
다만 실제 운영 전에는 JSON handoff E2E, 권한 selector 무결성, 알림/AuditLog 영구화, Data Quality, 백엔드 DB, 파일 스토리지 연동에 대한 추가 검증 또는 구현이 반드시 필요합니다.
