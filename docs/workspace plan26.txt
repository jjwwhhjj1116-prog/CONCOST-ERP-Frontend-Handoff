# WORKSPACE PLAN 26 — 작업 가능 인력 추천, 승인 전후 일정 비교, 반려 후 PM 재작성·재승인 Workflow 고도화 프롬프트

이 프롬프트는 기존 `workspace plan1`부터 `workspace plan25` 이후에 추가되는 스물여섯 번째 보강 지시사항이다.

Plan 26의 목적은 Plan 25에서 구현 완료된 PM 작업자 배정·소요일정 작성·중간관리자 승인 workflow를 실제 운영 수준으로 고도화하는 것이다.

이번 Plan 26은 다음 세 가지를 핵심으로 한다.

1. PM이 작업자를 선택할 때 **작업 가능 인력 추천**을 받을 수 있게 한다.
2. 중간관리자가 PM 제출 일정을 승인하기 전에 **기존 일정과 신규 요청 일정의 차이**를 비교할 수 있게 한다.
3. 중간관리자가 일정을 반려하면 PM이 반려 사유를 확인하고, 일정을 다시 작성한 뒤 중간관리자에게 **재승인 요청**할 수 있게 한다.

Plan 26은 신규 대형 시스템을 무리하게 추가하는 것이 아니라, Plan 25 workflow를 안정화하고 운영자가 실제로 판단할 수 있는 화면과 데이터 구조를 보강하는 Plan이다.

---

## 0. 핵심 운영 흐름

Plan 26에서 반드시 보장해야 하는 흐름은 다음이다.

```text
중간관리자 PM 지정
→ PM 작업자/소요일정 작성
→ 시스템이 작업 가능 인력 추천 및 충돌/부하 경고 표시
→ PM 승인 요청
→ 중간관리자가 기존 일정과 요청 일정을 비교 검토
→ 승인 또는 반려
→ 승인 시 공식 직원 일정표 반영
→ 반려 시 반려 사유 저장 및 PM 알림
→ PM이 반려 사유 확인
→ PM이 기존 요청안을 수정하거나 새 일정안 작성
→ PM 재승인 요청
→ 중간관리자 재검토
→ 최종 승인 시 공식 직원 일정표 반영
```

---

## 1. 가장 중요한 원칙

Antigravity는 아래 원칙을 반드시 지켜라.

1. Plan 단계는 뒤로 갈수록 최신 요구사항이 우선이다.
2. Plan 25는 이미 진행 완료된 것으로 간주한다.
3. Plan 26은 Plan 25 workflow를 대체하지 않고 고도화한다.
4. Plan 26에서는 PM 작업자 선택, 일정 승인, 반려, 재요청 흐름을 실제 화면에서 다시 검증한다.
5. 리포트에 완료라고 적혀 있어도 실제 화면에서 사용자가 수행할 수 없으면 미완료로 본다.
6. 작업 가능 인력 추천은 “자동 배정”이 아니라 “PM 판단을 돕는 추천”이다.
7. 시스템이 추천한 작업자를 PM에게 강제 배정하지 마라.
8. 승인 전 일정은 공식 일정표에 반영하지 마라.
9. 승인 전 일정은 관리자/PM preview에서만 승인대기 일정으로 표시한다.
10. 중간관리자가 반려한 일정은 공식 일정표에 반영하지 마라.
11. 반려 사유는 필수이며, PM이 재작성 시 반드시 확인할 수 있어야 한다.
12. PM이 재승인 요청하면 이전 반려 이력과 새 요청 이력을 모두 남겨라.
13. 재요청 이력은 삭제하거나 덮어쓰지 말고 version 또는 revision으로 관리하라.
14. 승인/반려/재요청/일정 공식 반영은 Notification과 AuditLog를 남겨라.
15. JSON Export/Import에는 추천 결과 자체보다 추천 근거와 최종 선택/승인/반려/재요청 이력이 보존되어야 한다.
16. 각 Phase 시작 전 반드시 사용자에게 승인 요청을 하라.
17. 사용자 승인 없이 Phase를 시작하지 마라.
18. 사용자 승인 없이 다음 Phase로 넘어가지 마라.
19. 사용자 승인 없이 GitHub 원격 push하지 마라.
20. 먼저 분석하고, 그 다음 설계하고, 그 다음 작은 단위로 구현하라.

