---
name: safe-feature-change
description: 기존 CON-COST ERP 기능을 보존하면서 승인된 범위의 버그 수정, UI 수정, 기능 보완을 안전하게 수행한다. 변경 범위 통제, 회귀 방지, 테스트, 커밋 증거가 필요한 모든 일반 기능 수정 작업에 사용한다.
---

# Safe Feature Change

## 목적

현재 정상 동작하는 기능을 훼손하지 않고 사용자가 승인한 기능만 수정한다.

## 저장소 안전 계약

1. 작업 전 repository, branch, HEAD, 최근 commit, `git status`를 확인한다.
2. working tree가 dirty이면 기존 변경, 이번 작업, 다른 작업자의 변경과 생성물을 구분하고 기존 변경을 되돌리지 않는다.
3. 각 요구를 `COMPLETE`, `PARTIAL`, `MISSING`, `BROKEN`, `CONFLICT`, `UNKNOWN`으로 분류한다.
4. 수정할 파일 목록과 각 파일의 역할, 변경 이유, 영향 기능, 테스트를 먼저 작성한다.
5. 목록에 없는 파일은 수정하지 않는다. 추가 필요 시 계획을 먼저 갱신한다.
6. 기능 변경과 폴더 이동을 같은 작업 또는 commit에 섞지 않는다.
7. 공통 컴포넌트를 수정하면 영향받는 전체 모듈과 route를 검사한다.
8. lint, typecheck, test, build와 `git diff --check`를 실행한다.
9. 관련 브라우저 화면과 console 오류를 검사한다.
10. 기존 기능 회귀가 발견되면 완료 또는 PASS로 보고하지 않는다.
11. 사용자가 명시적으로 요청하지 않으면 Push하지 않는다.

## 사용 시점

- 버그 수정
- UI 보정
- 기능 일부 보완
- 다국어 수정
- route 연결 수정
- API 오류 수정
- 기존 화면에 작은 기능 추가
- 한 모듈 안의 제한된 변경

## 사용하지 않는 시점

- 대규모 폴더 이동
- 도메인 전면 재설계
- DB 대규모 마이그레이션
- 여러 모듈을 동시에 재작성
- 새 시스템 전체 구축

이 경우 별도 스킬이나 설계 Phase를 사용한다.

## 필수 입력

- 사용자 요구사항
- 대상 repository
- 현재 branch
- 기준 commit
- 수정 대상 모듈
- 수정 금지 범위
- 필요한 테스트 또는 화면

## STEP 1. 기준선 확인

반드시 확인한다.

- repository 경로
- git remote
- branch
- HEAD SHA
- git status
- working tree
- 최근 commit
- 실행 중인 개발 서버
- 현재 lint/test/build 상태

working tree가 dirty이면 다음을 분리한다.

- 기존 변경
- 이번 작업 변경
- 다른 작업자의 변경
- 자동 생성 파일

관련 없는 변경이 섞여 있으면 작업을 중단하고 보고한다.

## STEP 2. 요구사항 분류

각 요구를 다음으로 분류한다.

- COMPLETE
- PARTIAL
- MISSING
- BROKEN
- CONFLICT
- UNKNOWN

COMPLETE는 회귀검사만 하고 재작성하지 않는다.

## STEP 3. 영향분석

다음을 확인한다.

- 관련 route
- 관련 component
- 관련 hook/store
- API
- server service
- DB model
- permission
- i18n
- shared component
- tests
- 다른 회사 workspace
- KR/VI 전환 영향

공용 파일을 수정할 때는 영향받는 전체 모듈을 기록한다.

## STEP 4. 파일계획

코드 작성 전에 작성한다.

| 파일 | 현재 역할 | 변경 이유 | 영향 기능 | 테스트 |
|---|---|---|---|---|

계획에 없는 파일은 수정하지 않는다.

## STEP 5. 구현 규칙

- 승인 범위만 수정한다.
- 기존 업무 로직을 복제하지 않는다.
- server DB/API가 SSOT다.
- localStorage를 운영 데이터 저장소로 사용하지 않는다.
- 프로젝트명 문자열로 엔티티를 연결하지 않는다.
- 권한은 UI와 서버에서 모두 검증한다.
- 실제 개인정보를 fixture에 넣지 않는다.
- 기존 디자인 토큰을 사용한다.
- 새 hex·shadow·radius를 임의 하드코딩하지 않는다.
- 기능 변경과 폴더 이동을 섞지 않는다.
- 데이터 삭제나 migration은 별도 승인 없이 수행하지 않는다.
- TODO, mock, placeholder를 완료라고 주장하지 않는다.

## STEP 6. 변경 단위

작은 논리 단위로 수행한다.

1. 코드 수정
2. 관련 lint/typecheck
3. 관련 테스트
4. diff 확인
5. 다음 단위

## STEP 7. 필수 검증

프로젝트에 존재하는 명령을 실제 확인한 후 실행한다.

- lint
- typecheck
- unit test
- integration test
- build
- git diff --check

관련 화면을 브라우저에서 확인한다.

- 정상 상태
- loading
- empty
- error
- permission denied
- mobile
- KR/VI
- console error

공용 UI를 수정했다면 최소 확인:

- 로그인
- 홈
- 메일
- 전자결재
- 일정
- 프로젝트
- 프로젝트 접수
- 영업
- 재무
- 조직도
- Drive

## STEP 8. 자체검수

확인한다.

- 범위 밖 변경
- 기존 기능 삭제
- 하드코딩 데이터
- client-only permission
- 잘못된 route
- 더미 성공
- console log
- unused code
- 번역 누락
- 반응형 파손
- 데이터 회사범위 혼합
- 테스트 미실행

## STEP 9. 커밋

- 하나의 목적만 가진 커밋
- 명확한 commit message
- working tree clean
- 사용자가 요청하지 않으면 Push 금지

## 완료 보고

```markdown
# SAFE FEATURE CHANGE RESULT

## Identity
- Repository:
- Branch:
- Base:
- Head:
- Working tree:

## Classification
| Requirement | Initial | Final | Evidence |
|---|---|---|---|

## Changed Files
| File | Change | Reason |
|---|---|---|

## Preserved Functions

## Tests
| Command | Exit | Result |
|---|---:|---|

## Browser Validation
| Route | Viewport | Result |
|---|---|---|

## Console
- Errors:
- Warnings:

## Remaining
- PARTIAL:
- BLOCKED:

## Git
- Commit:
- Push:
```
