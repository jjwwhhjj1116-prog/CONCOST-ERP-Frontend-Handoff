# Business Example Catalog

All examples use synthetic identifiers and data. They are contract examples, not fixture or operational records.

| Example | Kind | Operation | Status | Contract assertion |
|---|---|---|---|---|
| ContactMergeApproval | SUCCESS | mergeContacts | MERGED | {"approvedByCapability":"CRM_DATA_STEWARD","canonicalContactId":"contact-demo-canonical"} |
| ContactMergeRejected | ERROR | mergeContacts | REJECTED | {"errorCode":"CONTACT_MERGE_APPROVAL_REQUIRED"} |
| BusinessCardOcrReview | SUCCESS | reviewBusinessCardOcr | REVIEW_REQUIRED | {"humanReviewRequired":true} |
| GoogleContactsOneWaySync | SUCCESS | syncContact | SYNC_PENDING | {"direction":"ERP_TO_GOOGLE","optIn":true} |
| GooglePullImportReview | SUCCESS | pullContactSync | IMPORT_REVIEW | {"autoMerge":false} |
| PipelineDefaultStages | SUCCESS | listOpportunities | OPEN | {"pipelineVersion":"default-v1","companyConfigurable":true} |
| OpportunityCreateEstimate | SUCCESS | createEstimateRequestFromOpportunity | ESTIMATE_REQUESTED | {"estimateRequestId":"estimate-request-demo-001"} |
| FinanceV1Transaction | SUCCESS | createFinanceTransaction | DRAFT | {"amount":"1500000","currency":"KRW","sourceType":"MANUAL"} |
| AccountingPhase2Capability | SUCCESS | getFinanceDashboard | ACCOUNTING_PHASE_2_APPROVED | {"enabled":false} |
| TaxProviderNotConfigured | ERROR | submitTaxInvoiceProvider | NOT_CONFIGURED | {"errorCode":"TAX_INVOICE_PROVIDER_NOT_CONFIGURED"} |
| TaxApprovalSubmission | SUCCESS | approveTaxInvoice | APPROVED | {"next":"SUBMISSION_PENDING"} |
| BankProviderDeferred | SUCCESS | getCashPosition | PILOT_PHASE_DEFERRED | {"realTime":false,"allowedSource":"APPROVED_IMPORT"} |
| FinancePmSummaryPermission | SUCCESS | getFinanceReport | SUMMARY | {"payrollVisible":false,"bankSourceVisible":false} |
| HrSourceConflict | ERROR | updatePersonnel | CONFLICT | {"errorCode":"HR_SOURCE_CONFLICT","sourceSystem":"GOU"} |
| LeaveReadOnlyGou | SUCCESS | listLeaveReferences | READ_ONLY | {"sourceSystem":"GOU","writable":false} |
| SharedDriveProviderReady | SUCCESS | getDriveCapabilities | READY | {"provider":"GOOGLE_SHARED_DRIVE","publicLinkAllowed":false} |
| ProjectActivatedFolderIntent | SUCCESS | createProjectFolderBinding | SYNC_PENDING | {"trigger":"PROJECT_ACTIVATED","idempotent":true} |
| FolderCreationRetry | ERROR | getDriveSyncJob | FAILED | {"errorCode":"DRIVE_SYNC_FAILED","retryable":true,"projectRollback":false} |
| InternalClaimCreated | SUCCESS | createInternalClaim | RECEIVED | {"context":"INTERNAL_CLAIM"} |
| ClaimServiceConflictCheck | SUCCESS | runClaimConflictCheck | CONFLICT_CHECK | {"context":"CLAIM_SERVICE"} |
| EvidenceLegalHold | SUCCESS | setInternalClaimLegalHold | LEGAL_HOLD | {"immutableOriginal":true,"checksum":"sha256:demo-checksum"} |
| LegalHoldReleaseDenied | ERROR | setInternalClaimLegalHold | LEGAL_HOLD | {"errorCode":"LEGAL_HOLD_RELEASE_FORBIDDEN"} |
| CallRecordingPolicyMissing | ERROR | registerClaimCallRecord | POLICY_TBD | {"errorCode":"RECORDING_POLICY_REQUIRED"} |
| RestrictedLegalLocalAi | SUCCESS | createAiSummarizationJob | QUEUED | {"classification":"RESTRICTED_LEGAL","providerMode":"LOCAL_ONLY"} |
| RagCitation | SUCCESS | queryAiRag | REVIEW_REQUIRED | {"citations":[{"fileId":"file-demo-001","version":2,"page":7,"chunk":"chunk-demo-01"}]} |
| AiPermissionDenied | ERROR | queryAiRag | FAILED | {"errorCode":"AI_PERMISSION_DENIED"} |
| ProviderDegraded | ERROR | getAiCapabilities | DEGRADED | {"errorCode":"AI_PROVIDER_DEGRADED","retryable":true} |
| GouUnknownSource | SUCCESS | getBusinessSearchProviders | GOU_UNKNOWN_READ_ONLY_DEFERRED | {"dualWrite":false} |
| PilotPhaseCapability | SUCCESS | getContactSyncCapabilities | PILOT_PHASE_DEFERRED | {"pilot":"B2","enabled":false} |
| SecurityRestrictedSearch | ERROR | searchBusinessModules | FORBIDDEN | {"errorCode":"SEARCH_RESULT_FORBIDDEN","titleExposed":false} |
