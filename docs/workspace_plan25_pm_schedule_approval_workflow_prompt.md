# WORKSPACE PLAN 25 — PM 작업자 호출·소요일정 작성·중간관리자 승인 후 일정 반영 Workflow 복구 프롬프트

이 프롬프트는 기존 `workspace plan1`부터 `workspace plan24` 이후에 추가되는 스물다섯 번째 보강 지시사항이다.

Plan 25의 목적은 프로젝트가 생성된 뒤 실제 운영 workflow가 끊기는 문제를 복구하는 것이다.  
현재 화면에서는 프로젝트 상세 모달이 열리고 세부 탭이 보이지만, 정작 PM이 함께 일할 작업자를 명확히 선택하고, 소요일정을 작성하고, 그 일정을 중간관리자가 승인한 뒤 전체 직원 일정표에 공식 반영하는 핵심 흐름이 화면상 충분히 구현되어 있지 않다.

따라서 Plan 25는 다음 실무 흐름을 정확하게 구현·검증한다.

```text
수주/개발 업무 생성
→ 중간관리자 PM 지정
→ 지정된 PM이 프로젝트 상세에서 작업자 선택
→ PM이 작업 파트/업무카드/소요일정 작성
→ PM이 중간관리자에게 일정 승인 요청
→ 중간관리자가 전체 직원 일정표와 충돌/부하를 확인
→ 중간관리자가 승인 또는 반려
→ 승인된 일정만 전체 직원 일정표와 작업자 업무에 공식 반영
→ 반려 시 PM이 수정 후 재요청
```

---

## 0. 사용자 지시 및 현재 문제

사용자 스크린샷 기준으로 다음 문제가 확인되었다.

1. 프로젝트는 생성된다.
2. 프로젝트 상세 모달은 열린다.
3. 탭은 `개요 / 세부 작업내역 / 진행 내용 / 체크리스트 / 승인/신청 / 산출물 / QC/평가 / 정산 / 이력` 등으로 보인다.
4. 그러나 PM이 같이 일할 직원을 직접 선택하는 명확한 UI가 보이지 않는다.
5. PM이 작업자별 소요일정을 작성하는 화면이 부족하거나 사용자가 찾기 어렵다.
6. PM이 작성한 일정이 중간관리자 승인 전에는 공식 일정으로 들어가면 안 된다.
7. 중간관리자 승인 후에만 전체 직원 일정표에 포함되어야 한다.
8. 현재 리포트에는 `PmDispatchModal`이 호출되고 담당자를 배정할 수 있다고 되어 있지만, 실제 사용자가 보는 흐름상 “작업자 선택 → 일정 작성 → 승인 요청 → 승인 후 일정 반영”이 완결되어 있다고 보기 어렵다.
9. Plan 1부터 현재까지 요구한 핵심 workflow와 실제 화면 간 불일치가 있으므로, Plan 25에서 이 흐름을 기능·UI·데이터·승인·알림·JSON까지 연결해야 한다.

---

## 1. 가장 중요한 원칙

Antigravity는 아래 원칙을 반드시 지켜라.

1. Plan 단계는 뒤로 갈수록 최신 요구사항이 우선이다.
2. Plan 25는 PM 작업자 호출·소요일정 작성·중간관리자 승인 workflow 복구 전용 Plan이다.
3. 리포트에 완료라고 적혀 있어도 실제 화면에서 사용자가 수행할 수 없으면 미완료로 본다.
4. 프로젝트 상세 모달이 열리는 것만으로 PM 업무 하달 완료라고 보지 마라.
5. `PmDispatchModal`이 코드에 존재하는 것만으로 담당자 배정 workflow 완료라고 보지 마라.
6. 작업자 선택 UI, 작업자별 일정 작성 UI, 승인 요청, 중간관리자 검토, 승인 후 일정 반영까지 실제 동작해야 완료다.
7. 승인 전에는 작업자 공식 일정표에 반영하지 마라.
8. 승인 전 TaskCard/TaskWorkSegment는 draft 또는 pending 상태로만 저장한다.
9. 중간관리자 승인 후에만 직원별 공정표, 통합 일정표, 작업자 내 업무에 공식 표시한다.
10. 반려 시 반려 사유를 반드시 저장하고 PM이 수정 후 재요청할 수 있어야 한다.
11. AuditLog와 Notification을 생략하지 마라.
12. JSON Export/Import에 PM 일정 draft, 승인 요청, 승인된 일정, 반려 이력이 포함되어야 한다.
13. 각 Phase 시작 전 반드시 사용자에게 승인 요청을 하라.
14. 사용자 승인 없이 Phase를 시작하지 마라.
15. 사용자 승인 없이 다음 Phase로 넘어가지 마라.
16. 사용자 승인 없이 GitHub 원격 push하지 마라.
17. 먼저 분석하고, 그 다음 설계하고, 그 다음 작은 단위로 구현하라.

---

## 2. Plan 1~24와의 무결성 기준

