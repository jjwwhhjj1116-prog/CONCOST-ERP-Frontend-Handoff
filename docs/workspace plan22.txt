# WORKSPACE PLAN 22 — 전체 UI/UX 공간 활용 개선, Hover Sidebar, 브랜드명 변경 프롬프트

이 프롬프트는 기존 `workspace plan1.txt`부터 `workspace plan21.txt` 이후에 추가되는 스물두 번째 보강 지시사항이다.

Plan 22의 목적은 기능 추가가 아니라, 현재 구현된 Workspace 사이트의 전체 UI를 실제 업무자가 더 넓고 효율적으로 사용할 수 있도록 개선하는 것이다.

사용자가 제공한 비교 화면 기준으로 다음 문제가 확인된다.

1. 현재 사이트는 일부 상세 페이지에서 좌우 여백이 과도하게 남아 실제 업무 영역을 충분히 사용하지 못한다.
2. 좌측 Workspace 메뉴가 항상 펼쳐져 있어 보드, 일정표, 상세 페이지의 작업 영역을 많이 차지한다.
3. 사용자는 기본 상태에서는 좌측 메뉴가 아이콘 형태로만 보이고, 마우스 커서가 올라가면 현재 웹처럼 전체 메뉴가 펼쳐지기를 원한다.
4. 모든 상세 페이지가 첫 번째 참고 화면처럼 화면 폭을 적극적으로 활용해야 한다.
5. 상단/좌측 브랜드명이 `EUMDI OS`로 되어 있으나, 최종 명칭은 `CON-COST&Viet_QS OS`로 변경해야 한다.
6. Plan 21까지 진행한 오류 수정 흐름을 깨지 않고, UI 개선만 독립적으로 진행해야 한다.

---

## 0. Plan 22의 핵심 원칙

Antigravity는 아래 원칙을 반드시 지켜라.

1. Plan 단계는 뒤로 갈수록 최신 요구사항이 우선이다.
2. Plan 22는 UI/UX 레이아웃 개선 전용 Plan이다.
3. Plan 22는 Plan 21 오류 수정 결과를 덮어쓰거나 되돌리면 안 된다.
4. 기능 로직, workflow 상태 전이, 권한, JSON handoff, 결재, PM 하달 로직은 임의로 변경하지 않는다.
5. UI 변경으로 기존 기능이 동작하지 않게 만들면 실패로 간주한다.
6. 모든 Phase는 시작 전 사용자 승인 요청을 먼저 해야 한다.
7. 사용자 승인 없이 다음 Phase로 넘어가지 않는다.
8. 사용자 승인 없이 GitHub 원격 push하지 않는다.
9. 화면에서 확인하지 않은 항목을 “완료”라고 보고하지 않는다.
10. 모든 변경은 before/after 스크린샷 또는 화면 확인 증빙을 남긴다.
11. 단순히 예뻐지는 것이 아니라 실제 업무 공간이 넓어지고 정보 밀도가 높아져야 한다.
12. 데스크톱, 노트북, 태블릿, 좁은 브라우저 폭에서 모두 레이아웃이 깨지지 않아야 한다.

---

## 1. 작업 범위

Plan 22에서 다룰 범위는 다음이다.

### 1-1. 브랜드명 변경

현재 UI에 표시되는 다음 명칭을 전부 점검한다.

```text
EUMDI OS
EUMDI
EUMDI Workspace
© 2024 EUMDI OS
```

최종 표기는 아래로 통일한다.

```text
CON-COST&Viet_QS OS
```

적용 대상:

- 좌측 사이드바 로고/브랜드 텍스트
- 상단 헤더 브랜드 텍스트
- 문서 title / metadata
- footer copyright 문구
- manifest, config, 상수 파일
- empty state, 안내 문구, export metadata에 들어간 브랜드명
- QA 리포트에서 참조하는 명칭

주의:

