# PHASE356 REJECTION LOGIC CHAIN AUDIT REPORT

## 1. 개요
조직 내에서 가장 감정적/시간적 마찰이 큰 **반려(Rejection)** 프로세스가 진행될 때, 당사자에게 알림(Notification)이 즉각 발송되고 추적을 위한 감사 로그(Audit Log)가 남는지 소스코드 단에서 추적 스캔했습니다.

## 2. 조사 결과

### A. 매니저의 PM 일정 반려 (`approvalStore.ts` 의 `updateApprovalStatus`)
- **로직**: PM이 요청한 `SCHEDULE_APPROVAL`을 매니저가 반려(`REJECTED`)할 때의 동작을 검토했습니다.
- **결과 (알림)**: `useNotificationStore().addNotification`을 통해 PM(요청자)에게 "결재 반려 알림(HIGH)"을 발송하는 로직이 정상적으로 구현되어 있습니다. (**PASS**)
- **결과 (Audit Log)**: 반려 및 승인에 대한 감사 기록을 영속적인 `useAuditStore`에 남기지 않고, 단순히 브라우저 `console.log('[AUDIT] ...')`로만 찍고 휘발시키는 심각한 누락을 발견했습니다. (**FAIL**)

### B. PM의 작업자 산출물 반려 (`taskStore.ts` 의 `reviewTaskCompletion`)
- **로직**: 작업자가 완료를 요청한 업무를 PM이 반려(`isApproved: false`)할 때의 스토어 액션을 검토했습니다.
- **결과 (알림 & Audit Log)**: `reviewTaskCompletion` 함수 내부에서 `status: 'IN_PROGRESS'`, `completionStatus: 'REJECTED'`로 상태값만 조용히 변경(`set()`)할 뿐, 작업자에게 어떠한 Notification도 발송하지 않고 Audit Log도 남기지 않습니다. 작업자는 자신이 완료했다고 믿는 업무가 반려된 사실을 스스로 대시보드에 들어가기 전까지 알 수 없습니다.
- **판정**: **FAIL** (S1 Critical)

### C. (부록) 작업자의 완료 요청 (`taskStore.ts` 의 `requestTaskCompletion`)
- **결과**: 이 역시 상태값만 `PM_REVIEWING`으로 몰래 바꿀 뿐, PM에게 "검토 요청 알림"을 보내지 않습니다. PM은 내 대기열을 수시로 새로고침해야만 확인 가능합니다. (**FAIL**)

## 3. 결론 및 조치 계획 (Issue: OBS-29-007)
- **발견된 문제**: 시스템 전반의 상태 전이(State Transition) 시 부가적인 Side-effect(알림 전송, 로그 적재) 처리가 매우 파편화되어 있거나 누락되어 있습니다. 특히 실무자 간의 핵심 커뮤니케이션인 '업무 반려' 과정에서 알림이 없다는 것은 협업 툴로서 치명적입니다.
- **심각도**: **S1 Critical** (소통 단절 및 업무 지연 유발)
- **조치 방향**: 
  - `taskStore.ts`의 `reviewTaskCompletion`, `requestTaskCompletion` 내부에 Zustand 미들웨어나 getState() 패턴을 활용하여 `useNotificationStore` 및 `useAuditStore` 연동 코드를 강제 삽입해야 합니다 (Phase 371 Patch 시 일괄 적용).
