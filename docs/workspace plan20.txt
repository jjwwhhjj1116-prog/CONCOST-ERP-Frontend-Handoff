# WORKSPACE PLAN 20 — 배포 사이트 전수검수, 탭별 클릭 검증, 오류 재현/증빙/개선 Phase 통제 프롬프트

이 프롬프트는 기존 `workspace plan1.txt`부터 `workspace plan19.txt` 이후에 추가되는 스무 번째 보강 지시사항이다.

Plan 20의 목적은 새로운 기능을 구현하는 것이 아니라, 현재 배포되어 있는 Workspace 사이트를 Google Antigravity가 실제 브라우저에서 직접 열고, 모든 메뉴·탭·버튼·모달·폼·권한 전환·JSON 입출력·업무 흐름을 하나씩 눌러가며 오류를 찾는 **전수 검수 전용 Plan**이다.

검수 대상 사이트:

```text
https://eumditravel-oss.github.io/workspace/
```

중요 전제:

- Plan 단계는 뒤로 갈수록 최신 요구사항이 우선이다.
- Plan 20은 Plan 1~19를 대체하지 않는다.
- Plan 20은 Plan 1~19의 실제 구현 결과를 배포 사이트 기준으로 검증하는 QA/검수 Plan이다.
- 기능 구현, 디자인 수정, 코드 리팩토링은 기본 범위가 아니다.
- 오류가 발견되더라도 즉시 수정하지 말고, 재현 절차와 증빙을 먼저 남긴다.
- 수정이 필요한 경우에는 별도 Patch Phase 또는 Plan 21 후보로 분리한다.
- 사용자 승인 없이 다음 Phase로 넘어가지 않는다.
- 사용자 승인 없이 코드 수정하지 않는다.
- 사용자 승인 없이 GitHub 원격 push하지 않는다.
- 검수하지 않은 항목을 “정상”이라고 쓰지 않는다.
- 화면에서 직접 확인하지 않은 기능을 “완료”라고 쓰지 않는다.
- 코드에서만 확인하고 화면에서 확인하지 못한 것은 “코드상 존재 / 화면 검증 필요”로 표기한다.
- 화면에서만 확인하고 코드 흐름을 확인하지 못한 것은 “화면상 존재 / 로직 검증 필요”로 표기한다.
- 오류가 없다는 표현은 해당 Phase의 지정 범위 내에서만 사용한다.

---

## 0. Phase 진행 통제 규칙

Antigravity는 각 Phase를 시작하기 전 반드시 사용자에게 승인 요청을 해야 한다.

각 Phase 시작 전에는 아래 형식으로만 보고한다.

```text
[Phase XXX 진행 승인 요청]

이번 Phase 목적:
- ...

검수 대상 화면/route:
- ...

실제 클릭/조작할 항목:
- ...

이번 Phase에서 하지 않을 일:
- 코드 수정 금지
- 원격 push 금지
- 다음 Phase 선행 금지

예상 산출물:
- 검수 결과표
- 오류 목록
- 재현 절차
- 스크린샷/콘솔/네트워크 증빙 경로

진행하려면 다음 문구로 승인해 주세요.
"Phase XXX 진행 승인"
```

사용자가 정확히 승인하기 전에는 해당 Phase를 시작하지 않는다.

각 Phase 완료 후에는 아래 형식으로만 보고한다.

```text
[Phase XXX 완료 보고]

검수한 항목:
- ...

정상 확인:
- ...

오류/의심사항:
- [ISSUE-XXX-001] ...

증빙:
- screenshot: ...
- console log: ...
- network log: ...

판정:
- PASS / PARTIAL / FAIL / BLOCKED

다음 Phase:
- Phase XXX+1은 아직 시작하지 않음
- 진행 전 사용자 승인 필요
```

---

## 1. 검수 기본 환경

### 1-1. 브라우저 기준

가능하면 Playwright 또는 Chrome DevTools를 사용해 실제 사용자와 동일하게 클릭한다.

기본 검수 viewport:

```text
Desktop: 1440 x 900
Laptop: 1366 x 768
Tablet: 768 x 1024
Mobile: 390 x 844
```