- 기존 route, localStorage key, export schema name을 무리하게 변경하지 마라.
- 데이터 호환성에 영향을 주는 internal key는 유지하고, 사용자에게 보이는 display name만 우선 변경한다.
- internal key 변경이 꼭 필요하면 별도 migration 계획을 작성하고 사용자 승인을 받은 뒤 진행한다.

---

## 2. Hover Sidebar / Icon-only Sidebar 요구사항

### 2-1. 기본 동작

좌측 Workspace 사이드바는 기본적으로 아이콘만 보이는 compact 상태로 유지한다.

```text
기본 상태: 아이콘만 표시
마우스 hover / focus-in: 전체 메뉴 펼침
마우스 leave / focus-out: 다시 아이콘 상태로 축소
```

### 2-2. 권장 치수

```text
collapsed width: 64px ~ 72px
expanded width: 240px ~ 280px
transition: 160ms ~ 220ms
```

### 2-3. 레이아웃 방식

권장 구현은 다음이다.

```text
- 본문 레이아웃은 collapsed width 기준으로 넓게 확보한다.
- sidebar expand 시 본문을 강하게 밀어내지 말고 overlay 또는 lightweight push 방식으로 처리한다.
- hover expand 때문에 차트/보드/일정표가 매번 크게 흔들리지 않게 한다.
```

### 2-4. 접근성

아래 접근성을 지켜야 한다.

- 키보드 tab focus가 sidebar 안으로 들어오면 자동 확장
- focus가 sidebar 밖으로 나가면 축소
- 아이콘만 보일 때도 tooltip 또는 aria-label 제공
- 현재 활성 메뉴는 collapsed 상태에서도 색상/indicator로 표시
- hover가 없는 터치 기기에서는 hamburger 또는 pin 버튼 제공

### 2-5. Pin 옵션

사용자가 원하면 sidebar를 고정할 수 있도록 pin 옵션을 제공할 수 있다.

```text
기본값: auto-collapse
옵션: pinned expanded
저장 위치: localStorage 또는 uiStore
```

단, pin 옵션 구현이 과도하면 우선 hover sidebar만 구현하고 pin은 후속 개선으로 분리한다.

---

## 3. 전체 페이지 공간 활용 개선 요구사항

현재 일부 상세 페이지는 중앙 fixed-width container 때문에 좌우 빈 공간이 과도하다. Plan 22에서는 모든 주요 페이지의 page shell을 점검하고 다음 원칙으로 통일한다.

### 3-1. 공통 Page Shell

공통 레이아웃 규칙을 만든다.

```text
.page-shell 또는 AppContent
- width: 100%
- max-width: none 또는 페이지 유형별 명시
- padding: clamp(16px, 1.2vw, 24px)
- content width: calc(100vw - collapsedSidebarWidth - safePadding)
```

금지:

```text
- 모든 상세 페이지에 일괄 max-w-5xl, max-w-6xl, max-w-7xl을 적용해 좌우 빈 공간을 만드는 구조
- 본문을 고정폭 중앙 정렬만 하는 구조
- 일정표/보드처럼 넓은 데이터 화면을 작은 카드 안에 가두는 구조
```

### 3-2. 페이지 유형별 레이아웃

#### Dashboard

- 상단 KPI 카드는 화면 폭에 따라 4열 또는 2열 자동 배치
- 차트 영역은 2:1 또는 1:1 비율로 넓게 사용
- 최근 프로젝트/알림/빠른 작업 영역은 하단에서 균형 배치

#### 수주/개발 관리 `/projects/intake`

- 탭, 등록 폼, 리스트 영역이 화면 폭을 최대한 사용
- 입력 폼은 한 줄에 가능한 항목을 적절히 배치하되 너무 촘촘하지 않게 유지
- 리스트/테이블은 full width로 확장

#### 통합 프로젝트 보드 `/projects`

- 보드 컬럼은 화면 폭을 최대한 사용
- 컬럼 간 간격은 줄이고 카드 정보 밀도는 높인다
- 가로 스크롤은 필요할 때만 보드 내부에서 발생하게 한다
- 전체 페이지 자체가 불필요하게 좌우 스크롤되지 않게 한다

