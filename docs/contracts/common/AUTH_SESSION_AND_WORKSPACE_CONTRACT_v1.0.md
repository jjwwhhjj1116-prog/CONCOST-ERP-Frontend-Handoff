# Auth, Session and Workspace Contract v1.0

Status: `FROZEN_V1`

## Same-origin Delivery

Web과 API는 Reverse Proxy/BFF를 통해 동일 출처처럼 제공한다. Frontend는 실제 Backend host를 소스에 넣지 않는다. Cross-origin이 불가피하면 구체적인 CORS allowlist, credential cookie, CSRF와 Cookie Domain을 배포 승인문서에 기록한다.

## Authentication

- Secure HttpOnly server session cookie
- HTTPS only
- explicit SameSite policy
- synchronizer token 또는 동등한 CSRF 방어
- Production CORS wildcard 금지
- password/session secret/token 원문을 localStorage·sessionStorage에 저장하지 않음
- Frontend JavaScript가 cookie secret을 읽지 않음

## Session Policy

- idle timeout: 30 minutes
- absolute timeout: 12 hours
- approved devices: maximum 3
- current-device logout and all-device logout
- unsaved Draft가 있으면 expiry 전에 경고
- logout 시 rolling Draft의 삭제/승인 보존 선택과 결과를 사용자에게 표시

## Workspace

`currentCompanyId`, `allowedCompanyIds`, locale, theme, enabledModules, featureFlags를 서버가 반환한다. 회사 전환은 서버 검증 후 atomic하게 적용하고 기존 회사 요청·cache를 폐기한다. KR/VI 버튼은 권한을 생성하지 않는다.

## Synced Preferences

locale, theme, density, fontScale, homeWidgets, defaultCompanyId, favorites, sidebarState, defaultLandingModule.

최근 검색어와 민감 필터는 개인정보정책 확정 전 서버 동기화 대상이 아니다.

## Endpoints

- `POST /api/v1/auth/login`
- `GET /api/v1/auth/session`
- `POST /api/v1/auth/logout`
- `GET /api/v1/me/workspaces`
- `PATCH /api/v1/me/workspace-preference`
- `GET /api/v1/system/capabilities`

## Deployment Handoff

실제 Frontend Domain, API upstream, Cookie Domain, SameSite 세부값, CSRF 구현과 Sandbox 주소는 Viet QS Backend팀이 제안하고 보안·IT가 승인한다.
