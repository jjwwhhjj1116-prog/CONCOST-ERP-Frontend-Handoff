# WORKSPACE PLAN 23 — Hover Overlay Sidebar 안정화, 상세화면 Full-width 개선, 기본 탭/인사카드/통합 JSON Export 실사용화 프롬프트

이 프롬프트는 기존 `workspace plan1.txt`부터 `workspace plan22.txt` 이후에 추가되는 스물세 번째 보강 지시사항이다.

Plan 단계는 뒤로 갈수록 최신 요구사항이 우선이다. 따라서 Plan 23은 Plan 22에서 진행한 전체 UI/UX 개선 결과를 실제 화면 기준으로 다시 안정화하고, 현재 사용자가 바로 테스트할 수 있도록 다음 기능을 보완하는 **UI 안정화 + 실사용 데이터 관리 보강 Plan**이다.

Plan 23은 무작정 새 기능을 추가하는 작업이 아니다. Plan 1~22에서 정의된 업무관리 시스템의 흐름, 권한, JSON handoff, 인사카드, 일정표, 수주/개발 관리 구조를 유지하면서, 현재 화면에서 확인된 불편과 버그를 실제 사용 가능한 수준으로 바로잡는 작업이다.

---

## 0. 현재 화면 기준 확인된 문제

사용자가 제공한 최신 화면 기준으로 다음 문제가 확인되었다.

1. 좌측 Sidebar가 hover 확장될 때 `CON-COST&Viet_QS OS` 타이틀 텍스트가 줄바꿈/겹침/재생성되는 것처럼 보이는 버그가 있다.
2. Sidebar에 커서를 올리면 메인 화면이 오른쪽으로 밀린다. 사용자는 메인 화면이 밀리는 방식이 아니라, Sidebar가 메인 화면 위에 overlay처럼 덮이는 방식을 원한다.
3. Icon-only 상태에서는 브랜드명이 너무 길어 표시 안정성이 떨어진다. Collapsed 상태에서는 짧은 로고/약칭, Expanded 상태에서는 전체 명칭을 안정적으로 보여야 한다.
4. `수주/개발 관리` 메뉴 진입 시 기본 선택 탭이 `수주 프로젝트 관리`가 아니라 `개발팀 업무 리스트 관리`가 되기를 원한다.
5. 통합 일정표는 좌우 빈 공간이 넓은데 실제 일정표 카드/그리드의 가로폭이 작아 내부 가로 스크롤이 생긴다.
6. 사원관리 > 인사카드 관리 화면에 인사카드 추가 버튼이 없어 테스트용 직원/인사카드를 사용자가 직접 추가할 수 없다.
7. 사용자가 일정이나 인사카드를 수정한 뒤, Google Antigravity가 나중에 해당 JSON을 읽고 반영할 수 있도록 통합 JSON 내보내기 기능이 실사용 가능한 상태여야 한다.
8. Plan 22에서 전체 UI를 넓게 쓰도록 지시했지만, 일부 상세페이지는 아직 화면 중앙의 작은 고정폭 컨테이너처럼 보인다.
9. Hover Sidebar, 전체 폭 레이아웃, JSON Export, 인사카드 CRUD가 서로 따로 놀면 실사용 품질이 떨어진다.

---

## 1. Plan 23의 핵심 목표

Antigravity는 Plan 23에서 다음 목표를 반드시 달성해야 한다.