모든 Phase에서 모든 viewport를 반복하지 않는다. 화면 레이아웃 검증 전용 Phase에서 집중 검수한다.

### 1-2. 증빙 저장 위치

프로젝트 루트 기준 아래 폴더를 만든다.

```text
qa/plan20/
  screenshots/
  console-logs/
  network-logs/
  reports/
  issue-matrix/
```

단, 사용자 승인 전에는 Git 커밋하지 않는다.

### 1-3. 오류 등급

```text
S0 Blocker
- 사이트 진입 불가
- 주요 route 전체 깨짐
- 데이터 유실
- 저장/불러오기 불가
- 권한 우회로 민감 데이터 노출

S1 Critical
- 핵심 업무 흐름 진행 불가
- 프로젝트 생성/하달/결재/일정 변경/JSON handoff 중단
- 승인 없이 원본 데이터 변경
- 새로고침 후 데이터 상태 붕괴

S2 Major
- 특정 탭/버튼/모달 오류
- 화면과 데이터 불일치
- 검수 가능한 기능이 일부 누락
- 레이아웃이 업무 사용에 지장

S3 Minor
- 문구, 정렬, 간격, 빈 상태 안내, 버튼 라벨 오류

S4 Enhancement
- 기능은 정상이나 개선하면 좋은 항목
```

### 1-4. Issue 기록 형식

모든 오류는 아래 형식으로 기록한다.

```text
Issue ID: PLAN20-PHXXX-###
Severity: S0/S1/S2/S3/S4
Status: Open / Needs Repro / Confirmed / Fixed Later / Won't Fix
Route:
Viewport:
Role:
Precondition:
Steps to Reproduce:
Expected Result:
Actual Result:
Evidence:
Console Error:
Network Error:
Related Plan:
Likely Cause:
Fix Direction:
Requires Code Change: Yes/No
Requires User Approval Before Fix: Yes
```

---

## 2. 검수 범위 우선순위

검수는 다음 순서로 진행한다.

```text
1. 사이트 진입/라우팅/전역 레이아웃
2. 모든 메뉴와 탭 클릭
3. 대시보드 및 JSON 운영
4. 프로젝트 등록/개발팀 업무 등록
5. 프로젝트 보드/드래그/하달 모달
6. 결재/충돌/일정표/알림
7. 설정/인사카드/권한/운영 검증
8. 성과평가 및 숨은 route
9. 권한별 화면 노출
10. 새로고침/반응형/콘솔/네트워크
11. E2E 업무 흐름
12. 오류 Matrix 및 개선 Plan 후보 작성
```

---

## 3. Phase 세부 구성

아래 Phase는 모두 독립적으로 승인받고 진행한다. 한 번에 여러 Phase를 묶어서 진행하지 않는다.

---

# Phase 156 — 검수 준비, Plan 1~20 기준 재정렬, 수정 금지 선언

목표:
- Plan 1~19와 Plan 20의 관계를 정리한다.
- 뒤로 갈수록 최신 Plan이 우선이라는 규칙을 확정한다.
- 이번 작업이 기능 개발이 아니라 배포 사이트 검수임을 고정한다.

작업:
- 현재 프로젝트 폴더에서 plan 파일 목록 확인
- workspace_final_comprehensive_report.md 존재 여부 확인
- Plan 18, Plan 19 파일 존재 여부 확인
- 검수 폴더 구조 생성 여부만 확인
- 코드 수정 금지

완료 조건:
- 검수 기준 문서 목록 작성
- 수정 금지 선언 포함
- Phase 157 진행 승인 요청

---

# Phase 157 — 배포 URL 접속성 및 route inventory 작성

목표:
- 배포 사이트에 실제 접속한다.
- 눈에 보이는 모든 메뉴/링크/탭/숨은 route 후보를 inventory로 만든다.

검수 대상:
```text
https://eumditravel-oss.github.io/workspace/
```

작업:
- 루트 접속
- HTTP status 확인
- GitHub Pages base path 확인
- 화면 상단/좌측 메뉴 링크 추출
- 페이지 내 추가 링크 추출
- 코드 route 폴더가 있으면 실제 route와 비교

완료 조건:
- route_inventory.md 작성
- route별 검수 우선순위 작성
- 클릭하지 못한 링크는 별도 표시

