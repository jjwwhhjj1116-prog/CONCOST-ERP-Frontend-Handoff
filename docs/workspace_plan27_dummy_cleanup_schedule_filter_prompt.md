# WORKSPACE PLAN 27 — 더미데이터 정리, 허위 일정충돌 제거, CEO/COO 일정표 제외, 실사용 일정표 필터링 프롬프트

이 프롬프트는 기존 `workspace plan1`부터 `workspace plan26` 이후에 추가되는 스물일곱 번째 보강 지시사항이다.

Plan 27의 목적은 Plan 26 이후 실제 운영 테스트를 방해하는 더미데이터, 허위 충돌 데이터, 불필요한 일정표 노출 문제를 정리하여 Workspace를 실제 사용 가능한 데이터 상태로 안정화하는 것이다.

현재 사용자 화면 기준으로 다음 문제가 확인되었다.

1. `/conflicts` 화면에 실제 운영상 존재하지 않는 충돌이 표시된다.
2. `u4`, `LEAVE_OVERLAP`, `휴가(외근) 일정과 [UI 디자인 시안] 작업 일정이 겹칩니다.` 같은 테스트성 또는 더미성 충돌이 남아 있다.
3. 일정표에 실제 해당 월 일정이 없는 사람까지 모두 표시되어 화면이 불필요하게 길어진다.
4. [DEMO] CONCOST Executive 001, [DEMO] CONCOST Executive 002는 CEO/COO로서 최상위 권한자이며 해당 프로그램에서 실무 일정표에 표시될 필요가 없다.
5. CEO/COO는 결재권자·최고관리자 역할은 유지하되, 직원 월간 일정표의 실무 작업 행에서는 기본 제외되어야 한다.
6. 더미데이터를 무작정 삭제하면 최근 사용자가 요청하여 반영한 인사카드/조직/권한 더미 또는 테스트 기준 데이터까지 손상될 수 있다.
7. 따라서 먼저 더미데이터 전체를 식별하고, 삭제 대상과 보존 대상을 분리한 뒤 사용자 승인 후 삭제해야 한다.

---

## 0. 가장 중요한 원칙

Antigravity는 아래 원칙을 반드시 지켜라.

1. Plan 단계는 뒤로 갈수록 최신 요구사항이 우선이다.
2. Plan 27은 기능 확장보다 데이터 정리와 일정표 실사용 안정화가 목적이다.
3. 실제 사용자가 입력한 데이터, JSON import로 들어온 데이터, 사용자가 가장 마지막에 요청해 반영한 인사카드/조직/권한 데이터는 임의 삭제하지 마라.
4. 삭제 전 반드시 더미데이터 후보 목록을 작성하고 사용자 승인을 받아라.
5. 사용자 승인 없이 데이터 삭제 로직을 실행하지 마라.
6. 사용자 승인 없이 seed/mock/runtime data를 변경하지 마라.
7. 사용자 승인 없이 다음 Phase로 넘어가지 마라.
8. 사용자 승인 없이 GitHub 원격 push하지 마라.
9. 더미데이터 제거는 코드와 localStorage, seed data, JSON sample, conflict generator, schedule fixture를 모두 구분해서 처리하라.
10. 단순히 화면에서 숨기는 것과 실제 데이터를 삭제하는 것을 구분해서 보고하라.
11. 일정표는 기본적으로 “해당 월에 실제 일정이 있는 실무자”만 표시한다.
12. CEO/COO는 일정표 기본 행에서 제외하되, 권한·결재·관리 기능에서는 유지한다.
13. 필요 시 최고관리자만 `전체 직원 보기` 또는 `관리자 포함 보기` 토글로 CEO/COO를 확인할 수 있게 한다.
14. 허위 충돌은 삭제하되, 실제 승인된 일정·휴가·외근·Off 충돌은 계속 감지되어야 한다.
15. 충돌 데이터는 실시간 계산값인지 저장된 mock 데이터인지 반드시 구분하라.

---

## 1. 현재 사용자 화면 기준 문제

### 1-1. 일정 충돌 관리 화면 문제

사용자 화면:

```text
Route: /workspace/conflicts
표시 항목:
- 대상자: u4
- 충돌 기간: 2026-07-08 ~ 2026-07-08
- 유형: LEAVE_OVERLAP
- 내용: 휴가(외근) 일정과 [UI 디자인 시안] 작업 일정이 겹칩니다.
```