---

## 2. Plan 26 핵심 추가 기능

### 2-1. 작업 가능 인력 추천

PM이 프로젝트에 작업자를 배정할 때, 단순 사원 목록이 아니라 다음 정보를 함께 제공한다.

```text
추천 기준:
- 활성 상태 ACTIVE 직원
- 프로젝트 회사/부서/파트와 관련 있는 직원
- 해당 기간에 업무가 적은 직원
- 같은 날짜 일정 충돌이 없는 직원
- 하루 기준 8시간 이하로 배정 가능한 직원
- 휴가/Off/부재중이 아닌 직원
- 동일 프로젝트 또는 유사 Scope 경험이 있는 직원
- PM이 최근 자주 배정한 직원
```

추천 점수는 처음부터 복잡한 AI 방식으로 구현하지 않는다.  
MVP는 명확한 규칙 기반 점수로 구현한다.

```text
recommendationScore 예시:
기본점수 100
- 비활성 직원: 제외
- 기간 중 휴가/Off: 제외 또는 -100
- 같은 날짜 충돌: -40
- 일일 8시간 초과 예상: -30
- 같은 부서/파트: +20
- 같은 회사/조직: +10
- 유사 Scope 경험: +15
- 현재 주간 부하 낮음: +20
```

추천 결과에는 반드시 “왜 추천됐는지 / 왜 경고인지”를 표시한다.

```text
표시 예시:
- 추천: 일정 여유 있음, 같은 구조팀, 유사 Scope 경험 있음
- 주의: 7월 15일 8시간 초과 예상
- 제외: 휴가 등록됨
- 제외: 비활성 사원
```

---

### 2-2. 승인 전후 일정 비교표

중간관리자가 PM 제출 일정을 승인할 때, 단순 리스트가 아니라 비교표를 본다.

```text
비교 대상:
- 현재 공식 일정
- PM이 새로 제출한 승인대기 일정
- 기존 일정 대비 추가되는 업무량
- 충돌 발생 여부
- 직원별 일별 투입시간 변화
- 납품일/목표일에 미치는 영향
- 이전 반려안과 재제출안의 차이
```

비교 UI는 다음을 포함한다.

```text
1. 프로젝트 요약
2. PM 정보
3. 작업자별 요청 일정
4. 기존 공식 일정
5. 승인대기 일정
6. 변경 전후 차이
7. 충돌/과부하 경고
8. 반려 사유 입력
9. 승인 버튼
10. 반려 버튼
```

---

### 2-3. 승인대기 일정 Preview

공식 일정표에는 승인된 일정만 보여주는 것이 기본이다.  
단, PM/중간관리자/최고관리자는 검토를 위해 승인대기 일정을 preview로 볼 수 있어야 한다.

```text
일정표 토글:
- 공식 일정만 보기
- 승인대기 일정 포함
- 반려 일정 포함
```

표시 기준:

```text
공식 일정:
- 일반 업무 블록
- 승인 완료 배지

승인대기 일정:
- 점선 또는 연한 배경
- 승인대기 배지
- PM/중간관리자/SUPER_ADMIN만 표시

반려 일정:
- 공식 일정표에는 기본 숨김
- PM/중간관리자 preview에서만 반려됨 배지로 표시
```

---

### 2-4. 반려 후 PM 재작성·재승인 요청

중간관리자가 반려하면 workflow가 끝나면 안 된다.  
PM이 다시 작성해서 재승인 요청할 수 있어야 한다.

필수 흐름:

