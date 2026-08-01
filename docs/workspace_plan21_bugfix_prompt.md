# WORKSPACE PLAN 21 — Plan 20 QA 결과 기반 오류 수정 전용 프롬프트

이 프롬프트는 기존 `workspace plan1.txt`부터 `workspace plan20.txt` 이후에 추가되는 스물한 번째 보강 지시사항이다.

Plan 21의 목적은 새로운 기능을 추가하는 것이 아니라, Plan 20 QA Audit에서 발견된 오류와 누락사항을 실제 코드에 안전하게 반영하는 것이다.

Plan 21은 반드시 다음 원칙을 따른다.

- Plan 20은 검수 전용이었다.
- Plan 21은 수정 전용이다.
- Plan 단계는 뒤로 갈수록 최신 요구사항이 우선이다.
- 수정은 QA 리포트에 증빙된 이슈만 대상으로 한다.
- 리포트에 없는 기능을 임의로 추가하지 않는다.
- 한 번에 여러 기능을 고치지 않는다.
- Root Cause 단위로 작은 Phase를 나누어 수정한다.
- 각 Phase 시작 전 반드시 사용자 승인을 받는다.
- 각 Phase 완료 후 자체검수, lint/build/test, 화면 재검증, 변경 파일 목록, 남은 리스크를 보고한다.
- 사용자 승인 없이 다음 Phase로 넘어가지 않는다.
- 사용자 승인 없이 GitHub 원격 push를 하지 않는다.
- 수정 중 발견된 신규 이슈는 즉시 고치지 말고 `Plan21_FOLLOWUP_ISSUES.md`에 기록한다.

---

## 0. Plan 21 시작 전 필수 확인

Antigravity는 작업 시작 전 다음 경로를 확인한다.

```text
F:\workspace\qa\plan20\reports\
```

필수 확인 파일:

```text
F:\workspace\qa\plan20\reports\FINAL_QA_SUMMARY_REPORT.md
```

그리고 동일 폴더 내 23개의 세부 검수 리포트를 모두 확인한다.

예상 파일 예시:

```text
detailed_line_stage_drag_audit.md
...
FINAL_QA_SUMMARY_REPORT.md
```

파일이 없거나 일부 누락되면 코드 수정하지 말고 즉시 보고한다.

보고 형식:

```text
[Plan 21 시작 불가]
1. 확인한 reports 폴더 경로
2. 발견한 리포트 파일 목록
3. 누락된 파일
4. 사용자가 복사해야 할 위치
5. 현재 코드 수정 여부: 수정 안 함
```

---

## 1. Plan 21의 핵심 목표

Plan 21에서 달성해야 할 목표는 다음이다.

1. Plan 20 QA 리포트 전체를 읽고 이슈를 통합 Issue Matrix로 재정리한다.
2. 중복 이슈를 Root Cause 기준으로 병합한다.
3. S0/S1/S2/S3/S4 심각도 기준으로 수정 우선순위를 재분류한다.
4. 수정 전용 Backlog를 작성한다.
5. S0 Blocker가 있으면 최우선 수정한다.
6. S1 Critical은 Root Cause 단위로 하나씩 수정한다.
7. 각 수정은 최소 단위 Patch Phase로 나눈다.
8. 각 Phase 시작 전 사용자 승인을 받는다.
9. 각 Phase 완료 후 재현 테스트와 회귀 테스트를 수행한다.
10. 최종적으로 `PLAN21_BUGFIX_SUMMARY.md`와 `QA_EVIDENCE_MATRIX_PLAN21.md`를 작성한다.

---

## 2. 절대 금지사항

Antigravity는 다음 행위를 절대 하지 않는다.

