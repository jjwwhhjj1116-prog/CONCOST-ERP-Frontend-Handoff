# WORKSPACE PLAN 24 — Plan 23 결과 검증 및 Sidebar/Brand/Layout/JSON 안정화 재수정 프롬프트

이 프롬프트는 기존 `workspace plan1`부터 `workspace plan23` 이후에 추가되는 스물네 번째 보강 지시사항이다.

Plan 24의 목적은 Plan 23에서 “반영 완료”로 보고된 항목 중 실제 화면에서 여전히 재현되는 문제를 다시 검증하고, 기능을 임의 확장하지 않은 상태에서 실사용에 필요한 UI 안정화와 JSON Handoff 품질을 보완하는 것이다.

이번 Plan 24는 신규 대형 기능 개발이 아니다.  
다음 항목을 실제 화면/코드/배포 결과 기준으로 재검증하고 필요한 최소 수정을 진행한다.

- Sidebar hover 시 브랜드 텍스트 깨짐/겹침/재생성 오류
- Sidebar hover 확장 시 메인 콘텐츠가 밀리지 않고 overlay로 덮이는지 검증
- collapsed 상태와 expanded 상태의 브랜드 표시 정책 재정의
- `EUMDI OS` 잔존 텍스트 제거 및 `CON-COST&Viet_QS OS` 적용 범위 검증
- `수주/개발 관리` 기본 탭이 실제로 `개발팀 업무 리스트 관리`인지 검증
- 통합 일정표 및 상세 페이지의 full-width 적용 여부 검증
- 인사카드 추가/수정/비활성화 기능 실제 동작 검증
- 통합 JSON 내보내기/불러오기 실제 다운로드·복원 검증
- Plan 23 리포트의 과장/미검증 표현 정정
- GitHub push/커밋 절차가 사용자 승인 원칙과 충돌하지 않았는지 확인

---

## 0. 가장 중요한 원칙

Antigravity는 아래 원칙을 반드시 지켜라.

1. Plan 단계는 뒤로 갈수록 최신 요구사항이 우선이다.
2. Plan 24는 Plan 23 결과 검증 및 미반영 사항 재수정 전용 Plan이다.
3. 리포트에 “완료”라고 적혀 있어도 실제 배포 화면에서 깨지면 미완료로 본다.
4. 실제 화면, 코드, 빌드 결과, 배포 결과를 모두 확인하기 전에는 “완료”라고 쓰지 마라.
5. 사용자 승인 없이 Phase를 시작하지 마라.
6. 사용자 승인 없이 다음 Phase로 넘어가지 마라.
7. 사용자 승인 없이 GitHub 원격 push하지 마라.
8. 이미 origin/main에 push된 커밋이 있다면, 사용자 승인 절차와 충돌 여부를 먼저 보고하라.
9. 이번 Plan에서는 PM 하달, 결재, 권한, 일정 충돌, 번역, 평가 로직을 임의로 변경하지 마라.
10. 수정 범위는 Sidebar/Brand/Layout/Personnel/JSON Export-Import/Plan 23 Report 정합성으로 제한한다.
11. 검증 없이 CSS만 덧씌우지 말고, 원인 컴포넌트와 상태 모델을 먼저 확인하라.

---

## 1. 현재 사용자가 재현한 문제

사용자 스크린샷 기준으로 다음 문제가 확인되었다.

### 1-1. Sidebar collapsed 상태 브랜드 텍스트 오류

현재 collapsed 상태에서 좌측 상단 로고 영역에 `CON-COST&Viet_QS OS` 전체 문자열이 좁은 폭 안에서 강제로 줄바꿈되어 다음과 같은 문제가 발생한다.

- `CON-`
- `COST&Viet_QS`
- `OS`

처럼 3줄로 깨져 보임.
또한 hover/전환 과정에서 헤더 텍스트와 겹쳐 보이는 증상이 있다.