### 2-1. Plan 1 기본 workflow 복구

Plan 1의 기본 흐름은 유지한다.

```text
수주 프로젝트 등록
→ 중간관리자 PM 배정
→ PM 일정 작성
→ 중간관리자 승인/반려
→ 승인 후 직원별 일정 반영
```

Plan 25는 이 흐름을 실제 사용 가능한 UI와 데이터로 연결한다.

### 2-2. Plan 3 권한 구조 유지

권한 기준:

```text
SUPER_ADMIN:
- 전체 프로젝트/PM/작업자/일정 조회 및 디버깅 가능

DEPARTMENT_MANAGER:
- 본인 부서 프로젝트의 PM 지정
- PM이 제출한 일정 승인/반려
- 본인 부서 직원 일정과 부하 확인

PM:
- 본인에게 배정된 프로젝트만 일정 작성 가능
- 해당 프로젝트에 필요한 작업자 선택 가능
- 작업자별 TaskCard와 일정 초안 작성 가능
- 일정 승인 요청 가능
- 중간관리자 승인 전 공식 일정 확정 불가

WORKER:
- 승인된 본인 업무만 공식 업무로 확인
- 승인 전 draft 일정은 기본적으로 보지 않거나 “승인 대기 예정 업무”로 제한 표시
- 본인 업무에 대해 일정 연장/추가 일정 요청 가능
```

### 2-3. Plan 17 PM 업무 하달 workflow 정밀화

Plan 17에서 정의한 “착수 전 → 진행 중 이동 시 PM 업무 하달 workflow 강제”를 강화한다.

변경 기준:

```text
착수 전 카드 → 진행 중 이동 시:
1. PM 미지정이면 PM 지정 workflow로 안내
2. PM 지정되어 있으면 PM Schedule Draft 화면 또는 Dispatch Planner 열림
3. 작업자 1명 이상 선택 필수
4. TaskCard 1개 이상 생성 필수
5. 시작일/종료일 또는 작업 구간 필수
6. 예상 소요시간 또는 일별 투입량 입력 권장/필수
7. 중간관리자 승인 요청 전까지 공식 진행 중으로 확정 금지
```

### 2-4. Plan 11 통합 일정표 연결

승인 전/후 일정 반영 기준:

```text
승인 전:
- SchedulePlan.status = DRAFT 또는 PENDING_APPROVAL
- TaskCard.approvalStatus = PENDING
- 통합 일정표에는 기본적으로 공식 일정으로 표시하지 않는다.
- 관리자/PM preview 모드에서는 점선/임시색/승인대기 배지로만 볼 수 있다.

승인 후:
- SchedulePlan.status = APPROVED
- TaskCard.approvalStatus = APPROVED
- ScheduleAssignment 또는 TaskWorkSegment 생성/확정
- 통합 일정표와 작업자 내 업무에 반영
- 작업자에게 알림 발송
```

### 2-5. Plan 20~24 QA 원칙 유지

- 실제 화면에서 검증하지 않은 기능은 완료라고 쓰지 않는다.
- 리포트 문구는 실제 결과 기준으로 작성한다.
- build/lint/typecheck 증빙 없는 완료 보고 금지.
- 사용자 승인 전 push 금지.

---

## 3. 현재 리포트 검토 기준

현재 리포트에는 다음 내용이 있다.

- 브랜드, 사이드바, full-width 개선이 완료되었다고 보고됨.
- 인사카드 데이터와 권한 구조가 최신화되었다고 보고됨.
- 수주/개발 관리 기본 탭과 월별 요약 필터가 적용되었다고 보고됨.
- 빈 프로젝트 보드에서 `[세부 업무 및 파트 배정하기]` 버튼이 나타나고 `PmDispatchModal`이 호출된다고 보고됨.
- 개인 작업자 완료, PM 검수 요청, 부서장 최종 완료 승인 흐름이 완성되었다고 보고됨.
- JSON Export가 실제 다운로드로 연결되었다고 보고됨.

Plan 25에서는 위 내용 중 특히 다음을 다시 검증한다.

```text
1. `PmDispatchModal`이 실제로 작업자를 선택할 수 있는가?
2. 선택 가능한 작업자가 권한/부서/활성 상태 기준으로 필터링되는가?
3. PM이 작업자별 소요일정을 작성할 수 있는가?
4. 작성한 일정은 승인 전 draft/pending 상태로 남는가?
5. PM이 중간관리자에게 일정 승인 요청을 할 수 있는가?
6. 중간관리자는 일정, 직원 부하, 충돌을 보고 승인/반려할 수 있는가?
7. 승인 전에는 전체 직원 일정표에 공식 반영되지 않는가?
8. 승인 후에는 전체 직원 일정표, 작업자 내 업무, 알림, AuditLog에 반영되는가?
9. 반려 시 PM이 수정 후 재요청 가능한가?
10. JSON Export/Import에 이 workflow 데이터가 포함되는가?
```

---

## 4. 권장 데이터 모델 보강

