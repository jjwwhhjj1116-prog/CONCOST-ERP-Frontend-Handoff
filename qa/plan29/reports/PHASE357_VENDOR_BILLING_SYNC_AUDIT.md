# PHASE357 VENDOR BILLING SYNC AUDIT REPORT

## 1. 개요
초기 Plan 11(외주/벤더 관리 시스템)에서 기획된 외주 업무 관리 모델이 현재 작업 승인 프로세스와 잘 결합되어 있는지 소스코드를 스캔했습니다. 특히 업무(TaskCard)가 `DONE`(완료) 상태가 되었을 때 외주 업무의 청구(Billing) 상태가 자동으로 연동(Sync)되는지 여부를 집중적으로 확인했습니다.

## 2. 조사 결과

### A. 업무 완료 승인과 정산 상태의 연동 여부 (`taskStore.ts`)
- **로직**: `taskStore.ts`의 `reviewTaskCompletion(taskId, isApproved=true)` 액션 코드를 검토했습니다.
- **분석**: PM이 작업물에 대해 승인(`DONE`, `COMPLETED`) 처리를 내릴 때, 해당 Task의 `isOutsourced` 속성이 `true`인지 확인하는 조건문이 **존재하지 않습니다.**
- **결과**: 따라서 외주 작업자가 작업을 완료하고 PM이 승인하더라도, 해당 업무의 대금 청구 상태(`billingStatus`)는 자동으로 `INVOICED`(청구됨) 상태로 전이되지 않고 계속 `PENDING`(대기중)으로 멈춰 있습니다.
- **판정**: **FAIL** (S2 Major)

### B. UI/UX 계층의 수동 전환 의존성 (`TaskDetailModal.tsx`)
- **로직**: 벤더 정산 탭(`BILLING`)의 구현부를 점검했습니다.
- **분석**: 단순히 `isOutsourced` 체크박스와 정산 금액(`billingAmount`), 그리고 정산 상태(`billingStatus`) Select Box만 UI에 하드코딩되어 있습니다. 사용자가 일일이 이 모달을 열어 수동으로 `INVOICED` 또는 `PAID`로 변경해야만 업데이트(`updateTaskBilling`)가 발생합니다.
- **결과**: 업무 완료와 대금 지급 프로세스 간의 자동화된 파이프라인(Event-driven transition)이 부재하여 휴먼 에러(정산 누락)의 위험이 높습니다.
- **판정**: **FAIL** (S2 Major)

## 3. 결론 및 조치 계획 (Issue: OBS-29-008)
- **발견된 문제**: 외주 벤더 시스템(Plan 11) 데이터 스키마는 존재하나, 업무 상태 전이(Plan 28/29) 로직과 단절(Decoupled)되어 시너지를 내지 못하고 오직 수동 관리에만 의존하고 있습니다.
- **심각도**: **S2 Major** (대금 정산 지연 및 행정 비용 증가 우려)
- **조치 방향**:
  1. `taskStore.ts`의 `reviewTaskCompletion` 함수 내부에서, 승인 시(`isApproved === true`) 대상 Task가 `isOutsourced === true`라면 `billingStatus`를 자동으로 `INVOICED`(청구 대기/발행) 상태로 업데이트하도록 Zustand set() 로직을 보강해야 합니다.
  2. 자동으로 `INVOICED` 처리될 때 벤더 담당자 및 회계 부서에 알림을 전송하는 로직을 함께 붙이는 것이 이상적입니다 (Phase 370).
