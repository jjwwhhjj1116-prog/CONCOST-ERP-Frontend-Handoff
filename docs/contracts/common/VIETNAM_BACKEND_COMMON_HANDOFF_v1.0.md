# Vietnam Backend Common Handoff v1.0

Status: `FROZEN_V1`

## Authority

Viet QS Backend팀은 API, DB, auth server, file storage, server permission, notification provider, deployment, backup와 migration execution을 담당한다. 구현 기술은 자유지만 OpenAPI, DTO, error, state, permission, file lifecycle과 acceptance test를 준수한다.

## Deployment

- same-origin external delivery through `/api/v1`
- reverse proxy/BFF to the approved Backend upstream
- no hardcoded Backend host in Frontend
- HTTPS and no Production wildcard CORS
- propose Frontend/API domains, Cookie Domain, SameSite and CSRF implementation
- provide isolated API_SANDBOX address and owner

## Auth and Session

Secure HttpOnly session, idle 30 minutes, absolute 12 hours, maximum 3 approved devices and all-device logout. Frontend must not receive session secret or raw token.

## Capabilities

Return API/mode/modules/providers/feature flags plus dynamic file fields: defaultMaxFileSize, moduleMaxFileSize, batchMaxSize, allowedMimeTypes, allowedExtensions, resumableUploadThreshold, scanRequired, storageReady.

## File and Scanner

Implement a provider-neutral Storage Adapter and propose scanner, timeout, quarantine, retry, infected-file retention/disposal, admin review, audit and supported maximum size. Google Shared Drive is a separate integration contract.

## Notifications

Phase 1 is in-app. Preserve system event/audit independently from preferences. Direct PM assignment and mandatory approval in-app notifications cannot be fully disabled. Email/Web Push are opt-in; mobile follows approved infrastructure.

## GOU and Pilot

First read-only candidates are organization, contacts and notices. No GOU write or dual-write. Pilot is CON-COST development team plus named administrators with minimal approved data.

## Production Gates

Business owner, security/IT and executive approval are all required after API, permission, company isolation, file scan, audit, backup, recovery, performance, pilot and GOU cutover validation.

## Endpoint Acceptance Template

Every endpoint documents purpose, actor, permission, company scope, headers, path/query, request/response DTO, errors, transition, revision, idempotency, audit, file reference, example, frontend screen, mock scenario and acceptance tests.