기존 데이터 모델을 무너뜨리지 말고 필요한 필드만 확장한다.

### 4-1. SchedulePlan

```ts
interface SchedulePlan {
  id: string
  projectId: string
  pmId: string
  managerId: string
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "CANCELLED"
  title: string
  taskIds: string[]
  proposedStartDate?: string
  proposedEndDate?: string
  submittedAt?: string
  reviewedAt?: string
  reviewedBy?: string
  rejectionReason?: string
  approvalRequestId?: string
  createdAt: string
  updatedAt: string
}
```

### 4-2. TaskCard schedule draft 필드

```ts
TaskCard {
  approvalStatus: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED"
  schedulePlanId?: string
  assigneeId: string
  estimatedHours?: number
  dailyHours?: number
  plannedStartDate: string
  plannedEndDate: string
  approvedStartDate?: string
  approvedEndDate?: string
}
```

### 4-3. ScheduleAssignment 또는 TaskWorkSegment

승인 후 공식 일정으로 생성하거나 확정한다.

```ts
ScheduleAssignment {
  id: string
  projectId: string
  taskId: string
  assigneeId: string
  pmId: string
  managerId: string
  startDate: string
  endDate: string
  dailyHours?: number
  status: "APPROVED" | "IN_PROGRESS" | "COMPLETED"
  source: "MANAGER_APPROVED_PM_PLAN"
  schedulePlanId: string
  createdAt: string
  updatedAt: string
}
```

### 4-4. ApprovalRequest

```ts
ApprovalRequest {
  type: "SCHEDULE_APPROVAL"
  projectId: string
  schedulePlanId: string
  requestedBy: pmId
  managerId: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  reviewComment?: string
  rejectionReason?: string
}
```

---

## 5. UX 설계 기준

### 5-1. 프로젝트 상세 모달 상단 Primary Action

프로젝트 상세 모달 상단에는 상태에 따라 명확한 버튼이 있어야 한다.

```text
PM 미지정:
- [PM 지정하기] — 중간관리자/SUPER_ADMIN만

PM 지정됨, 일정 초안 없음:
- [작업자/일정 배정하기] — 해당 PM/SUPER_ADMIN

일정 초안 작성 중:
- [일정 초안 수정]
- [중간관리자 승인 요청]

승인 대기:
- [승인 대기 중]
- PM은 수정 제한 또는 요청 취소 후 수정

반려:
- [반려 사유 확인]
- [일정 수정 후 재요청]

승인 완료:
- [공식 일정 보기]
- [작업 진행 관리]
```

### 5-2. PM Schedule Planner 모달

`PmDispatchModal`을 단순 담당자 배정 모달로 두지 말고 `PM Schedule Planner`로 개선한다.

필수 UI:

```text
1. 프로젝트 요약
2. 담당 PM 표시
3. 작업자 선택 영역
   - 직원 검색
   - 부서/파트 필터
   - CON-COST / Viet_QS 필터
   - 활성 직원만 표시
   - 이미 과부하/충돌 직원 경고
4. 작업 카드/파트 작성 영역
   - 업무명
   - 파트/Scope
   - 담당자
   - 시작일
   - 종료일
   - 예상 소요시간
   - 우선순위
   - 설명
5. 일정 미리보기
   - 작업자별 일정 preview
   - 충돌/과부하 표시
6. 저장 방식
   - [임시저장]
   - [중간관리자 승인 요청]
```

### 5-3. 중간관리자 Schedule Approval 화면

중간관리자는 승인 화면에서 다음을 볼 수 있어야 한다.

```text
- 프로젝트명
- PM
- 작업자 목록
- 작업자별 업무명
- 시작일/종료일
- 예상 소요일정
- 직원별 월간 일정표 preview
- 충돌/과부하 경고
- PM 메모
- 승인 버튼
- 반려 버튼
- 반려 사유 입력
```

### 5-4. 승인 후 일정표 표시

승인 후 통합 일정표에는 다음이 표시되어야 한다.

```text
- 직원별 공식 업무 블록
- 프로젝트명
- 업무명/파트
- PM
- 기간
- 진행상태
- 승인 완료 배지
```

---

## 6. Phase 구성

아래 Phase는 반드시 순서대로 진행한다.  
각 Phase 시작 전 사용자 승인을 받아야 한다.  
사용자가 승인하기 전에는 다음 Phase를 시작하지 않는다.

---

# Phase 267 — Plan 25 현황 조사 및 코드 수정 금지 Baseline

## 목표

현재 리포트의 주장과 실제 화면/코드의 차이를 확인한다.

## 작업

1. `report_20260710_0051.md` 읽기
2. Plan 1, Plan 3, Plan 11, Plan 17, Plan 20~24 중 workflow 관련 항목 재확인
3. 현재 배포 화면에서 다음 재현
   - 프로젝트 생성
   - 중간관리자 PM 지정 가능 여부
   - PM으로 로그인/권한 전환
   - 프로젝트 상세 진입
   - 작업자 선택 가능 여부
   - 소요일정 작성 가능 여부
   - 승인 요청 가능 여부
   - 중간관리자 승인 가능 여부
   - 승인 후 통합 일정표 반영 여부