---

# Phase 158 — 전역 레이아웃, 헤더, 사이드바, 사용자 전환 영역 검수

목표:
- 모든 화면에 공통 적용되는 레이아웃 문제를 먼저 찾는다.

작업:
- 로고/서비스명 확인
- 사이드바 메뉴 확인
- 현재 선택 메뉴 active 상태 확인
- 사용자/권한 전환 UI 확인
- 실사용 모드/운영 검증 모드 표기 확인
- 데이터 상태 표기(JSON 운영 등) 확인
- 긴 베트남 이름이 헤더/사이드바를 깨뜨리는지 확인

완료 조건:
- 전역 레이아웃 issue matrix 작성
- menu_active_state 검수표 작성

---

# Phase 159 — 브라우저 콘솔/네트워크 baseline 검수

목표:
- 기능 클릭 전 기본 로딩 상태의 오류를 수집한다.

작업:
- 각 route 최초 진입 시 console error/warning 수집
- network 404/500/CORS/mixed content 확인
- favicon, chunk, css, js 로딩 실패 확인
- 새로고침 시 404 발생 여부 확인

완료 조건:
- console_baseline.md 작성
- network_baseline.md 작성
- S0/S1 오류가 있으면 즉시 보고 후 다음 Phase 보류

---

# Phase 160 — 대시보드 기본 정보 및 월별 프로젝트 요약 검수

검수 route:
```text
/workspace/
```

작업:
- 통합 대시보드 제목 확인
- 월별 프로젝트 요약 문구 확인
- 전체 월 조회/월 선택 버튼 클릭
- 진행 중 프로젝트, 납품 경과 프로젝트, 결재/승인 대기, 지연/충돌 업무 수치 확인
- 빈 상태 메시지 확인
- JSON 불러오기/내보내기/수주 프로젝트 등록/개발팀 작업 등록 버튼 확인

완료 조건:
- dashboard_audit.md 작성
- 모든 버튼 클릭 결과 기록

---

# Phase 161 — JSON 불러오기/내보내기 버튼 1차 안전 검수

목표:
- 데이터를 실제로 덮어쓰기 전에 JSON handoff UI의 안전장치를 검수한다.

작업:
- JSON 불러오기 클릭
- 파일 선택 modal/input 동작 확인
- 취소 시 상태 변경 없는지 확인
- JSON 내보내기 클릭
- 다운로드 파일명/스키마/데이터 포함 범위 확인
- 잘못된 JSON을 넣었을 때 validation이 있는지 확인
- Apply 전 Preview가 있는지 확인

주의:
- 사용자 승인 없이 운영 데이터를 덮어쓰지 않는다.

완료 조건:
- json_ui_safety_audit.md 작성

---

# Phase 162 — `/projects/intake` 수주 프로젝트 관리 탭 검수

검수 route:
```text
/workspace/projects/intake
```

작업:
- `수주 프로젝트 관리` 탭 클릭
- 새 프로젝트 등록 버튼 클릭
- 모든 입력 필드 확인
- 필수값 누락 validation 확인
- 납품일 입력/수정 가능 여부 확인
- PM 배정 필드 확인
- 등록 취소 시 데이터 변경 없는지 확인
- 등록 완료 시 보드 `착수 전` 컬럼에 나타나는지 확인

완료 조건:
- client_order_intake_audit.md 작성

---

# Phase 163 — `/projects/intake` 개발팀 업무 리스트 관리 탭 검수

작업:
- `개발팀 업무 리스트 관리` 탭 클릭
- 개발팀 작업 등록 버튼 클릭
- 외부 납품일과 내부 목표일 구분 확인
- CLIENT_ORDER와 INTERNAL_DEVELOPMENT 데이터가 섞이지 않는지 확인
- 등록 완료 시 보드 `착수 전` 컬럼에 나타나는지 확인

완료 조건:
- internal_development_intake_audit.md 작성

---

# Phase 164 — Intake 화면 빈 상태, 긴 텍스트, 베트남어/한국어 입력 검수

