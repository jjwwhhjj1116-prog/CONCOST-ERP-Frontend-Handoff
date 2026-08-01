# PHASE351 DATA MODEL & STORE INTEGRITY REPORT

## 1. 핵심 데이터 모델 간 ID 참조 관계 확인
`src/types/models.ts` 및 Zustand Store를 분석하여 모델 간 참조 무결성을 점검했습니다.
- `TaskCard`는 `assigneeId`, `pmId`, `managerId`, `departmentId` 등 필수 참조를 포함합니다.
- `TaskWorkSegment`는 `taskId`, `workerId` 필드로 업무와 작업자를 명확히 연결합니다.
- `ProcessTemplateAssignment`는 `taskId`와 `templateId`를 소유(Owner) 관계로 명확히 정의하고 있습니다.
- `ProcessSchedule`은 `assignmentId`를 참조하여, 할당 단위별 하위 일정 구조를 정상적으로 형성하고 있습니다.
- **판정**: **PASS** (기본 참조 및 식별자 설계 정상)

## 2. 공식 일정 반영 (isOfficial) 관계 검증
- `approvalStore.ts` 라인 178~196 분석 결과, `PROCESS_SCHEDULE_APPROVAL` 타입의 요청이 승인(APPROVED)되면:
  1. `ProcessSchedule`의 `isOfficial`이 `true`로 업데이트됩니다.
  2. 승인된 하위 공정(ProcessSchedule)별로 `taskStore.addWorkSegment()` 로직이 발동하여 `TaskWorkSegment`(공식 작업자 업무/일정)가 정상적으로 동기화 생성됩니다.
- **판정**: **PASS** (승인 후 공식 반영 파이프라인 존재 및 정상)

## 3. Observation 29-004 재판정 (반려, 이력, Revision)
**관찰 항목**: ProcessTemplateAssignment와 ProcessSchedule의 반려 사유, managerId, revisionNo/previous assignment/version history 보존 수준 확인.
- **조사 결과**:
  - 반려 시 `ApprovalRequest` 엔티티 내에 `reviewedBy` (managerId)와 `reviewComment` (반려 사유)는 남습니다.
  - **그러나**, `ProcessTemplateTab.tsx` 라인 20 로직(`a.status !== 'REJECTED'`)으로 인해, 중간관리자가 반려하면 해당 Assignment는 화면에서 아예 사라지고 **"공정 템플릿 미적용"** 상태로 초기화됩니다.
  - PM이 수정 후 재요청하려면 **기존 이력을 덮어쓰거나 수정하는 것이 아니라, 새로운 템플릿 적용(New Assignment 생성)**을 해야 합니다.
  - 이로 인해 `ProcessTemplateAssignment` 간의 `revisionNo`나 `previousAssignmentId` 연결 고리가 단절되며, Plan 26에서 요구한 "수정 이력 보존" 요구사항을 위배합니다.
- **판정**: **FAIL**
- **심각도**: **S1 Critical** (반려 후 재작성 시 이전 공정 작성 내역이 날아가고 이력이 끊김)

## 4. 데이터 Export/Import 영속성
- 모든 핵심 엔티티가 `export-current-state.ts`와 `import-json-data.ts`를 통해 JSON 직렬화에 포함되어 있음을 확인했습니다. (`TaskCard`, `ProcessTemplateAssignment` 등)
- 단, 위에서 지적된 Revision 단절 문제로 인해 Export되는 데이터 상에서도 "반려된 Assignment"와 "새로 생성된 Assignment" 간의 관계를 추적할 수 없습니다.

## 5. 결론 및 조치 계획
- 데이터 모델 자체의 스키마 구조는 매우 탄탄하게 설계되어 있으나 (PASS), 상태 전이(Lifecycle) 관점에서의 비즈니스 로직(특히 반려/재요청)에 결함(FAIL)이 존재합니다.
- 반려된 `ProcessTemplateAssignment`를 버리지 않고 상태를 `REJECTED` 또는 `DRAFT`로 유지하며 수정(Edit)할 수 있도록 UI와 Store 액션을 수정하는 Patch(Phase 370 이후)가 필수적입니다.
