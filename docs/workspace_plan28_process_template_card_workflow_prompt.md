# WORKSPACE PLAN 28 — 업무 리스트 관리 내 공정 단계형 카드 템플릿 반영 프롬프트

이 프롬프트는 기존 `workspace plan1`부터 `workspace plan27` 이후에 추가되는 스물여덟 번째 보강 지시사항이다.

Plan 28의 목적은 사용자가 제공한 Excel 공정표의 구조를 현재 Workspace의 `업무 리스트 관리` 안에 녹여 넣는 것이다.  
단, Excel 화면을 그대로 표 형태로 복제하지 않는다. 현재 Workspace의 핵심 UI인 **카드형 업무 리스트 구조는 유지**하고, 카드 내부 또는 상세 화면에서 `공정 단계 → 세부 업무 카드` 구조로 표시되도록 구현한다.

---

## 0. 작업 대상 Excel

참고 파일:

```text
Lo_trinh_ESC 2 (Translated)(1).xlsx
```

예상 시트:

```text
Roadmap_ESC
```

Excel에는 다음과 유사한 공정 단계가 포함되어 있다.

```text
GĐ 0 / Phase 0: 분석 및 협의
GĐ 1 / Phase 1: 기본 바탕 조성
GĐ 2 / Phase 2: 데이터 입력 및 관리자 인터페이스
GĐ 3 / Phase 3: 계산 기구 및 규칙
GĐ 4 / Phase 4: 보고 및 편리성 완료
GĐ 5 / Phase 5: 최종 점검 및 납품
```

---

## 1. 매우 중요한 컬럼 반영 기준

사용자가 명확히 지정한 기준:

```text
Excel의 C/D열, F~J열은 이번 Workspace 반영 범위에서 제외한다.
```

따라서 Antigravity는 Excel을 분석할 때 아래 기준을 따른다.

### 1-1. 우선 사용할 컬럼

```text
A열: 공정 단계 구분
B열: 공정 단계명 및 세부 업무명
E열: 기본 담당자 참고값
```

### 1-2. 이번 반영에서 제외할 컬럼

```text
C열: 상태
D열: 진도
F열: 확인 및 지원
G열: 수행일
H열: 시작일
I열: 종료일
J열: 구분
```

### 1-3. 제외 이유

이번 기능의 목적은 Excel 공정표의 모든 일정을 그대로 가져오는 것이 아니라,  
업무 리스트 관리 안에서 재사용 가능한 **공정 단계 템플릿**을 만드는 것이다.

따라서 시작일, 종료일, 수행일, 상태, 진도, 구분은 Excel에서 자동 반영하지 않는다.  
이 값들은 PM이 Workspace 안에서 프로젝트별로 직접 작성하고, 중간관리자 승인 후 공식 일정으로 반영한다.

### 1-4. K열 이후 날짜 Bar 처리

K열 이후의 날짜 Bar 또는 색상 기반 일정 영역은 이번 Plan 28 MVP에서는 자동 import하지 않는다.

처리 기준:

```text
- K열 이후 날짜 Bar는 참고용으로만 분석한다.
- 실제 Workspace 데이터로 자동 변환하지 않는다.
- 공정 템플릿에는 단계명과 세부 업무명 중심으로 저장한다.
- 일정은 PM이 직접 작성한다.
```

---

## 2. 핵심 목표

Plan 28에서 반드시 달성해야 하는 목표는 다음이다.

1. 업무 리스트 관리 화면에서 공정 단계형 업무 템플릿을 적용할 수 있게 한다.
2. 기존 카드형 업무 리스트 UI를 유지한다.
3. Excel을 그대로 복제하지 않고 `공정 단계 카드 그룹 + 세부 업무 카드`로 변환한다.
4. 공정 단계 템플릿은 자동 적용하지 않고, 사용자가 선택할 때만 적용한다.
5. 공정 단계가 적용된 업무 카드는 전체 단계 수, 세부 업무 수, 진행률, 승인 상태를 요약 표시한다.
6. 카드를 클릭하면 상세 화면에서 공정 단계별 세부 업무 카드를 볼 수 있게 한다.
7. PM은 각 세부 업무 카드에 담당자와 소요일정을 직접 작성할 수 있어야 한다.
8. PM이 작성한 일정은 즉시 공식 일정표에 반영하지 않고 승인 대기 상태로 둔다.
9. 중간관리자가 승인해야만 전체 직원 일정표와 작업자 내 업무에 공식 반영한다.
10. 중간관리자가 반려하면 PM은 반려 사유를 확인하고, 일정을 수정해 다시 승인 요청할 수 있어야 한다.
11. JSON Export/Import에 공정 템플릿, 적용된 단계, 세부 업무, 승인 이력이 포함되어야 한다.