#### 프로젝트 상세 / 세부 공정 보드

- 프로젝트 정보 header는 full width
- 공정 단계 컬럼은 화면 폭 전체를 사용
- 태스크 상세 패널 또는 modal은 너무 좁지 않게 한다
- 상세 패널이 있다면 right drawer 또는 wide modal 검토

#### 결재/수정 내역 `/approvals`

- 결재 목록과 상세 내용을 2-pane 구조로 확장 가능
- 목록만 중앙에 좁게 배치하지 않는다

#### 일정 충돌 `/conflicts`

- 충돌 목록, 영향 직원, 관련 프로젝트, 조치 버튼이 한 화면에서 확인되도록 grid/table 개선

#### 통합 일정표 `/schedule`

- 월간 그리드는 화면 폭 전체 사용
- 직원명 고정 컬럼 + 날짜 영역 스크롤 구조 유지
- 날짜 셀은 최소 폭을 확보하되, 빈 여백을 과도하게 남기지 않는다
- 현재 화면처럼 좌우 빈 공간이 많고 일정표가 중앙에 작게 갇힌 구조를 금지한다

#### 알림 센터 `/notifications`

- 알림 리스트와 상세/필터 영역을 넓게 사용
- 읽음/미읽음/우선순위 필터가 상단에서 명확히 보이게 한다

#### 운영 설정 `/settings`

- 설정 카테고리 sidebar와 상세 설정 영역을 2-pane 구조로 배치
- personnel, organization, data quality 등 하위 페이지도 full-width 원칙 적용

#### 성과 평가 `/evaluation`

- 평가 대상 목록, QC 오류 입력, 점수 계산 결과를 한 화면에서 볼 수 있는 wide layout 검토

---

## 4. 디자인 방향

Plan 22의 UI 방향은 다음이다.

```text
- 업무용 SaaS 느낌
- 밝은 배경 + 얇은 border + 낮은 그림자
- 카드 간격은 줄이되 답답하지 않게 유지
- 상단 헤더는 compact하게 유지
- 빈 공간보다 데이터 표시 영역 우선
- 보드/일정표/테이블은 화면 폭을 적극적으로 사용
- 주요 액션 버튼은 우측 상단 또는 섹션 헤더 우측으로 정렬
```

색상은 기존 blue/violet 계열을 유지하되, 브랜드명 변경과 충돌하지 않게 한다.

---

## 5. 금지사항

Plan 22에서 아래 작업은 금지한다.

1. 기능 로직을 리팩토링하면서 workflow를 변경하는 것
2. Plan 21에서 수정한 버그를 되돌리는 것
3. JSON schema를 임의 변경하는 것
4. 권한 로직을 UI 표시 편의를 위해 우회하는 것
5. 모든 페이지를 동일한 grid로 강제해 사용성이 떨어지게 만드는 것
6. 화면 확인 없이 “전체 페이지 반영 완료”라고 보고하는 것
7. localStorage 데이터 초기화를 강제하는 것
8. 기존 사용자 데이터가 사라질 수 있는 변경
9. GitHub 원격 push를 사용자 승인 없이 수행하는 것

---

## 6. Phase 진행 규칙

각 Phase 시작 전 반드시 다음 형식으로 사용자에게 승인 요청하라.

```text
[Plan 22 / Phase XXX 시작 승인 요청]

이번 Phase 목표:
- ...

이번 Phase에서 할 작업:
- ...

이번 Phase에서 하지 않을 작업:
- ...

예상 산출물:
- ...

진행 승인 부탁드립니다.
```

사용자가 승인하기 전에는 해당 Phase를 실행하지 마라.

각 Phase 완료 후에는 다음 형식으로 보고하라.

```text
[Plan 22 / Phase XXX 완료 보고]

수행 내용:
- ...

변경 파일:
- ...

화면 확인 결과:
- ...

Before/After 증빙:
- ...

잔여 리스크:
- ...

다음 Phase 진행 승인 요청 여부:
- ...
```

