# OpenAPI Enum Example Mapping v1.0.1

Status: `CONTRACT_SET_V1_0_1_PATCH`

This mapping preserves the 27 legacy synthetic values corrected by `ALL01-OAS-003`. Canonical schema enums and frozen state machines are authoritative; examples do not extend or override an enum.

| Example | Operation | Canonical Schema | Field | Legacy Value | Canonical Target Value | Mapping Reason |
|---|---|---|---|---|---|---|
| BusinessSuccess007 | listLeads | `./schemas/sales.yaml#/components/schemas/LeadDto` | `status` | `DRAFT` | `NEW` | Lead list sample uses the canonical initial Lead state. |
| BusinessSuccess008 | createLead | `./schemas/sales.yaml#/components/schemas/LeadDto` | `status` | `DRAFT` | `NEW` | Lead creation returns the canonical initial Lead state. |
| BusinessSuccess009 | getLead | `./schemas/sales.yaml#/components/schemas/LeadDto` | `status` | `DRAFT` | `NEW` | Lead detail sample uses a valid canonical Lead state. |
| BusinessSuccess010 | updateLead | `./schemas/sales.yaml#/components/schemas/LeadDto` | `status` | `DRAFT` | `QUALIFYING` | Lead update sample represents active qualification without changing the enum. |
| BusinessSuccess011 | qualifyLead | `./schemas/sales.yaml#/components/schemas/LeadDto` | `status` | `DRAFT` | `QUALIFIED` | Qualify command returns the canonical QUALIFIED state. |
| BusinessSuccess012 | disqualifyLead | `./schemas/sales.yaml#/components/schemas/LeadDto` | `status` | `DRAFT` | `DISQUALIFIED` | Disqualify command returns the canonical DISQUALIFIED state. |
| BusinessSuccess013 | convertLead | `./schemas/sales.yaml#/components/schemas/OpportunityDetailDto` | `status` | `DRAFT` | `OPEN` | Lead conversion creates an Opportunity in the canonical OPEN state. |
| BusinessSuccess015 | createOpportunity | `./schemas/sales.yaml#/components/schemas/OpportunityDetailDto` | `status` | `DRAFT` | `OPEN` | Opportunity creation returns the canonical OPEN state. |
| BusinessSuccess016 | getOpportunity | `./schemas/sales.yaml#/components/schemas/OpportunityDetailDto` | `status` | `DRAFT` | `OPEN` | Opportunity detail sample uses the canonical OPEN state. |
| BusinessSuccess024 | getContactSyncCapabilities | `./schemas/contacts.yaml#/components/schemas/ContactSyncStatusDto` | `syncDirection` | `UNDECIDED` | `ERP_TO_GOOGLE_OPT_IN` | Frozen policy permits opt-in ERP-to-Google sync; provider availability remains separate. |
| BusinessSuccess025 | createBusinessCardCapture | `./schemas/contacts.yaml#/components/schemas/BusinessCardCaptureDto` | `status` | `DRAFT` | `UPLOADED` | Capture creation consumes a READY file and returns the canonical uploaded state. |
| BusinessSuccess026 | getBusinessCardCapture | `./schemas/contacts.yaml#/components/schemas/BusinessCardCaptureDto` | `status` | `DRAFT` | `UPLOADED` | Capture detail sample uses a valid pre-OCR state. |
| BusinessSuccess027 | startBusinessCardOcr | `./schemas/contacts.yaml#/components/schemas/BusinessCardCaptureDto` | `status` | `DRAFT` | `OCR_QUEUED` | Starting OCR returns the canonical queued state. |
| BusinessSuccess074 | createInternalClaim | `./schemas/claims.yaml#/components/schemas/InternalClaimDetailDto` | `status` | `DRAFT` | `RECEIVED` | Internal Claim creation returns the canonical RECEIVED state. |
| BusinessSuccess075 | getInternalClaim | `./schemas/claims.yaml#/components/schemas/InternalClaimDetailDto` | `status` | `DRAFT` | `RECEIVED` | Internal Claim detail sample uses the canonical initial state. |
| BusinessSuccess076 | updateInternalClaim | `./schemas/claims.yaml#/components/schemas/InternalClaimDetailDto` | `status` | `DRAFT` | `RECEIVED` | Ordinary update does not imply a lifecycle transition. |
| BusinessSuccess077 | triageInternalClaim | `./schemas/claims.yaml#/components/schemas/InternalClaimDetailDto` | `status` | `DRAFT` | `TRIAGE` | Triage command returns the canonical TRIAGE state. |
| BusinessSuccess078 | listClaimServiceProjects | `./schemas/claims.yaml#/components/schemas/ClaimServiceProjectDto` | `status` | `DRAFT` | `INTAKE` | Claim Service list sample uses the canonical initial state. |
| BusinessSuccess079 | createClaimServiceProject | `./schemas/claims.yaml#/components/schemas/ClaimServiceProjectDto` | `status` | `DRAFT` | `INTAKE` | Claim Service creation returns the canonical INTAKE state. |
| BusinessSuccess080 | getClaimServiceProject | `./schemas/claims.yaml#/components/schemas/ClaimServiceProjectDto` | `status` | `DRAFT` | `INTAKE` | Claim Service detail sample uses the canonical initial state. |
| BusinessSuccess081 | updateClaimServiceProject | `./schemas/claims.yaml#/components/schemas/ClaimServiceProjectDto` | `status` | `DRAFT` | `INTAKE` | Ordinary update does not imply a lifecycle transition. |
| BusinessSuccess082 | runClaimConflictCheck | `./schemas/claims.yaml#/components/schemas/ClaimServiceProjectDto` | `status` | `DRAFT` | `CONFLICT_CHECK` | Conflict-check command returns the canonical CONFLICT_CHECK state. |
| BusinessSuccess083 | activateClaimServiceProject | `./schemas/claims.yaml#/components/schemas/ClaimServiceProjectDto` | `status` | `DRAFT` | `EVIDENCE_COLLECTION` | Activating a contracted service begins the canonical delivery phase. |
| BusinessSuccess084 | closeClaimServiceProject | `./schemas/claims.yaml#/components/schemas/ClaimServiceProjectDto` | `status` | `DRAFT` | `CLOSED` | Close command returns the canonical CLOSED state. |
| BusinessSuccess087 | createAiOcrJob | `./schemas/ai.yaml#/components/schemas/AiJobDto` | `status` | `DRAFT` | `QUEUED` | OCR job creation returns the canonical QUEUED state. |
| BusinessSuccess088 | createAiTranscriptionJob | `./schemas/ai.yaml#/components/schemas/AiJobDto` | `status` | `DRAFT` | `QUEUED` | Transcription job creation returns the canonical QUEUED state. |
| BusinessSuccess089 | createAiSummarizationJob | `./schemas/ai.yaml#/components/schemas/AiJobDto` | `status` | `DRAFT` | `QUEUED` | Summarization job creation returns the canonical QUEUED state. |

## Invariants

- No example was deleted or renamed.
- No schema enum, endpoint, DTO, or business state changed.
- Legacy values remain documented here for traceability only.
- `DRAFT` remains valid only in contexts whose canonical schema explicitly declares it.
- Provider availability and provider lifecycle remain independent from example state values.
