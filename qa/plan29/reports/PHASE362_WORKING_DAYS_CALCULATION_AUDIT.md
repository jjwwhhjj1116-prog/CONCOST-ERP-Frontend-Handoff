# PHASE362 WORKING DAYS CALCULATION AUDIT REPORT

## 1. 개요
프로젝트 및 업무 일정 계획의 근간이 되는 '소요 일수(Duration)' 계산 시, 달력의 주말(토/일)이나 `scheduleStore`에 등록된 개인 휴가, 법정 공휴일 등이 정상적으로 배제(Skip)되어 순수 업무일(Working Days) 기준으로 산출되는지 스캔했습니다.

## 2. 조사 결과

### A. 유틸리티 및 캘린더 엔진 부재
- **분석**: `src/lib/` 및 `src/utils/` 디렉토리를 탐색하여 `dateUtils.ts`나 `scheduleUtils.ts` 등 날짜 연산을 보조하는 유틸리티의 존재 여부를 파악했습니다.
- **결과**: 주말이나 특정 `OFF` 일정을 배제하는 함수(예: `addWorkingDays(date, days)`)가 전무합니다.

### B. PM 일정 하달 뷰의 원시적 날짜 연산 (`PmDispatchModal.tsx`)
- **분석**: PM이 작업자에게 업무를 분배하고 과부하(Overload)를 체크하는 로직을 검토했습니다.
- **결과**: `const days = Math.max(1, (dueDate - startDate) / 86400000 + 1)` 라는 매우 원시적인 뺄셈 연산만 수행합니다. 이로 인해 주말이나 작업자의 5일짜리 휴가(`OFF`)가 사이에 끼어 있어도 이를 '근무 가능 일수'로 포함시켜버리는 치명적 오류가 발생합니다.
- **판정**: **FAIL** (S2 Major)

### C. 공정 템플릿의 자동화 부재 (`ProcessTemplateTab.tsx`)
- **분석**: 공정 템플릿 적용 시, 기획서(Plan 28)에 명시된 `baseHours`나 `baseDays`를 활용하여 세부 업무의 시작/마감일을 자동 순차 계산(Auto-scheduling)하는 로직이 있는지 점검했습니다.
- **결과**: 자동 계산 로직이 아예 누락되어 있으며, PM이 각 세부 공정의 `startDate`와 `endDate`를 빈칸부터 일일이 수동(Input date)으로 채워 넣어야 하는 극심한 수기(Manual) 구조입니다.
- **판정**: **FAIL** (S2 Major)

## 3. 결론 및 조치 계획 (Issue: OBS-29-012)
- **발견된 문제**: 시스템 내에 "워킹데이(Working Days)"라는 개념 자체가 이식되지 않았습니다. 모든 연산이 물리적 캘린더 일수(Calendar Days) 기반으로 돌아가며, 이로 인해 휴가나 주말을 무시한 가혹한 일정 할당이 시스템적으로 통과(Validation Bypass)되고 있습니다.
- **심각도**: **S2 Major** (일정 계획 도구로서의 신뢰성 하락 및 노무 리스크)
- **조치 방향**: 
  - Phase 369 스키마/엔진 개선 안건으로 이관합니다. 
  - 차기 업데이트(V2) 시 `src/lib/dateUtils.ts`를 신설하여 `calculateWorkingDays(start, end, userSchedules)` 및 `addWorkingDays(start, baseDays)` 유틸리티를 전역적으로 제공하고, 이를 `PmDispatchModal`과 `ProcessTemplateTab`에 접목해야 합니다.
