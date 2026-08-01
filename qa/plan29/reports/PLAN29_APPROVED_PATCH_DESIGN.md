# PLAN29 APPROVED PATCH DESIGN (PHASE 370)

## 1. 개요
Discovery 단계에서 도출된 근본 원인(Root Cause) A~E에 대응하기 위한 코드 수정(Patch) 계획 및 테스트 명세를 확정합니다. 기능 추가는 배제하고 무결성 확보와 결함 복구에만 집중합니다. (Root Cause F - 날짜 연산은 공수 문제로 이번 패치에서 제외하고 별도 플랜으로 이관합니다)

## 2. Patch Phase 설계

### 2-1. Phase 372/373/374: 위생, 템플릿 Seed, UX 패치
- **대상 파일**: `src/components/board/ProcessTemplateTab.tsx`, `src/store/processTemplateStore.ts` 등
- **수정 목표**: 
  - 카드형 UI 유지(Plan 28 기준) 및 템플릿 강제 초기화 제거.
  - 인코딩이 깨진 문서나 불필요한 락 파일 제거.
- **Rollback 기준**: UI 렌더링이 깨지거나 기존 저장된 JSON을 불러왔을 때 빈 화면이 뜨면 즉시 이전 커밋으로 롤백.

### 2-2. Phase 376: 반려/재요청 흐름 복구 (Root Cause D)
- **대상 파일**: `src/components/board/ProcessTemplateTab.tsx`
- **수정 목표**: 
  - `activeAssignment` 판별 로직에서 `status !== 'REJECTED'` 조건을 완화.
  - 반려 시 매니저의 `reviewComment`를 Alert 박스로 표출.
  - `[수정 후 재요청]` 버튼 신설 및 `PENDING_APPROVAL` 상태 전이 로직 추가.
- **테스트 시나리오**: PM이 반려된 템플릿을 화면에서 다시 확인하고, 수정하여 상신할 수 있는지 확인.
- **Rollback 기준**: 결재 승인 플로우 자체가 먹통이 되면 롤백.

### 2-3. Phase 377: JSON Handoff 무결성 검증 보강 (Root Cause C)
- **대상 파일**: `src/store/importStore.ts` (또는 `json/` 유틸)
- **수정 목표**: 
  - `JSON.parse` 이후 데이터 스키마 유효성을 방어적으로 검증하는 로직 보강.
  - 누락된 상태나 이력을 빈 배열/기본값으로 안전하게 채우는 Migration 전략 적용.
- **테스트 시나리오**: 손상된 JSON을 Import 시도했을 때 Crash 나지 않고 적절한 오류 문구를 반환하는지 확인.

### 2-4. Phase 378/379: 권한 격리 및 Audit/알림망 복원 (Root Cause A, B)
- **대상 파일**: `src/store/taskStore.ts`, `src/store/projectStore.ts`, `src/store/approvalStore.ts`
- **수정 목표**: 
  - 상태 변이 함수(ex. `updateTaskStatus`, `assignPM`) 최상단에 `useAuthStore`와 `permissions.ts`의 `canEdit...` 가드 추가.
  - 권한 통과 후 함수 종료 직전에 `useNotificationStore().addNotification` 및 `useAuditLog().addLog` 호출 주입.
- **테스트 시나리오**: WORKER 권한으로 DevTools에서 `updateTaskStatus` 강제 호출 시도 -> 차단(`return state`)되는지 확인. PM 배정 시 알림 생성 여부 확인.
- **Rollback 기준**: 기존 정상적인 칸반 드래그앤드롭이 권한 문제로 막혀버리는(False Positive) 현상 발생 시 롤백.

### 2-5. Phase 371/379 (보완): 글로벌 에러 바운더리 (Root Cause E)
- **대상 파일**: `src/app/error.tsx`, `src/app/global-error.tsx`
- **수정 목표**: Next.js 기본 에러 바운더리를 생성하여 런타임 크래시 방어.

## 3. Migration & 호환성 전략
- 모든 변경사항은 기존 `localStorage`나 Export된 JSON의 스키마를 파괴하지 않습니다.
- 새로 추가되는 Notification/Audit 로직은 기존 데이터를 읽기만 하며, 과거 데이터에 소급 적용하지 않고 신규 이벤트부터 기록합니다.
