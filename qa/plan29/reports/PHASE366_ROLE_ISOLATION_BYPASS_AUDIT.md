# PHASE366 ROLE ISOLATION BYPASS AUDIT REPORT

## 1. 개요
프론트엔드 내에서 역할 기반 접근 제어(RBAC)가 UI 뷰(View) 렌더링 수준을 넘어 핵심 비즈니스 로직(Zustand Store Actions) 깊숙한 곳까지 방어막(Guard)을 치고 있는지 검증했습니다. 악의적 혹은 비정상적인 경로(DevTools, Console API 직접 호출 등)를 통한 우회(Bypass)가 차단되는지 스캔했습니다.

## 2. 조사 결과

### A. UI 컴포넌트 레벨 가드 (UI Guard)
- **분석**: `ProjectBoardPage.tsx` 및 `Board.tsx`에서 사용자의 권한(`canEditProject`, `canMoveTask`)을 검사하여 버튼을 렌더링하지 않거나, 칸반 카드 이동 시 `alert`를 띄워 차단합니다.
- **결과**: UI 단에서는 작업자(WORKER)가 타인의 업무를 건드리거나, PM이 타 부서의 승인을 누르는 행위가 시각적으로 잘 통제되고 있습니다. (**PASS**)

### B. Store Action 레벨 가드 (Store Guard)
- **분석**: `taskStore.ts`와 `projectStore.ts` 내부의 상태 변이(Mutation) 함수들을 전수 스캔하여 `canEditTask` 등의 권한 검증이 이중으로(Double Check) 실행되는지 점검했습니다.
- **결과 1 (부분적 보호)**: `updateTaskProgress`, `updateTaskBilling` 등 부가적인 액션에는 `canEditTask` 검증이 잘 걸려 있습니다.
- **결과 2 (치명적 우회 허용)**: 하지만 시스템의 뼈대인 핵심 상태 전이 함수 `updateTaskStatus`, `updateTaskAssignee`, `updateProjectStatus`에는 **아무런 권한 검증 로직이 없습니다.**
- **판정**: **FAIL** (S1 Critical)

### C. 상태 건너뛰기 및 역행 (State Transition Guard)
- **분석**: 승인 절차 없이 `PRE_WORK`에서 `IN_PROGRESS`로 넘어가는 행위나, `DONE` 상태에서 임의로 돌아가는 행위를 스토어가 차단하는지 확인했습니다.
- **결과**: `updateDetailedLineStage` 함수에는 상태 건너뛰기(`newIdx > currentIdx + 1`)를 차단하는 로직이 훌륭히 구현되어 있습니다. 그러나 일반 칸반 모드(`COLLAB`)에서 호출되는 `updateTaskStatus`에는 이러한 상태 머신 방어막이 아예 없어 모든 규칙이 무효화될 수 있습니다.
- **판정**: **FAIL** (S1 Critical)

## 3. 결론 및 조치 계획 (Issue: OBS-29-015)
- **발견된 문제**: 현재 시스템은 프론트엔드 단독(Local-First)으로 구동되는 만큼 Zustand Store가 사실상의 백엔드 역할을 합니다. 그러나 Store의 핵심 액션들이 "브라우저 콘솔 창에서의 함수 직접 호출(Bypass)"에 무방비하게 노출되어 있어, 누구나 `useTaskStore.getState().updateTaskStatus(...)`를 쳐서 타인의 업무를 완료 처리하거나 맘대로 담당자를 바꿀 수 있습니다.
- **심각도**: **S1 Critical** (보안 격리 벽 붕괴 및 권한 탈취 가능)
- **조치 방향**: 
  - Phase 378(권한/Conflict Patch) 단계에서 모든 Store Action 내부에 `canEdit...` 및 `canMove...` 함수를 주입하여, 권한이 없는 사용자가 스토어 함수를 호출하면 즉시 `console.error`를 뿜고 `return state`로 튕겨내도록 이중 방어망(Double Validation)을 구축해야 합니다.