작업:
- 빈 상태 안내 문구 확인
- 매우 긴 프로젝트명 입력
- 한국어 프로젝트명 입력
- 베트남어 프로젝트명 입력
- 특수문자/따옴표/줄바꿈 입력
- UI 깨짐, 저장 실패, escaping 문제 확인

완료 조건:
- intake_text_i18n_edge_case_audit.md 작성

---

# Phase 165 — 프로젝트 보드 탭 순서 및 컬럼 순서 검수

검수 route:
```text
/workspace/projects
```

작업:
- 상단 탭 순서 확인: `개발팀 작업` → `외부 수주 프로젝트`
- 컬럼 순서 확인: `착수 전` → `진행 중` → `완료` → `수정(Revision)`
- 각 컬럼 카운트 확인
- 탭 전환 시 필터 유지/초기화 정책 확인
- 월 선택 버튼 확인
- 개인일정 표기 토글 확인

완료 조건:
- board_structure_audit.md 작성

---

# Phase 166 — 프로젝트 보드 카드 표시 정보 검수

작업:
- Project Summary Card 정보 확인
- 프로젝트명, PM, 담당자, 진행률, 납품일/목표일, 상태, source type 표시 확인
- 납품일 경과/임박 배지 정확성 확인
- 데이터 없는 상태에서 잘못된 배지 표시 여부 확인
- 긴 이름/베트남어 이름 표시 확인

완료 조건:
- board_card_content_audit.md 작성

---

# Phase 167 — 보드 드래그 가능 영역 및 단순 상태 변경 차단 검수

목표:
- `착수 전`에서 `진행 중`으로 이동할 때 단순 status 변경이 아니라 PM 하달 workflow가 강제되는지 확인한다.

작업:
- 테스트 프로젝트 생성 또는 기존 테스트 카드 사용
- 착수 전 → 진행 중 드래그 시도
- PM Dispatch Modal이 뜨는지 확인
- 모달 취소 시 카드가 원래 위치로 돌아가는지 확인
- 필수 하달 정보 없이 진행 중 확정이 차단되는지 확인

완료 조건:
- board_drag_dispatch_gate_audit.md 작성

---

# Phase 168 — PM Dispatch Modal 1차 UI 검수

작업:
- 모달 제목/설명 확인
- 작업자 선택 필드 확인
- TaskCard 생성 필드 확인
- 작업 기간/시작일/마감일 입력 확인
- 업무 내용 입력 확인
- 한국어/베트남어 입력 확인
- 필수값 validation 확인
- 취소/닫기/외부 클릭 동작 확인

완료 조건:
- pm_dispatch_modal_ui_audit.md 작성

---

# Phase 169 — PM Dispatch Modal 데이터 반영 검수

작업:
- 유효한 하달 정보 입력
- 진행 중 이동 확정
- TaskCard 생성 여부 확인
- 담당자 일정표 반영 여부 확인
- 알림 생성 여부 확인
- AuditLog 생성 여부 확인
- 새로고침 후 유지 여부 확인

완료 조건:
- pm_dispatch_data_integrity_audit.md 작성

---

# Phase 170 — 프로젝트 상세 진입, 뒤로가기, breadcrumb, 상태 보존 검수

작업:
- 프로젝트 카드 클릭
- Project Detail 화면 진입 확인
- 파트별 진행 보드 표시 확인
- 뒤로가기 버튼 확인
- breadcrumb 확인
- 이전 보드 탭/월/스크롤 위치 보존 여부 확인

완료 조건:
- project_detail_navigation_audit.md 작성

---

# Phase 171 — 프로젝트 상세 파트별 진행 보드 검수

작업:
- 프로젝트에 배정된 파트 수만큼 열이 생성되는지 확인
- 각 파트별 TaskCard 표시 확인
- 담당자별 진행률 표시 확인
- 권한 없는 파트 노출 여부 확인
- 선후행/충돌/체크리스트/산출물 placeholder 또는 실제 UI 확인

완료 조건:
- project_part_board_audit.md 작성

---

# Phase 172 — 완료 컬럼 및 수정(Revision) workflow 검수

