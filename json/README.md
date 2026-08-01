# Workspace JSON Handoff Directory

Antigravity는 이 폴더의 `export-manifest.json`을 먼저 읽고,
각 JSON 파일의 `schemaVersion`을 확인한 뒤,
현재 `src/data` 또는 runtime data 구조에 맞게 반영하라.

기존 코드와 충돌할 경우 임의로 덮어쓰지 말고 diff report를 먼저 작성하라.

## Files
- `export-manifest.json`: 패키지 메타데이터 및 포함된 파일 목록
- `workspace-export.json`: 전체 통합 내보내기 파일
- `org-structure.json`: 멀티 법인(CON-COST, Viet_QS 등) 및 부서 조직도 구조 정의
- `personnel-cards.json`: 인사카드 데이터 구조 정의 (`PersonnelCard` 모델 기반)
- `internal-projects.json`: 개발팀 전용 프로젝트 데이터 (`projectSourceType: INTERNAL_DEVELOPMENT`, `targetDate` 속성 사용)
- `revision-requests.json`: 클라이언트 외부 수정 요청 데이터 (`RevisionRequest` 모델, `PRE_WORK` / `IN_PROGRESS` / `REVISION` / `COMPLETED` 등 4단 보드 대응용)

## Data Architecture & Models

### 1. PersonnelCard & Organization
- **User 모델 확장**: 시스템 권한(`systemRole`)과 직급(`organizationRank`)을 분리.
- **법인 정보**: `companyId`, `companyName` 등 다중 소속 지원.
- **상태 관리**: `employmentStatus` 필드로 활성/비활성 여부 통제.

### 2. ProjectSourceType
- **`CLIENT_ORDER`**: 기존 외부 수주 프로젝트 (기본값). `deliveryDate`(납품일) 사용.
- **`INTERNAL_DEVELOPMENT`**: 내부 개발팀 프로젝트. `targetDate`(목표일) 사용.
- **UI 동적 매핑**: 프로젝트 보드 등에서 `ProjectSourceType`에 따라 라벨이 "납품일"과 "목표일"로 동적 분기됨.

### 3. RevisionRequest vs PostDeliveryWorkRequest
- **`RevisionRequest`**: 클라이언트가 요청하는 단순 '수정'. 이 요청이 활성화(PENDING/ACCEPTED)된 프로젝트는 프로젝트 보드 상에서 `[REVISION]` 컬럼으로 렌더링됨.
- **`PostDeliveryWorkRequest`**: 납품 후 내부 판단 또는 사후 유지보수로 인한 '추가 업무'. 프로젝트 상태가 `[IN_PROGRESS]`로 Reopen 됨.
- 보드 4단 컬럼 구조: `PRE_WORK(작수 전) -> IN_PROGRESS(진행 중) -> REVISION(수정) -> COMPLETED(완료)`
