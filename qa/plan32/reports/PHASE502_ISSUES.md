# PHASE 502 ISSUE MATRIX

| ID | Issue | Reproducible Evidence | Proposed Owner Phase | Severity |
| :--- | :--- | :--- | :--- | :--- |
| **P32-001** | `next.config.ts` uses `output: "export"`, while Cloudflare deployment invokes OpenNext. | `next.config.ts` 확인 (`output: "export"`). 사용자 제공 Cloudflare 에러 스크린샷 확인 (`npx wrangler deploy` 실행됨). | Phase 514, Phase 516 | High |
| **P32-002** | `basePath: "/workspace"` is correct for GitHub Pages but not Cloudflare. | `next.config.ts` 확인 (`basePath: "/workspace"` 하드코딩). | Phase 513 | High |
| **P32-003** | `server/node_modules` tracked; root lint fails. | `git ls-files` 결과 `server/node_modules` 내부 파일 2340여 개가 추적 중. `npm run lint` 실행 결과 157개의 문제(88 errors) 발생 (주로 `server/src` 및 `any` 타입 에러). | Phase 508, Phase 509, Phase 511 | High |
| **P32-004** | Client auth starts as mock; no real login UI. | `src/store/authStore.ts` 및 컴포넌트 코드 확인 (여전히 클라이언트 사이드 Mock 데이터 및 상태 사용). | Phase 520, Phase 521 | High |
| **P32-005** | Prisma schema exists but no migration history/config. | `server/prisma/migrations` 디렉토리 없음 확인 (`dir` 명령 실패). 마이그레이션 이력 부재. | Phase 510, Phase 517 | Critical |
| **P32-006** | Zustand used as authority instead of API/PostgreSQL. | `src/store/projectStore.ts`, `src/store/taskStore.ts` 등 Zustand 스토어가 로컬 상태를 관리 중이며 서버 동기화가 부분적이거나 부재함. | Phase 523, Phase 524, Phase 525 | Critical |
| **P32-007** | Required Plan 30/31 phase reports absent. | `qa/plan30`, `qa/plan31` 관련 증빙 레포트 디렉토리 부재 확인. | Phase 528 (Final Matrix) | Medium |