```text
중간관리자 반려
→ rejectionReason 필수 입력
→ SchedulePlan.status = REJECTED
→ ApprovalRequest.status = REJECTED
→ PM Notification 생성
→ PM이 프로젝트 상세에서 반려 사유 확인
→ PM이 반려된 일정안을 복사하여 수정
→ 새 revisionNo 생성
→ 수정된 일정으로 재승인 요청
→ 새 ApprovalRequest 생성 또는 기존 요청 revision 연결
→ 중간관리자 재검토
```

반드시 보존할 이력:

```text
- 최초 제출안 v1
- 반려 사유
- 반려자
- 반려 시각
- PM 수정안 v2
- 재요청 시각
- 최종 승인 또는 재반려 이력
```

---

## 3. 데이터 모델 보강 제안

기존 타입을 무너뜨리지 말고, 필요한 필드만 추가한다.

### 3-1. WorkerRecommendation

```ts
interface WorkerRecommendation {
  workerId: string
  projectId: string
  schedulePlanId?: string
  score: number
  status: "RECOMMENDED" | "WARNING" | "EXCLUDED"
  reasons: string[]
  warnings: string[]
  conflicts: {
    date: string
    type: "OVERLOAD" | "DUPLICATE_ASSIGNMENT" | "OFF_DAY" | "LEAVE" | "ROLE_MISMATCH"
    message: string
  }[]
}
```

### 3-2. SchedulePlan version fields

```ts
interface SchedulePlan {
  id: string
  projectId: string
  pmId: string
  managerId: string
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "CANCELLED"
  revisionNo: number
  previousSchedulePlanId?: string
  parentSchedulePlanId?: string
  rejectionReason?: string
  resubmissionReason?: string
  submittedAt?: string
  reviewedAt?: string
  reviewedBy?: string
  versionHistory?: SchedulePlanVersion[]
}
```

### 3-3. SchedulePlanVersion

```ts
interface SchedulePlanVersion {
  id: string
  schedulePlanId: string
  revisionNo: number
  status: "SUBMITTED" | "REJECTED" | "RESUBMITTED" | "APPROVED"
  snapshot: unknown
  reason?: string
  actorId: string
  createdAt: string
}
```

### 3-4. ApprovalRequest 보강

```ts
interface ApprovalRequest {
  id: string
  type: "SCHEDULE_APPROVAL"
  projectId: string
  schedulePlanId: string
  revisionNo: number
  requestedBy: string
  managerId: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  rejectionReason?: string
  reviewComment?: string
  previousApprovalRequestId?: string
  createdAt: string
  reviewedAt?: string
}
```

---

## 4. Phase 구성

아래 Phase는 반드시 순서대로 진행한다.  
각 Phase 시작 전 사용자 승인을 받아야 한다.  
사용자가 승인하기 전에는 다음 Phase를 시작하지 않는다.

---

# Phase 290 — Plan 25 결과 및 Plan 26 적용 범위 조사

## 목표

Plan 25에서 실제로 구현된 workflow를 확인하고, Plan 26에서 고도화할 범위를 확정한다.

## 작업

1. Plan 25 최종 리포트 확인
2. 현재 코드에서 다음 기능 확인
   - PM 작업자 선택
   - 일정 draft 저장
   - 승인 요청
   - 중간관리자 승인
   - 중간관리자 반려
   - PM 재작성/재요청
   - 공식 일정 반영
3. 현재 화면에서 실제 E2E 재현
4. 누락/부분 구현 항목을 기록
5. Plan 26 대상과 제외 대상을 구분

## 금지

- 코드 수정 금지
- UI 수정 금지
- store 수정 금지
- git commit 금지
- git push 금지

## 완료 보고