1. Sidebar hover 확장 시 브랜드명 줄바꿈/겹침/재렌더링처럼 보이는 오류를 해결한다.
2. Sidebar는 기본 collapsed 상태에서 아이콘 중심으로 보이고, hover/focus 시 **메인 콘텐츠를 밀지 않고 overlay로 확장**되어야 한다.
3. Collapsed 상태에서는 브랜드를 `C&V` 또는 사용자가 식별 가능한 짧은 로고로 표시한다.
4. Expanded 상태에서는 `CON-COST&Viet_QS OS`를 한 줄 또는 안정적인 2줄 규칙으로 표시하되, 레이아웃 깨짐이 없어야 한다.
5. Sidebar 확장/축소 중 top bar, content, page shell의 x-position이 흔들리지 않아야 한다.
6. `/projects/intake` 또는 `수주/개발 관리` 진입 시 기본 탭은 `개발팀 업무 리스트 관리`로 설정한다.
7. 통합 일정표는 화면 폭을 최대한 활용하도록 full-width layout으로 개선한다.
8. 통합 일정표의 내부 가로 스크롤은 데이터가 실제 화면 폭보다 클 때만 발생해야 한다. 화면에 빈 공간이 충분한데도 작은 카드 안에서 스크롤이 생기면 실패로 본다.
9. 사원관리 > 인사카드 관리에 `인사카드 추가` 버튼을 추가하고, 최소한 신규 인사카드 생성/수정/비활성화/JSON 반영 준비가 가능해야 한다.
10. 통합 JSON 내보내기 기능을 활성화하고, 인사카드/일정/프로젝트/업무/결재/설정/번역/감사로그 등 현재 운영 데이터가 schema version과 함께 export되도록 한다.
11. Export된 JSON은 Google Antigravity가 나중에 `/json` 폴더에서 읽고 반영할 수 있는 구조여야 한다.
12. 모든 수정은 Plan 1~22의 권한, 업무 흐름, PM 하달, 결재, JSON handoff, KOR/VIET 번역 구조와 충돌하지 않아야 한다.
13. 각 Phase 시작 전 사용자 승인 요청을 반드시 한다.
14. 사용자 승인 없이 다음 Phase로 넘어가지 않는다.
15. 사용자 승인 없이 GitHub 원격 push하지 않는다.

---

## 2. 절대 금지사항

Antigravity는 아래 행위를 금지한다.

- Sidebar 문제를 해결한다는 이유로 기존 라우팅, 업무 flow, 권한 로직을 임의로 변경하지 마라.
- 브랜드명을 다시 `EUMDI OS`로 되돌리지 마라.
- 전체 폭 개선을 위해 무조건 `w-screen`을 남발하지 마라. 이 경우 모바일/스크롤/overflow 문제가 생길 수 있다.
- 기존 localStorage/Zustand 데이터를 임의 초기화하지 마라.
- JSON Export를 만든다고 하면서 실제 파일 다운로드가 되지 않는 더미 버튼만 만들지 마라.
- 인사카드 추가 버튼을 UI에만 만들고 실제 store/localStorage/export 데이터에 반영하지 않는 상태로 완료 보고하지 마라.
- 검증 없이 “완료”, “완벽”, “100%”라고 보고하지 마라.
- 사용자 승인 없이 코드 수정, 다음 Phase 진행, GitHub push를 하지 마라.

---

## 3. 최신 요구사항 우선순위

Plan 23에서 충돌이 생기면 다음 우선순위를 따른다.

```text
1순위: 현재 사용자가 지적한 화면 버그 및 실사용 불편
2순위: Plan 22의 UI/UX 개선 목표
3순위: Plan 21의 오류 수정 안정성 원칙
4순위: Plan 20 QA 검수 증빙 원칙
5순위: Plan 19 KOR/VIET 번역 및 JSON 데이터 확장 원칙
6순위: Plan 1~18의 기존 업무 흐름, 권한, 승인, 일정, 알림, AuditLog 원칙
```

---

## 4. 권장 구현 방향

### 4-1. Sidebar Hover Overlay 구조

목표 구조:

```text
AppLayout
├─ SidebarLayer
│  ├─ CollapsedRail: fixed width 64px
│  └─ ExpandedPanel: absolute/fixed overlay, hover/focus 시 width 240~280px
├─ MainArea
│  ├─ TopBar: margin-left는 collapsed rail 기준으로 고정
│  └─ PageContent: margin-left는 collapsed rail 기준으로 고정
```

핵심:

- collapsed width는 항상 고정한다. 예: `--sidebar-rail-width: 64px`
- expanded width는 overlay panel로만 넓어진다. 예: `--sidebar-expanded-width: 240px` 또는 `260px`
- 메인 콘텐츠의 `margin-left`는 항상 collapsed width만 반영한다.
- hover 시 main content margin-left를 바꾸지 않는다.
- expanded panel은 `position: fixed` 또는 layout 구조에 맞는 absolute overlay로 처리한다.
- z-index는 top bar와 충돌하지 않게 정한다.
- focus-within도 hover와 동일하게 작동해야 keyboard 접근성이 유지된다.