4. 실제 코드에서 다음 파일 확인
   - Project detail modal
   - PmDispatchModal
   - projectStore
   - taskStore
   - scheduleStore
   - approvalStore
   - notificationStore
   - auditLog 관련 파일
   - JSON export/import service

## 금지

- 코드 수정 금지
- UI 수정 금지
- store 수정 금지
- git commit 금지
- git push 금지

## 완료 보고

```text
[Plan 25 / Phase 267 완료 보고]
1. 검토한 문서
2. 확인한 화면/route
3. 실제 동작 가능한 기능
4. 부분 구현 기능
5. 미구현 기능
6. 수정 필요 파일 후보
7. 다음 Phase 진행 승인 요청
```

---

# Phase 268 — Workflow Gap Matrix 작성

## 목표

PM 작업자 호출 및 일정 승인 workflow의 누락 항목을 Matrix로 정리한다.

## 작업

다음 항목을 PASS/PARTIAL/FAIL/BLOCKED로 분류한다.

1. 중간관리자 PM 지정
2. PM에게 알림 생성
3. PM 프로젝트 접근
4. PM 작업자 선택
5. 선택 가능한 작업자 필터링
6. TaskCard 작성
7. 작업자별 소요일정 작성
8. 일정 preview
9. 충돌/과부하 경고
10. 임시저장
11. 승인 요청
12. ApprovalRequest 생성
13. 중간관리자 승인 화면
14. 승인 전 공식 일정 미반영
15. 승인 처리
16. 반려 처리
17. 반려 후 재작성
18. 승인 후 통합 일정표 반영
19. 승인 후 작업자 내 업무 반영
20. 알림 생성
21. AuditLog 생성
22. JSON Export 포함
23. JSON Import 복원

## 금지

- 코드 수정 금지

## 완료 보고

```text
[Plan 25 / Phase 268 완료 보고]
- Workflow Gap Matrix 경로:
- S1 Critical:
- S2 Major:
- S3 Minor:
- 이번 Plan에서 수정할 범위:
- 다음 Phase 진행 승인 요청
```

---

# Phase 269 — 데이터 모델 및 상태 전이 설계 확정

## 목표

SchedulePlan, TaskCard, ApprovalRequest, ScheduleAssignment의 상태 전이를 확정한다.

## 작업

1. 기존 타입과 store 구조 확인
2. 새 필드 추가가 필요한지 결정
3. 가능한 경우 기존 타입 확장으로 처리
4. 상태 전이 정의

필수 상태 전이:

```text
PM_ASSIGNED
→ SCHEDULE_DRAFTING
→ SCHEDULE_PENDING_APPROVAL
→ SCHEDULE_APPROVED
→ IN_PROGRESS
```

반려:

```text
SCHEDULE_PENDING_APPROVAL
→ SCHEDULE_REJECTED
→ SCHEDULE_DRAFTING
→ SCHEDULE_PENDING_APPROVAL
```

차단:

```text
PM 미지정 → PM schedule draft 생성 불가
작업자 없음 → 승인 요청 불가
일정 없음 → 승인 요청 불가
승인 전 → 공식 일정표 반영 불가
반려 상태 → 작업 진행 불가
```

## 금지

- 코드 수정 금지

## 완료 보고

```text
[Plan 25 / Phase 269 완료 보고]
- 확정한 데이터 모델:
- 상태 전이표:
- 차단 규칙:
- 기존 코드 영향 범위:
- 다음 Phase 진행 승인 요청
```

---

# Phase 270 — PM Schedule Planner UI 설계

## 목표

PM이 실제로 작업자와 소요일정을 작성할 수 있는 UI를 설계한다.

## 작업

1. 프로젝트 상세 모달의 action 위치 설계
2. `PmDispatchModal` 유지/확장 또는 신규 `PmSchedulePlannerModal` 결정
3. 작업자 선택 UI 설계
4. TaskCard row editor 설계
5. 일정 preview UI 설계
6. 충돌/과부하 표시 설계
7. 임시저장/승인요청 버튼 설계
8. 모바일/작은 화면 대응 설계

## 금지

- 코드 수정 금지

## 완료 보고

```text
[Plan 25 / Phase 270 완료 보고]
- 선택한 UI 구현 방식:
- 주요 컴포넌트 구조:
- 사용자 플로우:
- 다음 Phase 진행 승인 요청
```

---

# Phase 271 — 중간관리자 Schedule Approval UI 설계

## 목표

중간관리자가 PM 제출 일정을 검토·승인·반려할 수 있는 화면을 설계한다.

## 작업

1. 기존 `/approvals`와 연결할지 프로젝트 상세의 승인 탭과 연결할지 결정
2. 승인 상세 모달 설계
3. 직원별 일정 preview 설계
4. 충돌/과부하 경고 표시 설계
5. 반려 사유 입력 설계
6. 승인 후 반영 범위 설계