---

## 3. 기존 시스템과의 연결 기준

### 3-1. Plan 25 연결

Plan 25에서 구현된 기본 흐름을 유지한다.

```text
중간관리자 PM 지정
→ PM 작업자 선택
→ PM 소요일정 작성
→ 중간관리자 승인 요청
→ 승인 후 공식 일정 반영
```

### 3-2. Plan 26 연결

Plan 26의 기능을 공정 단계 세부 업무에도 연결한다.

```text
- 작업 가능 인력 추천
- 승인 전후 일정 비교표
- 승인대기 일정 Preview
- 중간관리자 반려 후 PM 재작성·재승인 요청
```

### 3-3. Plan 27 연결

Plan 27의 더미데이터 정리 원칙을 유지한다.

```text
- 공정 템플릿은 더미 프로젝트로 자동 생성하지 않는다.
- 기본 템플릿은 사용자가 선택해야만 적용된다.
- CEO/COO는 세부 업무 담당자로 자동 배정하지 않는다.
- 일정표에는 승인된 실제 일정이 있는 직원만 표시한다.
```

---

## 4. UX 방향

### 4-1. 업무 리스트 관리 카드

업무 카드에는 다음 요약을 표시한다.

```text
- 업무명
- 업무 유형: 수주 프로젝트 / 개발팀 업무
- 공정 템플릿 적용 여부
- 전체 단계 수
- 전체 세부 업무 수
- 전체 진행률
- PM
- 중간관리자
- 승인 상태
```

공정 템플릿이 적용되지 않은 카드에는 다음 CTA를 표시한다.

```text
[공정 템플릿 적용]
```

### 4-2. 공정 템플릿 선택 모달

템플릿 선택 모달에는 다음이 필요하다.

```text
- 템플릿명
- 설명
- 단계 수
- 세부 업무 수
- 미리보기
- [적용] 버튼
```

기본 템플릿 예시:

```text
ESC 개발 공정 템플릿
```

### 4-3. 공정 단계 상세 화면

카드 상세 화면 안에 다음 구조를 추가한다.

```text
공정 단계
├ Phase 0: 분석 및 협의
│ └ 세부 업무 카드
├ Phase 1: 기본 바탕 조성
│ └ 세부 업무 카드
├ Phase 2: 데이터 입력 및 관리자 인터페이스
│ └ 세부 업무 카드
├ Phase 3: 계산 기구 및 규칙
│ └ 세부 업무 카드
├ Phase 4: 보고 및 편리성 완료
│ └ 세부 업무 카드
└ Phase 5: 최종 점검 및 납품
  └ 세부 업무 카드
```

### 4-4. 세부 업무 카드

각 세부 업무 카드는 다음 필드를 가진다.

```text
- 세부 업무명
- 담당자
- 시작일
- 종료일
- 예상 소요시간
- 설명
- 승인 상태
- 작업 상태
```

Excel의 C/D열, F~J열은 가져오지 않으므로, 이 값들은 PM이 Workspace에서 직접 작성한다.

---

## 5. 데이터 모델 제안

기존 모델을 무너뜨리지 말고 필요한 구조만 추가한다.

```ts
interface ProcessTemplate {
  id: string
  nameKr: string
  nameVn?: string
  description?: string
  source: "MANUAL" | "EXCEL_REFERENCED" | "SYSTEM_DEFAULT"
  stages: ProcessStage[]
  createdAt: string
  updatedAt: string
}

interface ProcessStage {
  id: string
  templateId: string
  order: number
  code: string
  nameKr: string
  nameVn?: string
  description?: string
  tasks: ProcessTask[]
}

interface ProcessTask {
  id: string
  stageId: string
  order: number
  titleKr: string
  titleVn?: string
  defaultAssigneeName?: string
  assigneeId?: string
  plannedStartDate?: string
  plannedEndDate?: string
  estimatedHours?: number
  description?: string
  approvalStatus: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED"
  workStatus: "NOT_STARTED" | "IN_PROGRESS" | "DONE" | "BLOCKED"
}

interface ProcessTemplateAssignment {
  id: string
  projectId: string
  templateId: string
  pmId: string
  managerId: string
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED"
  revisionNo: number
  rejectionReason?: string
  createdAt: string
  updatedAt: string
}
```