### 4-2. 브랜드명 표시 규칙

Collapsed:

```text
C&V
```

Expanded:

```text
CON-COST&Viet_QS OS
```

권장:

- collapsed 상태에서는 전체 브랜드명을 렌더링하지 않는다.
- expanded 상태에서만 전체 브랜드명을 표시한다.
- 글자 수가 길어도 한 줄 유지가 어려우면 `CON-COST` / `Viet_QS OS` 2줄 고정 레이아웃으로 표시한다.
- hover animation 중 텍스트가 갑자기 줄바꿈되거나 겹치지 않도록 `white-space`, `line-height`, `min-width`, `opacity transition`을 분리한다.
- 단순 `display: none` 전환보다 `opacity/visibility` 전환이 안정적이면 사용한다.

### 4-3. Intake 기본 탭

`수주/개발 관리` 진입 시 기본값:

```text
개발팀 업무 리스트 관리
```

요구사항:

- route query, local state, tab state의 우선순위를 점검한다.
- 사용자가 마지막으로 선택한 탭을 localStorage에 저장하는 기존 로직이 있다면, 사용자 요구와 충돌하는지 보고한다.
- 기본 진입은 개발팀 업무 탭이지만, 사용자가 수주 프로젝트 탭으로 직접 전환하는 기능은 유지한다.

### 4-4. 통합 일정표 Full-width 개선

목표:

- page shell max-width 제한 제거 또는 route별 wide variant 적용
- 일정표 카드가 viewport 폭을 적극적으로 사용
- 내부 grid/table이 부모 폭을 정확히 따라감
- 빈 공간이 있는데도 내부 스크롤이 생기지 않게 함

권장:

```text
PageShell variant="wide"
CalendarContainer width: 100%
CalendarGrid min-width: data-driven
Only enable horizontal scroll when required columns exceed available width
```

실패 기준:

- 화면 좌우에 큰 빈 공간이 있는데 일정표 내부만 좁고 스크롤이 생김
- 카드가 중앙에 작게 고정됨
- 날짜 셀이 너무 좁아 가독성이 떨어짐
- Sidebar hover 시 일정표 폭이 재계산되며 흔들림

### 4-5. 인사카드 추가/수정

사원관리 > 인사카드 관리에는 최소 다음 기능이 있어야 한다.

```text
- 인사카드 추가 버튼
- 추가 모달 또는 사이드 패널
- 필수값: 이름, 표시명, 회사, 부서, 역할, 상태
- 선택값: 사번, 직급, 파트, 이메일, 언어, 대리결재자, 입사일, 비고
- 저장 시 personnel store/localStorage 반영
- 수정 기능
- 비활성화 기능
- JSON Export 포함
```

권장:

- 삭제보다는 `inactive` 또는 `archived` 처리 우선
- 일정/업무가 연결된 인사카드는 hard delete 금지
- 신규 인사카드는 권한 시뮬레이터/일정표/프로젝트 배정 후보에 연결될 수 있게 데이터 구조를 맞춘다.

### 4-6. 통합 JSON Export 실사용화

Export 대상 최소 범위:

```text
metadata
settings
personnelCards
departments
projects
tasks
scheduleAssignments
taskWorkSegments
approvalRequests
notifications
auditLogs
revisionRequests
postDeliveryWorkRequests
translationEntries
uiPreferences
```

metadata 최소 필드:

```text
schemaVersion
exportedAt
exportedBy
appVersion
source: "workspace-web"
mode: "DAILY_WORK" | "ADMIN_VALIDATION"
```

요구사항:

- 대시보드의 `JSON 내보내기`
- 빠른 작업의 `JSON 데이터 내보내기`
- 설정/가져오기(JSON) 화면의 export 기능
- 인사카드 관리의 `JSON 내보내기`

위 버튼들이 동일한 export service 또는 동일 schema를 사용해야 한다.

파일명 권장:

```text
workspace_export_YYYYMMDD_HHmmss.json
workspace_personnel_export_YYYYMMDD_HHmmss.json
```

---

## 5. Phase 진행 규칙

모든 Phase는 다음 형식을 지켜야 한다.

### Phase 시작 전 승인 요청 형식

```text
[Plan 23 / Phase XXX 시작 승인 요청]

이번 Phase 목표:
- ...

수정 예정 범위:
- ...

수정하지 않을 범위:
- ...

완료 후 산출물:
- ...

진행 승인 부탁드립니다.
```

### Phase 완료 보고 형식

```text
[Plan 23 / Phase XXX 완료 보고]

수행 내용:
- ...

수정 파일:
- ...

검증 결과:
- PASS / PARTIAL / FAIL

발견 이슈:
- ...

다음 Phase 진행 여부:
- 사용자 승인 대기
```

---

# Phase 상세 계획

## Phase 223 — 현황 조사 및 수정 금지 Baseline

목표:
- 현재 Sidebar, Layout, Intake, Calendar, Personnel, JSON Export 관련 파일과 route를 조사한다.
- 코드 수정은 하지 않는다.

검토 항목:
- AppLayout / Sidebar / TopBar / PageShell 구조
- 브랜드명 표시 위치
- `/projects/intake` 기본 탭 state
- `/calendar` 또는 통합 일정표 route layout
- `/settings/personnel` 인사카드 관리 구조
- JSON export/import service 존재 여부

완료 조건:
- 수정 대상 파일 목록 작성
- 현재 문제별 원인 가설 작성
- 코드 수정 없이 보고

사용자 승인 필요:
- Phase 223 시작 전 승인
- Phase 224 진행 전 승인

---

## Phase 224 — Plan 1~22 무결성 검토 및 수정 범위 확정

목표:
- 이번 수정이 기존 Plan과 충돌하지 않는지 확인한다.

검토 항목:
- Plan 15 JSON handoff 원칙
- Plan 19 번역 데이터 export 필요성
- Plan 21 workflow bugfix와 충돌 여부
- Plan 22 UI wide layout 원칙

완료 조건:
- 이번 Plan 23에서 수정할 항목과 수정하지 않을 항목 확정
- 위험도 분류 작성

---

## Phase 225 — Sidebar Overlay 설계안 작성

목표:
- 구현 전 Sidebar overlay 구조를 설계한다.

산출물:
- collapsed rail width
- expanded overlay width
- z-index 정책
- focus/hover 정책
- mobile fallback
- 브랜드명 표시 규칙

코드 수정 금지.

---

## Phase 226 — Sidebar 브랜드명 깨짐 수정

목표:
- `CON-COST&Viet_QS OS` 텍스트 깨짐/줄바꿈/겹침 문제를 수정한다.

수정 방향:
- collapsed 상태: `C&V`
- expanded 상태: `CON-COST&Viet_QS OS`
- 텍스트 영역 min-width, white-space, line-height 안정화
- transition 중 레이아웃 깨짐 방지

검증:
- collapsed screenshot
- expanded screenshot
- hover transition 중 겹침 없음

---

## Phase 227 — Sidebar Hover Overlay 구현

목표:
- hover 시 메인 화면을 밀지 않고 overlay처럼 덮는 Sidebar로 변경한다.

수정 방향:
- main content margin-left는 collapsed width 기준으로 고정
- expanded panel은 fixed/absolute overlay
- hover/focus-within 시 확장
- pointer-events와 z-index 점검

검증:
- hover 전후 topbar/content x-position 변화 없음
- Sidebar가 content 위로 덮임
- 메뉴 클릭 가능

---

## Phase 228 — Sidebar 접근성 및 모바일 fallback

목표:
- hover만으로 동작하지 않는 환경을 보완한다.

요구사항:
- keyboard focus-within 확장
- 모바일에서는 drawer 또는 pinned expanded 방식
- ESC 또는 외부 클릭 닫힘 검토
- 메뉴 label aria 처리

완료 조건:
- desktop hover 정상
- keyboard focus 정상
- mobile에서 메뉴 접근 가능

---

## Phase 229 — 공통 Layout 회귀 검증