문제 판단:

```text
- 현재 사용자가 실제로 생성한 일정 충돌이 아님
- Plan 테스트 과정에서 남은 더미 conflict일 가능성이 높음
- 이 conflict가 seed/mock/localStorage/fixture 중 어디에서 유입되는지 추적 필요
- 해결 버튼이 보이더라도 실제 운영 데이터가 아니므로 검수/운영 혼란을 유발함
```

### 1-2. 통합 일정표 문제

사용자 화면:

```text
Route: /workspace/schedule
월: 2026년 7월
표시 직원:
- [DEMO] CONCOST Executive 001
- [DEMO] CONCOST Executive 002
- [DEMO] Viet QS Team Lead 058
- [DEMO] Viet QS Team Member 059
- Quoc Nhut
- Long Vu
- [DEMO] CONCOST Manager 010
- [DEMO] CONCOST Team Member 011
...
```

문제 판단:

```text
- [DEMO] CONCOST Executive 001, [DEMO] CONCOST Executive 002는 CEO/COO 최상위 권한자이므로 실무 일정 행에 표시될 필요가 없음
- 실제 해당 월 일정이 없는 직원까지 모두 행으로 표시되어 가독성이 떨어짐
- 기본 일정표는 “해당 월에 일정 데이터가 있는 사람”만 표시해야 함
- 단, 관리자용 전체 보기 옵션은 별도 토글로 제공 가능
```

---

## 2. 더미데이터 보존/삭제 원칙

### 2-1. 보존 대상

다음 데이터는 임의 삭제하지 않는다.

```text
1. 사용자가 최근 직접 요청하여 반영한 인사카드/조직/권한 데이터
   - CEO [DEMO] CONCOST Executive 001
   - COO [DEMO] CONCOST Executive 002
   - 베트남 부서장급 권한 반영 인원
   - 활성/비활성 및 대리 결재자 설정
2. 사용자가 JSON import로 가져온 데이터
3. 사용자가 화면에서 직접 생성한 프로젝트/일정/인사카드
4. Plan 25/26 workflow 검증에 필요한 최소 운영 테스트 데이터
5. 실제 운영 테스트에 필요한 CON-COST / Viet_QS 조직 기준 데이터
```

### 2-2. 삭제 후보

다음 데이터는 삭제 후보로 분류한다.

```text
1. 명백한 demo/test/sample 프로젝트
   - UI 디자인 시안
   - 테스트 프로젝트
   - 샘플 프로젝트
   - Demo Project
   - Sample Task
2. id가 u1, u2, u3, u4 등 의미 없는 mock user로 남아 있고 실제 인사카드와 연결되지 않은 데이터
3. 실제 직원명과 매핑되지 않는 orphan task/conflict/schedule
4. 사용자가 만든 적 없는 seed conflict
5. Plan 20~26 검수용으로 삽입된 테스트 충돌 데이터
6. 승인 workflow와 연결되지 않은 standalone dummy conflict
7. 현재 월 일정표를 채우기 위해 임의 생성된 placeholder schedule
8. 공식 일정/승인 요청/AuditLog와 연결되지 않는 orphan ScheduleAssignment
```

### 2-3. 삭제 전 필수 확인

삭제 전 반드시 아래 표를 작성하고 사용자에게 승인 요청한다.

```text
[Dummy Data Deletion Candidate Matrix]
- dataType
- id
- title/name
- source 추정
- 연결된 projectId/taskId/userId
- 삭제 사유
- 보존 위험도
- 삭제 시 영향
- 권장 조치: DELETE / ARCHIVE / KEEP / HIDE_ONLY / NEED_USER_CONFIRMATION
```

---

## 3. 일정표 표시 정책

### 3-1. 기본 표시 정책

통합 일정표 기본 화면은 다음 기준으로 표시한다.

```text
표시 대상:
- 해당 월에 승인된 공식 일정이 있는 직원
- 해당 월에 휴가/Off/외근 일정이 있는 직원
- 권한 있는 사용자가 preview toggle을 켠 경우 승인대기 일정이 있는 직원

기본 제외 대상:
- 해당 월에 일정이 전혀 없는 직원
- CEO/COO/최고경영진 중 실무 일정 대상이 아닌 사용자
- INACTIVE 사용자
- deleted/archived 사용자
- 실제 인사카드와 연결되지 않은 mock user
```

