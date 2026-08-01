# PHASE358 DELEGATION AND MULTIPLE ASSIGNMENT AUDIT REPORT

## 1. 개요
조직의 유연성을 담보하기 위한 시스템의 권한 이양(Delegation) 처리와 단일 업무 다중 배정(Multiple Assignment) 체계를 검증했습니다. 구체적으로 PM의 휴가 시 대직자 지정 로직, 그리고 복수의 실무자가 같은 Task를 분담할 때 발생하는 락(Lock)이나 설계적 한계를 스캔했습니다.

## 2. 조사 결과

### A. 업무 다중 할당(Multiple Assignment) 제약
- **분석**: `src/types/models.ts`에 정의된 `TaskCard` 및 `ProcessSchedule`(세부공정) 스키마를 확인했습니다.
- **결과**: 업무 배정 필드가 배열(`string[]`)이 아닌 단일 문자열(`assigneeId?: string;`)로 선언되어 있습니다. 이로 인해 2명 이상의 작업자가 하나의 업무를 공동으로 담당하는 병렬 할당 체계가 원천적으로 불가능합니다.
- **영향**: 협업이 필요한 덩어리가 큰 업무의 경우 PM이 억지로 'Task A-1', 'Task A-2'처럼 카드를 분할(Duplicate)해야 하므로 파편화가 발생합니다.
- **판정**: **FAIL** (아키텍처 제약사항, 향후 모델 마이그레이션 요망)

### B. 결재/PM 권한 이양(Delegation) 누락
- **분석**: 초기 기획 문서(`docs/workspace plan4.txt`)에 명시되었던 부재 시 대리 결재자 지정(`DelegationRule`, `delegateUserId`) 개념이 실제 소스코드와 스키마 모델에 이식되었는지 `grep`으로 글로벌 탐색했습니다.
- **결과**: `src/types/models.ts` 및 관련 Store(`authStore`, `projectStore`) 어디에도 대직자나 권한 위임(Delegation)에 대한 로직이 **전혀 구현되어 있지 않습니다.**
- **영향**: PM이나 부서장(Manager)이 휴가(`OFF` 스케줄)를 떠났을 때, 긴급한 일정 하달 결재나 작업자 산출물 검토(`requestTaskCompletion`)가 공중에 붕 뜨게 되는 병목(Bottleneck) 현상이 필연적으로 발생합니다.
- **판정**: **FAIL** (S2 Major)

## 3. 결론 및 조치 계획 (Issue: OBS-29-009)
- **발견된 문제**: 다중 작업자 할당 및 결재 권한 위임(Delegation)이라는 필수적인 유연성(Flexibility) 기믹들이 초기 기획(Plan 4)에만 존재하고 실제로는 누락되어 시스템의 락다운(Lock-down) 리스크를 내포하고 있습니다.
- **심각도**: **S2 Major** (운영 상의 치명적 병목 지점)
- **조치 방향**: 
  - 본 Plan 29의 Audit 범위를 넘어서는 거대 스키마 변경 사항입니다.
  - Phase 369 이슈 매트릭스에 등재하되, 즉각적인 코드 패치보다는 향후 V2(버전 2) 아키텍처 개편 시 `assigneeIds: string[]` 배열 도입 및 `DelegationRule` 모델 신설 안건으로 상정(Defer)할 것을 권고합니다.