### 1-2. Sidebar expanded 상태와 collapsed 상태의 브랜드 표시 정책이 없음

collapsed 상태에서는 전체 브랜드명을 표시하면 안 된다.  
expanded 상태에서는 전체 브랜드명을 안정적으로 표시하되, 길이 때문에 깨지면 안 된다.

Plan 24에서 브랜드 표시는 다음 기준으로 고정한다.

```text
Collapsed Sidebar:
- 표시값: C&V
- tooltip/aria-label: CON-COST&Viet_QS OS
- 전체 브랜드명 표시 금지
- 줄바꿈 금지
- overflow hidden 처리

Expanded Sidebar:
- 표시값: CON-COST&Viet_QS OS
- 한 줄 표시를 우선한다.
- 필요 시 font-size, letter-spacing, container width를 조정한다.
- 절대 2~3줄로 깨지지 않게 한다.
- hover animation 중에는 opacity transition 후 표시한다.
```

### 1-3. Sidebar hover overlay 방식 재검증 필요

Plan 23 리포트에서는 overlay 방식이 적용되었다고 보고했지만, 실제 화면에서 다음을 다시 확인해야 한다.

- hover 시 main content가 margin-left 변경으로 밀리는지
- sidebar width animation 때문에 header/content가 재계산되는지
- overlay sidebar가 position fixed 또는 absolute + z-index 방식으로 안정적으로 덮이는지
- collapsed rail 영역은 고정 폭으로 유지되는지
- expanded panel만 overlay로 나타나는지

### 1-4. 브랜드명 잔존 문제

사용자 화면 일부에는 `CON-COST&Viet_QS OS`가 보이지만, 배포 HTML 또는 문서 타이틀/초기 fallback/manifest 등에 `EUMDI OS`가 남아 있을 수 있다.  
다음 위치를 모두 검색해야 한다.

```text
EUMDI OS
EUMDI
EUMDI OS - Project Management
<title>
metadata
manifest
package display text
sidebar logo text
header text
footer text
empty state text
JSON export metadata
report text
```

사용자에게 보이는 브랜드명은 다음으로 통일한다.

```text
CON-COST&Viet_QS OS
```

단, collapsed sidebar의 시각 표시만 다음 약칭을 허용한다.

```text
C&V
```

---

## 2. Plan 23 리포트와 실제 반영 여부 점검 기준

Plan 23 리포트에는 다음이 완료되었다고 되어 있다.

1. Sidebar Hover overlay 방식 적용
2. 수주/개발 관리 기본 탭 변경
3. 통합 일정표 Full-width 적용
4. 인사카드 CRUD 및 모달 추가
5. 통합 JSON Export 활성화
6. 모든 상세페이지 Full-width 적용
7. 알림/결재 리스트 UX 안정화
8. 다국어 텍스트 가시성 개선
9. 빌드 테스트 후 origin/main 반영

Plan 24에서는 위 항목을 모두 “실제 검증 대상”으로 본다.

각 항목은 다음 4단계 중 하나로 판정한다.

```text
PASS: 실제 화면/코드/동작 검증 완료
PARTIAL: 일부만 반영
FAIL: 미반영 또는 실제 화면에서 오류 재현
BLOCKED: 검증 불가
```

---

## 3. Phase 구성

아래 Phase는 반드시 순서대로 진행한다.  
각 Phase 시작 전에는 반드시 사용자 승인을 요청한다.  
사용자가 승인하기 전에는 실행하지 않는다.

---

# Phase 250 — Plan 23 산출물 및 현재 배포 화면 Baseline 수집

## 목표

Plan 23 리포트의 주장과 현재 배포 화면을 대조하기 위한 baseline을 만든다.

## 작업