### 3-2. CEO/COO 처리 기준

```text
[DEMO] CONCOST Executive 001: CEO
[DEMO] CONCOST Executive 002: COO

기본 일정표:
- 표시하지 않음

권한/결재:
- 유지

직원 관리/인사카드:
- 표시

전체 직원 보기 토글:
- 최고관리자 또는 시스템 관리자만 표시 가능

필요 시 예외:
- CEO/COO가 실제 휴가/일정/결재 부재 기간을 등록한 경우에는 관리자용 일정표에서만 표시 가능
```

### 3-3. UI 토글 제안

일정표 상단에 다음 필터를 추가한다.

```text
[일정 있는 직원만] 기본 ON
[관리자/임원 포함] 기본 OFF
[승인대기 일정 포함] 권한자만
[반려 일정 포함] 권한자만
[비활성 직원 포함] 최고관리자만
```

초기 MVP에서는 최소한 다음 2개만 구현해도 된다.

```text
1. 일정 있는 직원만 보기
2. 관리자/임원 포함
```

---

## 4. 충돌 데이터 처리 정책

### 4-1. 충돌은 저장값보다 계산값 우선

충돌 관리 화면은 가능하면 현재 데이터에서 실시간 계산된 충돌을 표시해야 한다.

```text
공식 일정
+ 승인대기 일정 preview
+ 휴가/Off/외근
+ 직원별 dailyHours
→ 충돌 계산
```

### 4-2. 더미 conflict 제거

```text
- mock conflict array
- seed conflicts
- persisted dummy conflicts
- orphan conflicts
```

는 삭제 또는 비활성 처리한다.

단, 다음은 유지한다.

```text
- 실제 승인된 일정 간 충돌
- 실제 휴가/Off와 승인된 일정의 충돌
- 사용자가 직접 생성한 휴가/일정 기반 충돌
- Plan 26 승인대기 preview에서 계산되는 충돌 경고
```

### 4-3. Conflict Resolution History

더미 conflict를 삭제할 때 해결 이력에 남길지 여부를 구분한다.

```text
운영 데이터 conflict:
- 해결/미루기/재배정/야근승인 이력 기록

더미 conflict:
- 운영 이력으로 남기지 않음
- 삭제 로그 또는 cleanup report에만 기록
```

---

## 5. Phase 구성

아래 Phase는 반드시 순서대로 진행한다.  
각 Phase 시작 전 사용자 승인을 받아야 한다.  
사용자가 승인하기 전에는 다음 Phase를 시작하지 않는다.

---

# Phase 311 — Plan 27 현황 조사 및 코드 수정 금지 Baseline

## 목표

현재 일정 충돌과 일정표 표시 문제가 어디에서 발생하는지 확인한다.

## 작업

1. 현재 브랜치/커밋 상태 확인
2. `/conflicts` 화면에서 표시되는 충돌 목록 확인
3. `/schedule` 화면에서 2026년 7월 직원 목록 확인
4. [DEMO] CONCOST Executive 001/[DEMO] CONCOST Executive 002 표시 원인 확인
5. `u4`, `UI 디자인 시안`, `LEAVE_OVERLAP` 데이터 출처 추적
6. localStorage에 남은 데이터 확인
7. seed/mock/fixture 파일 확인
8. conflict generator/store 확인
9. schedule selector 확인
10. personnelStore/authStore 확인

## 금지

- 코드 수정 금지
- 데이터 삭제 금지
- localStorage 초기화 금지
- git commit 금지
- git push 금지

## 완료 보고

