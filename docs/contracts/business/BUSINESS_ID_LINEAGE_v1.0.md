# Business ID Lineage

| Context | Lineage | Invariant | Evidence |
|---|---|---|---|
| Sales | companyId → customerId → contactId → leadId → opportunityId → estimateRequestId → projectId | Canonical IDs only; Estimate Request and Project IDs are owned by Project Chain. | PROJECT_CONTRACT |
| Business Card | fileId → businessCardCaptureId → ocrJobId → contactId → contactSyncBindingId | File READY before OCR; human review before Contact. | PROPOSAL |
| Finance | companyId → financeTransactionId → receivable/payableId → receipt/paymentId → taxInvoiceId → providerSubmissionId | Optional projectId is an ID reference, never a copied ledger. | PROPOSAL |
| HR | companyId → personnelId → organizationMembershipId → businessRoleAssignmentId → accountId | Rank/title never derives role. personnelId and membership IDs are separate. | POLICY_FROZEN |
| Drive | providerBindingId → driveFolderBindingId → driveItemReferenceId → fileId → projectId/claimId | Provider secrets stay server-side; File Reference owns upload/scan lifecycle. | COMMON_CONTRACT + PROPOSAL |
| Internal Claim | companyId → internalClaimId → claimIssueId/claimEvidenceId/claimDeadlineId | No external Claim Service ID reuse. | PROPOSAL |
| Claim Service | projectId → claimServiceProjectId → disputeCaseId → issueId/evidenceId/meetingId/reportId | One canonical Project; legal context is separate. | PROJECT_CONTRACT + PROPOSAL |
| AI | sourceFileId/version → aiJobId → aiOutputId → citationId → feedbackId | Output never replaces source and never auto-decides. | PROPOSAL |
| Search | sourceType + sourceId → route | Provider returns only authorized safe projection; no title leak before permission. | COLLABORATION_CONTRACT |

Display names, email addresses, folder names and project names are never relationship keys.
