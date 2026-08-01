# Frontend-Backend Contracts

이 경로는 CON-COST ERP Frontend와 Viet QS Backend 사이의 승인된 계약 기준을 보관한다.

## 계약 우선순위

1. FE-CONTRACT-01 Final
2. 이후 승인된 Module Contract
3. OpenAPI 3.1
4. 상태전이·권한·오류 문서
5. 기존 Prisma·서버 구현
6. Fixture·Mock·화면 하드코딩

충돌 시 OpenAPI와 승인된 정책문서가 기준이다.

## 현재 운영경계

- GOU: 현재 실제 운영 SSOT
- 신규 ERP: Frontend·API 계약·Mock·Pilot 준비
- Viet QS 개발팀: Backend·DB·Storage·Deployment

## 실행 모드

- `DEMO_LOCAL`
- `API_SANDBOX`
- `PRODUCTION_SERVER`

## 금지

- Production Mock fallback
- localStorage 업무 SSOT
- 서버 실패 후 성공 표시
- 회사 기본값 fallback
- 이름 문자열 관계
- 파일 metadata-only 성공 표시
- 자동 Dual Write

## 다음 Module Contract

- FE-CONTRACT-02 Project Chain
- FE-CONTRACT-03 Collaboration
- FE-CONTRACT-04 Business Modules