```text
[Plan 27 / Phase 311 완료 보고]
- 확인한 route:
- 현재 충돌 목록:
- 현재 일정표 직원 목록:
- `u4` 출처:
- `UI 디자인 시안` 출처:
- [DEMO] CONCOST Executive 001/[DEMO] CONCOST Executive 002 표시 원인:
- 더미데이터 후보:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 312 — Dummy Data Inventory 작성

## 목표

현재 프로젝트에 남아 있는 더미데이터를 전수 조사한다.

## 조사 대상

```text
- users
- personnel
- projects
- tasks
- taskCards
- schedulePlans
- scheduleAssignments
- taskWorkSegments
- conflicts
- approvals
- notifications
- auditLogs
- localStorage persisted state
- seed files
- JSON sample files
- test fixture files
```

## 작업

1. 더미성 키워드 검색
   - dummy
   - mock
   - sample
   - demo
   - test
   - UI 디자인 시안
   - u1/u2/u3/u4
2. 실제 인사카드와 연결되지 않은 userId 검색
3. orphan task 검색
4. orphan schedule 검색
5. orphan conflict 검색
6. 사용자가 최근 요청한 보존 대상 데이터 분리
7. 삭제 후보 Matrix 작성

## 금지

- 코드 수정 금지
- 데이터 삭제 금지

## 산출물

```text
qa/plan27/reports/PLAN27_DUMMY_DATA_INVENTORY.md
```

## 완료 보고

```text
[Plan 27 / Phase 312 완료 보고]
- inventory 파일:
- 삭제 후보 개수:
- 보존 대상 개수:
- 사용자 확인 필요한 항목:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 313 — 삭제/보존 정책 사용자 승인 요청

## 목표

삭제 전 사용자에게 명확히 승인받는다.

## 작업

1. 삭제 후보를 표로 요약
2. 보존 후보를 표로 요약
3. 모호한 항목은 `NEED_USER_CONFIRMATION`으로 분류
4. 다음 조치별로 사용자 승인 요청
   - DELETE
   - ARCHIVE
   - KEEP
   - HIDE_ONLY
5. 승인 전 어떤 데이터도 삭제하지 않는다.

## 완료 보고

```text
[Plan 27 / Phase 313 승인 요청]
다음 데이터 정리안을 승인해 주세요.

- 삭제 예정:
- 보존 예정:
- 숨김 처리 예정:
- 확인 필요:
- 승인 전에는 삭제/수정하지 않겠습니다.
```

---

# Phase 314 — 더미 Conflict 제거 및 Conflict 계산 로직 분리

## 목표

허위 충돌 데이터를 제거하고, 충돌 화면이 실제 데이터 기반으로 표시되게 한다.

## 작업

1. 더미 conflict 삭제 또는 seed에서 제거
2. `u4` 기반 orphan conflict 제거
3. `UI 디자인 시안` 더미 task와 연결된 conflict 제거
4. conflict source를 구분
   - CALCULATED
   - MANUAL
   - IMPORTED
   - MOCK
5. `MOCK` conflict는 실사용 모드에서 숨김
6. 운영 검증 모드에서만 mock conflict를 볼 수 있게 할지 결정
7. 실제 일정/휴가 기반 충돌 계산은 유지
8. 해결 이력에는 더미 삭제를 운영 이력으로 넣지 않음

## 완료 조건

- 사용자가 지적한 허위 `LEAVE_OVERLAP` 충돌이 실사용 모드에서 사라짐
- 실제 일정 기반 충돌은 계속 감지됨
- 운영 검증 모드와 실사용 모드가 분리됨

## 완료 보고

```text
[Plan 27 / Phase 314 완료 보고]
- 삭제/숨김 처리한 conflict:
- 유지한 conflict:
- 수정 파일:
- 실사용 모드 결과:
- 운영 검증 모드 결과:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 315 — Legacy Dummy Project/Task/Schedule 정리

## 목표

충돌을 유발하는 더미 프로젝트/업무/일정 데이터를 정리한다.

## 작업

1. 사용자 승인 받은 삭제 후보만 처리
2. 더미 project 제거 또는 archive
3. 더미 task 제거 또는 archive
4. 더미 scheduleAssignment 제거 또는 archive
5. 더미 taskWorkSegment 제거 또는 archive
6. 관련 approval/notification/auditLog가 운영 데이터처럼 남지 않게 정리
7. 삭제보다 archive가 안전한 경우 archive 처리
8. JSON export에 dummy가 포함되지 않게 조정

## 완료 보고

```text
[Plan 27 / Phase 315 완료 보고]
- DELETE 처리:
- ARCHIVE 처리:
- KEEP 처리:
- JSON Export 제외 여부:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 316 — 일정표 사용자 표시 Selector 설계

## 목표

일정표에 표시할 직원을 결정하는 selector 정책을 설계한다.

## 표시 조건

```text
showEmployeeInScheduleMonth(user, month, options):
- user.status === ACTIVE
- user.isDeleted !== true
- user.role/rank가 CEO/COO이면 기본 제외
- 해당 월 approved schedule 존재
- 해당 월 leave/off/external schedule 존재
- options.includePending이면 pending schedule 존재
- options.includeExecutives이면 CEO/COO 포함 가능
- options.showAllEmployees이면 일정 없는 직원도 표시 가능
```

