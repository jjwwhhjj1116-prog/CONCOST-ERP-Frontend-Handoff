# GOU Coexistence Policy v1.0

Status: `FROZEN_V1`

## Operational Boundary

GOU가 현재 운영 SSOT다. Cutover 전 실제 운영 입력은 GOU에서 수행한다. 신규 ERP는 source와 lastSyncedAt을 표시하며 동기화 완료를 가장하지 않는다.

## First Read-only Integration Review

| Module | Direction | New ERP write | Required evidence |
|---|---|---:|---|
| 조직도 | GOU -> ERP read-only | 금지 | source, lastSyncedAt, field/permission mapping |
| 고객·주소록 | GOU -> ERP read-only | 금지 | 개인정보 최소화, scope, reconciliation |
| 공지사항 | GOU -> ERP read-only | 금지 | source, publish state, attachment policy |

메일과 전자결재 전체 이관은 별도 GOU Migration Project로 분리한다.

## Forbidden

- automatic dual-write
- 신규 ERP에서 GOU 원본 수정
- Demo/fixture를 운영자료로 표시
- source 또는 sync time 없는 mirror
- 실패한 동기화를 성공으로 표시

## Cutover Gate

모듈별 Backend capability, scope·permission test, reconciliation, rollback, named owner와 승인 후에만 `PILOT`으로 변경한다.