---

# Plan 22 Phase 구성

## Phase 203 — UI 현황 조사 및 변경 금지 Baseline 작성

목표:
현재 화면과 코드 구조를 조사하고, 어떤 레이아웃 컴포넌트가 전체 UI를 제어하는지 파악한다.

작업:
- 현재 route 목록 작성
- layout, sidebar, header, page shell, container component 위치 파악
- `EUMDI OS` 문자열 사용 위치 검색
- fixed max-width, container, page padding 사용 위치 검색
- 현재 화면 before screenshot 수집

금지:
- 코드 수정 금지
- 스타일 수정 금지
- 브랜드명 변경 금지

산출물:
- `qa/plan22/phase203_ui_baseline.md`

---

## Phase 204 — 브랜드명 변경 영향 범위 보고

목표:
`EUMDI OS` → `CON-COST&Viet_QS OS` 변경 범위를 정확히 확정한다.

작업:
- UI display string 목록 작성
- metadata/title/footer/manifest/config 영향 범위 작성
- internal key와 display name 구분
- 변경 시 위험한 항목 분류

금지:
- 아직 변경하지 않는다.

산출물:
- `qa/plan22/phase204_brand_rename_scope.md`

---

## Phase 205 — 공통 레이아웃 설계안 작성

목표:
Hover sidebar와 full-width page shell 설계를 먼저 문서화한다.

작업:
- collapsed/expanded sidebar 치수 확정
- overlay/push 방식 중 최종 방식 제안
- page shell 공통 규칙 작성
- 페이지 유형별 적용 전략 작성
- 접근성 요구사항 작성

금지:
- 코드 수정 금지

산출물:
- `qa/plan22/phase205_layout_design.md`

---

## Phase 206 — 브랜드명 변경 Patch

목표:
사용자에게 보이는 브랜드명을 `CON-COST&Viet_QS OS`로 변경한다.

작업:
- header/sidebar/footer/title 변경
- metadata/manifest display name 변경
- export metadata display name이 있다면 확인 후 display만 변경
- internal schema key 변경 금지

검증:
- 주요 route에서 새 명칭 표시 확인
- 기존 데이터 유지 확인

산출물:
- 변경 파일 목록
- before/after screenshot

---

## Phase 207 — Sidebar 상태 모델 및 UI Store 점검

목표:
Hover sidebar 구현 전 상태 모델을 확정한다.

작업:
- 기존 sidebar collapsed state 존재 여부 확인
- uiStore/localStorage 사용 여부 확인
- hover/focus/pin 상태 설계
- 모바일 대응 분기 설계

금지:
- 아직 visual 변경 최소화

산출물:
- `qa/plan22/phase207_sidebar_state_plan.md`

---

## Phase 208 — Icon-only 기본 Sidebar 구현

목표:
기본 상태에서 좌측 sidebar를 아이콘 전용 compact 상태로 만든다.

작업:
- collapsed width 적용
- 메뉴 텍스트 숨김
- 활성 메뉴 indicator 유지
- tooltip/aria-label 추가
- 본문 영역이 넓어지는지 확인

검증:
- 모든 주요 메뉴 접근 가능
- 현재 route 표시 정상
- keyboard navigation 기본 확인

---

## Phase 209 — Hover / Focus Expand Sidebar 구현

목표:
마우스 hover 또는 keyboard focus 시 sidebar가 펼쳐지게 한다.

작업:
- pointer enter/leave 처리
- focus within 처리
- transition 적용
- expanded 상태 메뉴 텍스트 표시
- 본문 layout shift 최소화

검증:
- hover 시 자연스럽게 열림
- 마우스가 떠나면 접힘
- 키보드 focus 접근 가능
- 일정표/보드 화면이 흔들리지 않는지 확인

---

## Phase 210 — Sidebar Pin / Mobile Fallback 검토 및 적용

