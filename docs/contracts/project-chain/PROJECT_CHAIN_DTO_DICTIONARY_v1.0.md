# PROJECT CHAIN DTO DICTIONARY v1.0

`*` denotes a schema-required field. Submit/transition constraints may be stricter than a
Draft DTO and are specified by operation `x-contract`.

| Schema | File | Fields |
|---|---|---|
| EstimateRequestSummaryDto | openapi/schemas/estimates.yaml | id*, companyId*, status*, revision*, createdAt, updatedAt, permissions*, projectName*, clientDisplayName*, ownerPersonnelCardId, receivedAt |
| EstimateRequestDetailDto | openapi/schemas/estimates.yaml | id*, companyId*, status*, revision*, createdAt, updatedAt, permissions*, projectName*, clientDisplayName*, ownerPersonnelCardId, receivedAt, inquiryMemo*, contacts*, activities*, files* |
| EstimateSheetDto | openapi/schemas/estimates.yaml | id*, companyId*, status*, revision*, createdAt, updatedAt, permissions*, estimateRequestId*, templateType*, version*, workbookState*, immutable*, documentHash, issuedAt, supersedesEstimateSheetId |
| EstimateSubmissionDto | openapi/schemas/estimates.yaml | id*, companyId*, status*, revision*, createdAt, updatedAt, permissions*, estimateSheetId*, version*, recipientDisplay*, channel*, documentFileId, sentAt |
| CommercialDecisionDto | openapi/schemas/estimates.yaml | id*, companyId*, estimateRequestId*, estimateSubmissionId, decision*, reason, agreedAmount, decidedAt*, revision*, workflowPhase*, correctionOfDecisionId, correctionReason, sourceLineagePreserved* |
| EstimateRequestWriteRequest | openapi/schemas/estimates.yaml | projectName*, clientDisplayName*, inquiryMemo, ownerPersonnelCardId |
| EstimateSheetWriteRequest | openapi/schemas/estimates.yaml | templateType*, workbookState*, reason |
| EstimateBusinessRecordDto | openapi/schemas/estimates.yaml | id*, companyId*, status*, revision*, createdAt, updatedAt, permissions*, recordType*, projectId, periodKey, displayName*, amount, payload* |
| EstimateBusinessRecordWriteRequest | openapi/schemas/estimates.yaml | recordType*, projectId, periodKey, displayName*, amount, payload* |
| EstimateBusinessReportDto | openapi/schemas/estimates.yaml | companyId*, reportType*, periodKey*, generatedAt*, rows*, permissions* |
| EstimateBusinessExportRequest | openapi/schemas/estimates.yaml | reportType*, periodKey, format*, filters* |
| ProjectSummaryDto | openapi/schemas/project-common.yaml | id*, companyId*, status*, revision*, createdAt, updatedAt, permissions*, name*, health*, primaryOrganizationUnitId, primaryTeamUnitId, newBadge*, newUntil, projectNo |
| ProjectAssignmentDto | openapi/schemas/project-common.yaml | id*, projectId*, organizationUnitId*, personnelCardId, role*, status*, validFrom*, validTo |
| ProjectParticipantDto | openapi/schemas/project-common.yaml | personnelCardId*, assignmentId*, role*, active* |
| ProjectScheduleDto | openapi/schemas/project-common.yaml | id*, companyId*, status*, revision*, createdAt, updatedAt, permissions*, projectId*, pmPersonnelCardId, resourcePersonnelCardIds*, plannedStartDate, plannedEndDate, pmCandidatePersonnelCardIds*, assignedPmPersonnelCardIds* |
| ProjectTimelineItemDto | openapi/schemas/project-common.yaml | id*, projectId*, kind*, occurredAt*, actorId*, summary*, safePayload* |
| ProjectNotificationDto | openapi/schemas/project-common.yaml | id*, eventType*, projectId*, summary*, route*, readAt, createdAt* |
| ApprovalPolicySummaryDto | openapi/schemas/project-common.yaml | approvalPolicyId*, version*, steps*, currentStep, unavailableReason, permissions* |
| PermissionCapabilitiesDto | openapi/schemas/project-common.yaml | (none) |
| ProjectDetailDto | openapi/schemas/project-common.yaml | id*, companyId*, status*, revision*, createdAt, updatedAt, permissions*, name*, health*, primaryOrganizationUnitId, primaryTeamUnitId, newBadge, newUntil, estimateRequestId*, commercialDecisionId*, executionPlanId*, projectIntakeId*, assignments*, participants*, schedule, timeline*, projectNo, projectNoIssuedAt, completionGate, archiveGate, legacyBridge |
| ProjectActionRequest | openapi/schemas/project-common.yaml | action*, reason, targetState, payload |
| ExecutionPlanUnitDto | openapi/schemas/project-intake.yaml | id*, organizationUnitId*, role*, sortOrder* |
| ProjectExecutionPlanDto | openapi/schemas/project-intake.yaml | id*, companyId*, status*, revision*, createdAt, updatedAt, permissions*, commercialDecisionId*, units*, pmCandidatePersonnelCardId, canConfirmExecutionPlan* |
| ProjectIntakeStep1Dto | openapi/schemas/project-intake.yaml | projectName*, projectCodeCandidate, workNature*, workScopes*, sourceEstimateRequestId*, sourceEstimateSubmissionId*, changeReason |
| ProjectIntakeStep2Dto | openapi/schemas/project-intake.yaml | materials* |
| ProjectIntakeStep3Dto | openapi/schemas/project-intake.yaml | plannedStartDate*, plannedDeliveryDate*, primaryOrganizationUnitId*, primaryTeamUnitId*, participantTeamUnitIds*, supportOrganizationUnitIds*, pmCandidatePersonnelCardId, teamScopes*, pmCandidatePersonnelCardIds |
| ProjectIntakeStep4Dto | openapi/schemas/project-intake.yaml | contacts*, workDescription*, specialRequests*, awardRequestText*, requestNoteFileIds* |
| ProjectIntakeSummaryDto | openapi/schemas/project-intake.yaml | id*, companyId*, status*, revision*, createdAt, updatedAt, permissions*, projectId*, executionPlanId*, currentStep*, projectName* |
| ProjectIntakeDetailDto | openapi/schemas/project-intake.yaml | id*, companyId*, status*, revision*, createdAt, updatedAt, permissions*, projectId*, executionPlanId*, currentStep*, projectName*, step1, step2, step3, step4, approvalPolicy*, intakeNo*, projectNo* |
| ExecutionPlanWriteRequest | openapi/schemas/project-intake.yaml | commercialDecisionId*, units*, pmCandidatePersonnelCardId, pmCandidatePersonnelCardIds |
| ProjectIntakeCreateRequest | openapi/schemas/project-intake.yaml | executionPlanId*, sourceDecisionId*, initialStep* |
| ProjectQuestionDto | openapi/schemas/project-operations.yaml | id*, companyId*, status*, revision*, createdAt, updatedAt, permissions*, projectId*, category*, title*, body*, assigneePersonnelCardId, comments*, files*, visibility* |
| ProjectQcDto | openapi/schemas/project-operations.yaml | id*, companyId*, status*, revision*, createdAt, updatedAt, permissions*, projectId*, items*, approvalPolicy*, currentApprovalStage |
| ProjectWorkLogDto | openapi/schemas/project-operations.yaml | id*, companyId*, status*, revision*, createdAt, updatedAt, permissions*, projectId*, reportDate*, progressRate*, planMemo*, resultMemo*, fileIds*, logLevel*, authorPersonnelCardId*, noWork* |
| ProjectMeetingMinuteDto | openapi/schemas/project-operations.yaml | id*, companyId*, status*, revision*, createdAt, updatedAt, permissions*, projectId*, meetingAt*, title*, attendeePersonnelCardIds*, body*, decisionSummary*, fileIds* |
| ProjectDeliveryDto | openapi/schemas/project-operations.yaml | id*, companyId*, status*, revision*, createdAt, updatedAt, permissions*, projectId*, roundNumber*, parentDeliveryId, deliveryDate, packageFileIds*, acknowledgedAt, version*, immutable*, supersedesDeliveryId, redeliveryReason, changeSummary, recipient, acknowledgementMethod, deliveredAt, evidenceReferenceIds*, documentHash |
| ProjectProfitabilityDto | openapi/schemas/project-operations.yaml | id*, companyId*, status*, revision*, createdAt, updatedAt, permissions*, projectId*, version*, contractAmount*, revenue*, laborCost*, externalCost*, expectedProfit*, actualProfit*, snapshotAt, accessLevel*, individualSalaryVisible* |
| OperationWriteRequest | openapi/schemas/project-operations.yaml | title, body, assigneePersonnelCardId, fileIds, payload |

## Cross-cutting Contract

Opaque IDs, Money string amounts, UTC timestamps, revisions, permissions and FileDto come
from FE-CONTRACT-01. The project contract does not redefine those common schemas.
