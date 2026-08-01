# PLAN29 REQUIREMENTS TRACEABILITY MATRIX

## 1. 개요
이 매트릭스는 Plan 1~28까지의 요구사항 중 시스템 무결성, 승인 워크플로우, 데이터 보존 및 핵심 UX와 관련된 주요 요구사항을 추적하기 위해 작성되었습니다. 충돌 시 가장 최신 Plan(Plan 번호가 높은 것)의 요구사항을 우선하며, 보안/데이터 보존 원칙은 명시적 폐기가 없는 한 유지됩니다.
*Plan 19의 경우 사용자의 "진행" 승인에 따라 일단 `workspace_plan19_prompt(1).md`를 정본으로 가정하고 작성되었습니다.*

## 2. 상태(Status) 범례
- `IMPLEMENTED`: 구현 완료 (정적 확인)
- `VERIFY_REQUIRED`: 코드/문서 확인만 되어 실제 E2E/브라우저 검증이 필요함
- `DESIGNED_ONLY`: 설계만 존재하며 미구현됨
- `OUT_OF_SCOPE`: 최신 Plan에 의해 명시적으로 제외됨

## 3. 요구사항 추적 매트릭스 (Core Requirements)

| REQ-ID | Source Plan | 요구사항 요약 | 관련 엔티티/Route | 역할(Role) | 완료 증거 기준 | 현재 상태 | 비고 (무결성/충돌) |
|---|---|---|---|---|---|---|---|
| **REQ-19-01** | Plan 19 | 다국어(KOR/VIET) UI 전환 및 입력 데이터 원문/번역문 분리 저장 | 전역 UI, TaskCard | ALL | UI 렌더링, JSON 내 번역 상태 보존 | `VERIFY_REQUIRED` | 핵심 영역 |
| **REQ-25-01** | Plan 25 | PM이 작업자 선택 및 일정 초안 작성, 중간관리자 승인 워크플로우 | TaskCard, Schedule | PM, MANAGER | 승인 전엔 공식 일정(TaskWorkSegment) 비노출 | `VERIFY_REQUIRED` | 핵심 영역 |
| **REQ-25-02** | Plan 25 | 반려 시 반려 사유 필수, 반려 이력 보존 | ApprovalRequest | MANAGER | 이력(Revision) 보존, 공식 일정 배제 | `VERIFY_REQUIRED` | 핵심 영역 |
| **REQ-26-01** | Plan 26 | PM이 작업자 배정 시 작업자의 기존 부하/충돌 여부 추천 | Schedule, Conflict | PM | 경고 표시 UI, 충돌 로직 | `VERIFY_REQUIRED` | 핵심 영역 |
| **REQ-26-02** | Plan 26 | 재요청(Resubmission) 시 이전 버전 이력 보존 | ApprovalRequest | PM | Snapshot/History 보존 | `VERIFY_REQUIRED` | 핵심 영역 |
| **REQ-27-01** | Plan 27 | 더미 데이터/충돌 정책 개선 (허위 충돌 제거) | ConflictStore | ALL | 실제 충돌과 Dummy 충돌 구분 | `VERIFY_REQUIRED` | 핵심 영역 |
| **REQ-27-02** | Plan 27 | 월별 통합 일정표에 경영진(CEO, COO) 제외 및 승인/휴가 인력만 표시 | SchedulePlan | ALL | 통합 일정표 필터링 로직 동작 | `VERIFY_REQUIRED` | 사용자 제공 인사카드 삭제 불가 원칙 보존 |
| **REQ-28-01** | Plan 28 | 공정 단계형 템플릿(Excel Roadmap 기준 A,B,E열) UX 및 저장 | ProcessTemplate, TaskCard | PM | 카드형 UI 유지, 템플릿 데이터 스토어 보존 | `VERIFY_REQUIRED` | 핵심 영역 (기존 테이블 UX 수정) |
| **REQ-28-02** | Plan 28 | 공정 일정의 승인 요청 및 공식 일정(TaskWorkSegment) 동기화 | ProcessSchedule, Approval | PM, MANAGER | 승인 후에만 공식 일정 배포 | `VERIFY_REQUIRED` | Plan 25와 동일 정책 공유 |
| **REQ-GEN-01** | Plan 1~28 | 통합 JSON Export/Import 시 무결성 유지 및 비밀값 비노출 | JSON Handoff | SYSTEM_ADMIN | Round-trip(Export->Import) 후 상태 보존 | `VERIFY_REQUIRED` | 시스템 전체 신뢰도 직결 |
| **REQ-GEN-02** | Plan 22~24 | 반응형 UI, 사이드바 오버레이, 브랜딩 명칭 유지 | Layout, Sidebar | ALL | 브라우저 모바일/데스크톱 렌더링 확인 | `VERIFY_REQUIRED` | CSS 레이아웃 |
| **REQ-GEN-03** | Plan 25~28 | 권한 격리 (Role Isolation) | Store, Action | ALL | 권한 없는 자의 상태 변경, 승인 우회 차단 | `VERIFY_REQUIRED` | UI 및 Store 레벨 Guard 확인 필요 |

## 4. 특이사항
- **Plan 28 Excel 범위**: C/D열, F~J열, K열 이후 날짜 Bar 등은 자동 일정 및 데이터 모델에 강제 반영하지 않음 (OUT_OF_SCOPE)
- 위 Matrix의 상태는 모두 `VERIFY_REQUIRED`로 설정되었으며, 이어지는 Phase 347 ~ Phase 367의 E2E 테스트 및 코드 감사를 통해 실제 증거(PASS/FAIL/PARTIAL)를 판정하게 됩니다.
