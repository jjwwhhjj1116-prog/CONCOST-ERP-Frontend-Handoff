# PHASE359 REAL-TIME NOTIFICATION HOOK AUDIT REPORT

## 1. 개요
Plan 21에서 기획되었던 "실시간 소통 및 알림(WebSocket / Polling)"이 프론트엔드 아키텍처 상에 제대로 연결(Hook)되어 있는지 검증했습니다. Mock 상태라 하더라도 주기적 Polling이나 `window.addEventListener('storage')` 등을 통한 탭 간/기기 간 상태 동기화 기믹이 존재하는지 스캔했습니다.

## 2. 조사 결과

### A. 알림 배지(Red-dot) UI 반응성 (`NotificationPopover.tsx`)
- **로직**: `useNotificationStore`의 `notifications` 상태를 구독하며 `unreadCount > 0`일 경우 종(Bell) 아이콘에 Red-dot 배지를 표시하도록 구현되어 있습니다.
- **결과**: Zustand 스토어가 업데이트되면 UI는 즉각적으로(Reactively) 반응하여 배지를 띄웁니다. UI 계층의 반응성은 훌륭합니다.
- **판정**: **PASS**

### B. 외부/타 기기 이벤트 수신 훅(Hook) 부재
- **로직**: `src/app/layout.tsx`, `DataLoader.tsx`, `SessionManager.tsx` 등 앱 최상단 래퍼(Wrapper) 컴포넌트들을 스캔하여 `useWebSocket`, `setInterval(fetch)`, `EventSource(SSE)` 등의 백그라운드 동기화 로직을 탐색했습니다.
- **결과**: **전혀 존재하지 않습니다.** 현재 시스템은 철저히 '로컬(Local) 브라우저' 내부에서만 Zustand Store가 변이(Mutation)되는 단일 클라이언트 구조에 머물러 있습니다. PM이 A 기기에서 알림을 발송해도, 작업자의 B 기기에는 브라우저를 새로고침하거나 Mock DB를 덮어쓰지 않는 한 절대 실시간 알림이 도착할 수 없습니다. 심지어 Zustand `persist`를 이용한 동일 기기 내 다중 탭 간 동기화(`storage` 이벤트 리스너) 로직조차 없습니다.
- **판정**: **FAIL** (S2 Major)

## 3. 결론 및 조치 계획 (Issue: OBS-29-010)
- **발견된 문제**: 알림을 그려주는 뷰(View) 컴포넌트는 멀쩡하지만, 외부로부터 알림을 주입받는 통신 파이프라인(Socket / Polling) 훅이 완전히 누락되어 실시간성(Plan 21 핵심)이 상실된 상태입니다.
- **심각도**: **S2 Major** (알림이 있어도 타 기기로 전달 불가)
- **조치 방향**: 
  - (Mock 단계 보완): `src/components/layout/` 내에 `MockSocketProvider.tsx`를 신설하여 주기적으로(setInterval 10초 등) `localStorage` 변동을 감지하고 타 탭의 이벤트를 Sync해오는 브라우저 레벨 동기화를 임시 구현해야 합니다.
  - (V2 대비): 실제 백엔드 연동 시 사용할 `useWebSocket` 커스텀 훅의 뼈대(Skeleton)를 만들어 `notificationStore`와 연결하는 작업이 Phase 371 Patch 시점에 수반되어야 합니다.