1. 현재 브랜치, 최근 커밋 5개, origin/main 상태 확인
2. Plan 23 관련 커밋 `29e2134`, `9c6b00d` 존재 여부 확인
3. `git status` 확인
4. 배포 URL 접속
5. 다음 화면 스크린샷 저장
   - 대시보드
   - 수주/개발 관리
   - 통합 프로젝트 보드
   - 통합 일정표
   - 알림 센터
   - 운영 설정 > 사원 관리
   - 운영 설정 > 가져오기(JSON)
6. console error 확인
7. localStorage key 목록 확인
8. route refresh 404 여부 확인

## 금지

- 코드 수정 금지
- CSS 수정 금지
- 기능 수정 금지
- git commit 금지
- git push 금지

## 완료 보고

```text
[Plan 24 / Phase 250 완료 보고]
- 확인한 URL:
- 확인한 커밋:
- Plan 23 커밋 존재 여부:
- 화면별 baseline 스크린샷:
- console error:
- route refresh 결과:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 251 — Sidebar 브랜드 텍스트 깨짐 원인 분석

## 목표

collapsed 상태에서 `CON-COST&Viet_QS OS`가 깨지는 원인을 코드 기준으로 찾는다.

## 작업

1. Sidebar 컴포넌트 위치 확인
2. AppLayout / Shell / Navigation 컴포넌트 구조 확인
3. sidebar 상태값 확인
   - collapsed
   - expanded
   - hover
   - pinned
   - mobile
4. brand text 렌더링 위치 확인
5. collapsed 상태에서도 full brand text가 렌더링되는지 확인
6. CSS class 확인
   - width
   - min-width
   - max-width
   - white-space
   - overflow
   - transition
   - z-index
7. hover 중 brand text가 먼저 렌더링되고 width가 나중에 확장되어 줄바꿈되는지 확인

## 금지

- 코드 수정 금지

## 완료 보고

```text
[Plan 24 / Phase 251 완료 보고]
- 원인 컴포넌트:
- 원인 CSS:
- collapsed 상태 렌더링 문제:
- hover transition 문제:
- 수정 제안:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 252 — Sidebar 브랜드 표시 정책 설계

## 목표

브랜드 표시 정책을 확정한다.

## 정책

```text
collapsed:
- visual text: C&V
- full text hidden
- aria-label/title: CON-COST&Viet_QS OS
- no wrapping
- width: rail width에 맞춤
- tooltip optional

hover-expanded:
- visual text: CON-COST&Viet_QS OS
- opacity transition after panel width settled
- white-space: nowrap
- overflow hidden
- max one line

expanded/pinned:
- visual text: CON-COST&Viet_QS OS
- stable width
- no line-break
```

## 작업

1. Sidebar state별 brand rendering spec 작성
2. 접근성 기준 작성
3. 모바일 기준 작성
4. 회귀 검증 기준 작성

## 금지

- 코드 수정 금지

## 완료 보고

```text
[Plan 24 / Phase 252 완료 보고]
- 최종 브랜드 표시 정책:
- CSS 적용 방향:
- 접근성 기준:
- 사용자 승인 후 구현 예정:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 253 — Sidebar 브랜드 깨짐 수정 구현

## 목표

사용자 스크린샷의 브랜드 깨짐 문제를 실제로 수정한다.

## 작업

1. Sidebar 컴포넌트에서 collapsed/expanded brand 렌더링 분리
2. collapsed 상태에서는 `C&V`만 렌더링
3. expanded 상태에서는 `CON-COST&Viet_QS OS` 렌더링
4. `white-space: nowrap`
5. `overflow: hidden`
6. `text-overflow: clip` 또는 안정적 ellipsis 처리
7. hover transition 중 layout shift 방지
8. 헤더 텍스트와 겹치지 않도록 z-index 및 overlay panel 확인
9. screenshot 기준 재현 검증

## 완료 조건

- collapsed 상태에서 전체 브랜드명이 보이지 않음
- collapsed 상태에서 `C&V`만 보임
- expanded 상태에서 full brand가 한 줄로 안정 표시
- hover 도중 텍스트가 줄바꿈되지 않음
- 헤더와 겹치지 않음

## 완료 보고

```text
[Plan 24 / Phase 253 완료 보고]
- 수정 파일:
- 수정 내용:
- before/after 스크린샷:
- collapsed 검증:
- expanded 검증:
- hover transition 검증:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 254 — Sidebar Overlay 동작 재검증 및 보정

