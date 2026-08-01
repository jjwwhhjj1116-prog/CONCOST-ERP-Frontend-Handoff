# PHASE367 NOTIFICATION & AUDIT LOG E2E AUDIT REPORT

## 1. 개요
시스템 내에서 주요 상태 변경(결재 상신, PM/작업자 배정, 승인/반려, 공정 템플릿 적용 등)이 발생했을 때, (1) 관련된 담당자에게 즉각적인 알림(Notification)이 전송되는지, (2) 추적 및 복원 가능한 글로벌 Audit Log가 빠짐없이 기록되는지 검증했습니다.

## 2. 조사 결과

### A. 알림(Notification) 전송 누락 스캔
- **결재 상신 (Pending)**: PM이 공정 일정을 작성하고 매니저에게 승인 요청(`addRequest`)을 보낼 때, 정작 매니저에게는 "결재 요청이 도착했다"는 알림이 전송되지 않습니다. 매니저는 결재함에 직접 들어가야만 알 수 있습니다.
- **PM 및 담당자 배정**: `assignPM` 및 `updateTaskAssignee` 액션 발생 시 당사자에게 알림이 전송되지 않아, 자신이 업무에 배정되었는지 실시간으로 인지할 수 없습니다.
- **결재 승인/반려**: 매니저가 승인(`APPROVED`)하거나 반려(`REJECTED`)할 때 요청자(PM)에게 시스템 알림이 전송되는 로직은 정상적으로 작동합니다.
- **판정**: **FAIL** (S2 Major)

### B. Audit Log (상태 변경 추적) 무결성
- **분석**: Phase 360(Audit Log)에서 이미 확인된 바와 같이, Store의 상태 변이 함수(`updateTaskStatus`, `assignPM` 등) 내부에서 `AuditLog`를 호출하지 않고 일부 UI 컴포넌트(모달 등)에서만 간헐적으로 호출하고 있습니다.
- **결과**: 브라우저 콘솔(`console.warn`)로 로그를 뿜는 코드는 산재해 있으나, DB에 영구 저장될 영속성(Persisted) AuditLog로는 전혀 수집되지 않습니다.
- **판정**: **FAIL** (S1 Critical)

## 3. 결론 및 조치 계획 (Issue: OBS-29-016)
- **발견된 문제**: 시스템의 상태(Store)는 빠르게 변하고 있지만, 사용자 간의 커뮤니케이션(알림)과 사후 추적(Audit Log) 궤도가 완전히 끊어져 있습니다. 업무 할당이나 결재가 수동적 확인(Polling)에 의존하고 있어 사각지대가 발생합니다.
- **심각도**: **S1 Critical** (Audit Log 무결성 상실 및 비동기 협업 흐름 단절)
- **조치 방향**: 
  - Phase 379(기타 핵심 Workflow Patch) 단계에서 `approvalStore.ts`의 `addRequest`, `projectStore.ts`의 `assignPM`, `taskStore.ts`의 `updateTaskAssignee` 최상단에 `useNotificationStore.getState().addNotification(...)`를 주입하여 알림 사각지대를 완전히 해소해야 합니다.
  - Audit Log 무결성 복원은 Phase 378/379에서 Store Guard와 함께 통합 보완합니다.