## 금지

- 코드 수정 금지

## 완료 보고

```text
[Plan 25 / Phase 271 완료 보고]
- 승인 UI 위치:
- 승인 상세 정보:
- 반려 UX:
- 다음 Phase 진행 승인 요청
```

---

# Phase 272 — Store/Action 구현 1차: SchedulePlan Draft

## 목표

PM이 작성한 작업자/소요일정을 draft로 저장할 수 있게 한다.

## 작업

1. scheduleStore 또는 projectStore에 schedule plan draft action 추가
2. TaskCard draft 생성 action 추가
3. 작업자 선택 저장
4. 시작일/종료일/소요시간 저장
5. draft 상태에서는 공식 일정표에 반영하지 않도록 selector 분리
6. AuditLog 생성

## 완료 조건

- PM이 draft 저장 가능
- draft가 localStorage/Zustand에 유지
- 공식 일정표에는 승인 전 반영되지 않음
- AuditLog 생성

## 완료 보고

```text
[Plan 25 / Phase 272 완료 보고]
- 수정 파일:
- 추가 action:
- draft 저장 검증:
- 공식 일정 미반영 검증:
- lint/build 결과:
- 다음 Phase 진행 승인 요청
```

---

# Phase 273 — PM Schedule Planner UI 구현

## 목표

PM이 실제로 작업자를 선택하고 일정 draft를 작성할 수 있게 한다.

## 작업

1. 프로젝트 상세 모달 상단 action 추가
2. PM Schedule Planner 모달 구현/확장
3. 작업자 검색/선택 UI 구현
4. TaskCard row 추가/삭제/수정 UI 구현
5. 날짜/소요시간 입력 UI 구현
6. validation 추가
7. 저장/취소 버튼 구현
8. 권한 없는 사용자 접근 차단

## 완료 조건

- 지정된 PM이 작업자 선택 가능
- 작업자 1명 이상 선택 가능
- TaskCard 1개 이상 작성 가능
- 시작일/종료일 입력 가능
- 필수값 누락 시 승인 요청 불가
- 중간관리자/SUPER_ADMIN은 디버그/대리 작성 가능 여부 명확히 표시

## 완료 보고

```text
[Plan 25 / Phase 273 완료 보고]
- 수정 파일:
- 구현 UI:
- 작업자 선택 테스트:
- 일정 draft 작성 테스트:
- 권한 차단 테스트:
- lint/build 결과:
- 다음 Phase 진행 승인 요청
```

---

# Phase 274 — 일정 Preview 및 충돌/부하 경고 구현

## 목표

PM이 승인 요청 전 작업자 일정 충돌과 부하를 확인할 수 있게 한다.

## 작업

1. 선택 작업자의 기존 일정 조회
2. draft 일정과 기존 일정 비교
3. 동일 날짜 중복 경고
4. 하루 기준 8시간 초과 경고
5. 승인 요청 전 경고 표시
6. 경고가 있어도 제출 가능할지, manager approval에서 판단하게 할지 정책 적용
7. 일정 preview grid 또는 list 구현

## 완료 보고

```text
[Plan 25 / Phase 274 완료 보고]
- 충돌 감지 방식:
- 과부하 기준:
- preview UI:
- 테스트 결과:
- lint/build 결과:
- 다음 Phase 진행 승인 요청
```

---

# Phase 275 — 승인 요청 생성 구현

## 목표

PM이 작성한 draft를 중간관리자 승인 요청으로 제출할 수 있게 한다.

## 작업

1. [중간관리자 승인 요청] 버튼 구현
2. SchedulePlan status `PENDING_APPROVAL` 전환
3. ApprovalRequest type `SCHEDULE_APPROVAL` 생성
4. Project status `SCHEDULE_PENDING_APPROVAL` 전환
5. 중간관리자 Notification 생성
6. AuditLog 생성
7. 승인 요청 후 PM 임의 수정 제한 또는 요청 취소 후 수정 정책 적용
8. 승인 전 공식 일정 미반영 확인

## 완료 보고

```text
[Plan 25 / Phase 275 완료 보고]
- 수정 파일:
- ApprovalRequest 생성 결과:
- Notification 결과:
- AuditLog 결과:
- 승인 전 공식 일정 미반영 검증:
- lint/build 결과:
- 다음 Phase 진행 승인 요청
```

---

# Phase 276 — 중간관리자 승인 상세 UI 구현

## 목표

중간관리자가 PM 제출 일정을 검토할 수 있게 한다.

## 작업

1. `/approvals` 또는 프로젝트 상세 `승인/신청` 탭에 schedule approval item 표시
2. 승인 상세 모달 구현
3. PM, 작업자, 업무, 일정, 소요시간 표시
4. 일정 preview 표시
5. 충돌/과부하 경고 표시
6. [승인] [반려] 버튼 구현
7. 반려 사유 필수 validation

