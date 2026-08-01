# Common API and Persistence Contract v1.0

Status: `FROZEN_V1`

## 1. Technology-neutral Boundary

API DTO는 DB table, ORM relation 또는 Backend 언어를 노출하지 않는다. ID는 opaque string이며 Frontend는 ID 형식을 해석하지 않는다. OpenAPI 계약이 Prisma를 포함한 구현 참고자료보다 우선한다.

## 2. Deployment and Transport

- 사용자 관점에서 Web과 API는 동일 출처로 제공한다.
- Production 기본 구조는 `https://erp.<company-domain>/`와 같은 origin의 `/api/v1/`이다.
- 분리된 Backend host는 Reverse Proxy/BFF 뒤에 둔다.
- Frontend에 Backend 실제 host를 하드코딩하지 않고 환경설정을 사용한다.
- Production CORS wildcard를 금지한다.
- HTTPS, Secure cookie, CSRF와 allowlist를 적용한다.
- 실제 Domain/Cookie Domain/SameSite 세부값은 Backend Handoff 배포 설계에서 기록한다.

## 3. Runtime Modes

`DEMO_LOCAL`, `API_SANDBOX`, `PRODUCTION_SERVER`만 허용한다. Production은 fixture/mock fallback, localStorage 업무 SSOT, API 실패 성공 처리와 브라우저 설정에 의한 mode downgrade를 금지한다.

## 4. Data Ownership

| Class | Rule |
|---|---|
| `FRONTEND_PREFERENCE` | 비민감 화면 상태만 로컬 임시 저장 가능하며 승인된 preference는 서버 동기화 |
| `TEMPORARY_DRAFT_CACHE` | 비민감 미전송 입력만 rolling 7일, 사용자·회사·모듈 key로 격리 |
| `SERVER_PERSISTENCE_REQUIRED` | 사용자·조직·프로젝트·결재·메일·일정·고객·재무·파일·알림·감사·상태·revision은 서버 SSOT |

Server Draft는 자동 물리삭제하지 않는다. 장기 미수정은 `STALE`로 표시할 수 있으며 보존·취소·Archive는 모듈 계약이 정한다.

## 5. Save and Concurrency

상태는 `IDLE`, `DIRTY`, `SAVING`, `SAVED`, `ERROR`, `CONFLICT`, `OFFLINE`, `UNSYNCED_LOCAL`, `READ_ONLY`다. `SAVED`는 서버 ID, revision, updatedAt을 포함한 성공 응답 이후에만 표시한다. 수정 문서는 `If-Match`; 중복 위험 command는 `Idempotency-Key`를 사용한다.

## 6. Company, Locale and Cache

회사 업무 API는 `X-Company-Id`가 필수다. 기본회사 fallback은 금지하고 서버가 `allowedCompanyIds`와 resource company를 검증한다. Cache key는 mode, API version, user, permissions version, company를 포함한다. 회사 전환 전 응답을 새 회사에 적용하지 않는다. `Accept-Language`는 `ko-KR`, `en-US`, `vi-VN`이다.

## 7. Response and Error

성공은 `data + meta`, 오류는 stable code/messageKey/requestId/details/retryable envelope를 사용한다. Stack, SQL, table명, provider secret은 반환하지 않는다. Frontend는 Backend 원문을 그대로 표시하지 않고 검토된 KO/EN/VI 문구를 사용한다.

## 8. Permission and Audit

메뉴 숨김은 보안이 아니다. Backend는 Company, Organization, Project, Role, Action, Resource State, Confidentiality를 최종 검증한다. Mutation audit는 actor, company, action, resource, before/after summary, request/correlation ID, timestamp와 결과를 보존한다.

## 9. Files and Google Drive

ERP 첨부는 provider-neutral File API를 사용한다. Google Shared Drive는 계정·Shared Drive·folder 권한을 다루는 별도 Integration Contract이며 일반 File API provider와 혼동하지 않는다.

## 10. GOU

GOU가 현재 운영 SSOT다. Cutover 전 운영 입력은 GOU에서 수행한다. 자동 dual-write, 동기화 완료 가장, Demo 데이터 운영표시는 금지한다.
