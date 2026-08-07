# RC3 Claim Center, Drive, AI, and Approval Backend Delta

Status: `BACKEND_CAPABILITY_PENDING`

The RC3 frontend now exposes one operational Claim workflow. This document is a Viet QS backend handoff; it does not amend the frozen OpenAPI contract and it does not claim that a provider or production server is connected.

## Canonical Identity

Every Claim record must be addressed by both identifiers:

```text
Project.id (canonical projectId)
  -> ClaimProject.projectId
  -> ClaimProject.claimId
  -> ClaimEvidence.projectId + claimId
  -> ClaimMeeting.projectId + claimId
  -> ClaimIssue.claimId
  -> ClaimReport.claimId
  -> ApprovalRequest.projectId + claimId + reportId + reportVersionId
  -> DriveFolderBinding.projectId + claimId
```

`INTERNAL_CLAIM` and `CONSULTING_PROJECT` are Claim kinds, not separate Project copies. The backend must reject title matching, mirror arrays, and per-department Project duplication.

## Common Request Boundary

All endpoints below require:

- authenticated user session;
- explicit `X-Company-Id`;
- membership in the selected company;
- permission check before metadata projection;
- `If-Match` revision for updates;
- `Idempotency-Key` for commands;
- company equality across Project, Claim, file, approval, and actor;
- audit before/after references and notification outbox in the same transaction where applicable.

Missing company returns `400 COMPANY_SCOPE_REQUIRED`. Unauthorized company returns `403 COMPANY_SCOPE_FORBIDDEN`. Cross-company identifiers return `404 RESOURCE_NOT_FOUND` without leaking titles or file names.

## Claim Project

Suggested resources:

```http
GET   /api/v1/claim-projects/{claimId}
PATCH /api/v1/claim-projects/{claimId}
GET   /api/v1/claim-projects/{claimId}/timeline
```

The response must include `projectId`, `claimId`, `companyId`, `kind`, `revision`, capability flags, and counts. Claim Center navigation queries only Project assignments for the Claim unit.

## Drive Folder Binding

The required folder template is immutable by code and provisioned per provider capability:

| Code | Name | Purpose |
|---|---|---|
| 00 | 프로젝트관리 | Project administration |
| 01 | 계약·수주 | Contract and award |
| 02 | 접수원본 | Original intake |
| 03 | 현장조사 | Site research |
| 04 | 증거자료 | Evidence |
| 05 | 회의록 | Meeting minutes |
| 06 | 쟁점·분석 | Issues and analysis |
| 07 | Workpaper | Workpapers |
| 08 | 보고서 | Reports |
| 09 | 결재·확정본 | Approved final versions |
| 10 | 납품 | Delivery |

Suggested resources:

```http
POST /api/v1/claim-projects/{claimId}/drive-binding
GET  /api/v1/claim-projects/{claimId}/drive-folders
POST /api/v1/claim-projects/{claimId}/evidence
```

Evidence metadata requires a READY `fileReferenceId`, immutable version, checksum, classification, optional issue link, and scan state. Provider tokens and Shared Drive secrets stay server-side. A provider failure must not be represented as READY.

## Meeting and AI Review

Suggested resources:

```http
POST /api/v1/claim-projects/{claimId}/meetings
POST /api/v1/claim-projects/{claimId}/meetings/{meetingId}/ai-jobs
PUT  /api/v1/claim-projects/{claimId}/meetings/{meetingId}/review
POST /api/v1/claim-projects/{claimId}/meetings/{meetingId}/candidates
```

Meeting input includes title, date/time, location, attendees, rough notes, optional audio file reference, linked evidence, and linked issues. Audio requires explicit consent or legal basis. `RESTRICTED_LEGAL` input is blocked unless a Private/Local AI capability is ready.

AI output remains a draft until human review. The review payload contains editable summary, decisions, issues, action items with owner/due text, next schedule, and citations. Task, Calendar, Drive, and Approval outputs are candidates only; each requires a separate confirmed command.

