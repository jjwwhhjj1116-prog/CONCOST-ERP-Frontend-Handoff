# Execution Mode and Fallback Policy v1.0

Status: `FROZEN_V1`

| Rule | `DEMO_LOCAL` | `API_SANDBOX` | `PRODUCTION_SERVER` |
|---|---|---|---|
| Purpose | UI·workflow 시연 | Backend 계약 검증 | 실제 운영 |
| Data | 비식별 fixture/mock | 비식별 테스트 데이터 | 서버 권위 데이터 |
| Badge | 항상 `DEMO MODE` | 항상 테스트 환경 표시 | 승인된 환경 표시 |
| Fixture/mock fallback | 명시적 scenario만 | 자동 fallback 금지 | 금지 |
| API failure success | 금지 | 금지 | 금지 |
| Browser business SSOT | 금지 | 금지 | 금지 |
| Saved | `UNSYNCED_LOCAL` | 서버 성공만 | 서버 ID/revision/updatedAt 이후만 |

## Fixed Demo Message

- KO: `DEMO MODE · 현재 데이터는 실제 서버에 저장되지 않습니다.`
- EN: `DEMO MODE · This data is not saved to the production server.`
- VI: `CHẾ ĐỘ DEMO · Dữ liệu này không được lưu trên máy chủ vận hành.`

## Mode Control

Build/deployment configuration과 server capability가 mode를 결정한다. 일반 사용자는 URL, query, localStorage 또는 개발자도구로 Production을 Demo로 낮출 수 없다. Production에 API가 없으면 `SERVER_NOT_CONFIGURED`이며 Demo adapter를 생성하지 않는다.

## Temporary Browser Draft

- rolling TTL 7 days
- key: mode + userId + companyId + module + draftId
- 서버 저장 후 삭제
- 사용자/회사 전환 시 다른 scope 로드 금지
- logout 시 경고 후 삭제 또는 승인된 보존
- `UNSYNCED_LOCAL` 고정 표시
- password, secret, binary, 민감 HR/finance, 승인문서, mail body, 법적 증거 금지

## Server Draft

24시간 자동삭제와 자동 물리삭제를 금지한다. 장기 미수정은 `STALE` 표시가 가능하며 모듈별 취소·Archive·보존계약을 따른다. Project Intake Draft는 명시적 취소 또는 승인된 보존정책을 사용한다.