```text
- QA 리포트 읽기 전에 코드 수정 금지
- 사용자 승인 없이 Phase 시작 금지
- 사용자 승인 없이 다음 Phase 진행 금지
- 사용자 승인 없이 GitHub 원격 push 금지
- 한 Phase에서 관련 없는 여러 기능 동시 수정 금지
- 리포트에 없는 기능 임의 구현 금지
- UI만 맞추고 store/data/workflow 무결성 검증 생략 금지
- alert만 추가하고 실제 상태 전이 차단 없이 완료 처리 금지
- 빌드 실패 상태에서 완료 보고 금지
- 실제 테스트 없이 “수정 완료” 표현 금지
- 증빙 없는 항목에 “완료”, “정상”, “완벽” 표현 금지
```

---

## 3. 심각도 기준

이슈는 다음 기준으로 재분류한다.

```text
S0 Blocker
- 사이트 접속 불가
- 주요 route 렌더링 불가
- 앱이 crash되어 검수/사용 불가
- 데이터 저장/불러오기 기능 전체 불가
- 핵심 workflow 전체 진행 불가

S1 Critical
- 업무 상태 무결성 붕괴
- 권한 없는 사용자가 중요 데이터 변경 가능
- 승인 없이 원본 데이터 변경 가능
- PM 하달 workflow 우회 가능
- 완료/수정/결재 상태가 잘못 저장됨
- JSON export/import 후 데이터 손상

S2 Major
- 특정 화면 또는 기능이 부분 동작하지 않음
- 필터/검색/정렬/탭 상태가 잘못 반영됨
- 일부 role에서 데이터 노출 범위가 잘못됨
- 일정표/보드/모달 일부 입력값 누락

S3 Minor
- UI 문구, 배치, 간격, 뱃지, 안내 메시지 오류
- 새로고침 시 일부 선택값 초기화
- 사용성 저하

S4 Enhancement
- 개선 제안
- 운영 편의성 향상
- 추후 기능 확장
```

---

## 4. Plan 21 Phase 구성

Plan 21은 Phase 185부터 시작한다.

각 Phase는 시작 전 사용자 승인을 받아야 한다.

---

# Phase 185 — QA 리포트 수집 및 수정 금지 상태 점검

## 목표

Plan 20 QA 산출물이 모두 존재하는지 확인한다.

## 작업