작업:
- 프로젝트 완료 처리 가능 여부 확인
- 완료 후 수정 요청 생성 가능 여부 확인
- 수정 요청 발생 시 `수정(Revision)` 컬럼 이동 여부 확인
- 수정 완료 시 완료 컬럼 복귀 여부 확인
- 원본 이력 삭제/왜곡 여부 확인
- AuditLog/Notification 생성 여부 확인

완료 조건:
- revision_workflow_audit.md 작성

---

# Phase 173 — 결재함 기본 검수

검수 route:
```text
/workspace/approvals
```

작업:
- 대기 중인 결재 목록 확인
- 결재 유형/요청 내역/사유/액션 표시 확인
- 승인 버튼 동작 확인
- 반려 버튼 동작 확인
- 처리 내역 이동 여부 확인
- 승인/반려 후 원본 데이터 반영 여부 확인
- 잘못된 중복 클릭 방지 확인

완료 조건:
- approvals_audit.md 작성

---

# Phase 174 — 작업자 일정 조정 요청 workflow 검수

작업:
- 작업자 역할로 전환
- 할당된 업무에서 일정 연장/추가 일정/세부일정 조정 요청 UI 확인
- 요청 생성 시 원본 task가 즉시 변하지 않는지 확인
- ApprovalRequest 생성 확인
- PM/부서장 역할에서 결재 가능 여부 확인
- 승인 후 원본 task 반영 확인
- 반려 후 원본 유지 확인

완료 조건:
- schedule_request_workflow_audit.md 작성

---

# Phase 175 — 충돌 관리 화면 검수

검수 route:
```text
/workspace/conflicts
```

작업:
- 해결 대기 중인 충돌 목록 확인
- 충돌 유형 표시 확인
- 중복 진행 허용 버튼 확인
- 일정 미루기 승인 버튼 확인
- 담당자 재배정 버튼 확인
- 야근 승인 버튼 확인
- 각 액션 후 상태 변경/이력 기록 확인
- resolved history 이동 여부 확인

완료 조건:
- conflicts_audit.md 작성

---

# Phase 176 — 일정표 월간 그리드 기본 검수

검수 route:
```text
/workspace/schedules
```

작업:
- 직원 월간 그리드 탭 확인
- 프로젝트 타임라인 탭 확인
- 직원별 상세 탭 확인
- 휴가/일정 등록 버튼 확인
- 이전 달/다음 달 버튼 확인
- 2026년 1월~7월 월 버튼 확인
- 직원명 열 고정/스크롤 확인
- 긴 베트남 이름 표시 확인

완료 조건:
- schedules_month_grid_audit.md 작성

---

# Phase 177 — 일정표 프로젝트 타임라인 검수

작업:
- 프로젝트 타임라인 탭 클릭
- 프로젝트별 전체 일정 표시 확인
- 프로젝트 필터 확인
- 일정 막대/기간 표시 확인
- 빈 데이터 상태 확인
- 프로젝트 상세와 연결 여부 확인

완료 조건:
- schedules_project_timeline_audit.md 작성

---

# Phase 178 — 일정표 직원별 상세 및 휴가/일정 등록 검수

작업:
- 직원별 상세 탭 클릭
- 직원 선택/필터 확인
- 개인 일정, 프로젝트 일정, 휴가/Off/Day/반차 구분 확인
- 휴가/일정 등록 modal 확인
- 등록/취소/validation 확인
- 충돌 발생 시 conflicts에 반영되는지 확인

완료 조건:
- schedules_employee_detail_leave_audit.md 작성

---

# Phase 179 — 알림 센터 검수

검수 route:
```text
/workspace/notifications
```

작업:
- 알림 목록 확인
- 읽음/안읽음 상태 확인
- 알림 유형 확인
- PM 하달, 결재 승인/반려, 수정 요청, 충돌 발생 알림 생성 여부 확인
- 전체 읽음 처리 확인
- 알림 클릭 시 관련 route로 이동 여부 확인

완료 조건:
- notifications_audit.md 작성

---

# Phase 180 — 설정 화면 기본 검수

검수 route:
```text
/workspace/settings
```

작업:
- 설정 메인 화면 진입 확인
- 운영 설정 항목 확인
- 인사카드/조직 관리 링크 확인
- 권한 시뮬레이터 링크 확인
- 데이터 품질 검사 링크 확인
- 저장/취소/validation 확인
- 설정 변경 후 새로고침 유지 여부 확인