```text
[Plan 26 / Phase 290 완료 보고]
- Plan 25 검토 결과:
- 실제 구현된 기능:
- 부분 구현 기능:
- 누락 기능:
- Plan 26 수정 대상:
- Plan 26 제외 대상:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 291 — 작업 가능 인력 추천 정책 설계

## 목표

PM 작업자 선택 시 사용할 추천 기준과 점수 정책을 확정한다.

## 작업

1. 현재 인사카드/조직/부서/파트 데이터 확인
2. 일정/휴가/Off/부재중 데이터 확인
3. 현재 공식 일정과 승인대기 일정 조회 방식 확인
4. 추천 점수 산정 기준 설계
5. 추천 제외 조건 설계
6. 경고 조건 설계
7. 추천 결과 UI 표시 방식 설계

## 금지

- 코드 수정 금지

## 완료 보고

```text
[Plan 26 / Phase 291 완료 보고]
- 추천 점수 정책:
- 제외 조건:
- 경고 조건:
- 표시 방식:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 292 — 승인 전후 일정 비교 정책 설계

## 목표

중간관리자 승인 화면에 표시할 기존 일정 vs 요청 일정 비교 기준을 확정한다.

## 작업

1. 공식 일정 조회 방식 확인
2. 승인대기 일정 조회 방식 확인
3. 작업자별 일별 투입시간 계산 방식 설계
4. 충돌/과부하 계산 방식 설계
5. 기존 일정 대비 변화량 표시 방식 설계
6. 재제출안의 이전 반려안 대비 변경점 표시 방식 설계

## 금지

- 코드 수정 금지

## 완료 보고

```text
[Plan 26 / Phase 292 완료 보고]
- 비교 데이터:
- 비교 UI:
- 변경점 계산 방식:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 293 — 반려 후 재작성·재승인 상태 전이 설계

## 목표

중간관리자 반려 후 PM 재작성·재승인 요청 상태 전이를 확정한다.

## 작업

1. 현재 반려 action 확인
2. rejectionReason 저장 여부 확인
3. PM에게 반려 알림이 가는지 확인
4. PM이 반려된 일정을 수정할 수 있는지 확인
5. revisionNo 또는 previousSchedulePlanId 정책 확정
6. 재요청 시 ApprovalRequest 생성 정책 확정
7. 이력 보존 방식 확정

## 금지

- 코드 수정 금지

## 완료 보고

```text
[Plan 26 / Phase 293 완료 보고]
- 반려 상태 전이:
- 재작성 상태 전이:
- revision 정책:
- ApprovalRequest 재요청 정책:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 294 — Worker Recommendation Selector/Service 구현

## 목표

PM 작업자 선택 화면에서 사용할 작업 가능 인력 추천 계산 로직을 구현한다.

## 작업

1. 활성 직원 필터 구현
2. 회사/부서/파트 필터 구현
3. 일정 충돌 계산
4. 일별 8시간 초과 계산
5. 휴가/Off/부재중 제외 또는 경고
6. 추천 점수 계산
7. 추천 사유/reason 생성
8. 경고/warning 생성
9. unit-level 테스트 또는 최소 함수 테스트 작성

## 완료 조건

- 추천 가능한 직원 목록이 나온다.
- 제외 직원은 제외 사유가 표시된다.
- 경고 직원은 경고 사유가 표시된다.
- 점수 기준 정렬이 가능하다.

## 완료 보고

```text
[Plan 26 / Phase 294 완료 보고]
- 수정 파일:
- 추천 로직:
- 점수 정책:
- 테스트 결과:
- lint/build 결과:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 295 — PM Schedule Planner에 작업자 추천 UI 연결

## 목표

PM이 작업자를 선택할 때 추천/주의/제외 정보를 바로 볼 수 있게 한다.

## 작업

1. PM Schedule Planner 작업자 선택 영역 수정
2. 추천순 정렬 추가
3. 검색/부서/파트 필터와 추천 점수 결합
4. 추천 사유 표시
5. 경고 배지 표시
6. 제외 직원 표시 정책 적용
7. PM이 경고가 있는 직원을 선택할 수 있는지 정책 적용
8. 선택 시 일정 preview에 반영

## 완료 보고

```text
[Plan 26 / Phase 295 완료 보고]
- UI 수정 파일:
- 추천 표시 방식:
- 선택 테스트:
- 경고 직원 선택 정책:
- lint/build 결과:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 296 — Schedule Comparison Service 구현