1. `F:\workspace\qa\plan20\reports\` 폴더 확인
2. `FINAL_QA_SUMMARY_REPORT.md` 확인
3. 세부 리포트 23개 확인
4. 파일명, 수정일, 크기 목록 작성
5. 코드 수정 없이 `PLAN21_REPORT_INVENTORY.md` 작성

## 금지

- 코드 수정 금지
- 리포트 내용 해석 금지
- 이슈 수정 금지

## 완료 조건

- 리포트 파일 목록이 작성됨
- 누락 파일 여부가 보고됨
- 다음 Phase 진행 승인 요청

---

# Phase 186 — Plan 20 Issue Matrix 통합 작성

## 목표

모든 QA 리포트에서 이슈를 추출하여 하나의 통합 Matrix를 만든다.

## 작업

1. 모든 리포트에서 Issue ID 추출
2. 발견 Phase, 관련 route, 증상, 재현 절차, 예상 동작, 실제 동작 정리
3. 관련 Plan 번호 연결
4. 관련 코드 위치가 있으면 기록
5. `PLAN21_ISSUE_MATRIX.md` 작성

## 출력 형식

```text
Issue ID
Source Report
Detected Phase
Route / Screen
Symptom
Expected Behavior
Actual Behavior
Severity Candidate
Related Plan
Related Code
Evidence
Fix Needed: Yes/No
```

## 금지

- 코드 수정 금지
- severity 확정 금지
- 임의 추측 금지

---

# Phase 187 — Root Cause 병합 및 심각도 확정

## 목표

중복 이슈를 Root Cause 단위로 병합하고 수정 우선순위를 확정한다.

## 작업

1. 동일 원인 이슈 병합
2. S0/S1/S2/S3/S4 심각도 확정
3. 수정 순서 작성
4. `PLAN21_ROOT_CAUSE_BACKLOG.md` 작성

## 우선순위 원칙

```text
1순위: S0 Blocker
2순위: S1 Workflow Integrity
3순위: S1 Permission / Approval Integrity
4순위: S1 JSON Data Integrity
5순위: S2 Functional Defect
6순위: S3 UI/UX Defect
7순위: S4 Enhancement
```

## 금지

- 코드 수정 금지
- 사용자 승인 없이 Patch Phase 생성 금지

---

# Phase 188 — 수정 전략 및 Patch Phase 확정

## 목표

실제 수정에 들어가기 전 Patch Phase를 확정한다.

## 작업

1. 수정 대상 이슈 선정
2. 각 이슈별 영향 파일 후보 작성
3. 회귀 테스트 범위 작성
4. 수정 순서를 Phase 단위로 나눔
5. 사용자에게 전체 수정 순서 승인 요청

## 산출물

```text
PLAN21_PATCH_EXECUTION_PLAN.md
```

## 금지

- 아직 코드 수정 금지

---

# Phase 189 — S0 Blocker 수정 Phase

## 목표

S0 Blocker가 있을 경우 먼저 수정한다.

## 조건

S0 Blocker가 없으면 이 Phase는 SKIP 처리한다.

## 작업

1. S0 이슈 1개만 선택
2. 수정 전 재현
3. 최소 코드 수정
4. lint/build/test 실행
5. 배포 전 로컬 화면 확인
6. 결과 보고

## 완료 조건

- S0 재현 불가 확인
- 관련 회귀 테스트 통과
- 다음 Phase 승인 요청

---

# Phase 190 — 상태 전이 무결성 정책 설계

## 목표

보드/세부 공정 보드/수정 workflow의 상태 전이 정책을 코드 수정 전에 확정한다.

## 반드시 포함할 이슈

```text
ISSUE-PLAN20-173-001
- 워크플로우 상태 전이 제약 로직 누락
```

## 설계해야 할 내용

1. Project Board 상태 전이표
2. Detailed Line Board 상태 전이표
3. Revision 상태 전이표
4. Task completionStatus 전이표
5. Role별 허용 액션
6. PM 하달 workflow 강제 조건
7. 완료에서 수정으로 이동 가능한 조건
8. 역방향 이동 제한 조건
9. 단계 건너뛰기 제한 조건
10. 예외적으로 되돌리기 허용 조건

## 예시 정책

```text
Project Board:
PRE_WORK -> IN_PROGRESS: PM Dispatch 완료 시에만 허용
PRE_WORK -> COMPLETED: 차단
PRE_WORK -> REVISION: 차단
IN_PROGRESS -> COMPLETED: 완료 조건 충족 시 허용
COMPLETED -> REVISION: RevisionRequest 생성 시 허용
COMPLETED -> IN_PROGRESS: 직접 드래그 차단
REVISION -> IN_PROGRESS: 재작업 승인 시 허용
REVISION -> COMPLETED: 수정 완료 승인 시 허용
```

## 산출물

```text
PLAN21_STATUS_TRANSITION_POLICY.md
```

## 금지

- 아직 코드 수정 금지

---

# Phase 191 — 상태 전이 무결성 코드 수정

## 목표

Phase 190에서 승인된 정책을 실제 코드에 반영한다.

## 작업

1. drag handler 확인
2. Zustand action 확인
3. 상태 전이 validation 함수 추가
4. UI 단에서 차단
5. Store 단에서 한 번 더 차단
6. 실패 시 사용자에게 명확한 메시지 표시
7. AuditLog는 허용된 전이에만 기록
8. 차단된 전이는 상태 변경하지 않음

## 필수 구현 방향

```text
validateProjectTransition(from, to, context)
validateTaskStageTransition(from, to, context)
canUserMoveTask(user, task, from, to)
```

## 검증

- PRE_WORK -> COMPLETED 차단
- COMPLETED -> IN_PROGRESS 직접 이동 차단
- WORKER의 타인 업무 이동 차단
- PM 하달 없이 PRE_WORK -> IN_PROGRESS 차단
- 유효한 이동은 정상 처리

---

# Phase 192 — PM 하달 Workflow 우회 차단 수정

## 목표

`착수 전 -> 진행 중` 이동 시 PM 하달 절차가 반드시 실행되도록 한다.

## 작업

1. ProjectBoard drag event 검토
2. PmDispatchModal open 조건 검토
3. 하달 완료 전 상태 변경 금지
4. 하달 취소 시 원래 컬럼 유지
5. 하달 완료 후 TaskCard, ScheduleAssignment, Notification, AuditLog 생성 확인

## 검증

- 드래그만으로 IN_PROGRESS 저장 불가
- Modal 취소 시 상태 유지
- Modal 완료 시에만 상태 변경
- 새로고침 후 상태 유지

---

# Phase 193 — 승인/결재 무결성 수정

## 목표

작업자 일정 변경, 일정 연장, 추가 일정 요청이 승인 전 원본 데이터를 변경하지 않도록 보강한다.

## 작업

1. ScheduleRequestModal 검토
2. ApprovalRequest 생성 흐름 확인
3. 승인 전 Task 원본 dueDate/status 변경 여부 확인
4. 승인 후에만 원본 반영
5. 반려 시 원본 유지
6. AuditLog/Notification 생성 확인

---

# Phase 194 — 수정(Revision) Workflow 무결성 수정

## 목표

완료 프로젝트가 임의로 수정 컬럼에 들어가지 않고, RevisionRequest가 있을 때만 수정 workflow로 진입하게 한다.

## 작업

1. COMPLETED -> REVISION 조건 검토
2. RevisionRequest 생성 여부 검증
3. 수정 완료 후 COMPLETED 복귀 조건 검증
4. 임의 드래그 차단
5. 관련 AuditLog/Notification 기록

---

# Phase 195 — JSON Handoff 데이터 무결성 수정

## 목표

수정된 상태 전이, 결재, revision, task data가 JSON export/import에 손상 없이 포함되도록 한다.

## 작업

1. WorkspaceExportData 스키마 확인
2. export 대상 store 확인
3. import preview validation 확인
4. 상태 전이 정책 데이터 포함 여부 검토
5. import 후 route별 데이터 일관성 확인

---

# Phase 196 — 권한/역할별 액션 차단 수정

## 목표

Role별로 불가능해야 하는 버튼, 드래그, 상태 변경, 승인 액션을 차단한다.

## 작업

1. SUPER_ADMIN 권한 확인
2. DEPARTMENT_MANAGER 권한 확인
3. PM 권한 확인
4. WORKER 권한 확인
5. UI 숨김 + Store 단 차단 이중 방어
6. 권한 없는 액션 시 명확한 안내 메시지

---

# Phase 197 — S2 기능 오류 수정 1차

## 목표

S2 Major 기능 오류 중 우선순위가 높은 항목을 수정한다.

## 조건

Phase 187~188에서 확정된 S2 이슈만 대상으로 한다.

## 원칙

- 한 Phase에서 최대 3개 이슈까지만 수정
- 서로 같은 Root Cause일 때만 묶어서 수정
- unrelated issue는 다음 Phase로 분리

---

# Phase 198 — S2 기능 오류 수정 2차

## 목표

남은 S2 Major 오류를 수정한다.

## 조건

Phase 197과 동일하다.

---

# Phase 199 — S3 UI/UX 오류 수정

## 목표

심각하지 않지만 실사용성을 떨어뜨리는 UI/UX 오류를 수정한다.

## 대상 예시

```text
- 버튼 문구 불명확
- 배지 색상/위치 오류
- 모달 닫기/취소 동작 불편
- 컬럼 가로 스크롤 문제
- 빈 상태 안내 문구 누락
- 모바일/태블릿 레이아웃 깨짐
```

---

# Phase 200 — 회귀 테스트 전체 실행

## 목표

Plan 21에서 수정한 모든 기능의 회귀 테스트를 수행한다.

## 테스트 범위

1. Dashboard
2. Intake
3. Project Board
4. Detailed Line Board
5. PM Dispatch
6. Schedule Request
7. Approvals
8. Revision
9. Conflicts
10. Calendar
11. Notifications
12. Settings
13. Personnel
14. JSON Import/Export
15. Role Switch / Permission Simulator

## 산출물

```text
PLAN21_REGRESSION_TEST_REPORT.md
```

---

# Phase 201 — Build/Lint/Test 및 배포 전 검증

## 목표

코드 품질과 배포 가능성을 검증한다.

## 작업

1. npm install 필요 여부 확인
2. lint 실행
3. typecheck 실행 가능하면 실행
4. test script가 있으면 실행
5. build 실행
6. GitHub Pages base path 검증
7. 새로고침 404 여부 검증

## 산출물

```text
PLAN21_BUILD_EVIDENCE.md
```

---

# Phase 202 — 최종 수정 리포트 작성

## 목표

Plan 21 수정 결과를 최종 문서화한다.

## 산출물

```text
PLAN21_BUGFIX_SUMMARY.md
QA_EVIDENCE_MATRIX_PLAN21.md
PLAN21_FOLLOWUP_ISSUES.md
```

## 반드시 포함할 내용

1. 수정한 이슈 목록
2. 수정하지 않은 이슈 목록
3. 수정 보류 사유
4. 변경 파일 목록
5. 테스트 결과
6. 남은 리스크
7. 다음 Plan 필요 여부
8. Git commit 후보 메시지
9. 원격 push 승인 요청

---

## 5. 각 Phase 시작 전 승인 요청 템플릿

Antigravity는 모든 Phase 시작 전 아래 형식으로 사용자 승인 요청만 한다.

```text
[Plan 21 / Phase XXX 시작 승인 요청]

