# PHASE354 PROCESS TEMPLATE SYNC AUDIT REPORT

## 1. 개요
Plan 28에서 신설된 공정 템플릿(Process Template) 모델의 하위 단위인 `TaskWorkSegment` 및 `ProcessSchedule`의 진척도(Progress)가 부모 `TaskCard`와 `Project` 레벨로 올바르게 말아올려지는지(Roll-up) 검증했습니다.

## 2. 조사 결과

### A. 작업자의 공정 진척도(Progress) 입력 채널 부재
- **조사**: `TaskWorkSegment`의 `progress` 필드를 업데이트하는 스토어 액션(`updateWorkSegment`)의 사용처를 프로젝트 전체 코드베이스에서 탐색했습니다.
- **결과**: `taskStore.ts` 내에 스토어 액션은 존재하나, 실제 프론트엔드 UI 컴포넌트(특히 작업자 화면인 `tasks/my/page.tsx`) 어디에서도 이를 호출하는 곳이 **없습니다**.
- **판정**: **FAIL** (작업자는 세부 공정의 진척도를 입력할 수단이 없음)

### B. 부모 Task 및 Project로의 진척도 Roll-up 단절
- **조사**: 작업자가 세부 단위의 진척도를 올렸을 때, 이것이 `TaskCard.progress`로 합산되거나 `getProjectOverallProgress` (selector) 수식에 반영되는지 검토했습니다.
- **결과**: `src/lib/selectors.ts`의 `calculateTaskProgress` 함수는 `TaskWorkSegment`를 전혀 참조하지 않습니다. 오로지 부모 `TaskCard` 자신의 하드코딩된 상태(TODO=0, IN_PROGRESS=50 등)나 별도로 수동 입력된 `TaskCard.progress`만을 취합하여 프로젝트 전체 진척도를 산출합니다.
- **판정**: **FAIL** (Plan 28 세부 공정 데이터 모델과 기존 Plan의 진행률 계산 로직이 완전히 단절되어 있음)

## 3. 결론 및 조치 계획 (Issue: OBS-29-006)
- **발견된 문제**: Plan 28을 통해 훌륭한 "세부 공정 템플릿 데이터 스키마"가 도입되었으나, 이것이 작업자의 입력 UI나 진척도 산출 수식(Selectors)과 결합되지 않고 껍데기만 겉돌고 있습니다. 작업자는 여전히 큰 덩어리의 업무(TaskCard) 전체를 한 번에 "완료 요청"할 수밖에 없는 상태입니다.
- **심각도**: **S1 Critical** (Plan 28의 비즈니스 가치를 상실시키는 구조적 단절)
- **조치 방향**:
  1. `tasks/my/page.tsx`에 작업자가 자신에게 할당된 세부 `TaskWorkSegment`별로 0~100% 진척도를 슬라이더나 입력칸으로 직접 업데이트할 수 있는 UI를 추가해야 합니다.
  2. `src/lib/selectors.ts`의 진척도 계산식을 수정하여, 하위에 `TaskWorkSegment`가 존재할 경우 하위 세그먼트들의 평균 progress를 `TaskCard.progress`로 역산출(Roll-up)하도록 로직을 패치해야 합니다 (Phase 370).