## 금지

- 코드 수정 금지

## 완료 보고

```text
[Plan 27 / Phase 316 완료 보고]
- selector 정책:
- CEO/COO 제외 기준:
- 일정 있는 사람 판정 기준:
- 옵션 토글:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 317 — CEO/COO 일정표 기본 제외 구현

## 목표

[DEMO] CONCOST Executive 001, [DEMO] CONCOST Executive 002 등 CEO/COO를 일정표 실무 행에서 기본 제외한다.

## 작업

1. CEO/COO 판정 기준 확인
   - rank
   - role
   - organizationRank
   - jobTitle
2. schedule selector에 기본 제외 적용
3. 권한/결재/인사카드에서는 유지
4. 최고관리자용 includeExecutives 옵션 준비
5. [DEMO] CONCOST Executive 001/[DEMO] CONCOST Executive 002가 기본 일정표에서 사라지는지 검증

## 완료 조건

- 기본 일정표에서 [DEMO] CONCOST Executive 001/[DEMO] CONCOST Executive 002가 보이지 않음
- 사원관리에서는 보임
- 권한/결재 기능은 유지
- `관리자/임원 포함` 옵션이 켜지면 표시 가능

## 완료 보고

```text
[Plan 27 / Phase 317 완료 보고]
- 수정 파일:
- CEO/COO 판정 기준:
- 기본 일정표 결과:
- 사원관리/권한 유지 검증:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 318 — 해당 월 일정 있는 직원만 표시 구현

## 목표

통합 일정표에서 해당 월에 실제 일정이 있는 직원만 기본 표시한다.

## 작업

1. 월 단위 일정 존재 여부 계산
2. approved official schedule 기준 표시
3. 휴가/Off/외근도 일정으로 인정
4. pending preview가 켜진 경우 pending schedule도 표시
5. 일정 없는 직원은 기본 숨김
6. empty state 문구 추가
7. `전체 직원 보기` 토글 추가 여부 결정

## 완료 조건

- 해당 월 일정 없는 직원은 기본 숨김
- 실제 일정 있는 직원만 표시
- 일정이 하나도 없으면 “해당 월에 표시할 일정이 없습니다” 문구 표시
- 권한자가 토글로 전체 직원 보기 가능

## 완료 보고

```text
[Plan 27 / Phase 318 완료 보고]
- 수정 파일:
- 월별 필터 결과:
- empty state:
- 전체 직원 보기 옵션:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 319 — 일정표 필터 UI 추가

## 목표

사용자가 일정표 표시 범위를 조정할 수 있게 한다.

## 권장 필터

```text
- 일정 있는 직원만
- 관리자/임원 포함
- 승인대기 일정 포함
- 반려 일정 포함
- 비활성 직원 포함
```

## MVP 필수

```text
- 일정 있는 직원만
- 관리자/임원 포함
```

## 작업

1. 통합 일정표 상단 필터 UI 추가
2. 기본값 설정
   - 일정 있는 직원만: ON
   - 관리자/임원 포함: OFF
3. 권한별 토글 노출 제한
4. 필터 상태 local state 또는 store 저장 여부 결정
5. 필터 변경 시 grid 즉시 반영

## 완료 보고

```text
[Plan 27 / Phase 319 완료 보고]
- 추가한 필터:
- 기본값:
- 권한별 노출:
- 테스트 결과:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 320 — 더미데이터 Cleanup 후 JSON Export/Import 검증

## 목표

정리된 데이터가 JSON Handoff에 정상 반영되는지 검증한다.

## 작업

1. JSON Export 실행
2. export 파일에 dummy conflict/project/task가 남아있는지 확인
3. CEO/COO는 personnel에는 포함되는지 확인
4. CEO/COO가 schedule rows로 강제 생성되지 않는지 확인
5. clean export를 별도 파일명으로 저장
6. localStorage 초기화 후 import
7. import 후 conflicts/schedule 화면 확인

## 완료 보고