완료 조건:
- settings_audit.md 작성

---

# Phase 181 — 인사카드/조직 구조 검수

작업:
- personnel 관련 route 또는 설정 탭 확인
- CON-COST / VIET_QS 회사 구분 확인
- 부서/파트/SubDepartment 확인
- 직원 생성/수정/비활성화 UI 확인
- 권한 Role 변경 확인
- 인사카드 변경이 일정표/권한/결재에 연결되는지 확인

완료 조건:
- personnel_organization_audit.md 작성

---

# Phase 182 — 권한 시뮬레이터 및 role별 화면 노출 검수

작업:
- SUPER_ADMIN으로 전체 메뉴 확인
- DEPARTMENT_MANAGER로 본인 부서 범위 확인
- PM으로 담당 프로젝트 범위 확인
- WORKER로 본인 업무/본인 팀 일정 범위 확인
- 권한 없는 route 접근 시 차단/리다이렉트 확인
- 메뉴 자체가 숨겨지는지, 접근만 막는지 정책 기록

완료 조건:
- permission_scope_audit.md 작성

---

# Phase 183 — 성과 평가 화면 검수

검수 후보 route:
```text
/workspace/evaluation
```

작업:
- route 존재 여부 확인
- 평가 대시보드 진입 확인
- QC 오류 입력 UI 확인
- 가중치 10~100% 확인
- 오류율/가중 오류율 계산 확인
- 작업량 0일 때 NaN/Infinity 방지 확인
- 평가 잠금 기능 확인
- 권한별 접근 제한 확인

완료 조건:
- evaluation_audit.md 작성

---

# Phase 184 — 데이터 품질 검사기 및 운영 검증 모드 검수

작업:
- 운영 검증 모드 토글 확인
- Data Quality 화면 또는 섹션 확인
- 고아 Task, PM 미배정, 납품일 없는 프로젝트, 완료 프로젝트 내 미결 요청 감지 여부 확인
- Danger Zone 일괄 마감 버튼이 있으면 안전 확인 modal 존재 여부 확인

완료 조건:
- data_quality_validation_mode_audit.md 작성

---

# Phase 185 — JSON Handoff E2E 검수

목표:
- 실제로 export → import → preview → apply → reload가 가능한지 확인한다.

작업:
- 테스트 데이터 생성
- JSON export
- export 파일 스키마 확인
- localStorage 초기화 또는 별도 브라우저 프로필 준비
- JSON import
- preview 확인
- apply 확인
- 새로고침 후 데이터 유지 확인
- 깨진 JSON import 시 안전 차단 확인

주의:
- 실제 운영 데이터를 덮어쓰지 않도록 테스트 프로필/백업 사용

완료 조건:
- json_handoff_e2e_audit.md 작성

---

# Phase 186 — localStorage / 상태 초기화 / 새로고침 내구성 검수

작업:
- 새 프로젝트 생성 후 새로고침
- 업무 하달 후 새로고침
- 결재 처리 후 새로고침
- 일정 등록 후 새로고침
- 브라우저 재시작 후 유지 확인
- localStorage key 목록 확인
- 민감정보/API key 저장 여부 확인

완료 조건:
- persistence_reload_audit.md 작성

---

# Phase 187 — GitHub Pages routing / base path / refresh 404 검수

작업:
- 각 route 직접 주소 입력
- 새로고침
- 뒤로가기/앞으로가기
- deep link 접근
- 잘못된 route 접근
- base path `/workspace` 누락 여부 확인

완료 조건:
- github_pages_routing_audit.md 작성

---

# Phase 188 — 반응형 UI 검수: Desktop / Laptop

작업:
- 1440x900 확인
- 1366x768 확인
- 사이드바 폭 확인
- 보드 컬럼 가로 스크롤 확인
- 납품일 임박도 현황 미정 컬럼 밀림 여부 확인
- 일정표 가독성 확인

완료 조건:
- responsive_desktop_laptop_audit.md 작성

---

# Phase 189 — 반응형 UI 검수: Tablet / Mobile