## 목표

기존 공식 일정과 PM 요청 일정을 비교하는 로직을 구현한다.

## 작업

1. 공식 일정 수집
2. 승인대기 일정 수집
3. 직원별 날짜별 업무량 계산
4. 기존 대비 추가/감소 업무량 계산
5. 충돌/과부하 계산
6. 이전 반려안 대비 수정 차이 계산
7. comparison result type 정의

## 완료 보고

```text
[Plan 26 / Phase 296 완료 보고]
- 수정 파일:
- 비교 로직:
- 계산 결과 예시:
- 테스트 결과:
- lint/build 결과:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 297 — 중간관리자 승인 화면에 일정 비교표 구현

## 목표

중간관리자가 승인/반려 판단에 필요한 정보를 한 화면에서 볼 수 있게 한다.

## 작업

1. `/approvals` 또는 승인 상세 모달에 comparison panel 추가
2. 기존 공식 일정 표시
3. 요청 일정 표시
4. 차이 표시
5. 직원별 부하 표시
6. 충돌/과부하 경고 표시
7. 이전 반려안 대비 변경점 표시
8. 승인/반려 버튼 위치 재정리
9. 반려 사유 입력 UX 강화

## 완료 보고

```text
[Plan 26 / Phase 297 완료 보고]
- UI 수정 파일:
- 비교표 표시:
- 충돌 표시:
- 반려 사유 UX:
- lint/build 결과:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 298 — 반려 처리 보강: rejectionReason, version history, PM 알림

## 목표

중간관리자 반려 시 PM이 재작성할 수 있는 충분한 정보를 남긴다.

## 작업

1. 반려 사유 필수 validation
2. reviewedBy 저장
3. reviewedAt 저장
4. SchedulePlan.status = REJECTED
5. ApprovalRequest.status = REJECTED
6. SchedulePlanVersion 생성
7. PM Notification 생성
8. AuditLog 생성
9. 반려된 일정의 공식 일정표 미반영 재검증

## 완료 보고

```text
[Plan 26 / Phase 298 완료 보고]
- 반려 처리 수정 파일:
- 저장되는 반려 정보:
- version history:
- PM 알림:
- 공식 일정 미반영 검증:
- lint/build 결과:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 299 — PM 재작성 UI 구현

## 목표

PM이 반려된 일정의 사유를 확인하고 수정할 수 있게 한다.

## 작업

1. 프로젝트 상세에 반려 상태 CTA 추가
2. 반려 사유 표시
3. 이전 제출안 표시
4. [일정 수정하기] 버튼 추가
5. 기존 반려안을 기반으로 새 draft 생성
6. 작업자/일정/업무 수정 가능
7. 수정 중 version draft 표시
8. 기존 반려 이력은 삭제하지 않음

## 완료 보고

```text
[Plan 26 / Phase 299 완료 보고]
- UI 수정 파일:
- 반려 사유 표시:
- 재작성 화면:
- 기존 이력 보존:
- lint/build 결과:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 300 — PM 재승인 요청 구현

## 목표

PM이 수정한 일정을 다시 중간관리자에게 승인 요청할 수 있게 한다.

## 작업

1. 재요청 버튼 구현
2. revisionNo 증가
3. previousSchedulePlanId 또는 parentSchedulePlanId 연결
4. 새 ApprovalRequest 생성
5. 이전 반려 이력 유지
6. 중간관리자 Notification 생성
7. AuditLog 생성
8. 재요청 후 status = PENDING_APPROVAL
9. 공식 일정표 미반영 유지

## 완료 보고