```text
[Plan 27 / Phase 320 완료 보고]
- export 파일명:
- dummy 잔존 여부:
- personnel 보존 여부:
- schedule 표시 결과:
- import round-trip 결과:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 321 — Conflict/Schedule E2E QA

## 목표

실제 화면에서 더미 충돌 제거와 일정표 필터링을 검증한다.

## 시나리오 A: 충돌 없음

1. 더미데이터 정리 후 `/conflicts` 접속
2. 실제 충돌이 없다면 “해결 대기 중인 충돌이 없습니다” 표시
3. 해결 이력에 더미 삭제 이력이 운영 이력처럼 남지 않는지 확인

## 시나리오 B: 실제 충돌 생성

1. 테스트 프로젝트 생성
2. 직원 A에게 일정 배정
3. 같은 날짜 휴가 또는 다른 일정 생성
4. 충돌이 계산되는지 확인
5. 충돌 해결 액션 확인

## 시나리오 C: 일정표 표시

1. 2026년 7월 통합 일정표 접속
2. 일정 없는 직원 숨김 확인
3. CEO/COO 기본 숨김 확인
4. 관리자/임원 포함 토글 확인
5. 전체 직원 보기 또는 일정 있는 직원만 토글 확인

## 완료 보고

```text
[Plan 27 / Phase 321 완료 보고]
- 충돌 없음 시나리오:
- 실제 충돌 생성 시나리오:
- 일정표 표시 시나리오:
- 발견 이슈:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 322 — UI/UX 실사용 보정

## 목표

정리된 상태에서 사용자가 혼동하지 않도록 문구와 UI를 보정한다.

## 개선 후보

1. 충돌 화면 empty state 문구 개선
2. 더미/검증 모드 충돌과 실사용 충돌 구분 배지
3. 일정표 필터 설명 tooltip
4. CEO/COO 제외 이유 tooltip
5. 일정 없는 직원 숨김 안내
6. 데이터 없음 상태에서 다음 액션 안내
7. JSON 운영 모드와 실사용 모드 구분 문구

## 완료 보고

```text
[Plan 27 / Phase 322 완료 보고]
- 보정한 UI:
- 문구 변경:
- 사용자 혼동 감소 효과:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 323 — 회귀 테스트

## 목표

Plan 27 수정으로 기존 기능이 깨지지 않았는지 확인한다.

## 검증 항목

1. 대시보드
2. 수주/개발 관리
3. 프로젝트 보드
4. PM 작업자 배정
5. 일정 승인/반려/재요청
6. 통합 일정표
7. 충돌 관리
8. 결재/수정 내역
9. 알림 센터
10. 사원관리
11. 권한 전환
12. JSON Export/Import
13. KOR/VIET 토글
14. Sidebar overlay

## 완료 보고

```text
[Plan 27 / Phase 323 완료 보고]
- PASS:
- PARTIAL:
- FAIL:
- 회귀 발생 여부:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 324 — Lint / Typecheck / Build

## 목표

수정 후 기본 품질 검증을 실행한다.

## 작업

1. lint 실행
2. typecheck 실행
3. build 실행
4. console error 확인
5. route refresh 확인
6. GitHub Pages base path 영향 확인

## 완료 보고

```text
[Plan 27 / Phase 324 완료 보고]
- lint:
- typecheck:
- build:
- runtime:
- route refresh:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 325 — Plan 27 최종 리포트 작성

## 목표

Plan 27의 실제 수정 결과와 남은 리스크를 문서화한다.

## 산출물

```text
qa/plan27/reports/PLAN27_DUMMY_CLEANUP_SCHEDULE_FILTER_REPORT.md
```

## 포함 항목

1. 수정 배경
2. 사용자 스크린샷 기준 문제
3. 더미데이터 inventory
4. 삭제/보존/숨김 처리 결과
5. conflict 정리 결과
6. CEO/COO 일정표 제외 정책
7. 일정 있는 직원만 표시 정책
8. JSON Export/Import 결과
9. E2E QA 결과
10. 남은 이슈
11. push 전 사용자 승인 필요 문구

## 완료 보고

```text
[Plan 27 / Phase 325 완료 보고]
- 최종 리포트 경로:
- 주요 수정 결과:
- 남은 이슈:
- Git commit 가능 여부:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 326 — Git Commit 및 Push 승인 요청

## 목표

사용자 승인 후에만 commit/push를 진행한다.

## 작업

1. git diff 요약
2. 수정 파일 목록
3. commit message 제안
4. 사용자에게 commit 승인 요청
5. 사용자에게 push 승인 요청
6. 승인 전 commit/push 금지

## 완료 보고