---

## 6. 절대 금지 사항

Antigravity는 다음을 절대 하지 마라.

1. Excel 화면을 그대로 복제하지 마라.
2. 업무 리스트 관리 화면을 엑셀형 그리드로 바꾸지 마라.
3. 기존 카드형 UI를 제거하지 마라.
4. C/D열, F~J열 값을 자동 import하지 마라.
5. K열 이후 날짜 Bar를 공식 일정으로 자동 반영하지 마라.
6. 템플릿 적용만으로 공식 직원 일정표에 일정을 생성하지 마라.
7. PM 작성 및 중간관리자 승인 없이 공식 일정표에 반영하지 마라.
8. CEO/COO를 세부 업무 담당자로 자동 배정하지 마라.
9. 더미 프로젝트를 자동 생성하지 마라.
10. 사용자 승인 없이 GitHub 원격 push하지 마라.

---

## 7. Phase 구성

아래 Phase는 반드시 순서대로 진행한다.  
각 Phase 시작 전 사용자 승인을 받아야 한다.  
사용자가 승인하기 전에는 다음 Phase를 시작하지 않는다.

---

# Phase 327 — 참고 Excel 구조 분석 및 현행 업무 리스트 구조 조사

## 목표

`Lo_trinh_ESC 2 (Translated)(1).xlsx`의 구조를 분석하고, 현재 업무 리스트 관리 화면과 카드 구조를 확인한다.

## 작업

1. Excel 파일 존재 여부 확인
2. 시트명 확인
3. `Roadmap_ESC` 시트 확인
4. A열, B열, E열만 주요 반영 대상으로 분석
5. C/D열, F~J열은 제외 대상으로 기록
6. K열 이후 날짜 Bar는 참고용으로만 기록
7. 현재 업무 리스트 관리 화면 구조 확인
8. 현재 카드 컴포넌트 구조 확인
9. 현재 TaskCard / Project / SchedulePlan / ApprovalRequest 타입 확인
10. Plan 25~27 workflow와 충돌 여부 확인

## 금지

- 코드 수정 금지
- UI 수정 금지
- 데이터 생성 금지
- Excel import 구현 금지

## 완료 보고

```text
[Plan 28 / Phase 327 완료 보고]
- 분석한 Excel 구조:
- 사용 대상 컬럼:
- 제외 대상 컬럼:
- 현재 업무 리스트 구조:
- 유지해야 할 카드 UI:
- 추가가 필요한 데이터 모델:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 328 — 공정 단계 카드형 UX 설계

## 목표

Excel식 공정표를 카드형 UI에 맞게 재설계한다.

## 작업

1. 업무 리스트 카드 요약 정보 설계
2. 공정 템플릿 선택 모달 설계
3. 공정 단계 상세 레이아웃 설계
4. 단계별 세부 업무카드 구조 설계
5. PM 일정 작성 위치 설계
6. 중간관리자 승인/반려 연결 위치 설계
7. KOR/VIET 표시 방식 설계

## 금지

- 코드 수정 금지

## 완료 보고

```text
[Plan 28 / Phase 328 완료 보고]
- 카드형 UX 설계안:
- 공정 단계 상세 구조:
- PM 일정 작성 위치:
- 승인/반려 연결 방식:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 329 — 데이터 모델 및 Store 확장 설계

## 목표

ProcessTemplate, ProcessStage, ProcessTask 구조를 기존 데이터 모델과 충돌 없이 추가한다.

## 작업

1. 기존 TaskCard와 ProcessTask의 관계 정의
2. ProcessTemplate 저장 위치 결정
3. ProcessTemplateAssignment 구조 설계
4. 승인 전/후 상태 정의
5. 반려 후 재작성 revision 정책 정의
6. JSON Export/Import 포함 구조 설계

## 금지

- 코드 수정 금지

## 완료 보고