목표:
- Sidebar 수정 후 전체 route가 깨지지 않는지 확인한다.

검증 route:
- Dashboard
- 수주/개발 관리
- 통합 프로젝트 보드
- 결재/수정 내역
- 일정 충돌 관리
- 통합 일정표
- 알림 센터
- 운영 설정
- 사원 관리
- 가져오기(JSON)
- 데이터 품질 검사기
- 번역 설정
- 성과 평가

완료 조건:
- 모든 route 진입 가능
- 메인 화면 밀림 없음
- overlay가 중요한 버튼을 영구적으로 가리지 않음

---

## Phase 230 — 수주/개발 관리 기본 탭 변경

목표:
- `수주/개발 관리` 진입 시 기본 탭을 `개발팀 업무 리스트 관리`로 설정한다.

검토:
- initial state
- query param
- localStorage preference
- tab component defaultValue

완료 조건:
- 신규 진입 시 개발팀 업무 탭 활성화
- 사용자가 수주 프로젝트 탭으로 전환 가능
- 새로고침 시 정책이 명확함

---

## Phase 231 — Intake 탭 UX 품질 개선

목표:
- 탭 상태가 명확하게 보이고, 어떤 리스트를 관리 중인지 헷갈리지 않게 한다.

개선 후보:
- 활성 탭 강조
- 탭 설명문 보강
- 빈 상태 CTA 구분
- 개발팀 업무 등록 / 수주 프로젝트 등록 버튼 분리

완료 조건:
- 기본 탭이 개발팀 업무
- 사용자가 수주 프로젝트 관리로 이동하기 쉬움

---

## Phase 232 — 통합 일정표 Layout 원인 분석

목표:
- 일정표가 좁게 표시되고 내부 스크롤이 생기는 원인을 분석한다.

검토:
- PageShell max-width
- Calendar wrapper width
- card width
- table/grid min-width
- overflow-x 위치
- Sidebar collapsed/expanded 영향

코드 수정 금지.

---

## Phase 233 — 통합 일정표 Full-width 적용

목표:
- 통합 일정표가 화면 폭을 적극적으로 사용하게 한다.

수정 방향:
- route-level wide layout 적용
- container max-width 제거 또는 확장
- calendar card width 100%
- 날짜 grid width 계산 조정

완료 조건:
- 좌우 빈 공간 감소
- 화면 폭이 충분하면 내부 가로 스크롤 최소화
- 데이터가 많을 때만 스크롤 발생

---

## Phase 234 — 통합 일정표 가독성 개선

목표:
- 넓어진 화면에서 일정표가 실제 업무용으로 보기 쉽게 만든다.

개선 후보:
- 직원명 column sticky
- 날짜 cell 최소 폭 조정
- 월 이동 컨트롤 정렬
- 프로젝트 타임라인/직원 월간 그리드/직원별 상세 탭 폭 통일
- empty state 안내 개선

완료 조건:
- 빈 상태에서도 화면이 과도하게 작아 보이지 않음
- 데이터가 들어오면 일정 흐름이 잘 보일 구조

---

## Phase 235 — 인사카드 Store 및 Schema 점검

목표:
- 인사카드 추가 기능 구현 전에 기존 데이터 구조를 점검한다.

검토:
- PersonnelCard type
- Department/Role relation
- active/inactive/archive 정책
- 권한 시뮬레이터 연결
- JSON export 연결

코드 수정 금지.

---

## Phase 236 — 인사카드 추가 버튼 및 모달 구현

목표:
- 사원관리 > 인사카드 관리에 추가 버튼을 제공한다.

필수 필드:
- 이름
- 표시명
- 회사
- 부서
- 역할
- 상태

선택 필드:
- 사번
- 직급
- 파트
- 이메일
- 기본 언어
- 대리 결재자
- 비고

완료 조건:
- 신규 인사카드 생성 가능
- 목록에 즉시 반영
- localStorage/Zustand persist 반영

---

## Phase 237 — 인사카드 수정/비활성화 구현

목표:
- 기존 인사카드 수정 및 비활성화 처리를 가능하게 한다.

