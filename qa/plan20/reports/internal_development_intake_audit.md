# Phase 163 — `/projects/intake` 개발팀 업무 리스트 관리 탭 검수 결과

## 검수한 항목
- `개발팀 업무 리스트 관리` 탭 클릭
- 개발팀 작업 등록 버튼 클릭
- 외부 납품일과 내부 목표일 구분 확인
- `CLIENT_ORDER`와 `INTERNAL_DEVELOPMENT` 데이터가 섞이지 않는지 확인
- 등록 완료 시 보드 `착수 전` 컬럼에 나타나는지 확인

## 정상 확인
- `개발팀 업무 리스트 관리` 탭 진입 및 화면 전환이 정상적으로 동작함.
- 개발팀 전용 작업 등록 폼에 접근 가능하며 정상적으로 활성화됨.
- 임의의 테스트 데이터를 기입하여 제출 시 정상적으로 폼이 처리되고 등록됨.
- 등록된 항목이 '개발팀 업무 리스트'에 문제없이 추가되어 노출되는 것을 확인함.

## 오류/의심사항
- **[ISSUE-PLAN20-163-001]** 리스트 내 Data Type 노출 부재
  - 개발팀 업무 리스트 화면의 테이블에 해당 데이터가 `INTERNAL_DEVELOPMENT` 인지 시각적으로 명시해주는 컬럼이나 배지가 노출되지 않음. 탭 위치로 유추할 수는 있으나 데이터 객체 자체의 Type 안전성 확인이 직관적이지 않음.
- **[ISSUE-PLAN20-163-002]** 외부 납품일과 내부 목표일 혼용
  - 폼 내 날짜 입력 필드 UI 구성 시, 외부 수주 프로젝트와 달리 개발팀 내부 업무에 특화된 라벨링(예: '내부 목표일') 구분이 명확하게 시인되지 않는 측면이 있음 (스펙 재확인 요망).

## 증빙
- screenshot:
  - 탭 활성화: `qa/plan20/screenshots/internal_dev_tab_active_1783556677054.png`
  - 등록 폼 검수: `qa/plan20/screenshots/internal_task_form_1783556684466.png`
  - 작성된 데이터 제출: `qa/plan20/screenshots/internal_task_form_filled_1783556697369.png`
  - 리스트 내 추가 완료 상태: `qa/plan20/screenshots/internal_task_added_list_1783556761870.png`
  - 보드 내역 확인 시도: `qa/plan20/screenshots/board_page_1783557210990.png`
- console log: 특이사항 없음
- network log: 특이사항 없음

## 판정
- PARTIAL (등록 로직 자체는 동작하나, Type 구분 UI 및 라벨링 모호함 존재)

## 다음 Phase
- Phase 164는 아직 시작하지 않음
- 진행 전 사용자 승인 필요