## 완료 보고

```text
[Plan 25 / Phase 276 완료 보고]
- 승인 UI 위치:
- 검토 정보 표시:
- 승인 버튼:
- 반려 버튼:
- 권한 테스트:
- lint/build 결과:
- 다음 Phase 진행 승인 요청
```

---

# Phase 277 — 승인 처리 및 공식 일정 반영 구현

## 목표

중간관리자 승인 후에만 직원 일정표와 작업자 업무에 공식 반영한다.

## 작업

1. ApprovalRequest `APPROVED`
2. SchedulePlan `APPROVED`
3. TaskCard `APPROVED`
4. ScheduleAssignment 또는 TaskWorkSegment 생성/확정
5. Project status `SCHEDULE_APPROVED` 또는 `IN_PROGRESS`
6. 통합 일정표 반영
7. 작업자 내 업무 반영
8. 작업자 Notification 생성
9. PM Notification 생성
10. AuditLog 생성

## 완료 조건

- 승인 전에는 일정표에 공식 업무 없음
- 승인 후 일정표에 공식 업무 표시
- 승인 후 작업자 내 업무 표시
- 승인 중복 처리 방지

## 완료 보고

```text
[Plan 25 / Phase 277 완료 보고]
- 승인 처리 action:
- 생성/확정된 일정 데이터:
- 통합 일정표 반영:
- 작업자 내 업무 반영:
- 중복 승인 방지:
- lint/build 결과:
- 다음 Phase 진행 승인 요청
```

---

# Phase 278 — 반려 처리 및 재작성 구현

## 목표

중간관리자가 반려하고 PM이 수정 후 재요청할 수 있게 한다.

## 작업

1. 반려 사유 필수
2. ApprovalRequest `REJECTED`
3. SchedulePlan `REJECTED`
4. Project status `SCHEDULE_REJECTED`
5. TaskCard draft 상태 유지 또는 rejected 표시
6. PM Notification 생성
7. AuditLog 생성
8. PM이 반려 사유 확인
9. PM이 일정 수정 후 재요청 가능
10. 재요청 시 새 ApprovalRequest 또는 기존 revision 정책 적용

## 완료 보고

```text
[Plan 25 / Phase 278 완료 보고]
- 반려 처리:
- 반려 사유 저장:
- PM 재작성 UI:
- 재요청 테스트:
- lint/build 결과:
- 다음 Phase 진행 승인 요청
```

---

# Phase 279 — 착수 전 → 진행 중 전환 차단/연결 보정

## 목표

승인 workflow를 거치지 않고 프로젝트가 진행 중으로 넘어가는 경로를 차단한다.

## 작업

1. 보드 drag/drop 상태 전이 재검토
2. `PRE_WORK → IN_PROGRESS` 직접 변경 차단
3. PM 미지정 시 PM 지정 안내
4. PM 지정 및 schedule draft 없음이면 PM Schedule Planner 열기
5. SchedulePlan 승인 전이면 이동 차단
6. 승인 완료 후에만 진행 중 이동 허용
7. Store level guard와 UI level guard 이중 적용
8. 사용자에게 명확한 안내 toast/alert 표시

## 완료 보고

```text
[Plan 25 / Phase 279 완료 보고]
- 차단한 우회 경로:
- Store guard:
- UI guard:
- 테스트 결과:
- lint/build 결과:
- 다음 Phase 진행 승인 요청
```

---

# Phase 280 — 권한별 접근 제어 및 작업자 필터링 구현

## 목표

PM이 부적절한 작업자를 선택하거나 권한 없는 사용자가 일정 승인/변경하지 못하게 한다.

## 작업

1. 작업자 선택 후보 필터
   - active user
   - WORKER 또는 작업 가능 role
   - 관련 부서/파트
   - 프로젝트 회사/부서 조건
2. SUPER_ADMIN override 여부 표시
3. DEPARTMENT_MANAGER 권한 범위 제한
4. PM은 본인 프로젝트만 수정
5. WORKER는 공식 승인된 본인 업무만 공식 업무로 표시
6. 권한 없는 승인 버튼 숨김/차단

## 완료 보고

```text
[Plan 25 / Phase 280 완료 보고]
- 작업자 후보 필터:
- role별 접근 테스트:
- 차단 테스트:
- lint/build 결과:
- 다음 Phase 진행 승인 요청
```

---

# Phase 281 — JSON Export/Import Workflow 데이터 포함

## 목표

PM schedule draft, approval, schedule assignment가 JSON handoff에 포함되게 한다.

## 작업

1. JSON Export schema 점검
2. SchedulePlan 포함
3. draft TaskCard 포함
4. ApprovalRequest 포함
5. ScheduleAssignment/TaskWorkSegment 포함
6. Notification/AuditLog 포함
7. JSON Import 시 round-trip 복원
8. schemaVersion 증가 여부 검토

## 완료 보고

