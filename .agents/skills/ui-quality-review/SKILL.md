---
name: ui-quality-review
description: CON-COST ERP 화면의 카드, 색상, 그림자, hover, focus, 가독성, 다국어, 반응형, 메뉴 구조를 실제 브라우저 기준으로 검수하고 개선한다. UI가 밋밋하거나 버튼이 어지럽거나 글자가 작거나 화면이 미완성처럼 보일 때 사용한다.
---

# UI Quality Review

## 목적

단순히 렌더링되는 화면이 아니라,
업무 우선순위가 명확하고 클릭 가능한 영역이 직관적이며
가독성과 브랜드가 일관된 ERP UI를 만든다.

## 저장소 안전 계약

1. 작업 전 repository, branch, HEAD, 최근 commit, `git status`를 확인한다.
2. working tree가 dirty이면 기존 변경, 이번 UI 작업과 생성물을 구분하고 기존 변경을 되돌리지 않는다.
3. 요구사항과 화면을 `COMPLETE`, `PARTIAL`, `MISSING`, `BROKEN`, `CONFLICT`, `UNKNOWN`으로 분류한다.
4. 수정할 파일 목록과 변경 이유, 영향 화면과 검증 viewport를 먼저 작성한다.
5. 목록에 없는 파일은 수정하지 않는다. 추가 필요 시 계획을 먼저 갱신한다.
6. UI 기능 변경과 폴더 이동을 같은 작업 또는 commit에 섞지 않는다.
7. 공통 컴포넌트나 디자인 토큰을 수정하면 영향받는 전체 모듈과 route를 검사한다.
8. lint, typecheck, test, build와 `git diff --check`를 실행한다.
9. 관련 화면을 실제 브라우저에서 확인하고 console 오류를 검사한다.
10. 기존 기능 회귀가 발견되면 완료 또는 PASS로 보고하지 않는다.
11. 사용자가 명시적으로 요청하지 않으면 Push하지 않는다.

## 디자인 원칙

- CON-COST: 오렌지
- Viet QS: 블루
- 밝은 canvas
- 흰색 card
- near-black text/navigation
- 초록: 성공·완료
- amber: 대기·주의
- 빨강: 위험·삭제
- 색상만으로 상태 표현 금지

## STEP 1. 화면 감사

각 화면을 분류한다.

- COMPLETE
- VISUALLY_WEAK
- INCONSISTENT
- CLUTTERED
- TOO_SPARSE
- BROKEN
- RESPONSIVE_BROKEN
- I18N_BROKEN
- ACCESSIBILITY_BROKEN

## STEP 2. 정보위계

확인:

- 페이지 제목
- 설명
- Primary Action
- Secondary Action
- KPI
- 목록
- 상세
- 상태
- 다음 액션

한 화면에서 Primary Action은 원칙적으로 1개다.
버튼이 많으면 탭·더보기·드로어로 정리한다.

## STEP 3. 카드

기본:

- border radius 16~20px
- soft border
- E1 shadow
- padding 20~28px
- gap 16~24px

interactive:

- cursor pointer
- hover translateY -2~-4px
- E2/E3 shadow
- accent border
- active feedback
- focus-visible
- reduced motion

noninteractive 카드에 hover lift 금지.

## STEP 4. 색상

오렌지는:

- Primary button
- active menu
- selected tab
- current workflow step
- focus ring
- key accent

초록은:

- success
- approved
- completed
- won

빨강은:

- danger
- failed
- delayed
- destructive

모든 카드 전체를 강한 상태색으로 칠하지 않는다.
흰색 surface에 accent와 badge를 사용한다.

## STEP 5. Typography

최소 권장:

- 본문 15~16px
- 메뉴 14px
- 보조 12~13px
- input/button 14px
- card title 16~18px
- page title 28~36px
- KPI 26~40px
- line-height 1.45~1.65

11px 이하 본문 금지.

## STEP 6. 다국어

KO/VI/EN:

- clipping 없음
- fixed height 없음
- 2줄 허용
- tooltip
- 베트남어 길이
- 날짜·통화·숫자 형식
- 번역 누락 key
- mixed language 금지

## STEP 7. 반응형

viewport:

- 1920×1080
- 1440×900
- 1280×800
- 768×1024
- 390×844

zoom:

- 100%
- 125%
- 150%
- 200%

확인:

- overflow
- card wrapping
- sidebar
- modal
- table
- form
- search
- project wizard

## STEP 8. 접근성

- keyboard
- focus-visible
- contrast
- aria
- tooltip
- modal focus trap
- reduced motion
- color independence
- touch target 44px

## STEP 9. 화면상태

각 화면:

- loading
- empty
- error
- forbidden
- selected
- hover
- focus
- disabled

## STEP 10. 시각 회귀

핵심 화면 screenshot:

- default
- hover
- focus
- selected
- empty
- error
- mobile
- Viet QS

가능하면 Playwright screenshot을 사용한다.

## 금지

- 타사 화면 픽셀 복제
- 임의 hex 남발
- 모든 카드 강한 그림자
- 과도한 glow
- 버튼이 동일 강도로 경쟁
- hover에만 핵심 액션
- 작은 글자로 공간 해결
- zoom 차단
- 화면 전체 scale

## 출력

```markdown
# UI QUALITY REVIEW RESULT

## Screen Inventory
| Route | Initial | Final | Evidence |
|---|---|---|---|

## Brand
- Logo:
- Primary:
- Theme tokens:

## Component State Matrix
| Component | Default | Hover | Focus | Selected | Result |
|---|---|---|---|---|---|

## Responsive
| Viewport | Result | Problems |
|---|---|---|

## I18N
| Module | KO | VI | EN | Result |
|---|---|---|---|---|

## Accessibility

## Findings
| ID | Severity | Route/Component | Problem | Fix |
|---|---|---|---|---|

## Verdict
PASS / FAIL / BLOCKED
```