## 목표

Sidebar hover 시 메인 콘텐츠가 밀리지 않고 overlay처럼 덮이는지 검증·보정한다.

## 작업

1. collapsed rail width 고정
2. hover expanded panel을 overlay layer로 분리
3. main content margin-left가 hover 상태에서 변경되지 않도록 보정
4. top header와 sidebar z-index 관계 정리
5. hover out 시 content layout shift 없는지 확인
6. keyboard focus 시에도 overlay 확장되도록 유지
7. sidebar 내부 메뉴 hover/click 시 pointer event 확인
8. 모바일에서는 overlay drawer 또는 기존 responsive 방식 유지

## 완료 조건

- hover 전/후 main content x-position이 변하지 않음
- header 버튼 위치가 밀리지 않음
- overlay sidebar가 content 위에 자연스럽게 덮임
- 스크롤/클릭 방해 없음

## 완료 보고

```text
[Plan 24 / Phase 254 완료 보고]
- 수정 파일:
- layout shift 측정 결과:
- z-index 정책:
- keyboard focus 검증:
- 모바일 fallback:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 255 — 브랜드명 EUMDI OS 잔존 제거

## 목표

사용자에게 보이는 `EUMDI OS` 잔존 텍스트를 제거한다.

## 작업

1. 전체 코드 검색
   - EUMDI OS
   - EUMDI
   - eumdi
   - Project Management
2. 다음 파일군 확인
   - app metadata
   - layout
   - manifest
   - sidebar
   - header
   - footer
   - JSON export metadata
   - report/about/version text
3. 사용자 표시 브랜드를 `CON-COST&Viet_QS OS`로 통일
4. collapsed sidebar만 `C&V` 약칭 허용
5. README/리포트는 필요한 경우 히스토리 문맥을 유지하되 사용자 UI와 구분

## 완료 조건

- 배포 HTML title에 EUMDI OS가 남아있지 않음
- 사용자 UI에 EUMDI OS가 남아있지 않음
- sidebar collapsed는 C&V
- sidebar expanded는 CON-COST&Viet_QS OS

## 완료 보고

```text
[Plan 24 / Phase 255 완료 보고]
- 검색 결과:
- 수정 파일:
- 남겨둔 EUMDI 문자열이 있다면 사유:
- 배포 HTML 확인 결과:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 256 — 수주/개발 관리 기본 탭 재검증 및 보정

## 목표

`수주/개발 관리` 진입 시 기본 탭이 `개발팀 업무 리스트 관리`인지 검증한다.

## 작업

1. `/projects/intake` 또는 해당 route 진입
2. localStorage/state 초기화 후 기본 탭 확인
3. 새로고침 후 기본 탭 확인
4. 직접 URL 진입 시 기본 탭 확인
5. 이전 탭 기억 정책이 있는지 확인
6. 기본값과 사용자 마지막 선택값의 우선순위 결정

## 정책

기본 요구사항:

```text
처음 진입 또는 저장된 선호값이 없을 때:
- 개발팀 업무 리스트 관리 활성

사용자가 같은 세션에서 탭을 바꾼 경우:
- 선택값 유지 가능
```

## 완료 보고