목표:
필요 시 사용자가 sidebar를 고정할 수 있게 하거나, 모바일 fallback을 보완한다.

작업:
- pin 버튼 필요성 검토
- localStorage 저장 여부 결정
- touch 환경에서 hamburger/overlay 동작 확인

주의:
- 과도한 기능이면 후속 개선으로 분리 가능

---

## Phase 211 — 공통 Page Shell Full-width 적용

목표:
모든 상세 페이지가 화면 폭을 더 잘 사용하도록 공통 shell을 개선한다.

작업:
- max-width 제한 제거 또는 페이지별 재정의
- padding clamp 적용
- header/content/footer width 통일
- page overflow 정책 정리

검증:
- 대시보드, 프로젝트, 일정표, 설정 화면에서 좌우 여백 감소 확인
- 전체 페이지 horizontal scroll 발생 여부 확인

---

## Phase 212 — Dashboard 레이아웃 개선

목표:
대시보드가 넓은 화면을 효율적으로 사용하도록 조정한다.

작업:
- KPI 카드 grid 개선
- 월별 프로젝트 현황 차트 영역 확장
- 프로젝트 상태 분포 균형 조정
- 최근 프로젝트/최근 알림/빠른 작업 배치 개선

검증:
- 1920px, 1440px, 1280px 기준 화면 확인

---

## Phase 213 — 수주/개발 관리 화면 레이아웃 개선

목표:
`/projects/intake`의 탭, 입력 폼, 리스트 영역을 넓게 개선한다.

작업:
- 수주 프로젝트 관리 탭 full-width 적용
- 개발팀 업무 리스트 관리 탭 full-width 적용
- 폼 grid 재정렬
- 리스트/table 영역 확장

검증:
- 프로젝트 생성 기능 유지
- 개발팀 작업 생성 기능 유지

---

## Phase 214 — 통합 프로젝트 보드 레이아웃 개선

목표:
`/projects` 보드가 화면 폭을 최대한 활용하도록 개선한다.

작업:
- 보드 컬럼 폭/간격 재조정
- board container max-width 제거
- 카드 정보 밀도 개선
- 보드 내부 scroll 정책 정리

검증:
- 개발팀 작업/외부 수주 프로젝트 탭 모두 확인
- 착수 전/진행 중/완료/수정 컬럼 모두 확인
- drag/drop 기능 회귀 확인

---

## Phase 215 — 프로젝트 상세 / 세부 공정 보드 레이아웃 개선

목표:
프로젝트 상세 페이지와 세부 공정 보드의 빈 공간을 줄이고 업무 영역을 확장한다.

작업:
- 상세 header full-width
- 공정 컬럼 full-width
- 상세 패널/modal 너비 개선
- breadcrumb/back button 위치 확인

검증:
- 세부 공정 drag/drop 회귀 확인
- 상태 전이 제약이 Plan 21 기준으로 유지되는지 확인

---

## Phase 216 — 통합 일정표 레이아웃 개선

목표:
두 번째 참고 화면처럼 중앙에 좁게 갇힌 일정표를 full-width 업무형 그리드로 개선한다.

작업:
- calendar wrapper width 확장
- 직원명 고정 컬럼 유지
- 날짜 영역 가로 스크롤 개선
- 직원 월간 그리드/프로젝트 타임라인/직원 상세 탭 모두 확인

검증:
- 2026년 7월 기준 표시 확인
- 월 이동 버튼 정상
- 빈 공간 감소 확인

---

## Phase 217 — 결재/수정 내역 화면 레이아웃 개선

목표:
결재 목록과 상세 정보를 넓은 화면에서 더 잘 볼 수 있게 한다.

작업:
- list/detail 구조 검토
- 필터/액션 버튼 배치 개선
- 승인/반려 버튼 회귀 확인

---

## Phase 218 — 일정 충돌 관리 화면 레이아웃 개선

목표:
충돌 목록, 원인, 영향, 조치 액션이 넓은 화면에서 한눈에 보이도록 개선한다.