작업:
- 768x1024 확인
- 390x844 확인
- 메뉴 접기/펼치기 확인
- 카드/모달/폼 overflow 확인
- 일정표 모바일 사용성 확인
- 탭 버튼 줄바꿈 확인

완료 조건:
- responsive_tablet_mobile_audit.md 작성

---

# Phase 190 — 접근성 및 키보드 조작 검수

작업:
- Tab 이동 순서 확인
- Enter/Space 버튼 활성화 확인
- Modal focus trap 확인
- ESC 닫기 확인
- label/input 연결 확인
- aria-label 필요한 아이콘 버튼 확인
- 색상만으로 상태 구분하는지 확인

완료 조건:
- accessibility_keyboard_audit.md 작성

---

# Phase 191 — 다국어/VIET 언어 전환 및 업무카드 번역 준비상태 검수

목표:
- Plan 19가 아직 구현되지 않았더라도 현재 상태를 정확히 분류한다.

작업:
- KOR/VIET 언어 전환 UI 존재 여부 확인
- 한국어 입력 → 베트남어 번역 UI 존재 여부 확인
- 베트남어 입력 → 한국어 번역 UI 존재 여부 확인
- 자동번역 결과와 원문이 분리 저장되는지 확인
- API key가 코드나 localStorage에 노출되는지 확인
- 구현되지 않았으면 `Not Implemented / Plan 19 대상`으로 표기

완료 조건:
- i18n_translation_audit.md 작성

---

# Phase 192 — 보안/개인정보/공개 배포 안전성 검수

작업:
- 소스/번들/localStorage에 API key, secret, token 노출 여부 확인
- 공개 GitHub Pages에 민감한 직원 정보가 과도하게 노출되는지 확인
- 권한 전환 UI가 실제 보안이 아니라 검증용임을 명확히 표시하는지 확인
- 외부 API 호출이 있으면 CORS/키 노출 확인
- JSON export에 불필요한 민감정보가 포함되는지 확인

완료 조건:
- security_privacy_public_deploy_audit.md 작성

---

# Phase 193 — 핵심 E2E 1: 외부 수주 프로젝트 생성 → PM 배정 → 하달 → 일정표 → 결재 → 완료

작업:
- 외부 수주 프로젝트 생성
- PM 배정
- 보드 착수 전 확인
- 진행 중 드래그
- PM 하달
- 작업자 일정표 반영
- 작업자 일정 조정 요청
- PM/부서장 결재
- 완료 처리
- 알림/AuditLog 확인
- JSON export에 반영 확인

완료 조건:
- e2e_client_order_workflow_audit.md 작성

---

# Phase 194 — 핵심 E2E 2: 개발팀 업무 생성 → 하달 → 수정/추가업무 → 완료

작업:
- 개발팀 업무 생성
- 보드 착수 전 확인
- 진행 중 하달
- 내부 목표일 기준 표시 확인
- 추가 업무 요청 확인
- 수정/재작업 workflow와 외부 수주 revision이 섞이지 않는지 확인
- 완료 처리

완료 조건:
- e2e_internal_development_workflow_audit.md 작성

---

# Phase 195 — 오류 목록 정규화 및 중복 제거

작업:
- 모든 Phase issue 취합
- 중복 issue 병합
- severity 재평가
- route별/기능별/권한별로 분류
- 재현 가능한 오류와 재현 불가 의심사항 분리

완료 조건:
- plan20_issue_matrix.md 작성
- plan20_issue_matrix.json 작성

---

# Phase 196 — 개선안 분류: 즉시 수정 / Patch / Plan 21 / 보류

작업:
- S0/S1은 즉시 수정 후보로 분류
- S2는 Patch 후보로 분류
- 구조 변경이 필요한 항목은 Plan 21 후보로 분류
- 단순 개선은 Backlog로 분류
- 각 항목마다 예상 영향 범위와 리스크 작성

완료 조건:
- plan20_improvement_backlog.md 작성

주의:
- 이 Phase에서도 코드는 수정하지 않는다.

---

# Phase 197 — 최종 전수검수 리포트 작성