요구사항:
- hard delete는 기본 금지
- 연결된 일정/업무가 있을 경우 비활성화만 허용
- 수정 시 AuditLog 가능 여부 검토
- 상태값: ACTIVE / INACTIVE / ARCHIVED 등 기존 모델과 맞춤

완료 조건:
- 생성/수정/비활성화 흐름 정상
- 목록/일정/권한 후보 데이터와 충돌 없음

---

## Phase 238 — 인사카드와 일정/권한 후보 연결 검증

목표:
- 새로 추가한 인사카드가 실제 시스템 후보 데이터로 활용 가능한지 확인한다.

검증:
- 프로젝트 담당자 후보
- 업무 작업자 후보
- 일정표 직원 목록
- 권한 시뮬레이터 사용자 목록
- JSON export 포함 여부

완료 조건:
- UI에만 존재하는 더미 인사카드가 아니어야 함

---

## Phase 239 — 통합 JSON Export 구조 점검

목표:
- 기존 JSON 내보내기 버튼들이 실제 export service와 연결되어 있는지 확인한다.

검토:
- Dashboard export
- Quick Action export
- Settings import/export
- Personnel export
- schema version
- file download utility

코드 수정 금지.

---

## Phase 240 — 통합 JSON Export Service 구현/정비

목표:
- 모든 주요 운영 데이터를 하나의 schema로 내보낼 수 있게 한다.

필수 포함:
- metadata
- settings
- personnelCards
- departments
- projects
- tasks
- schedules
- approvals
- notifications
- auditLogs
- translations
- uiPreferences

완료 조건:
- JSON 파일 다운로드 가능
- 파일명에 timestamp 포함
- JSON parse 가능
- 빈 데이터 상태에서도 유효 schema 유지

---

## Phase 241 — JSON Export 버튼 통합 연결

목표:
- 여러 화면의 JSON 내보내기 버튼이 동일 schema 또는 명확히 분리된 schema를 사용하게 한다.

연결 대상:
- 대시보드 상단 JSON 내보내기
- 빠른 작업 JSON 데이터 내보내기
- 사원관리 JSON 내보내기
- 가져오기(JSON) 화면 export

완료 조건:
- 버튼 클릭 시 실제 파일 다운로드
- export 이후 Antigravity가 `/json` 폴더에서 읽을 수 있는 구조

---

## Phase 242 — JSON Export / Import 호환성 검증

목표:
- Export 파일이 다시 Import preview 또는 validation에 사용할 수 있는지 검증한다.

검증:
- export JSON parse
- schemaVersion 확인
- 필수 key 누락 없음
- import preview에서 깨지지 않음
- 기존 데이터 덮어쓰기 전 경고 표시 여부

완료 조건:
- 최소 1회 export → validation 통과

---

## Phase 243 — 상세페이지 Full-width 공통 개선 1차

목표:
- 상세페이지들의 좌우 빈 공간 문제를 공통 PageShell 단에서 개선한다.

대상:
- 통합 일정표
- 사원관리
- 수주/개발 관리
- 프로젝트 보드
- 결재/수정 내역

완료 조건:
- 주요 페이지가 화면 폭을 더 적극적으로 사용
- 너무 넓어져 가독성이 떨어지는 텍스트 화면은 max-width 유지

---

## Phase 244 — 상세페이지 Full-width 공통 개선 2차

목표:
- 남은 운영/관리 화면의 공간 활용을 개선한다.

대상:
- 일정 충돌 관리
- 알림 센터
- 운영 설정
- 가져오기(JSON)
- 데이터 품질 검사기
- 권한 정책 설정
- 번역 설정
- 성과 평가

완료 조건:
- 화면 중앙에 작은 카드만 떠 있는 느낌 최소화
- 표/그리드/보드는 wide layout 적용
- 문서형 설정 화면은 readable width 유지

---

## Phase 245 — 추가 실사용 품질 개선 제안 반영

목표:
- 이번 수정과 함께 바로 사용 가능성이 높아지는 작은 개선을 검토하고, 사용자 승인 후 반영한다.