```text
[Plan 24 / Phase 256 완료 보고]
- 기본 탭 검증:
- 새로고침 검증:
- localStorage 초기화 검증:
- 수정 여부:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 257 — 통합 일정표 Full-width 및 가로 스크롤 재검증

## 목표

통합 일정표가 실제로 좌우 빈 공간을 활용하고, 불필요한 내부 가로 스크롤을 줄였는지 검증·보정한다.

## 작업

1. 일정표 route 접속
2. viewport 1366, 1536, 1920 기준 확인
3. 일정표 외부 container width 확인
4. 내부 calendar grid width 확인
5. 날짜 셀 최소 너비 확인
6. 직원명 frozen column 또는 첫 열 기준 확인
7. 내부 스크롤이 필요한 경우와 불필요한 경우 분리
8. 좌우 빈 공간이 큰데도 내부 스크롤이 생기는 경우 수정

## 정책

```text
- page shell은 full-width
- calendar card는 available width를 최대 사용
- 날짜가 너무 많은 월간 grid는 내부 scroll 허용
- 단, 좌우 빈 공간이 남아있는데 container max-width 때문에 scroll이 생기면 실패
- horizontal scroll bar는 grid 하단에만 표시
- header/toolbar는 카드 폭과 정렬
```

## 완료 보고

```text
[Plan 24 / Phase 257 완료 보고]
- viewport별 결과:
- container width:
- grid width:
- scroll 필요/불필요 판단:
- 수정 파일:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 258 — 상세 페이지 Full-width 반영 재검증

## 목표

Plan 23에서 “13개 주요 페이지 full-width 적용”이라고 보고된 항목을 실제로 route별 검증한다.

## 검증 대상

- 대시보드
- 수주/개발 관리
- 통합 프로젝트 보드
- 프로젝트 상세
- 내 업무
- 결재/수정 내역
- 일정 충돌 관리
- 통합 일정표
- 알림 센터
- 운영 설정
- 사원 관리
- 권한 정책 설정
- 번역 설정
- 성과 평가

## 작업

1. 각 route의 page shell width 확인
2. max-width 잔존 여부 확인
3. 좌우 여백 과다 여부 확인
4. table/card/list가 화면 폭을 활용하는지 확인
5. full-width가 오히려 가독성을 해치면 콘텐츠 유형별 max-width 예외 정의

## 완료 보고

```text
[Plan 24 / Phase 258 완료 보고]
- route별 PASS/PARTIAL/FAIL:
- max-width 잔존 파일:
- 수정 필요 항목:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 259 — 인사카드 추가/수정/비활성화 실제 동작 검증

## 목표

사원관리에서 인사카드 추가 버튼과 CRUD가 실제로 동작하는지 검증한다.

## 작업

1. 운영 설정 > 사원 관리 접속
2. 인사카드 추가 버튼 존재 확인
3. 신규 직원 추가
4. 필수값 validation 확인
5. 권한/부서/회사/직급 입력 확인
6. 저장 후 목록 반영 확인
7. 수정 모달 확인
8. 비활성화 처리 확인
9. localStorage/state 반영 확인
10. JSON Export 포함 여부 확인

## 완료 보고

```text
[Plan 24 / Phase 259 완료 보고]
- 추가 버튼 존재 여부:
- 신규 추가 테스트:
- 수정 테스트:
- 비활성화 테스트:
- JSON 포함 여부:
- 오류:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 260 — 통합 JSON Export 실제 다운로드 검증

## 목표

통합 JSON Export가 실제 파일 다운로드로 동작하고 Antigravity가 읽을 수 있는 구조인지 검증한다.

## 작업

1. 대시보드 JSON 내보내기 클릭
2. 운영 설정 JSON 내보내기 클릭
3. 다운로드 파일명 확인
4. JSON schema 확인
5. 포함 데이터 확인
   - projects
   - tasks
   - schedule assignments
   - personnel
   - departments
   - settings
   - approvals
   - notifications
   - audit logs
   - translations
6. JSON parse 가능 여부 확인
7. schemaVersion 확인
8. export source timestamp 확인
9. 사용자 수정 데이터가 포함되는지 확인

## 완료 보고

