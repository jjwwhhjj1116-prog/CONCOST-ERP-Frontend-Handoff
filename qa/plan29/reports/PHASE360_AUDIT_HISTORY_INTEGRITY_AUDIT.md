# PHASE360 AUDIT HISTORY INTEGRITY AUDIT REPORT

## 1. 개요
프로젝트 관리 시스템에서 필수적인 투명성과 추적성을 보장하기 위해, 상태 변경(업무 완료, 상태 변경, 권한 변경 등) 시 이전 데이터로의 복기(Rollback)가 가능한 '이력 추적 및 무결성 테이블(Audit/History)' 구조가 프론트엔드 아키텍처에 구현되어 있는지 스캔했습니다.

## 2. 조사 결과

### A. Audit 모델 스키마 설계 (`models.ts`)
- **결과**: `AuditLog` 인터페이스 내에 `beforeValue?: string;` 및 `afterValue?: string;` 필드가 잘 선언되어 있습니다. 스키마 설계상으로는 History 추적이 가능한 구조를 갖추고 있습니다.
- **판정**: **PASS**

### B. Store 연동 및 이전 상태(beforeValue) 기록 여부
- **조사**: 상태 변이(Mutation)가 발생하는 핵심 스토어(`taskStore.ts`, `projectStore.ts`, `approvalStore.ts`) 내에서 `useAuditStore().addLog`가 호출되는지, 그리고 이전 상태와 새 상태를 직렬화(JSON)하여 기록하는지 글로벌 탐색했습니다.
- **결과 (호출 위치의 오류)**: 스토어 내부에서는 `addLog`를 전혀 호출하지 않습니다. 오직 `PmDispatchModal` 등 몇몇 View(UI 컴포넌트) 레이어에서만 단편적으로 `addLog`를 호출하고 있습니다. 이는 치명적인 안티 패턴으로, 다른 경로(다른 UI나 콘솔 등)로 Store Action이 호출될 경우 감사가 완벽히 우회됩니다.
- **결과 (History 기록 누락)**: UI에서 `addLog`를 호출할 때조차 `beforeValue`와 `afterValue` 인자를 넘기지 않고 단순 텍스트 `message`만 적재합니다.
- **판정**: **FAIL** (S1 Critical)

## 3. 결론 및 조치 계획 (Issue: OBS-29-011)
- **발견된 문제**: 모델(Schema)에는 이전 상태를 기록할 수 있는 그릇(Fields)이 존재하나, 실제 애플리케이션의 뼈대인 Zustand Store들이 이 이력 테이블을 완전히 외면(Bypass)하고 있습니다. 현 구조에서는 데이터가 오염되거나 실수로 변경되었을 때 "과거에 어떤 값이었는지" 추적 및 복원(Rollback)하는 것이 100% 불가능합니다.
- **심각도**: **S1 Critical** (시스템의 투명성 및 감사 역량 완전 상실)
- **조치 방향**:
  1. View 계층에서 산발적으로 호출되는 `addLog`를 모두 걷어내고, 상태 변경의 진원지인 각 Zustand Store의 Action 함수 내부로 `addLog` 호출을 이관해야 합니다.
  2. Action 실행 직전의 상태(`state.tasks.find(...)`)를 `beforeValue`로 캡처하고, 변경 후의 상태를 `afterValue`로 직렬화(stringify)하여 영구 보존하는 로직을 일괄 이식해야 합니다 (Phase 371 Patch).