이번 Phase 목표:
-

이번 Phase에서 읽을 파일:
-

이번 Phase에서 수정할 가능성이 있는 파일:
-

이번 Phase에서 하지 않을 일:
-

예상 산출물:
-

진행해도 될까요?
```

사용자가 승인하기 전에는 Phase를 시작하지 않는다.

---

## 6. 각 Phase 완료 보고 템플릿

```text
[Plan 21 / Phase XXX 완료 보고]

수행한 작업:
-

수정한 파일:
-

생성/수정한 리포트:
-

검증 결과:
- lint:
- typecheck:
- build:
- 화면 재검증:

해결된 이슈:
-

남은 이슈:
-

다음 Phase 제안:
-

다음 Phase 진행 승인 요청:
진행해도 될까요?
```

---

## 7. Antigravity 실행용 시작 프롬프트

사용자는 Antigravity에 다음 프롬프트로 시작한다.

```text
현재 F:\workspace 프로젝트의 Plan 21 오류 수정 작업을 시작한다.

중요 전제:
- Plan 단계는 뒤로 갈수록 최신 요구사항이 우선이다.
- Plan 20은 전수검수 단계였고, Plan 21은 Plan 20 QA 결과 기반 오류 수정 전용 Plan이다.
- 수정 대상은 F:\workspace\qa\plan20\reports\ 안의 FINAL_QA_SUMMARY_REPORT.md 및 23개 세부 리포트에서 증빙된 이슈만 대상으로 한다.
- 리포트에 없는 기능을 임의로 추가하지 마라.
- 각 Phase 시작 전 반드시 사용자에게 승인 요청을 하라.
- 사용자 승인 없이 Phase를 시작하지 마라.
- 사용자 승인 없이 다음 Phase로 넘어가지 마라.
- 사용자 승인 없이 GitHub 원격 push하지 마라.
- 먼저 Phase 185만 진행한다.
- Phase 185에서는 코드 수정 금지, 기능 수정 금지, 리포트 수집 및 파일 목록 작성만 수행한다.

먼저 [Plan 21 / Phase 185 시작 승인 요청]만 작성하라.
아직 Phase 185를 실행하지 마라.
```