```text
[Plan 24 / Phase 260 완료 보고]
- 다운로드 파일명:
- schemaVersion:
- 포함 데이터:
- parse 결과:
- 누락 데이터:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 261 — JSON Import/Export Round-trip 검증

## 목표

내보낸 JSON을 다시 불러왔을 때 데이터가 복원되는지 검증한다.

## 작업

1. 테스트 데이터 생성
   - 인사카드 1명
   - 개발팀 업무 1건
   - 일정 1건
   - 설정값 1개
2. JSON Export
3. localStorage 초기화 또는 별도 브라우저 세션 준비
4. JSON Import
5. 복원 확인
6. 복원 후 각 화면 반영 확인
7. import validation 오류 표시 확인
8. 잘못된 JSON import 시 방어 확인

## 완료 보고

```text
[Plan 24 / Phase 261 완료 보고]
- Round-trip 결과:
- 복원된 데이터:
- 누락 데이터:
- validation 결과:
- 수정 필요:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 262 — Plan 23 리포트 정합성 수정

## 목표

Plan 23 리포트에서 “완료”라고 적었지만 실제로 미완료/부분 반영인 항목을 정정한다.

## 작업

1. Plan 23 리포트 원문 확인
2. 실제 검증 결과와 비교
3. 완료/부분완료/미완료/검증필요로 재분류
4. push 승인 절차 위반 가능성 여부 기록
5. 과장 표현 제거
   - 완벽히
   - 안전하게
   - 모든
   - 정상적으로
   - 완비
6. 수정 리포트 작성

## 완료 보고

```text
[Plan 24 / Phase 262 완료 보고]
- 정정한 리포트:
- 완료에서 부분완료로 낮춘 항목:
- 완료에서 미완료로 낮춘 항목:
- 절차상 리스크:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 263 — 회귀 테스트

## 목표

Plan 24 수정으로 기존 기능이 깨지지 않았는지 확인한다.

## 검증 항목

1. 대시보드 진입
2. sidebar collapsed/expanded/hover/focus
3. 수주/개발 관리 탭
4. 프로젝트 보드
5. 일정표
6. 인사카드
7. JSON Export
8. JSON Import
9. 알림
10. 결재
11. 권한 전환
12. KOR/VIET 토글

## 완료 보고

```text
[Plan 24 / Phase 263 완료 보고]
- PASS:
- PARTIAL:
- FAIL:
- 회귀 발생 여부:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 264 — Lint / Typecheck / Build

## 목표

수정 후 기본 품질 검증을 실행한다.

## 작업

1. npm install 필요 여부 확인
2. lint 실행
3. typecheck 실행
4. build 실행
5. static export 또는 GitHub Pages 배포 빌드 확인
6. 콘솔 오류 확인

## 완료 보고

```text
[Plan 24 / Phase 264 완료 보고]
- lint:
- typecheck:
- build:
- 오류:
- 수정 여부:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 265 — 최종 수정 리포트 작성

## 목표

Plan 24 최종 결과를 문서화한다.

## 산출물

```text
qa/plan24/reports/PLAN24_FINAL_REPORT.md
```

## 포함 항목

1. 수정 배경
2. 사용자 재현 스크린샷 요약
3. 수정한 파일
4. 수정한 기능
5. 실제 검증 결과
6. 남은 이슈
7. push 전 사용자 승인 필요 문구
8. 다음 작업 제안

## 완료 보고

```text
[Plan 24 / Phase 265 완료 보고]
- 최종 리포트 경로:
- 주요 수정 결과:
- 남은 이슈:
- Git commit 가능 여부:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 266 — Git Commit 및 Push 승인 요청

## 목표

사용자 승인 후에만 커밋 및 push를 진행한다.

## 작업

1. git diff 요약
2. 수정 파일 목록
3. commit message 제안
4. 사용자에게 commit 승인 요청
5. 사용자에게 push 승인 요청
6. 승인 전에는 commit/push 금지

## 완료 보고

```text
[Plan 24 / Phase 266 승인 요청]
- commit 대상 파일:
- commit message:
- push 대상 branch:
- 승인 전에는 commit/push하지 않겠습니다.
```