```text
[Plan 25 / Phase 281 완료 보고]
- export 포함 데이터:
- import 복원 결과:
- schemaVersion:
- round-trip 테스트:
- lint/build 결과:
- 다음 Phase 진행 승인 요청
```

---

# Phase 282 — 알림 및 AuditLog 검증

## 목표

각 핵심 action이 기록과 알림을 남기는지 검증한다.

## 검증 대상

1. PM 배정
2. schedule draft 저장
3. 승인 요청
4. 중간관리자 승인
5. 중간관리자 반려
6. PM 재요청
7. 공식 일정 반영
8. 작업자 업무 생성
9. 우회 시도 차단

## 완료 보고

```text
[Plan 25 / Phase 282 완료 보고]
- Notification 생성 결과:
- AuditLog 생성 결과:
- 누락 항목:
- 수정 여부:
- lint/build 결과:
- 다음 Phase 진행 승인 요청
```

---

# Phase 283 — End-to-End 시나리오 QA 1: 외부 수주 프로젝트

## 목표

외부 수주 프로젝트 기준 전체 workflow를 검증한다.

## 시나리오

1. 수주 프로젝트 생성
2. 중간관리자 PM 지정
3. PM 계정으로 전환
4. PM 작업자 2명 선택
5. 업무카드 2개 생성
6. 소요일정 작성
7. 승인 요청
8. 중간관리자 반려
9. PM 수정 후 재요청
10. 중간관리자 승인
11. 통합 일정표 확인
12. 작업자 내 업무 확인
13. 알림 확인
14. AuditLog 확인
15. JSON Export 확인

## 완료 보고

```text
[Plan 25 / Phase 283 완료 보고]
- 외부 수주 E2E 결과:
- PASS/PARTIAL/FAIL:
- 발견 이슈:
- 다음 Phase 진행 승인 요청
```

---

# Phase 284 — End-to-End 시나리오 QA 2: 개발팀 업무

## 목표

내부 개발팀 업무 기준 전체 workflow를 검증한다.

## 시나리오

1. 개발팀 업무 생성
2. 중간관리자 또는 최고관리자 PM 지정
3. PM 작업자 선택
4. 목표일 기준 소요일정 작성
5. 승인 요청
6. 중간관리자 승인
7. 개발팀 작업 보드 반영
8. 통합 일정표 반영
9. 작업자 내 업무 반영
10. JSON Export/Import 확인

## 완료 보고

```text
[Plan 25 / Phase 284 완료 보고]
- 개발팀 업무 E2E 결과:
- PASS/PARTIAL/FAIL:
- 발견 이슈:
- 다음 Phase 진행 승인 요청
```

---

# Phase 285 — UI/UX 실사용 품질 보정

## 목표

기능은 동작하지만 사용자가 찾기 어려운 부분을 보정한다.

## 개선 후보

1. 프로젝트 상세 `개요` 탭에 다음 상태별 CTA 표시
   - PM 지정 필요
   - 작업자/일정 배정 필요
   - 승인 요청 필요
   - 승인 대기
   - 반려됨
   - 승인 완료
2. `승인/신청` 탭에 schedule approval 상태 표시
3. `세부 작업내역` 탭에 draft/approved 구분 배지 표시
4. 일정표에 승인대기 preview toggle 제공
5. 작업자 선택이 없는 경우 empty state 문구 개선
6. PM이 아닌 사용자가 접근했을 때 이유 설명

## 완료 보고

```text
[Plan 25 / Phase 285 완료 보고]
- 보정한 UI:
- 사용자 시나리오 개선점:
- lint/build 결과:
- 다음 Phase 진행 승인 요청
```

---

# Phase 286 — 회귀 테스트

## 목표

Plan 25 수정으로 기존 기능이 깨지지 않았는지 확인한다.

## 검증 항목

1. 대시보드
2. 수주/개발 관리 기본 탭
3. 프로젝트 보드
4. 프로젝트 상세 모달
5. 기존 완료/검수 workflow
6. 통합 일정표
7. 결재/수정 내역
8. 알림 센터
9. 인사카드
10. JSON Export/Import
11. KOR/VIET 토글
12. Sidebar overlay
13. 권한 전환

## 완료 보고

```text
[Plan 25 / Phase 286 완료 보고]
- PASS:
- PARTIAL:
- FAIL:
- 회귀 발생 여부:
- 다음 Phase 진행 승인 요청
```

---

