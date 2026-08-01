# PROJECT CHAIN ID LINEAGE v1.0

| Entity | Canonical ID | Created by | Parent / source | Idempotency |
|---|---|---|---|---|
| Estimate Request | estimateRequestId | Estimate Request API | companyId | create key |
| Estimate Sheet Version | estimateSheetId | Sheet API | estimateRequestId | request + version command |
| Estimate Submission | estimateSubmissionId | Issue API | estimateSheetId | issue key |
| Commercial Decision | commercialDecisionId | Decision API | estimateRequestId + optional submission | decision command key |
| Execution Plan | executionPlanId | Plan API | commercialDecisionId | one active plan per decision policy |
| Project reservation | projectId | Plan/Intake transaction | decision lineage | source decision key |
| Project Intake | projectIntakeId + intakeNo | Intake API | executionPlanId + projectId | create key |
| Official Project number | projectNo | Final Intake approval transaction | active projectId + company/year sequence | database sequence and approval key |
| Assignment | assignmentId | Assignment API | projectId + organizationUnitId | assignment command key |
| PM Schedule | projectScheduleId | Schedule API | projectId | project schedule command key |
| Question/QC/Delivery/Work Log | opaque resource ID | module API | canonical projectId | command-specific key |

Names are display attributes only. Name-string matching, department-name joins, mirror Project
arrays and per-team Project copies are forbidden.