개선 후보:
- 빈 상태 화면에 즉시 실행 CTA 추가
- JSON 운영 상태 배지 설명 tooltip
- 현재 선택 role/회사/부서 표시 안정화
- 데이터 없음 상태에서 등록 버튼 노출
- 통합 일정표 월 선택 범위 개선
- hover sidebar pin 옵션 추가 여부 검토

주의:
- 이 Phase는 반드시 사용자 승인 후 선택 반영한다.
- 새 대형 기능은 추가하지 않는다.

---

## Phase 246 — 반응형/브라우저/접근성 회귀 QA

목표:
- 수정 후 주요 화면이 깨지지 않는지 확인한다.

검증:
- 1920px desktop
- 1440px desktop
- 1366px laptop
- tablet width
- mobile width
- Chrome refresh
- GitHub Pages base path
- keyboard navigation
- hover/focus sidebar

완료 조건:
- S0/S1 UI 회귀 없음

---

## Phase 247 — Lint / Build / Typecheck / Runtime QA

목표:
- 기술 검증을 수행한다.

실행 후보:
- npm run lint
- npm run typecheck
- npm run build
- npm run test 가능 시
- local preview

완료 조건:
- 실제 실행 결과 로그 보고
- 실패 시 원인과 수정 여부 보고

---

## Phase 248 — 최종 검증 리포트 작성

목표:
- Plan 23 수정 결과를 문서화한다.

리포트 포함:
- 수정 전 문제
- 수정 후 결과
- 수정 파일 목록
- 스크린샷 또는 확인 route
- JSON export 테스트 결과
- 남은 리스크
- 다음 Plan 후보

---

## Phase 249 — Git Commit 및 Push 승인 요청

목표:
- 사용자 승인 후 커밋 및 원격 push를 준비한다.

절차:
- git diff 요약
- 변경 파일 목록
- commit message 제안
- 사용자 승인 요청
- 승인 전 push 금지

---

# Antigravity 실행용 시작 프롬프트

아래 내용을 Antigravity에게 전달하라.

```text
현재 F:\workspace 프로젝트의 Plan 23 작업을 시작한다.

중요 전제:
- Plan 단계는 뒤로 갈수록 최신 요구사항이 우선이다.
- Plan 23은 Plan 22 UI 개선 이후 발견된 Sidebar hover overlay 버그, 상세화면 공간 활용 문제, 수주/개발 관리 기본 탭, 통합 일정표 가로폭, 인사카드 추가, 통합 JSON Export 실사용화 문제를 수정하는 Plan이다.
- 기능 흐름, 권한, PM 하달, 결재, 일정, JSON handoff, KOR/VIET 번역 구조를 임의로 깨지 마라.
- Sidebar hover 시 메인 화면을 밀지 말고 overlay처럼 덮어야 한다.
- Sidebar collapsed 상태에서는 전체 브랜드명을 표시하지 말고 `C&V` 같은 짧은 표기를 사용하라.
- expanded 상태에서는 `CON-COST&Viet_QS OS`가 깨지지 않게 안정적으로 표시하라.
- `수주/개발 관리` 진입 기본 탭은 `개발팀 업무 리스트 관리`로 설정하라.
- 통합 일정표는 화면 좌우 빈 공간을 활용하여 full-width로 개선하라.
- 사원관리 > 인사카드 관리에서 인사카드 추가/수정/비활성화가 가능해야 한다.
- 사용자가 수정한 일정/인사카드/프로젝트/업무/설정 데이터를 Antigravity가 나중에 읽을 수 있도록 통합 JSON 내보내기 기능을 실제 파일 다운로드 형태로 활성화하라.
- 각 Phase 시작 전 반드시 사용자에게 승인 요청을 하라.
- 사용자 승인 없이 Phase를 시작하지 마라.
- 사용자 승인 없이 다음 Phase로 넘어가지 마라.
- 사용자 승인 없이 GitHub 원격 push하지 마라.

먼저 Phase 223만 진행한다.
Phase 223에서는 코드 수정 금지, UI 수정 금지, JSON 기능 수정 금지, 현황 조사와 baseline 작성만 수행한다.

먼저 [Plan 23 / Phase 223 시작 승인 요청]만 작성하라.
아직 Phase 223을 실행하지 마라.
```