작업:
- table/grid 확장
- severity 표시 개선
- 관련 프로젝트/직원 정보 표시 공간 확보

---

## Phase 219 — 알림 센터 / 운영 설정 / 성과 평가 화면 레이아웃 개선

목표:
나머지 관리 화면도 full-width 원칙을 적용한다.

작업:
- `/notifications` 개선
- `/settings` 개선
- `/settings/personnel` 등 하위 설정 개선
- `/evaluation` 개선

검증:
- 권한별 접근 메뉴 깨짐 여부 확인

---

## Phase 220 — 반응형 / 접근성 / Cross-route Regression QA

목표:
UI 개선 후 모든 주요 route가 깨지지 않는지 검증한다.

검증 해상도:

```text
1920 x 1080
1600 x 900
1440 x 900
1366 x 768
1280 x 720
tablet width
mobile width
```

검증 항목:
- sidebar hover/focus
- menu navigation
- page width
- horizontal scroll
- modal overflow
- board drag/drop
- form submit
- JSON import/export
- role switch

산출물:
- `qa/plan22/phase220_regression_qa.md`

---

## Phase 221 — Lint / Build / Test / Git Diff 검증

목표:
코드 품질과 빌드 안정성을 검증한다.

작업:
- npm lint
- npm build
- 필요한 test 실행
- git diff 요약
- 변경 파일 목록 작성

주의:
- 실패하면 실패 원인과 수정 필요 항목을 보고한다.
- 실제 통과하지 않았으면 통과했다고 쓰지 않는다.

---

## Phase 222 — Plan 22 최종 리포트 및 Push 승인 요청

목표:
Plan 22의 전체 변경사항을 정리하고, 원격 push 전 사용자 승인을 요청한다.

산출물:
- `qa/plan22/FINAL_PLAN22_UI_REFACTOR_REPORT.md`

리포트 필수 항목:

```text
1. 브랜드명 변경 결과
2. Hover sidebar 적용 결과
3. Page shell 개선 결과
4. 페이지별 before/after 요약
5. 남은 UI 리스크
6. 기능 회귀 테스트 결과
7. lint/build/test 결과
8. 변경 파일 목록
9. 커밋 전 상태
10. 사용자 push 승인 요청
```

---

# Antigravity 시작 지시문

아래 문장으로 Plan 22를 시작하라.

```text
현재 F:\workspace 프로젝트의 Plan 22 UI/UX 개선 작업을 시작한다.

중요 전제:
- Plan 단계는 뒤로 갈수록 최신 요구사항이 우선이다.
- Plan 22는 전체 UI/UX 공간 활용 개선, Hover Sidebar, 브랜드명 변경 전용 Plan이다.
- 브랜드명은 사용자에게 보이는 모든 위치에서 `EUMDI OS`가 아니라 `CON-COST&Viet_QS OS`로 표시되어야 한다.
- 좌측 Workspace 메뉴는 기본 상태에서 아이콘만 보이고, 마우스 hover 또는 keyboard focus 시 현재 웹처럼 펼쳐져야 한다.
- 모든 상세 페이지는 좌우 빈 공간을 줄이고 첫 번째 참고 화면처럼 화면 폭을 적극적으로 활용해야 한다.
- 기능 로직, workflow, 권한, JSON handoff, 결재, PM 하달 로직은 임의로 변경하지 마라.
- 각 Phase 시작 전 반드시 사용자에게 승인 요청을 하라.
- 사용자 승인 없이 Phase를 시작하지 마라.
- 사용자 승인 없이 다음 Phase로 넘어가지 마라.
- 사용자 승인 없이 GitHub 원격 push하지 마라.

먼저 Phase 203만 진행한다.
Phase 203에서는 코드 수정 금지, UI 수정 금지, 브랜드명 변경 금지, 현황 조사와 baseline 작성만 수행한다.

먼저 [Plan 22 / Phase 203 시작 승인 요청]만 작성하라.
아직 Phase 203을 실행하지 마라.
```