# Phase 287 — Lint / Typecheck / Build

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
[Plan 25 / Phase 287 완료 보고]
- lint:
- typecheck:
- build:
- runtime:
- route refresh:
- 다음 Phase 진행 승인 요청
```

---

# Phase 288 — Plan 25 최종 리포트 작성

## 목표

실제 수정 결과와 남은 리스크를 문서화한다.

## 산출물

```text
qa/plan25/reports/PLAN25_PM_SCHEDULE_APPROVAL_WORKFLOW_REPORT.md
```

## 포함 항목

1. 수정 배경
2. 사용자 스크린샷 기준 문제
3. 리포트 주장과 실제 반영 차이
4. 수정 파일
5. 구현 workflow
6. 권한별 동작
7. 승인 전/후 일정 반영 기준
8. E2E QA 결과
9. JSON round-trip 결과
10. 남은 이슈
11. push 전 사용자 승인 필요 문구

## 완료 보고

```text
[Plan 25 / Phase 288 완료 보고]
- 최종 리포트 경로:
- 주요 수정 결과:
- 남은 이슈:
- Git commit 가능 여부:
- 다음 Phase 진행 승인 요청
```

---

# Phase 289 — Git Commit 및 Push 승인 요청

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
[Plan 25 / Phase 289 승인 요청]
- commit 대상 파일:
- commit message:
- push 대상 branch:
- 승인 전에는 commit/push하지 않겠습니다.
```

---

## 7. 최종 완료 기준

Plan 25는 다음 조건을 모두 만족해야 완료된다.

1. 프로젝트 생성 후 중간관리자가 PM을 지정할 수 있다.
2. PM 지정 후 해당 PM에게 알림이 생성된다.
3. PM은 본인 프로젝트 상세에서 작업자/일정 배정 화면을 열 수 있다.
4. PM은 함께 일할 작업자를 선택할 수 있다.
5. PM은 작업자별 업무카드와 시작일/종료일/예상 소요시간을 작성할 수 있다.
6. PM은 일정 초안을 임시저장할 수 있다.
7. 승인 전 일정은 공식 직원 일정표에 반영되지 않는다.
8. PM은 중간관리자에게 일정 승인 요청을 보낼 수 있다.
9. 중간관리자는 PM 제출 일정을 보고 승인/반려할 수 있다.
10. 중간관리자는 승인 전 직원 부하와 일정 충돌을 확인할 수 있다.
11. 반려 시 사유가 저장되고 PM이 수정 후 재요청할 수 있다.
12. 승인 시 직원별 공식 일정과 작업자 내 업무에 반영된다.
13. 승인 시 작업자에게 알림이 생성된다.
14. 승인/반려/재요청/공식 반영이 AuditLog에 기록된다.
15. PM 업무 하달 없이 `착수 전 → 진행 중`으로 우회할 수 없다.
16. 권한 없는 사용자가 작업자 배정 또는 승인할 수 없다.
17. JSON Export/Import에 관련 데이터가 포함되고 round-trip이 된다.
18. 외부 수주 프로젝트 E2E가 통과한다.
19. 개발팀 업무 E2E가 통과한다.
20. lint/typecheck/build가 통과한다.
21. 최종 리포트가 실제 결과 기준으로 작성된다.
22. 사용자 승인 전 원격 push하지 않는다.

---

## 8. Antigravity 실행 시작 문구

아래 문구를 그대로 Antigravity에 입력하라.

```text
현재 F:\workspace 프로젝트의 Plan 25 작업을 시작한다.

중요 전제:
- Plan 단계는 뒤로 갈수록 최신 요구사항이 우선이다.
- Plan 25는 PM 작업자 호출·소요일정 작성·중간관리자 승인 후 공식 일정 반영 workflow 복구 전용 Plan이다.
- 리포트에 완료라고 적혀 있어도 실제 화면에서 사용자가 수행할 수 없으면 미완료로 본다.
- 현재 프로젝트는 생성되지만, 프로젝트 상세에서 PM이 함께 일할 직원을 명확히 선택하고 소요일정을 작성하는 흐름이 부족하다.
- 중간관리자가 PM을 지정하고, 지정된 PM은 원하는 작업자를 선택하고, 작업자별 업무카드와 소요일정을 작성할 수 있어야 한다.
- PM이 작성한 소요일정은 즉시 공식 일정으로 반영하지 말고, 중간관리자 승인 대기 상태로 저장해야 한다.
- 중간관리자가 승인해야만 전체 직원 일정표와 작업자 내 업무에 공식 반영되어야 한다.
- 반려 시 반려 사유를 저장하고 PM이 수정 후 재요청할 수 있어야 한다.
- 승인/반려/재요청/공식 일정 반영은 Notification과 AuditLog를 남겨야 한다.
- JSON Export/Import에는 SchedulePlan, TaskCard draft, ApprovalRequest, ScheduleAssignment/TaskWorkSegment, Notification, AuditLog가 포함되어야 한다.
- 각 Phase 시작 전 반드시 사용자에게 승인 요청을 하라.
- 사용자 승인 없이 Phase를 시작하지 마라.
- 사용자 승인 없이 다음 Phase로 넘어가지 마라.
- 사용자 승인 없이 GitHub 원격 push하지 마라.

먼저 Phase 267만 진행한다.
Phase 267에서는 코드 수정 금지, UI 수정 금지, store 수정 금지, JSON 기능 수정 금지, 현황 조사와 baseline 작성만 수행한다.

먼저 [Plan 25 / Phase 267 시작 승인 요청]만 작성하라.
아직 Phase 267을 실행하지 마라.
```