```text
[Plan 26 / Phase 300 완료 보고]
- 수정 파일:
- revisionNo:
- ApprovalRequest 생성:
- Notification/AuditLog:
- 공식 일정 미반영 검증:
- lint/build 결과:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 301 — 승인대기 일정 Preview Toggle 구현

## 목표

중간관리자와 PM이 승인 전 일정을 preview로 확인할 수 있게 한다.

## 작업

1. 통합 일정표에 preview toggle 추가
2. 공식 일정만 보기
3. 승인대기 일정 포함
4. 반려 일정 포함
5. role별 노출 제한
6. 승인대기/반려 배지 표시
7. 공식 일정과 스타일 구분
8. 작업자는 기본적으로 공식 승인 일정만 표시

## 완료 보고

```text
[Plan 26 / Phase 301 완료 보고]
- 수정 파일:
- preview toggle:
- role별 표시:
- 일정표 표시 검증:
- lint/build 결과:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 302 — JSON Export/Import에 추천·비교·재요청 이력 포함

## 목표

Plan 26에서 추가된 데이터가 JSON Handoff에 포함되게 한다.

## 작업

1. schedulePlan version history 포함
2. rejectionReason 포함
3. resubmissionReason 포함
4. previousSchedulePlanId/parentSchedulePlanId 포함
5. ApprovalRequest revision 정보 포함
6. AuditLog/Notification 포함
7. 추천 결과는 저장 대상인지 재계산 대상인지 결정
8. JSON round-trip 검증

## 원칙

추천 결과는 시점에 따라 달라질 수 있으므로 기본적으로 저장하지 않고 재계산한다.  
단, PM이 실제로 선택한 작업자와 선택 당시 경고/충돌 정보는 AuditLog 또는 SchedulePlan snapshot에 남길 수 있다.

## 완료 보고

```text
[Plan 26 / Phase 302 완료 보고]
- export 포함 데이터:
- import 복원 결과:
- recommendation 저장/재계산 정책:
- round-trip 결과:
- lint/build 결과:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 303 — E2E QA: 최초 승인 성공 시나리오

## 목표

PM이 작업자를 추천받고 일정을 제출한 뒤 중간관리자가 바로 승인하는 흐름을 검증한다.

## 시나리오

1. 프로젝트 생성
2. PM 지정
3. PM 계정 전환
4. 추천 작업자 확인
5. 작업자 선택
6. 일정 작성
7. 승인 요청
8. 중간관리자 계정 전환
9. 비교표 확인
10. 승인
11. 공식 일정표 반영 확인
12. 작업자 내 업무 확인
13. 알림 확인
14. AuditLog 확인
15. JSON Export 확인

## 완료 보고

```text
[Plan 26 / Phase 303 완료 보고]
- E2E 결과:
- PASS/PARTIAL/FAIL:
- 발견 이슈:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 304 — E2E QA: 반려 후 재작성·재승인 성공 시나리오

## 목표

사용자가 추가 요청한 반려 후 재작성·재승인 workflow를 검증한다.

## 시나리오

1. 프로젝트 생성
2. PM 지정
3. PM이 작업자와 소요일정 작성
4. PM 승인 요청
5. 중간관리자가 비교표 확인
6. 중간관리자가 반려 사유 입력 후 반려
7. PM에게 반려 알림 확인
8. PM이 반려 사유 확인
9. PM이 기존 일정을 수정
10. PM이 재승인 요청
11. revisionNo 증가 확인
12. 이전 반려 이력 보존 확인
13. 중간관리자가 재요청 건 검토
14. 변경점 비교 확인
15. 중간관리자 승인
16. 공식 직원 일정표 반영 확인
17. 작업자 내 업무 반영 확인
18. AuditLog 확인
19. JSON Export/Import round-trip 확인

## 완료 보고

