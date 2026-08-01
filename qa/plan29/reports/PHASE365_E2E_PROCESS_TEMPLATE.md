# PHASE365 E2E PROCESS TEMPLATE AUDIT REPORT

## 1. 개요
Plan 28에서 설계된 "공정 템플릿 적용 E2E 시나리오"를 점검했습니다. PM이 템플릿을 업무에 적용하고(Draft), 세부 일정을 입력한 뒤 승인을 요청(Pending)하면, 매니저가 이를 승인하거나 반려(Rejected)하고, PM이 반려 사유를 참고해 일정을 수정(Revision) 후 재요청하여 최종 공식 일정표(Official Schedule)로 확정되는 전체 라이프사이클의 무결성을 검증합니다.

## 2. 조사 결과

### A. 템플릿 적용 및 승인 요청 (Draft -> Pending)
- **분석**: `ProcessTemplateTab.tsx`에서 PM이 템플릿을 선택하고 "적용"을 누르면 `DRAFT` 상태의 `Assignment`와 세부 공정 `Schedules`가 생성됩니다. 이후 "승인 요청"을 누르면 `PENDING_APPROVAL` 상태로 전이되며 `approvalStore`에 결재 건이 등록됩니다.
- **결과**: 정상 동작합니다. (**PASS**)

### B. 매니저의 승인 및 공식 일정 반영 (Pending -> Approved)
- **분석**: `ApprovalReviewModal.tsx`에서 매니저가 승인 시, `approvalStore` 내부 로직이 `PROCESS_SCHEDULE_APPROVAL` 타입에 맞춰 Assignment를 `APPROVED`로 변경하고, 하위 Schedule들을 `isOfficial: true`로 마킹한 뒤, 작업자의 개별 업무(`taskStore.addWorkSegment`)로 일괄 배분합니다.
- **결과**: JSON 동기화 및 Store 연계가 정확하게 작동합니다. (**PASS**)

### C. 반려 및 PM의 수정/재요청 (Rejected -> Revision -> Pending)
- **분석**: 매니저가 반려(Rejected)할 경우, `assignment.status`가 `REJECTED`로 바뀝니다. 이때 PM이 자신이 작성했던 일정을 수정하고 다시 승인 요청을 올릴 수 있어야 합니다.
- **결과**: `ProcessTemplateTab.tsx`의 렌더링 로직(`const activeAssignment = assignments.find(a => a.taskId === task.id && a.status !== 'REJECTED');`)으로 인해, 반려된 즉시 해당 템플릿 할당 내역이 화면에서 완전히 증발(Hidden)해버립니다. UI는 "공정 템플릿 미적용" 상태로 되돌아가며, PM은 매니저가 왜 반려했는지 확인조차 할 수 없고, 템플릿을 처음부터 다시 적용하여 모든 날짜를 백지상태에서 다시 입력해야 합니다.
- **판정**: **FAIL** (S2 Major)

## 3. 결론 및 조치 계획 (Issue: OBS-29-014)
- **발견된 문제**: 반려된 공정 템플릿 일정을 수정하고 재요청(Revision)하는 라이프사이클이 프론트엔드 UI/UX 결함으로 인해 완전히 단절되어 있습니다. `REJECTED` 상태를 투명(Invisible) 처리해버린 것이 Root Cause입니다.
- **심각도**: **S2 Major** (승인 반려 시 데이터 재입력 강제, 협업 흐름 단절)
- **조치 방향**: 
  - Phase 371 Patch 시, `ProcessTemplateTab.tsx`가 `REJECTED` 상태의 Assignment도 렌더링하도록 수정해야 합니다. 
  - `REJECTED` 상태일 때는 상단에 반려 사유(결재 코멘트)를 경고창(Alert)으로 노출하고, `[수정 후 재요청]` 버튼을 통해 상태를 다시 `DRAFT`나 `PENDING_APPROVAL`로 밀어올릴 수 있는 복구 경로(Recovery Path)를 뚫어주어야 합니다.