```text
[Plan 27 / Phase 326 승인 요청]
- commit 대상 파일:
- commit message:
- push 대상 branch:
- 승인 전에는 commit/push하지 않겠습니다.
```

---

## 6. 최종 완료 기준

Plan 27은 다음 조건을 모두 만족해야 완료된다.

1. 더미데이터 전체 inventory가 작성된다.
2. 삭제 대상과 보존 대상이 사용자 승인 후 처리된다.
3. 사용자가 지적한 허위 `LEAVE_OVERLAP` 충돌이 실사용 화면에서 사라진다.
4. 실제 일정/휴가 기반 충돌 감지는 유지된다.
5. mock conflict는 실사용 모드에서 보이지 않는다.
6. CEO [DEMO] CONCOST Executive 001, COO [DEMO] CONCOST Executive 002는 기본 일정표에서 제외된다.
7. CEO/COO는 사원관리·권한·결재에서는 유지된다.
8. 통합 일정표는 해당 월에 실제 일정이 있는 직원만 기본 표시한다.
9. 일정 없는 직원은 기본 숨김 처리된다.
10. 권한자가 필요 시 관리자/임원 포함 또는 전체 직원 보기를 사용할 수 있다.
11. JSON Export에 정리된 데이터 상태가 반영된다.
12. JSON Import 후에도 허위 충돌이 되살아나지 않는다.
13. Conflict/Schedule E2E QA가 통과한다.
14. lint/typecheck/build가 통과한다.
15. 최종 리포트가 실제 결과 기준으로 작성된다.
16. 사용자 승인 전 원격 push하지 않는다.

---

## 7. Antigravity 실행 시작 문구

아래 문구를 그대로 Antigravity에 입력하라.

```text
현재 F:\workspace 프로젝트의 Plan 27 작업을 시작한다.

중요 전제:
- Plan 단계는 뒤로 갈수록 최신 요구사항이 우선이다.
- Plan 27은 더미데이터 정리, 허위 일정충돌 제거, CEO/COO 일정표 기본 제외, 해당 월 일정 있는 직원만 표시하는 실사용 안정화 Plan이다.
- 현재 `/conflicts` 화면에 실제 운영상 존재하지 않는 `u4`, `LEAVE_OVERLAP`, `UI 디자인 시안` 기반 충돌이 표시되고 있다.
- 이 충돌은 더미데이터 또는 검수용 mock data에서 유입된 것으로 보이므로, 출처를 추적하고 실사용 화면에서 제거하라.
- 단, 실제 일정/휴가/Off/외근 기반 충돌 감지는 유지해야 한다.
- 더미데이터는 무작정 삭제하지 말고, seed/mock/localStorage/fixture/export data를 전수 조사하여 삭제 후보와 보존 후보를 먼저 Matrix로 작성하라.
- 사용자가 가장 마지막에 요청해 반영한 인사카드/조직/권한 데이터는 임의 삭제하지 마라.
- 사용자 승인 없이 어떤 데이터도 삭제하지 마라.
- [DEMO] CONCOST Executive 001, [DEMO] CONCOST Executive 002는 CEO/COO 최상위 권한자이므로 기본 통합 일정표의 실무 직원 행에서 제외하라.
- 단, CEO/COO는 사원관리, 권한, 결재 기능에서는 유지하라.
- 통합 일정표는 기본적으로 해당 월에 실제 일정이 있는 직원만 표시하라.
- 일정이 없는 직원은 기본 숨김 처리하고, 필요 시 권한자가 `전체 직원 보기` 또는 `관리자/임원 포함` 토글로 볼 수 있게 하라.
- JSON Export/Import에서 정리된 데이터 상태가 유지되어야 하며, import 후 더미 conflict가 되살아나면 안 된다.
- 각 Phase 시작 전 반드시 사용자에게 승인 요청을 하라.
- 사용자 승인 없이 Phase를 시작하지 마라.
- 사용자 승인 없이 다음 Phase로 넘어가지 마라.
- 사용자 승인 없이 GitHub 원격 push하지 마라.

먼저 Phase 311만 진행한다.
Phase 311에서는 코드 수정 금지, 데이터 삭제 금지, localStorage 초기화 금지, UI 수정 금지, store 수정 금지, 현황 조사와 baseline 작성만 수행한다.

먼저 [Plan 27 / Phase 311 시작 승인 요청]만 작성하라.
아직 Phase 311을 실행하지 마라.
```
