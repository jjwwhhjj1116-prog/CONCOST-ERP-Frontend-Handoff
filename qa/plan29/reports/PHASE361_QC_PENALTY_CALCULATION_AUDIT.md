# PHASE361 QC PENALTY CALCULATION AUDIT REPORT

## 1. 개요
Plan 26(품질관리 및 평가)에서 기획된 QC(Quality Control) 모듈이 시스템 상에 수학적 결함 없이 정상적으로 연동되어 직원의 성과(Score)에 차감 계산(Penalty Deduction)을 가하고 있는지 스캔했습니다.

## 2. 조사 결과

### A. Store 연계의 오해와 진실
- **분석**: 초기 가설은 QC 벌점이 `dataQualityStore`에 연동되어 있을 것이라 추정했으나, 코드 베이스를 스캔한 결과 `dataQualityStore`는 "PM 미배정", "시작일 누락" 등 **시스템/메타데이터의 결함(Data Gap)**을 추적하는 용도로만 완전히 분리되어 사용되고 있었습니다.
- **결과**: 직원의 업무 성과를 깎는 실질적인 **품질 오류(QC Issue)**는 `evaluationStore.ts`에 독립적으로 적재되며, 아키텍처적으로 도메인 분리가 아주 잘 되어 있음을 확인했습니다. (**PASS**)

### B. 가중치(Weight) 적용의 수학적 정합성
- **분석**: `QcIssueModal.tsx`에서 오류 등록 시 `weightPercent` 값을 받아 `evaluationStore.addQcIssue`를 호출합니다.
- **결과**: `evaluationStore.ts` 내부에서 `const weightedErrorCount = weightPercent / 100;` 연산을 통해 가중 오류 건수를 정확하게 소수점으로 변환하여 저장하고 있으며, 향후 매니저가 이의신청(Appeal)을 수용하여 `updateQcIssueWeight`를 호출할 때도 이 값이 동적으로 재계산되도록 수식이 완벽히 짜여 있습니다. (**PASS**)

### C. 최종 평가(Quality Score) 산출 엔진
- **분석**: 평가 산출 로직이 `selectors.ts`에 있을 것으로 예상했으나, 비즈니스 로직 비대화를 막기 위해 `src/lib/evaluation/engine.ts`라는 전용 평가 엔진 파일로 모듈화되어 있었습니다.
- **결과**: `engine.ts`의 `generatePerformanceEvaluation` 함수에서 아래의 수식 파이프라인이 톱니바퀴처럼 맞물려 돌아가는 것을 증명했습니다.
  1. `calculateTotalWeightedErrorCount`: 해당 직원의 모든 승인된 QC 건의 `weightedErrorCount` 합산
  2. `calculateErrorRate`: `(가중오류합산 / 총_작업량) * 100`으로 0나누기 방어 로직과 함께 백분율 산출
  3. `calculateQualityScore`: 도출된 Error Rate 백분율을 `errorRateBands`(구간표)에 대입하여 최종 점수(Score) 반환
- **판정**: **PASS**

## 3. 결론 및 조치 계획
- **발견된 문제**: 없음. QC 모듈의 프론트엔드 연산 구조는 매우 견고하며, 평가 엔진(`engine.ts`)의 분리와 수식 정합성 모두 완벽합니다.
- **심각도**: N/A (정상 동작)
- **조치 방향**: 현상 유지 (단순 뷰잉이나 스토어 상태 감지만으로도 훌륭한 다면 평가 리포팅이 유지됨).
