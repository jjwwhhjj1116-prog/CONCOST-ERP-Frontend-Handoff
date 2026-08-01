# PROJECT CHAIN EXAMPLE CATALOG

| Example | Kind | Operation | Schema | Notes |
|---|---|---|---|---|
| EstimateRequestCreate | SUCCESS | createEstimateRequest | estimates.yaml#EstimateRequestDetailDto | Synthetic; company, revision and idempotency headers included |
| EstimateRequestDetail | SUCCESS | getEstimateRequest | estimates.yaml#EstimateRequestDetailDto | Synthetic; company, revision and idempotency headers included |
| EstimateSheetVersionCreate | SUCCESS | createEstimateSheet | estimates.yaml#EstimateSheetDto | Synthetic; company, revision and idempotency headers included |
| EstimateSheetIssue | SUCCESS | issueEstimateSheet | estimates.yaml#EstimateSheetDto | Synthetic; company, revision and idempotency headers included |
| CommercialDecisionWon | SUCCESS | recordCommercialDecision | estimates.yaml#CommercialDecisionDto | Synthetic; company, revision and idempotency headers included |
| ExecutionPlanUpdate | SUCCESS | updateProjectExecutionPlan | project-intake.yaml#ProjectExecutionPlanDto | Synthetic; company, revision and idempotency headers included |
| ExecutionPlanConfirm | SUCCESS | confirmProjectExecutionPlan | project-intake.yaml#ProjectExecutionPlanDto | Synthetic; company, revision and idempotency headers included |
| ProjectIntakeDraftCreate | SUCCESS | createProjectIntakeDraft | project-intake.yaml#ProjectIntakeDetailDto | Synthetic; company, revision and idempotency headers included |
| IntakeStep1Save | SUCCESS | saveProjectIntakeStep | project-intake.yaml#ProjectIntakeStep1Dto | Synthetic; company, revision and idempotency headers included |
| IntakeStep2SaveReadyFiles | SUCCESS | saveProjectIntakeStep | project-intake.yaml#ProjectIntakeStep2Dto | Synthetic; company, revision and idempotency headers included |
| IntakeStep3Save | SUCCESS | saveProjectIntakeStep | project-intake.yaml#ProjectIntakeStep3Dto | Synthetic; company, revision and idempotency headers included |
| IntakeStep4Save | SUCCESS | saveProjectIntakeStep | project-intake.yaml#ProjectIntakeStep4Dto | Synthetic; company, revision and idempotency headers included |
| IntakeSubmit | SUCCESS | submitProjectIntake | project-intake.yaml#ProjectIntakeDetailDto | Synthetic; company, revision and idempotency headers included |
| IntakeRequestChanges | SUCCESS | requestProjectIntakeChanges | project-intake.yaml#ProjectIntakeDetailDto | Synthetic; company, revision and idempotency headers included |
| IntakeApprove | SUCCESS | approveProjectIntake | project-intake.yaml#ProjectIntakeDetailDto | Synthetic; company, revision and idempotency headers included |
| OrganizationFilteredProjectList | SUCCESS | listProjects | project-common.yaml#ProjectSummaryDto | Synthetic; company, revision and idempotency headers included |
| ProjectDetailWithAssignments | SUCCESS | getProject | project-common.yaml#ProjectDetailDto | Synthetic; company, revision and idempotency headers included |
| PmScheduleAssignSubmit | SUCCESS | submitProjectPmSchedule | project-common.yaml#ProjectScheduleDto | Synthetic; company, revision and idempotency headers included |
| ProjectQuestionCreateResolve | SUCCESS | resolveProjectQuestion | project-operations.yaml#ProjectQuestionDto | Synthetic; company, revision and idempotency headers included |
| QcReviewApprove | SUCCESS | approveProjectQc | project-operations.yaml#ProjectQcDto | Synthetic; company, revision and idempotency headers included |
| DeliveryCreate | SUCCESS | createProjectDeliveryDraft | project-operations.yaml#ProjectDeliveryDto | Synthetic; company, revision and idempotency headers included |
| DeliveryAcknowledge | SUCCESS | acknowledgeProjectDelivery | project-operations.yaml#ProjectDeliveryDto | Synthetic; company, revision and idempotency headers included |
| RedeliveryVersion | SUCCESS | createProjectRedelivery | project-operations.yaml#ProjectDeliveryDto | Synthetic; company, revision and idempotency headers included |
| ProjectWorkLog | SUCCESS | createProjectWorkLog | project-operations.yaml#ProjectWorkLogDto | Synthetic; company, revision and idempotency headers included |
| ProfitabilitySummary | SUCCESS | getProjectProfitability | project-operations.yaml#ProjectProfitabilityDto | Synthetic; company, revision and idempotency headers included |
| ProjectCompletion | SUCCESS | transitionProjectLifecycle | project-common.yaml#ProjectDetailDto | Synthetic; company, revision and idempotency headers included |
| ProjectArchive | SUCCESS | transitionProjectLifecycle | project-common.yaml#ProjectDetailDto | Synthetic; company, revision and idempotency headers included |
| CompanyRequiredError | ERROR | * | common/errors.yaml#ErrorResponse | COMPANY_REQUIRED |
| CompanyForbiddenError | ERROR | * | common/errors.yaml#ErrorResponse | COMPANY_FORBIDDEN |
| RevisionConflictError | ERROR | * | common/errors.yaml#ErrorResponse | REVISION_CONFLICT |
| IdempotencyConflictError | ERROR | * | common/errors.yaml#ErrorResponse | IDEMPOTENCY_CONFLICT |
| InvalidTransitionError | ERROR | * | common/errors.yaml#ErrorResponse | INVALID_TRANSITION |
| FileNotReadyError | ERROR | * | common/errors.yaml#ErrorResponse | FILE_NOT_READY |
| ApproverNotConfiguredError | ERROR | * | common/errors.yaml#ErrorResponse | VALIDATION_FAILED with details.reasonCode=APPROVER_NOT_CONFIGURED |
| ActionForbiddenError | ERROR | * | common/errors.yaml#ErrorResponse | ACTION_FORBIDDEN |
| ValidationFailedError | ERROR | * | common/errors.yaml#ErrorResponse | VALIDATION_FAILED |
| ServiceUnavailableError | ERROR | * | common/errors.yaml#ErrorResponse | SERVICE_UNAVAILABLE |

Totals: **27 success**, **10 error**,
**37 overall**.