```text
[Plan 28 / Phase 329 완료 보고]
- 데이터 모델 설계:
- 기존 모델과의 연결:
- 승인 상태 정의:
- JSON Handoff 구조:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 330 — 기본 공정 템플릿 Seed 작성

## 목표

Excel 내용을 참고한 기본 공정 템플릿을 코드에 추가한다.  
단, 더미 프로젝트가 아니라 사용자가 선택해서 적용하는 템플릿으로만 만든다.

## 기본 템플릿

```text
ESC 개발 공정 템플릿
- Phase 0: 분석 및 협의
- Phase 1: 기본 바탕 조성
- Phase 2: 데이터 입력 및 관리자 인터페이스
- Phase 3: 계산 기구 및 규칙
- Phase 4: 보고 및 편리성 완료
- Phase 5: 최종 점검 및 납품
```

## 작업

1. ProcessTemplate seed 생성
2. A/B/E열을 기준으로 단계와 세부 업무 작성
3. C/D열, F~J열은 반영하지 않음
4. K열 이후 일정 Bar는 반영하지 않음
5. 기본 템플릿은 자동 적용하지 않음
6. 사용자가 선택할 때만 적용

## 완료 보고

```text
[Plan 28 / Phase 330 완료 보고]
- 추가한 template:
- 단계 수:
- 세부 업무 수:
- 반영한 컬럼:
- 제외한 컬럼:
- 자동 적용 여부:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 331 — 업무 리스트 관리에 템플릿 적용 버튼 추가

## 목표

업무 카드에서 공정 템플릿을 적용할 수 있게 한다.

## 작업

1. 업무 카드 상세 또는 업무 리스트 관리 화면에 `[공정 템플릿 적용]` 버튼 추가
2. 템플릿 선택 모달 추가
3. 기본 템플릿 목록 표시
4. 적용 전 미리보기 제공
5. 적용 시 ProcessTemplateAssignment 생성
6. 기존 카드 구조 유지

## 완료 보고

```text
[Plan 28 / Phase 331 완료 보고]
- 수정 파일:
- 추가 버튼 위치:
- 템플릿 선택 모달:
- 적용 테스트:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 332 — 공정 단계 상세 카드 UI 구현

## 목표

적용된 공정 템플릿을 카드 상세 안에서 단계별 카드로 보여준다.

## 작업

1. 공정 단계 탭 또는 섹션 추가
2. 단계별 카드 그룹 표시
3. 하위 업무카드 표시
4. 단계 진행률 계산
5. 전체 진행률 계산
6. 승인 상태 배지 표시
7. 카드형 UI 유지

## 완료 보고

```text
[Plan 28 / Phase 332 완료 보고]
- 공정 단계 UI:
- 진행률 계산:
- 카드형 유지 여부:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 333 — PM 공정 단계 일정 작성 기능 구현

## 목표

PM이 단계별 세부 업무의 담당자와 소요일정을 직접 작성할 수 있게 한다.

## 작업

1. 단계별 업무카드 수정 기능 추가
2. 담당자 선택
3. 시작일/종료일 입력
4. 예상 소요시간 입력
5. 설명 입력
6. PM 저장
7. 승인 전 draft 상태 유지
8. Plan 26의 작업 가능 인력 추천 기능과 연결 가능하면 연결

## 완료 보고

```text
[Plan 28 / Phase 333 완료 보고]
- PM 수정 가능 항목:
- 담당자 선택:
- 일정 입력:
- draft 저장:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 334 — 중간관리자 승인/반려 연결

## 목표

PM이 작성한 공정 단계 일정이 중간관리자 승인 workflow를 거치게 한다.

## 작업

1. 공정 단계 일정 승인 요청 버튼 추가
2. ApprovalRequest 생성
3. 중간관리자 승인 화면에 공정 단계 요약 표시
4. 승인 전후 일정 비교와 연결
5. 승인 시 공식 일정표 반영
6. 반려 시 반려 사유 저장
7. PM 재작성/재승인 요청 가능
8. 기존 Plan 26 workflow와 연결

## 완료 보고

```text
[Plan 28 / Phase 334 완료 보고]
- 승인 요청:
- 승인 화면:
- 반려 후 재작성:
- 공식 일정 반영:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 335 — 미니 타임라인 표시 구현

## 목표

Excel의 날짜 Bar 느낌을 카드 상세 안에서 간단한 타임라인으로 표현한다.

## 주의

Excel K열 이후 날짜 Bar를 자동 import하지 않는다.  
PM이 Workspace에서 입력한 시작일/종료일을 기준으로 미니 타임라인을 표시한다.

## 작업

1. 단계별 기간 Bar 표시
2. 세부 업무 기간 Bar 표시
3. 시작/종료일 없는 업무는 미정 표시
4. 상세보기에서만 충분한 폭 사용
5. Excel식 전체 날짜 그리드는 구현하지 않음

## 완료 보고