---

## 4. 최종 완료 기준

Plan 24는 다음 조건을 모두 만족해야 완료된다.

1. collapsed sidebar에서 브랜드가 깨지지 않는다.
2. collapsed sidebar에는 `C&V`만 보인다.
3. expanded sidebar에는 `CON-COST&Viet_QS OS`가 한 줄로 안정 표시된다.
4. hover 확장 시 메인 콘텐츠가 밀리지 않는다.
5. hover 확장 시 sidebar가 overlay처럼 덮인다.
6. `EUMDI OS` 사용자 표시 잔존 텍스트가 제거된다.
7. `수주/개발 관리` 기본 탭이 `개발팀 업무 리스트 관리`다.
8. 통합 일정표가 좌우 빈 공간을 활용한다.
9. 주요 상세 페이지 full-width 반영 여부가 route별로 검증된다.
10. 인사카드 추가/수정/비활성화가 실제로 동작한다.
11. 통합 JSON Export가 실제 다운로드된다.
12. JSON Import/Export round-trip이 검증된다.
13. Plan 23 리포트의 과장 표현이 정정된다.
14. Lint/Typecheck/Build 결과가 기록된다.
15. 사용자 승인 전 원격 push하지 않는다.

---

## 5. Antigravity 실행 시작 문구

아래 문구를 그대로 Antigravity에 입력하라.

```text
현재 F:\workspace 프로젝트의 Plan 24 작업을 시작한다.

중요 전제:
- Plan 단계는 뒤로 갈수록 최신 요구사항이 우선이다.
- Plan 24는 Plan 23 결과 검증 및 미반영 사항 재수정 전용 Plan이다.
- 리포트에 완료라고 적혀 있어도 실제 화면에서 깨지면 미완료로 본다.
- 현재 사용자 스크린샷에서 collapsed sidebar 브랜드명이 `CON-COST&Viet_QS OS` 전체로 줄바꿈되어 깨지는 문제가 재현되었다.
- collapsed sidebar에서는 전체 브랜드명을 표시하지 말고 `C&V`만 표시하라.
- expanded sidebar에서는 `CON-COST&Viet_QS OS`를 한 줄로 안정 표시하라.
- sidebar hover 시 메인 화면을 밀지 말고 overlay panel이 콘텐츠 위를 덮는 방식으로 동작시켜라.
- `EUMDI OS`가 title, metadata, manifest, sidebar, header, footer, JSON export metadata 등에 남아있는지 전수 검색하고 사용자 표시 영역에서 제거하라.
- 수주/개발 관리 진입 기본 탭은 `개발팀 업무 리스트 관리`여야 한다.
- 통합 일정표와 주요 상세 페이지가 실제로 full-width인지 route별로 검증하라.
- 사원관리에서 인사카드 추가/수정/비활성화가 실제로 가능한지 검증하고 필요한 경우 수정하라.
- 통합 JSON 내보내기는 실제 .json 다운로드로 동작해야 하며, 인사카드/일정/프로젝트/업무/설정 데이터가 포함되어야 한다.
- JSON Import/Export round-trip을 검증하라.
- Plan 23 리포트의 완료 표현이 실제 검증 결과와 다르면 정정하라.
- 각 Phase 시작 전 반드시 사용자에게 승인 요청을 하라.
- 사용자 승인 없이 Phase를 시작하지 마라.
- 사용자 승인 없이 다음 Phase로 넘어가지 마라.
- 사용자 승인 없이 GitHub 원격 push하지 마라.

먼저 Phase 250만 진행한다.
Phase 250에서는 코드 수정 금지, UI 수정 금지, JSON 기능 수정 금지, 브랜드명 변경 금지, 현황 조사와 baseline 작성만 수행한다.

먼저 [Plan 24 / Phase 250 시작 승인 요청]만 작성하라.
아직 Phase 250을 실행하지 마라.
```
