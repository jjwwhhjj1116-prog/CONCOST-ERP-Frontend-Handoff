# PHASE350 UI ROUTE & CTA INVENTORY REPORT

## 1. 개요
애플리케이션 내의 전체 정적 라우트(Route) 구조와 각 화면별 주요 탭, 모달, 기본 액션 버튼(Primary CTA), 역할별 접근 통제 요소를 인벤토리로 정리했습니다.

## 2. 주요 Route 인벤토리

### 2-1. 대시보드 및 공통 내비게이션
- **`/` (Home Dashboard)**
  - **탭/뷰**: CEO/COO Dashboard, Worker Dashboard, Manager Dashboard 
  - **모달**: 없음
  - **CTA**: 역할별 요약 정보 바로가기 버튼

- **`/notifications` (알림)**
  - **모달**: 없음
  - **CTA**: '전체 읽음 처리'
  - **Role**: ALL

### 2-2. 업무 및 프로젝트 관리
- **`/projects` (프로젝트 목록)**
  - **탭/뷰**: 활성 프로젝트, 완료된 프로젝트 
  - **모달**: 없음
  - **CTA**: 프로젝트 진입 버튼
  - **Role**: ALL (접근 가능 범위는 부서/할당에 따라 다름)

- **`/projects/intake` (신규 수주/개발 업무 목록 - Plan 28)**
  - **모달**: `TaskDetailModal`, `PmDispatchModal`
  - **내부 탭**: TaskDetailModal 내 [정보], [공정 템플릿(ProcessTemplateTab)] 탭
  - **CTA**: 'PM 배정', '공정 템플릿 적용', '일정 저장 및 승인 요청'
  - **Role**: SUPER_ADMIN, DEPARTMENT_MANAGER (PM 배정), PM (일정 초안 및 승인 요청)

- **`/tasks/my` (내 업무)**
  - **모달**: 업무 완료/상태 변경 보고 모달
  - **CTA**: '업무 시작', '진행률 업데이트', '완료 처리'
  - **Role**: WORKER (담당자로 지정된 사용자)

### 2-3. 일정 및 승인 관리
- **`/approvals` (승인 대기함)**
  - **뷰**: 내가 요청한 승인(PM), 내가 검토할 승인(MANAGER)
  - **모달**: 승인/반려 처리 모달
  - **CTA**: '승인', '반려 (사유 입력 필수)'
  - **Role**: PM, DEPARTMENT_MANAGER, SUPER_ADMIN

- **`/schedules` (통합 일정표 - Plan 27)**
  - **뷰**: 월간 일정표 그리드, 인력 필터(임원 제외, 휴가자 표시)
  - **CTA**: 월 변경(Prev/Next), 담당자 필터링
  - **Role**: ALL

- **`/conflicts` (충돌 감지 및 해소)**
  - **뷰**: 리소스 부하 및 일정 충돌 목록
  - **CTA**: 충돌된 일정 바로가기
  - **Role**: DEPARTMENT_MANAGER, PM

### 2-4. 평가 및 품질
- **`/evaluation` (프로젝트/인사 평가)**
  - **모달**: `ProjectEvaluationModal`, `QcIssueModal`
  - **CTA**: '평가 확정', 'QC 이슈 등록'
  - **Role**: DEPARTMENT_MANAGER, QA 담당

### 2-5. 시스템 설정 (`/settings/*`)
- **`/settings` (설정 홈)**: 내 정보, 다크 모드 토글 (기능 확인됨)
- **`/settings/workspace`**: 워크스페이스 전역 설정
- **`/settings/personnel`**: 인력풀 데이터 관리
- **`/settings/import`**: JSON Import/Export 시스템 (데이터 Round-trip)
- **`/settings/translation`**: 다국어(LibreTranslate) 번역 Provider 설정
- **`/settings/permissions`**: 권한 및 역할 부여
- **`/settings/data-quality`**: 데이터 정합성 검토
- **`/settings/bulk-edit`**: 대량 상태 변경 도구

## 3. 클릭 가능하지만 동작 확인(E2E)이 필요한 CTA (위험 요소)
아래 버튼들은 UI 상에 노출되어 있으나 실제 권한 방어(Store Guard) 및 연쇄 상태 전이가 완벽히 동작하는지 추가 검증(Phase 352~)이 필수적인 요소입니다.
- `TaskDetailModal` 내 **[승인 요청]** 버튼: 클릭 시 정말로 임시(Draft) 상태를 유지하고 공식 일정에 노출시키지 않는가?
- `ProcessTemplateTab` 내 **[공정 템플릿 적용]** 버튼: 적용 후 기존 데이터가 덮어씌워지지 않는가?
- `Approvals` 모달의 **[반려]** 버튼: 사유 입력이 없을 때 클릭을 차단하는가?
- 통합 일정표의 **[작업자 표시/숨김]** 필터: CEO/COO가 정말 기본으로 제외되어 렌더링되는가?
