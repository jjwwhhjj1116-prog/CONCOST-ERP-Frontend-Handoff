---
name: module-refactor
description: CON-COST ERP의 중구난방인 파일을 기능별 모듈 구조로 안전하게 이동하고 의존성을 정리한다. 기능 변경 없이 폴더 구조, import 경로, 모듈 경계를 정리할 때만 사용한다.
---

# Module Refactor

## 목적

파일 위치를 기능별로 정리해 수정 시 다른 모듈이 망가지는 위험을 줄인다.

## 저장소 안전 계약

1. 작업 전 repository, branch, HEAD, 최근 commit, `git status`를 확인한다.
2. working tree가 dirty이면 기존 변경과 이번 작업을 구분해 기록하고 refactor를 시작하지 않는다.
3. 관련 구조와 동작을 `COMPLETE`, `PARTIAL`, `MISSING`, `BROKEN`, `CONFLICT`, `UNKNOWN`으로 분류한다.
4. 이동 또는 수정할 파일의 전체 목록, 이전 경로, 새 경로, import 영향과 검증 항목을 먼저 작성한다.
5. 목록에 없는 파일은 수정하지 않는다. 추가 필요 시 계획을 갱신하고 작업을 중단해 범위를 다시 확인한다.
6. 기능 변경과 폴더 이동을 같은 작업 또는 commit에 섞지 않는다.
7. 공통 컴포넌트나 public API를 이동하면 영향받는 전체 모듈과 route를 검사한다.
8. lint, typecheck, test, build와 `git diff --check`를 이동 단위마다 실행한다.
9. 관련 브라우저 화면과 console 오류를 확인해 기능 변화가 없음을 검증한다.
10. 기존 기능 회귀가 발생하면 완료 또는 PASS로 보고하지 않는다.
11. 사용자가 명시적으로 요청하지 않으면 Push하지 않는다.

## 사용 시점

- 안정 커밋 생성 후
- 핵심 기능 회귀검사 완료 후
- 새 대형 도메인 개발 전
- 전용 refactor branch에서

## 사용 금지 시점

- 기능 구현과 동시에
- working tree dirty
- 여러 기능이 미완성
- 긴급 버그 수정 중
- migration과 혼합
- UI 전면개편과 혼합

## 사전조건

- 원격 또는 별도 백업
- clean working tree
- base commit
- 전체 build/test 성공
- refactor 전용 branch
- rollback 가능

권장 branch:

```text
refactor/module-boundaries
```

## 목표 구조

```text
src/
  app/
  modules/
    auth/
    workspace/
    mail/
    approvals/
    projects/
    project-intake/
    project-schedule/
    project-qc/
    sales/
    finance/
    claims/
    claim-service/
    drive/
    hr/
  components/
  design-system/
  lib/
  types/
  stores/

server/src/
  domains/
  integrations/
  jobs/
  routes/
  permissions/
  audit/
```

현재 framework 관례를 우선하며 무조건 위 구조를 강제하지 않는다.

## STEP 1. 전체 인벤토리

각 파일:

| Path | 역할 | 소유 모듈 | Importers | Shared 여부 | 이동 후보 |
|---|---|---|---|---|---|

## STEP 2. 의존성 그래프

확인:

- circular dependencies
- cross-module imports
- shared dumping ground
- deep relative imports
- duplicate types
- duplicate services
- barrel import risk
- server/client boundary

## STEP 3. 모듈 경계

각 모듈에 public API를 정의한다.

예:

```text
modules/mail/index.ts
```

외부 모듈은 내부 파일을 직접 deep import하지 않는다.

## STEP 4. 이동계획

한 번에 하나의 모듈만 이동한다.

권장 순서:

1. design-system
2. mail
3. board
4. calendar/task
5. approvals
6. projects
7. sales
8. finance
9. claims/drive/ai는 새 구조로 작성

각 이동:

- 파일
- 이전 path
- 새 path
- import 수정
- tests
- rollback
- commit

## STEP 5. 기능 변경 금지

폴더 이동 commit에서는 다음을 하지 않는다.

- UI 변경
- 비즈니스 로직 변경
- 상태 변경
- API schema 변경
- DB 변경
- dependency upgrade
- formatting 대량변경
- 이름 대량변경

필요한 최소 import 수정만 한다.

## STEP 6. Alias

현재 bundler/TypeScript 설정을 확인한다.

예:

```text
@/modules/mail
@/design-system
@/lib
```

alias 변경은 build, test, server runtime 모두 확인한다.

## STEP 7. Shared 기준

공통 폴더로 이동 가능한 것:

- 두 개 이상 독립 모듈에서 사용
- 도메인 규칙 없음
- 범용 UI 또는 utility
- 명확한 owner

공통으로 두면 안 되는 것:

- 프로젝트 전용 규칙
- 재무 전용 계산
- 클레임 전용 권한
- 특정 API response
- 특정 화면 state

## STEP 8. 모듈별 검증

각 모듈 이동 후:

- lint
- typecheck
- unit
- integration
- build
- diff check
- 해당 route
- 주요 회귀 route
- console

각 모듈마다 별도 commit.

## STEP 9. 완료기준

- orphan file 없음
- broken imports 없음
- circular dependency 감소
- deep import 정책
- module ownership 문서
- tests 유지
- 기능 변화 없음
- working tree clean

## 중단 조건

- 예상 밖 기능 변경 필요
- DB 변경 필요
- 테스트 대량 실패
- owner 불명확
- 같은 파일이 여러 도메인 로직 포함
- 현재 미완성 기능과 충돌

이 경우 BLOCKED로 보고하고 먼저 파일 분리 설계를 제출한다.

## 출력

```markdown
# MODULE REFACTOR RESULT

## Identity
- Repository:
- Branch:
- Base:
- Head:

## Inventory
| Module | Before Files | After Files | Result |
|---|---:|---:|---|

## Moves
| Before | After | Reason | Tests |
|---|---|---|---|

## Dependency Changes

## Functional Diff
- Expected: none
- Actual:

## Tests
| Command | Exit | Result |
|---|---:|---|

## Route Regression

## Findings

## Commits
| Module | Commit |
|---|---|

## Verdict
PASS / FAIL / BLOCKED
```