```text
[Plan 28 / Phase 335 완료 보고]
- 타임라인 UI:
- 미정 처리:
- Excel Bar 자동 import 여부:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 336 — JSON Export/Import 반영

## 목표

공정 템플릿과 적용된 공정 단계 데이터를 JSON으로 내보내고 다시 불러올 수 있게 한다.

## 작업

1. ProcessTemplate 포함
2. ProcessStage 포함
3. ProcessTask 포함
4. ProcessTemplateAssignment 포함
5. ApprovalRequest 연결 포함
6. 반려/재승인 이력 포함
7. JSON Export 실행
8. JSON Import Round-trip 검증

## 완료 보고

```text
[Plan 28 / Phase 336 완료 보고]
- export 포함 데이터:
- import 복원 결과:
- round-trip 결과:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 337 — E2E QA: 개발팀 업무에 공정 템플릿 적용

## 시나리오

1. 개발팀 업무 생성
2. 공정 템플릿 적용
3. 단계별 업무 확인
4. PM이 담당자와 일정 작성
5. 중간관리자 승인 요청
6. 중간관리자 승인
7. 일정표 반영
8. JSON Export 확인

## 완료 보고

```text
[Plan 28 / Phase 337 완료 보고]
- E2E 결과:
- PASS/PARTIAL/FAIL:
- 발견 이슈:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 338 — E2E QA: 반려 후 재작성

## 시나리오

1. 공정 템플릿 적용
2. PM 일정 작성
3. 중간관리자에게 승인 요청
4. 중간관리자가 반려 사유 입력 후 반려
5. PM이 반려 사유 확인
6. 단계별 일정 수정
7. 재승인 요청
8. 중간관리자 승인
9. 공식 일정표 반영
10. 이력 확인

## 완료 보고

```text
[Plan 28 / Phase 338 완료 보고]
- 반려 후 재작성 결과:
- revision 이력:
- 공식 일정 반영:
- 발견 이슈:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 339 — UI/UX 실사용 보정

## 목표

사용자가 공정 단계 기능을 쉽게 이해하도록 문구와 배치를 보정한다.

## 개선 후보

1. `공정 템플릿 적용` 버튼 문구 정리
2. 단계별 진행률 배지
3. 승인 상태 배지
4. PM 다음 액션 안내
5. 중간관리자 검토 필요 안내
6. 베트남어/한국어 병기 가독성 보정
7. 공정 단계가 없는 카드 empty state 개선

## 완료 보고

```text
[Plan 28 / Phase 339 완료 보고]
- 보정한 UI:
- 사용자 흐름 개선:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 340 — 회귀 테스트

## 검증 항목

1. 업무 리스트 관리
2. 기존 카드형 UI
3. 프로젝트 보드
4. PM 작업자 배정
5. 일정 승인/반려/재요청
6. 통합 일정표
7. 충돌 관리
8. JSON Export/Import
9. KOR/VIET 토글
10. 권한별 접근

## 완료 보고

```text
[Plan 28 / Phase 340 완료 보고]
- PASS:
- PARTIAL:
- FAIL:
- 회귀 발생 여부:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 341 — Lint / Typecheck / Build

## 작업

1. lint 실행
2. typecheck 실행
3. build 실행
4. console error 확인
5. route refresh 확인
6. GitHub Pages base path 영향 확인

## 완료 보고