AI provenance must persist:

- provider, model, and model version;
- system and task instruction IDs;
- input source IDs and input scope;
- source and output checksums;
- requester and generator;
- generation timestamp;
- review status and reviewer;
- citations.

The backend must never promote an AI result directly into official minutes, a legal finding, or a final report.

## Issues and Workpapers

Suggested resources:

```http
POST /api/v1/claim-projects/{claimId}/issues
PATCH /api/v1/claim-projects/{claimId}/issues/{issueId}
POST /api/v1/claim-projects/{claimId}/workpapers
POST /api/v1/claim-projects/{claimId}/workpapers/{workpaperId}/versions
```

Issue links to evidence and meetings by immutable IDs. Workpaper versions are append-only after review. Search projection must apply Claim permission before returning issue titles, file names, participants, or report metadata.

## Report, Approval, and Delivery

The required report lifecycle is:

```text
DRAFT -> REVIEW -> APPROVAL_PENDING -> APPROVED -> DELIVERED
```

No state may skip approval. AI can assist a DRAFT only. A report submitted for approval must reference one immutable `reportVersionId` and one READY file reference.

Suggested commands:

```http
POST /api/v1/claim-projects/{claimId}/reports
POST /api/v1/claim-projects/{claimId}/reports/{reportId}/review
POST /api/v1/claim-projects/{claimId}/reports/{reportId}/approval-draft
POST /api/v1/claim-projects/{claimId}/reports/{reportId}/revisions
POST /api/v1/claim-projects/{claimId}/reports/{reportId}/deliveries
```

The approval draft payload includes `projectId`, `claimId`, `reportId`, `reportVersionId`, and READY `fileReferenceId`. The existing electronic approval policy and line manager remain authoritative. The frontend must not choose the current user as an approver fallback.

Approval completion should append a final candidate into Drive folder `09`; delivery appends the exact approved version into folder `10`. A revision creates a new DRAFT version and preserves prior approved and delivered versions.

## Transaction and Idempotency

Every mutation uses a key scoped by company and resource, for example:

```text
claim:{claimId}:meeting:{clientCommandId}
claim:{claimId}:report:{reportId}:submit:{revision}
claim:{claimId}:delivery:{reportVersionId}:{clientCommandId}
```

Duplicate delivery, approval submission, notification, Drive copy, and AI candidate creation must return the prior result with `idempotent: true`. Outbox records are committed with the business mutation and delivered asynchronously.

## Notification Events

- `CLAIM_EVIDENCE_ADDED`
- `CLAIM_MEETING_CREATED`
- `CLAIM_AI_MINUTES_REVIEWED`
- `CLAIM_ISSUE_CREATED`
- `CLAIM_REPORT_REVIEW_REQUESTED`
- `CLAIM_REPORT_APPROVAL_DRAFT_CREATED`
- `CLAIM_REPORT_APPROVED`
- `CLAIM_REPORT_REVISION_CREATED`
- `CLAIM_REPORT_DELIVERED`

Preferences control delivery channels, not event retention. Recipients are resolved server-side from Claim membership, assignment, approval line, and explicit watchers.

## Frontend Capability Contract

The frontend supports `DEMO_LOCAL`, `API_SANDBOX`, and `PRODUCTION_SERVER`. In server modes, unavailable adapters or providers return `BACKEND_REQUIRED` or `PROVIDER_NOT_CONFIGURED`; local simulation is never an automatic fallback. Demo records are synthetic and must not be imported as production data.

## Acceptance Gate

Backend handoff is accepted when tests prove:

1. company and resource scope isolation;
2. one canonical Project and Claim identity;
3. exact folder taxonomy and READY file enforcement;
4. consent and restricted-AI blocking;
5. editable human review with provenance and citations;
6. candidate outputs are not auto-created;
7. permission-first search and list projection;
8. report transition and immutable revision rules;
9. approval snapshot and READY file linkage;
10. idempotent outbox, delivery, and revision behavior.
