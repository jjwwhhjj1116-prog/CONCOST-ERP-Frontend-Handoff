# FE-CONTRACT-01 Final Decisions

Status: `FROZEN_V1`

| No | Decision | Frozen policy |
|---:|---|---|
| 1 | Frontend/API origin | 사용자에게는 동일 출처로 제공하며 `/api/v1` Reverse Proxy 또는 BFF를 우선한다. 실제 Domain은 Backend Handoff에서 확정한다. |
| 2 | Authentication | Secure HttpOnly server session cookie, HTTPS, SameSite 정책과 CSRF 방어를 사용한다. Token/secret은 browser storage에 저장하지 않는다. |
| 3 | Session expiry | 유휴 30분, 절대 12시간. 저장 중 Draft가 있으면 만료 전에 경고한다. |
| 4 | Concurrent sessions | 승인 기기 최대 3대, 전체 기기 로그아웃을 지원한다. |
| 5 | Sandbox API | Viet QS Backend팀이 Production과 분리된 주소와 owner를 제공한다. |
| 6 | ERP file storage | Provider-neutral Backend Storage Adapter를 사용한다. Provider는 capability로 공개하지 않아도 된다. |
| 7 | File limits | Frontend 하드코딩 금지. `system/capabilities`가 크기·형식·resumable 기준을 제공한다. 초기 UI 제안은 일반 100MB, 대형 자료 2GB다. |
| 8 | Malware scanner | 제품을 고정하지 않는다. Viet QS Backend팀과 보안담당자가 scanner·timeout·quarantine·retry·retention을 제안한다. |
| 9 | Notification | 1차는 ERP 앱 내부 알림. Email/Web Push는 opt-in, Mobile Push는 인프라 이후다. 필수 배정·승인 앱 알림은 완전 비활성화할 수 없다. |
| 10 | Preference sync | locale, theme, density, fontScale, homeWidgets, defaultCompany, favorites, sidebarState, defaultLandingModule을 서버 동기화한다. |
| 11 | Browser Draft TTL | Rolling 7일. 사용자·회사·모듈별 격리하고 서버 저장 후 삭제한다. 민감정보·binary·credential은 금지한다. |
| 12 | GOU first integration | 조직도, 고객·주소록, 공지사항을 읽기 전용으로 우선 검토한다. 출처와 마지막 동기화시각을 표시한다. |
| 13 | Pilot | CON-COST 개발팀과 지정 관리자 소수. 승인된 최소·비식별 자료를 사용하고 GOU와 자동 dual-write하지 않는다. |
| 14 | Production approval | 업무책임자, 보안·IT, 경영진 3개 Gate가 모두 필요하다. |
| 15 | Prisma | 기존 Prisma 자료는 참고자료다. Backend 기술을 강제하지 않으며 OpenAPI·DTO·상태·권한·수락시험이 우선한다. |

## Freeze Rule

정책 변경은 새 계약 버전과 승인 이력을 사용한다. Runtime 구현은 이 문서를 임의 해석하지 않고 capability 및 OpenAPI를 따른다.