```text
[Plan 26 / Phase 304 완료 보고]
- 반려 후 재작성 E2E 결과:
- revision 이력:
- 공식 일정 반영:
- PASS/PARTIAL/FAIL:
- 발견 이슈:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 305 — E2E QA: 승인대기 Preview 및 권한 제한

## 목표

승인대기/반려 일정 preview가 권한에 맞게 보이는지 검증한다.

## 검증 항목

1. SUPER_ADMIN: 전체 preview 가능
2. DEPARTMENT_MANAGER: 본인 부서 preview 가능
3. PM: 본인 프로젝트 preview 가능
4. WORKER: 기본적으로 공식 승인 일정만 표시
5. 승인대기 일정은 공식 일정과 스타일 구분
6. 반려 일정은 preview에서만 표시
7. 승인 후 공식 일정으로 전환

## 완료 보고

```text
[Plan 26 / Phase 305 완료 보고]
- 권한별 preview 결과:
- WORKER 제한 결과:
- 오류:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 306 — UI/UX 실사용 보정

## 목표

작업자 추천, 비교표, 반려/재요청 화면이 실제 사용자가 이해하기 쉽게 보이도록 보정한다.

## 개선 후보

1. 추천 점수 설명 tooltip
2. 충돌/과부하 경고 문구 정리
3. 승인대기 일정 색상/배지 정리
4. 반려 사유 강조
5. 재작성 CTA 위치 개선
6. 승인 화면의 비교표 가독성 개선
7. PM이 다음 액션을 알 수 있는 상태별 안내 문구 추가

## 완료 보고

```text
[Plan 26 / Phase 306 완료 보고]
- 보정한 UI:
- 사용자 흐름 개선:
- lint/build 결과:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 307 — 회귀 테스트

## 목표

Plan 26 수정으로 기존 기능이 깨지지 않았는지 확인한다.

## 검증 항목

1. 대시보드
2. 수주/개발 관리
3. 프로젝트 보드
4. 프로젝트 상세
5. PM Schedule Planner
6. 중간관리자 승인 화면
7. 통합 일정표
8. 결재/수정 내역
9. 알림 센터
10. 인사카드
11. JSON Export/Import
12. KOR/VIET 토글
13. Sidebar overlay
14. Plan 25 기본 workflow

## 완료 보고

```text
[Plan 26 / Phase 307 완료 보고]
- PASS:
- PARTIAL:
- FAIL:
- 회귀 발생 여부:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 308 — Lint / Typecheck / Build

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
[Plan 26 / Phase 308 완료 보고]
- lint:
- typecheck:
- build:
- runtime:
- route refresh:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 309 — Plan 26 최종 리포트 작성

## 목표

Plan 26의 실제 수정 결과와 남은 리스크를 문서화한다.

## 산출물

```text
qa/plan26/reports/PLAN26_WORKER_RECOMMENDATION_SCHEDULE_REVIEW_REPORT.md
```

## 포함 항목

1. 수정 배경
2. Plan 25 이후 추가 보강 필요성
3. 작업 가능 인력 추천 정책
4. 승인 전후 일정 비교표
5. 반려 후 PM 재작성·재승인 workflow
6. 권한별 preview 정책
7. JSON Export/Import 결과
8. E2E QA 결과
9. 남은 이슈
10. push 전 사용자 승인 필요 문구

## 완료 보고

```text
[Plan 26 / Phase 309 완료 보고]
- 최종 리포트 경로:
- 주요 수정 결과:
- 남은 이슈:
- Git commit 가능 여부:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 310 — Git Commit 및 Push 승인 요청

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
[Plan 26 / Phase 310 승인 요청]
- commit 대상 파일:
- commit message:
- push 대상 branch:
- 승인 전에는 commit/push하지 않겠습니다.
```

---

## 5. 최종 완료 기준

Plan 26은 다음 조건을 모두 만족해야 완료된다.

