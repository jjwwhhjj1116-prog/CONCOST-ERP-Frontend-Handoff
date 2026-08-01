# Business Module State Machines v1.0

Status: `BUSINESS_CONTRACT_FROZEN_V1`

These Target enums extend the frozen Common, Project Chain and Collaboration contracts. Source states remain in parity and mapping documents; they are not silently discarded.

| Context | Canonical Target States | Invariant |
|---|---|---|
| Contact Merge | REVIEW_REQUIRED → APPROVAL_PENDING → MERGED \| REJECTED \| CANCELLED | CRM_DATA_STEWARD or SALES_MANAGER approval; no automatic merge |
| Business Card | LOCAL_SELECTED → UPLOADING → UPLOADED → OCR_QUEUED → OCR_PROCESSING → REVIEW_REQUIRED → DUPLICATE_REVIEW → READY_TO_CREATE → CREATED → SYNC_PENDING → SYNCED; FAILED/CANCELLED | Human review and duplicate review precede Contact creation |
| Opportunity | OPEN \| ON_HOLD \| WON \| LOST \| CANCELLED | Pipeline Stage is versioned and separate from status |
| Finance Transaction | DRAFT → SUBMITTED → APPROVED → POSTED; VOIDED/CANCELLED | POSTED is immutable; correction/void command only |
| Tax Invoice | DRAFT → VALIDATION_REQUIRED → APPROVAL_PENDING → APPROVED → SUBMISSION_PENDING → SUBMITTED → ACCEPTED; REJECTED/FAILED/CANCELLED/CORRECTION_REQUIRED/CORRECTED | Provider absence blocks provider submission and success |
| Employment | ACTIVE \| ON_LEAVE \| SUSPENDED \| RESIGNED \| RETIRED \| CONTRACT_ENDED | Employment, account and business-role states are separate |
| Drive Provider | NOT_CONFIGURED → CONNECTING → READY \| DEGRADED \| FAILED \| DISABLED | Public link is forbidden by default; secrets are server-only |
| Internal Claim | RECEIVED → TRIAGE → INVESTIGATING → ACTION_REQUIRED → RESOLUTION_PROPOSED → RESOLVED → CLOSED; REOPENED/CANCELLED | Internal operational context only |
| Claim Service | INTAKE → CONFLICT_CHECK → CONTRACTING → EVIDENCE_COLLECTION → ANALYSIS → REPORT_DRAFTING → CLIENT_REVIEW → FINALIZED → CLOSED; ON_HOLD/CANCELLED | External professional-service context only |
| Claim Report | DRAFT → REVIEW → APPROVED → ISSUED; SUPERSEDED/WITHDRAWN | AI cannot approve or issue; issued versions are immutable |
| AI Job | QUEUED → PROCESSING → REVIEW_REQUIRED → COMPLETED; FAILED/CANCELLED | Citation, ACL and human review are mandatory |

## Pipeline Defaults

### Lead

`NEW → CONTACT_ATTEMPTED → QUALIFYING → QUALIFIED → CONVERTED`, with `DISQUALIFIED` and `ARCHIVED` terminal/correction branches.

### Opportunity Stage

`DISCOVERY → REQUIREMENT_CONFIRMED → ESTIMATE_REQUESTED → ESTIMATE_PREPARING → ESTIMATE_SENT → NEGOTIATION`, with `ON_HOLD`, `WON`, `LOST` and `CANCELLED`.

Stages are company-versioned Backend capability data. Frontend hardcoding is prohibited.
