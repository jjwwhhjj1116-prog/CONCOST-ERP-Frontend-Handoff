---
name: legacy-feature-parity
description: offday2, Groupware-System-3, 기존 사내 소스처럼 사용자가 지정한 원본 시스템의 기능을 현재 ERP에 빠짐없이 이식했는지 파일·함수·상태·데이터 승계·E2E 기준으로 검사하고 구현한다.
---

# Legacy Feature Parity

## 목적

원본의 외형만 따라 하거나 일부 버튼만 만드는 것이 아니라,
업무 기능·상태·입력·데이터 승계·산출물의 동등성을 보장한다.

## 저장소 안전 계약

1. 작업 전 repository, branch, HEAD, 최근 commit, `git status`를 확인한다.
2. working tree가 dirty이면 기존 변경, 이번 작업, 다른 작업자의 변경, 생성물을 구분하고 기존 변경을 되돌리지 않는다.
3. 현재 구현을 `COMPLETE`, `PARTIAL`, `MISSING`, `BROKEN`, `CONFLICT`, `UNKNOWN`으로 분류한다.
4. 수정 전에 허용 파일 목록과 각 파일의 변경 이유를 작성한다.
5. 허용 목록에 없는 파일은 수정하지 않는다. 필요하면 계획을 먼저 갱신하고 범위를 보고한다.
6. 기능 변경과 폴더 이동을 같은 작업 또는 commit에 섞지 않는다.
7. 공통 컴포넌트를 수정하면 영향받는 전체 모듈과 route를 검사한다.
8. 프로젝트에 실제 존재하는 lint, typecheck, test, build를 실행하고 `git diff --check`를 확인한다.
9. 관련 화면을 브라우저에서 확인하고 console 오류, 정상·빈·오류·권한·모바일 상태를 검사한다.
10. 기존 기능 회귀가 발견되면 완료 또는 PASS로 보고하지 않는다.
11. 사용자가 명시적으로 요청하지 않으면 Push하지 않는다.

## 사용 시점

- offday2 프로젝트 workflow 이식
- Groupware-System-3 회사전환·검색 이식
- 기존 스케줄러 이식
- 기존 인사·조직 기능 이식
- 레거시 프로그램 현대화

## 필수 입력

- 원본 repository/path
- 원본 branch 또는 commit
- 대상 repository
- 사용자 필수 기능
- 허용된 차이
- 제외 승인 항목

## STEP 1. 원본 잠금

반드시 기록한다.

- repository/path
- branch
- commit SHA
- 주요 file SHA
- 조사 일시
- 실행 방법
- 배포 URL
- screenshot

main 최신값만 기준으로 삼지 않고 commit을 잠근다.

## STEP 2. 원본 전수조사

검색 대상:

- route/panel
- HTML section
- component
- function
- event handler
- state
- localStorage/session key
- API
- DB
- download/export
- status
- validation
- permission
- attachment
- template
- calculation
- error
- placeholder

## STEP 3. 기능 인벤토리

| ID | 원본 화면 | 원본 기능 | 파일:줄 | 입력 | 출력 | 상태 | 저장 |
|---|---|---|---|---|---|---|---|

실제 동작과 placeholder를 구분한다.

## STEP 4. 상태전이

| From | Action | To | Actor | Required | Side Effect | Audit |
|---|---|---|---|---|---|---|

상태를 임의로 하나의 status로 축소하지 않는다.

## STEP 5. 필드 매핑

| Source Entity | Source Field | Target Entity | Target Field | Transform | Loss |
|---|---|---|---|---|---|

승인 없는 field discard 금지.

## STEP 6. ID 계보

문자열 이름 매칭 금지.

예:

```text
estimateRequestId
→ estimateSheetId
→ decisionId
→ projectIntakeId
→ projectId
→ scheduleId / qcId / deliveryId
```

## STEP 7. 패리티 상태

- FULL_PARITY
- PARTIAL
- MISSING
- BROKEN
- REPLACED_WITH_EQUIVALENT
- SOURCE_PLACEHOLDER
- OUT_OF_SCOPE_APPROVED
- BLOCKED

`REPLACED_WITH_EQUIVALENT`에는 동등성 설명과 테스트가 필요하다.

## STEP 8. 구현 원칙

- 원본 코드를 무조건 복사하지 않는다.
- 현재 framework·server 구조에 재구현한다.
- 원본 기능은 삭제하지 않는다.
- 보안 취약점은 개선한다.
- localStorage SSOT를 server DB로 현대화한다.
- 원본 이름 매칭을 ID 관계로 개선한다.
- 원본 출력·Excel·PDF 의미를 보존한다.
- UI는 현재 디자인 시스템을 사용한다.

## STEP 9. E2E

원본에서 가능한 실제 사용자 흐름을 작성한다.

예:

```text
견적 의뢰
→ 견적서
→ 수주
→ 프로젝트 접수
→ PM 일정
→ 운영
→ QC
→ 납품
→ 수지
```

각 단계의 데이터가 동일 lineage를 가지는지 검사한다.

## STEP 10. 금지

- 버튼만 생성
- 카드만 생성
- 더미 성공
- 원본 기능 누락
- 이름 매칭
- 별도 mirror array
- 이전 버전 덮어쓰기
- placeholder를 구현완료로 분류
- 원본 조사 없이 추측 구현

## 출력

```markdown
# LEGACY FEATURE PARITY RESULT

## Source
- Repository:
- Ref:
- Commit:

## Inventory Summary
| Module | Total | Full | Partial | Missing | Placeholder |
|---|---:|---:|---:|---:|---:|

## Parity Matrix
| Source Feature | Evidence | Target | Test | Status |
|---|---|---|---|---|

## Field Mapping

## State Mapping

## ID Lineage

## E2E
| Scenario | Result | Evidence |
|---|---|---|

## Accepted Differences

## Findings
| ID | Severity | Source | Target | Required Fix |
|---|---|---|---|---|

## Verdict
PASS / FAIL / BLOCKED
```