1. PM 작업자 선택 화면에서 추천 작업자가 표시된다.
2. 추천 사유와 경고 사유가 표시된다.
3. 비활성/휴가/Off 등 제외 대상이 잘못 추천되지 않는다.
4. PM은 추천을 참고하되 최종 선택을 직접 할 수 있다.
5. 중간관리자 승인 화면에서 기존 공식 일정과 요청 일정을 비교할 수 있다.
6. 직원별 업무량 변화와 충돌/과부하를 볼 수 있다.
7. 승인 전 일정은 공식 일정표에 반영되지 않는다.
8. 승인대기 preview는 권한 있는 사용자만 볼 수 있다.
9. 중간관리자가 반려할 때 반려 사유가 필수다.
10. 반려된 일정은 공식 일정표에 반영되지 않는다.
11. PM은 반려 사유를 확인할 수 있다.
12. PM은 반려된 일정을 수정해 재승인 요청할 수 있다.
13. 재승인 요청 시 revisionNo 또는 version history가 남는다.
14. 이전 반려 이력은 삭제되지 않는다.
15. 중간관리자는 재요청안과 이전 반려안을 비교할 수 있다.
16. 최종 승인 후에만 공식 직원 일정표에 반영된다.
17. 작업자 내 업무에 승인된 업무만 공식 표시된다.
18. Notification과 AuditLog가 생성된다.
19. JSON Export/Import round-trip에서 반려/재요청 이력이 보존된다.
20. E2E QA 3개 시나리오가 통과한다.
21. lint/typecheck/build가 통과한다.
22. 사용자 승인 전 원격 push하지 않는다.

---

## 6. Antigravity 실행 시작 문구

아래 문구를 그대로 Antigravity에 입력하라.

```text
현재 F:\workspace 프로젝트의 Plan 26 작업을 시작한다.

중요 전제:
- Plan 단계는 뒤로 갈수록 최신 요구사항이 우선이다.
- Plan 25는 이미 진행 완료된 것으로 간주한다.
- Plan 26은 Plan 25에서 구현된 PM 작업자 배정·소요일정 작성·중간관리자 승인 workflow를 고도화하는 Plan이다.
- 이번 Plan 26의 핵심은 작업 가능 인력 추천, 승인 전후 일정 비교표, 승인대기 일정 Preview, 그리고 중간관리자 반려 후 PM 재작성·재승인 요청 workflow다.
- PM이 작업자를 선택할 때 활성 직원, 부서/파트, 기존 일정, 휴가/Off, 일일 8시간 초과 여부를 기준으로 추천/주의/제외 정보를 표시하라.
- 중간관리자는 PM 제출 일정을 승인하기 전에 기존 공식 일정과 승인대기 일정을 비교하고, 직원별 부하와 충돌 여부를 볼 수 있어야 한다.
- 중간관리자가 반려하면 반려 사유를 필수로 저장하고 PM에게 알림을 보내라.
- 반려된 일정은 공식 일정표에 반영하지 마라.
- PM은 반려 사유를 확인하고 기존 일정을 수정하거나 새 일정안을 작성해 중간관리자에게 재승인 요청할 수 있어야 한다.
- 재승인 요청 시 이전 반려 이력은 삭제하지 말고 revisionNo, previousSchedulePlanId, versionHistory 또는 동등한 구조로 보존하라.
- 최종 승인된 일정만 전체 직원 일정표와 작업자 내 업무에 공식 반영하라.
- 승인대기 일정과 반려 일정은 권한 있는 사용자에게만 preview로 표시하라.
- Notification, AuditLog, JSON Export/Import round-trip까지 포함해 검증하라.
- 각 Phase 시작 전 반드시 사용자에게 승인 요청을 하라.
- 사용자 승인 없이 Phase를 시작하지 마라.
- 사용자 승인 없이 다음 Phase로 넘어가지 마라.
- 사용자 승인 없이 GitHub 원격 push하지 마라.

먼저 Phase 290만 진행한다.
Phase 290에서는 코드 수정 금지, UI 수정 금지, store 수정 금지, JSON 기능 수정 금지, 현황 조사와 baseline 작성만 수행한다.

먼저 [Plan 26 / Phase 290 시작 승인 요청]만 작성하라.
아직 Phase 290을 실행하지 마라.
```
