---
name: regression-gate
description: CON-COST ERP 변경 후 기존 주요 기능이 망가지지 않았는지 자동검사와 브라우저 검사를 통해 판정한다. 공통 UI, 라우팅, 권한, 프로젝트, 메일, 결재, 회사 전환 등 여러 모듈에 영향을 줄 수 있는 변경 후 사용한다.
---

# Regression Gate

## 목적

새 기능이 동작하더라도 기존 기능 하나라도 깨졌으면 완료로 승인하지 않는다.

## 저장소 안전 계약

1. 작업 전 repository, branch, HEAD, 최근 commit, `git status`를 확인한다.
2. working tree가 dirty이면 기존 변경과 이번 검증 대상 변경을 분리하고 자동 생성물을 별도로 기록한다.
3. 각 요구사항을 `COMPLETE`, `PARTIAL`, `MISSING`, `BROKEN`, `CONFLICT`, `UNKNOWN`으로 분류한다.
4. 검증 중 수정이 필요하면 먼저 수정 허용 파일 목록과 이유를 작성한다.
5. 허용 목록에 없는 파일은 수정하지 않는다.
6. 기능 변경과 폴더 이동을 같은 회귀 수정에 섞지 않는다.
7. 공통 컴포넌트 변경은 영향받는 전체 모듈과 route를 검사한다.
8. lint, typecheck, test, build와 `git diff --check`를 실행한다.
9. 관련 브라우저 화면과 console 오류를 검사한다.
10. 기존 기능 회귀가 하나라도 남으면 완료 또는 PASS로 보고하지 않는다.
11. 사용자가 명시적으로 요청하지 않으면 Push하지 않는다.

## 사용 시점

- 공용 컴포넌트 수정 후
- App Shell·사이드바·상단바 수정 후
- route·permission·auth 수정 후
- DB schema·API 수정 후
- 프로젝트 workflow 수정 후
- KR/VI workspace 전환 수정 후
- 검색 수정 후
- 폴더 이동 후
- 릴리스 전

## 필수 입력

- base commit
- head commit
- 변경 요구사항
- 영향받는 모듈
- 실행 가능한 테스트 명령
- 브라우저 URL

## STEP 1. 변경범위 확인

```text
git diff --name-status <base>..<head>
git diff --stat <base>..<head>
```

다음을 분류한다.

- UI
- route
- state
- API
- DB
- permission
- integration
- test
- config
- asset

예상하지 못한 변경이 있으면 FAIL 후보로 기록한다.

## STEP 2. 기준선 비교

가능한 경우 base와 head에서 동일 테스트를 비교한다.

- 기존부터 실패
- 이번 변경으로 신규 실패
- 이번 변경으로 해결
- flaky
- 미실행

기존 경고와 신규 경고를 구분한다.

## STEP 3. 자동검증

실제 프로젝트 명령을 확인하여 실행한다.

- install consistency
- lint
- typecheck
- unit
- integration
- E2E
- build
- git diff --check

DB 변경 시:

- migration validate
- migration up
- rollback 또는 down 전략
- seed
- schema client generation

## STEP 4. 핵심 화면 회귀

최소 다음 route를 확인한다.

### 전역

- 로그인
- Workspace 홈
- App Shell
- 사용자 메뉴
- KR/VI 전환
- 통합검색

### 협업

- 전자메일 목록·상세·작성
- 전자결재 목록·작성·승인
- 일정·캘린더
- 할 일
- 게시판

### 프로젝트

- 견적 의뢰
- 견적서 관리
- 프로젝트 작성
- 프로젝트 리스트
- PM 일정
- 운영현황
- 질의·QC
- 납품
- 업무일지
- 수지분석

### 경영

- 영업
- 재무
- 조직도
- Drive
- 설정

## STEP 5. 상태 검증

각 주요 화면:

- loading
- empty
- populated
- error
- forbidden
- direct URL
- refresh
- back/forward
- mobile

## STEP 6. 회사·언어 회귀

KR → VI → KR 전환:

- 로고
- theme
- locale
- menu
- data company scope
- query cache
- permission
- search scope
- 새로고침

회사 데이터가 섞이면 Critical.

## STEP 7. 권한 회귀

역할별 검사:

- 일반 사용자
- 작업자
- PM
- 부서장
- 재무
- 관리자
- 경영진

검사:

- 메뉴 노출
- 직접 URL
- API
- 파일
- export
- sensitive data

## STEP 8. 반응형·접근성

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

- horizontal overflow
- clipping
- keyboard
- focus-visible
- modal
- table
- sidebar
- Vietnamese text

## STEP 9. 성능·콘솔

- browser console errors
- failed network requests
- hydration errors
- repeated API calls
- infinite render
- layout shift
- slow route

## 판정

### PASS

- 신규 Critical 0
- 신규 High 0
- 필수 테스트 통과
- 핵심 화면 정상
- 권한 정상
- 데이터 혼합 없음

### FAIL

- 기존 기능 회귀
- 신규 console error
- route broken
- permission bypass
- data loss
- company scope leak
- 테스트 실패

### BLOCKED

- base/head 없음
- 실행 환경 없음
- 인증정보 없음
- 필요한 서버 접근 없음

## 출력

```markdown
# REGRESSION GATE RESULT

## Identity
- Base:
- Head:
- Verdict:

## Diff Summary

## Automated Tests
| Test | Base | Head | Result |
|---|---|---|---|

## Route Matrix
| Module | Route | Desktop | Mobile | KR/VI | Result |
|---|---|---|---|---|---|

## Permission Matrix

## Findings
| ID | Severity | Route/File | Problem | Required Fix |
|---|---|---|---|---|

## Existing vs New
- Existing failures:
- New failures:

## Final Verdict
PASS / FAIL / BLOCKED
```
