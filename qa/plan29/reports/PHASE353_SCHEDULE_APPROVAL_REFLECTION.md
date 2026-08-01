# PHASE353 SCHEDULE APPROVAL REFLECTION AUDIT REPORT

## 1. 개요
PM이 작성한 "일정 초안" 및 "배정 초안"이 중간관리자 혹은 승인권자의 최종 결재(Approval)가 떨어지기 전까지 공식 일정표(Calendar)나 담당 작업자의 업무함에 노출되지 않고 격리되는지 검증했습니다. (Plan 25/26 핵심 요건)

## 2. 일정 초안의 격리 상태 조사 결과

### A. 세부 공정(Process Schedule)의 공식 반영 로직
- `approvalStore.ts` 및 `processTemplateStore.ts` 상에서는 공정 템플릿 일정(Process Schedule)이 생성될 때 `isOfficial: false` 상태로 생성되며, `PROCESS_SCHEDULE_APPROVAL` 요청이 승인된 직후에만 `isOfficial: true`로 변경되고 `TaskWorkSegment`(작업자 실행 단위)로 동기화되는 방어 체계가 구현되어 있습니다. 
- **판정**: **PASS** (세부 공정의 데이터 무결성은 훌륭함)

### B. 단일 업무(Task Card) 및 통합 일정표 렌더링 검토
- **위반 사항 1 (`schedules/page.tsx`)**: 통합 일정표 렌더링 시 작업자의 세부 `TaskWorkSegment`를 읽어 그리는 것이 아니라, 부모 래퍼인 `TaskCard` 목록을 직접 순회하며 간트(Gantt) 바를 그립니다. 이때 `TaskCard`의 `approvalStatus === 'PENDING'` (초안 상태)인지 검사하지 않고 맹목적으로 `assigneeId`와 날짜만 맞으면 전부 렌더링해 버립니다.
- **위반 사항 2 (`WorkerDashboard.tsx`)**: 작업자의 개인 대시보드 역시 할당된 업무(`workerTasks`)를 필터링할 때 `approvalStatus === 'APPROVED'` 검증이 누락되어 있습니다. UI 상으로 "승인 대기" 뱃지를 달아주긴 하지만, 아직 확정되지 않은 일정이 작업자에게 곧바로 '해야 할 내 업무'로 노출되는 설계적 모순을 범하고 있습니다.
- **판정**: **FAIL** (초안 노출 방지 실패)

## 3. 결론 및 조치 계획 (Issue: OBS-29-005)
- **발견된 문제**: 승인 시스템의 상태 전이는 데이터 모델에 기록되나, 정작 보여주는 View(스케줄 보드 및 워커 대시보드)에서 승인되지 않은 초안(`PENDING`)을 필터링 없이 그대로 렌더링하여 작업자와 임원진의 혼선을 유발합니다.
- **심각도**: **S1 Critical** (Plan 25 "임시저장 초안 격리" 요구사항 전면 위배)
- **조치 방향**: 
  1. `schedules/page.tsx` 및 `WorkerDashboard.tsx` 등 모든 뷰에서 `t.approvalStatus === 'PENDING'` 및 `t.approvalStatus === 'REJECTED'` 인 항목은 렌더링 대상에서 아예 제외(Exclude)하도록 `filter` 조건을 수정해야 합니다.
  2. 세부 공정(`TaskWorkSegment`) 역시 캘린더에 표시될 수 있도록 렌더링 계층의 확장이 필요합니다 (Phase 370 Patch에서 통합 처리).
