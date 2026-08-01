# PHASE352 PERMISSION & STATE TRANSITION AUDIT REPORT

## 1. 개요
UI 상에서 버튼을 숨기는 것을 넘어, 실제 데이터의 변경점인 Zustand Store 내 액션(Action) 함수가 역할(Role)별 권한 및 엄격한 상태 전이(State Transition)를 강제(Guard)하는지 코드 수준에서 검증했습니다.

## 2. 권한 검증(Permission Guard) 감사 결과

### A. 업무 관리 (`taskStore.ts`)
- **로직**: `updateTaskStatus`, `updateTask` 등의 핵심 액션 호출 시 `permissions.ts`의 `canEditTask()`, `canMoveTask()` 순수 함수를 호출하여 현재 유저(`currentUser`)의 권한을 엄격히 검사합니다.
- **판정**: **PASS** (권한 없는 사용자의 스토어 강제 호출 방어 완료)

### B. 승인 요청 관리 (`approvalStore.ts`)
- **로직**: `updateApprovalStatus` 액션 등에서 `canApproveRequest()`를 호출하여 `currentUser`가 승인 권한(해당 매니저 혹은 PM인지)을 가졌는지 확인하는 로직이 **누락되어 있습니다**. 오직 UI 레이어에서만 버튼을 숨기고 있으며, 브라우저 콘솔 등을 통해 스토어 액션을 직접 호출할 경우 권한 없는 사용자가 승인/반려를 강제 처리할 수 있는 보안 취약점이 존재합니다.
- **판정**: **FAIL** (S1 Critical)

### C. 프로젝트 및 공정 관리 (`projectStore.ts`, `processTemplateStore.ts`)
- **로직**: `assignPM`, `updateProjectStatus`, `updateAssignmentStatus`, `updateSchedule` 등의 액션에서 `currentUser`의 권한 검증 로직이 **전혀 존재하지 않습니다**.
- **판정**: **FAIL** (S1 Critical)

## 3. 상태 전이(State Transition) 강제성 감사 결과

### A. 업무 칸반 카드 이동 역행/도약 (`taskStore.ts`)
- **로직**: `updateTaskStatus` 내에서 특정 상태(예: `IN_PROGRESS`)로 변경 시 세부 `completionStatus`를 동기화하는 하드코딩된 `switch-case` 문은 존재하나, **이전 상태(from)에서 새 상태(to)로의 전이가 합법적인지(예: TODO에서 승인 없이 바로 DONE으로 도약하거나, DONE에서 역행하는 것)**를 막는 가드(Guard) 로직이 없습니다.
- **판정**: **FAIL** (S2 Major)

### B. 승인 파이프라인 우회 (`approvalStore.ts`)
- **로직**: `PENDING -> APPROVED` 나 `PENDING -> REJECTED` 외에 이미 승인된 항목을 다시 `PENDING`으로 되돌리거나 무효화하는 예외 상황을 방어하는 유한 상태 기계(FSM) 형태의 제약이 부족합니다.
- **판정**: **FAIL** (S2 Major)

## 4. 결론 및 조치 계획
- 애플리케이션의 보안 방어선이 상당 부분 "UI 렌더링 시 버튼 숨김"에만 의존하고 있으며, Store 계층의 Action 방어가 매우 취약합니다 (역할 격리 우회 가능).
- 차후 수정(Patch) Phase에서 모든 핵심 Store Action 상단에 `const { currentUser } = useAuthStore.getState();` 및 `if (!canAction(currentUser, target)) return;` 형태의 Guard 구문을 추가하고, 합법적이지 않은 상태 도약(State Jump)을 차단하는 로직을 일괄 적용해야 합니다 (이슈 ID: OBS-29-SEC-001).