작업:
- 전체 검수 요약
- 검수한 route 목록
- 검수한 버튼/탭/모달 목록
- PASS/PARTIAL/FAIL/BLOCKED 요약
- S0~S4 issue 통계
- 화면 증빙 링크
- 콘솔/네트워크 증빙 링크
- 구현 완료/화면만 있음/로직 검증 필요/미구현 구분
- Plan 21 필요 여부 결론

완료 조건:
- workspace_plan20_site_audit_report.md 작성

---

# Phase 198 — 사용자 승인용 최종 보고 및 다음 작업 선택지 제시

작업:
- 사용자에게 최종 요약 보고
- 다음 선택지를 제시

선택지:
```text
A. S0/S1 치명 오류만 먼저 수정
B. S2 주요 오류까지 함께 수정
C. UI/문구 S3까지 정리
D. Plan 21로 구조 개선 프롬프트 작성
E. 현재는 수정하지 않고 리포트만 보관
```

완료 조건:
- 사용자 승인 전까지 코드 수정/커밋/push 금지

---

## 4. Antigravity 실행용 첫 지시문

아래 문장을 Antigravity에 그대로 입력한다.

```text
현재 F:\workspace 프로젝트의 Plan 20 전수검수를 시작한다.

검수 대상 배포 사이트는 다음이다.
https://eumditravel-oss.github.io/workspace/

중요 전제:
- Plan 단계는 뒤로 갈수록 최신 요구사항이 우선이다.
- Plan 20은 새 기능 구현이 아니라, 현재 배포 사이트를 실제 브라우저에서 직접 클릭하며 검수하는 전수 QA Plan이다.
- 모든 메뉴, 탭, 버튼, 모달, 폼, 권한 전환, JSON 불러오기/내보내기, 프로젝트 등록, 보드 이동, PM 하달, 결재, 충돌, 일정표, 알림, 설정, 성과평가, 권한 시뮬레이터, 데이터 품질 기능을 실제로 눌러가며 확인한다.
- 화면에서 직접 확인하지 않은 기능은 정상이라고 쓰지 마라.
- 리포트나 코드에 있다고 해서 구현 완료라고 판단하지 마라.
- 실제 화면, console, network, localStorage, route refresh, JSON export/import, role별 노출을 증빙으로 남겨라.
- 오류 발견 시 즉시 수정하지 말고 issue로 기록하라.
- 각 Phase를 시작하기 전 반드시 나에게 승인 요청을 하고, 내가 승인하기 전에는 시작하지 마라.
- 사용자 승인 없이 다음 Phase로 넘어가지 마라.
- 사용자 승인 없이 코드 수정하지 마라.
- 사용자 승인 없이 GitHub 원격 push하지 마라.

먼저 Phase 156 진행 승인 요청만 작성하라.
아직 Phase 156을 실행하지 마라.
```

---

## 5. Plan 20 완료 기준

Plan 20은 아래 조건을 모두 만족해야 완료로 본다.

```text
1. 모든 주요 route를 실제로 열어봤다.
2. 모든 상단/좌측 메뉴를 실제로 클릭했다.
3. 모든 주요 탭을 실제로 클릭했다.
4. 모든 주요 버튼을 최소 1회 이상 눌러봤다.
5. destructive action은 사전 백업/취소/확인 modal 기준으로만 안전 검수했다.
6. 모든 modal의 열기/닫기/취소/validation을 확인했다.
7. 프로젝트 생성부터 완료까지 E2E 검수했다.
8. 개발팀 업무 생성부터 완료까지 E2E 검수했다.
9. PM 하달 workflow를 확인했다.
10. 작업자 일정 조정 request workflow를 확인했다.
11. 결재 승인/반려 workflow를 확인했다.
12. 충돌 관리 action을 확인했다.
13. 일정표 월간 그리드와 직원 상세를 확인했다.
14. JSON export/import를 실제 파일 기준으로 확인했다.
15. 새로고침과 deep link를 확인했다.
16. role별 권한 노출을 확인했다.
17. console/network 오류를 수집했다.
18. desktop/tablet/mobile 반응형을 확인했다.
19. 보안/secret 노출 여부를 확인했다.
20. 모든 오류를 severity와 재현절차로 정리했다.
21. 수정이 필요한 항목은 즉시 수정하지 않고 사용자 승인용 개선 backlog로 분리했다.
```