```text
[Plan 28 / Phase 341 완료 보고]
- lint:
- typecheck:
- build:
- runtime:
- route refresh:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 342 — Plan 28 최종 리포트 작성

## 산출물

```text
qa/plan28/reports/PLAN28_PROCESS_TEMPLATE_CARD_WORKFLOW_REPORT.md
```

## 포함 항목

1. 수정 배경
2. Excel 구조 분석
3. 반영한 컬럼과 제외한 컬럼
4. 카드형 공정 단계 설계
5. 구현한 데이터 모델
6. 업무 리스트 관리 반영 결과
7. PM 일정 작성 workflow
8. 중간관리자 승인/반려 workflow
9. JSON Export/Import 결과
10. E2E QA 결과
11. 남은 이슈
12. push 전 사용자 승인 필요 문구

## 완료 보고

```text
[Plan 28 / Phase 342 완료 보고]
- 최종 리포트 경로:
- 주요 수정 결과:
- 남은 이슈:
- Git commit 가능 여부:
- 다음 Phase 진행 승인 요청:
```

---

# Phase 343 — Git Commit 및 Push 승인 요청

## 작업

1. git diff 요약
2. 수정 파일 목록
3. commit message 제안
4. 사용자에게 commit 승인 요청
5. 사용자에게 push 승인 요청
6. 승인 전 commit/push 금지

## 완료 보고

```text
[Plan 28 / Phase 343 승인 요청]
- commit 대상 파일:
- commit message:
- push 대상 branch:
- 승인 전에는 commit/push하지 않겠습니다.
```

---

## 8. 최종 완료 기준

Plan 28은 다음 조건을 모두 만족해야 완료된다.

1. Excel 구조가 분석된다.
2. C/D열, F~J열은 제외 기준으로 명확히 기록된다.
3. A/B/E열 중심으로 공정 템플릿이 구성된다.
4. K열 이후 날짜 Bar는 자동 공식 일정으로 반영되지 않는다.
5. 기존 카드형 업무 리스트 UI가 유지된다.
6. 공정 템플릿 적용 버튼이 추가된다.
7. 공정 단계 상세 카드 UI가 구현된다.
8. PM이 각 세부 업무에 담당자와 소요일정을 직접 작성할 수 있다.
9. PM 작성 일정은 승인 전 draft 상태로 유지된다.
10. 중간관리자 승인 후에만 공식 일정표에 반영된다.
11. 반려 시 PM이 수정 후 재승인 요청할 수 있다.
12. JSON Export/Import에 공정 템플릿과 승인 이력이 포함된다.
13. 개발팀 업무 E2E가 통과한다.
14. 반려 후 재작성 E2E가 통과한다.
15. lint/typecheck/build가 통과한다.
16. 사용자 승인 전 원격 push하지 않는다.

---

## 9. Antigravity 실행 시작 문구

아래 문구를 그대로 Antigravity에 입력하라.

```text
현재 F:\workspace 프로젝트의 Plan 28 작업을 시작한다.

중요 전제:
- Plan 단계는 뒤로 갈수록 최신 요구사항이 우선이다.
- Plan 28은 업무 리스트 관리 화면에 공정 단계형 업무 템플릿을 추가하는 Plan이다.
- 현재 카드형 업무 리스트 UI는 유지한다.
- Excel처럼 표를 그대로 복제하지 말고, Excel의 공정 단계 구조를 카드형 업무 리스트 안에 녹여 넣어라.
- 참고 파일은 `Lo_trinh_ESC 2 (Translated)(1).xlsx`이며, `Roadmap_ESC` 시트의 구조를 기준으로 분석한다.
- 이번 반영에서는 Excel의 C/D열, F~J열은 필요 없으므로 자동 import하거나 데이터 모델에 강제 반영하지 마라.
- 우선 반영할 컬럼은 A열 공정 단계, B열 단계명/세부 업무명, E열 기본 담당자 참고값이다.
- K열 이후 날짜 Bar는 참고용으로만 보고, 공식 일정으로 자동 반영하지 마라.
- 시작일, 종료일, 수행일, 상태, 진도, 구분은 Excel에서 가져오는 것이 아니라 PM이 Workspace에서 직접 작성하도록 한다.
- 공정 템플릿은 자동 적용하지 말고, 사용자가 업무 카드에서 `[공정 템플릿 적용]`을 눌렀을 때만 적용하라.
- PM이 작성한 공정 단계 일정은 중간관리자 승인 전까지 공식 일정표에 반영하지 마라.
- 중간관리자가 승인한 일정만 전체 직원 일정표와 작업자 내 업무에 공식 반영하라.
- 중간관리자가 반려하면 PM은 반려 사유를 확인하고 단계별 일정을 수정해 재승인 요청할 수 있어야 한다.
- JSON Export/Import에는 ProcessTemplate, ProcessStage, ProcessTask, ProcessTemplateAssignment, ApprovalRequest, 반려/재승인 이력이 포함되어야 한다.
- 각 Phase 시작 전 반드시 사용자에게 승인 요청을 하라.
- 사용자 승인 없이 Phase를 시작하지 마라.
- 사용자 승인 없이 다음 Phase로 넘어가지 마라.
- 사용자 승인 없이 GitHub 원격 push하지 마라.

먼저 Phase 327만 진행한다.
Phase 327에서는 코드 수정 금지, UI 수정 금지, 데이터 생성 금지, Excel import 구현 금지, 현황 조사와 설계 기준 정리만 수행한다.

먼저 [Plan 28 / Phase 327 시작 승인 요청]만 작성하라.
아직 Phase 327을 실행하지 마라.
```
