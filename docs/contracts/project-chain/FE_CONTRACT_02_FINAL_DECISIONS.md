# FE-CONTRACT-02 FINAL DECISIONS

Status: **FROZEN**

| ID | Policy | Final decision |
|---|---|---|
| DEC-01 | Project number | projectId may be reserved earlier; projectNo is issued only in final Intake approval and Project activation by a company/year server sequence. |
| DEC-02 | Estimate versions | Draft is editable. Every issued version is immutable, hash-stamped and superseded only by a newly issued server version. |
| DEC-03 | WON correction | Before planning, audited hold/cancel/reopen is allowed. After plan/intake, cancel dependents then issue a correction. After activation, use project cancellation or contract-change workflow. |
| DEC-04 | Execution Plan confirmation | Only a server-returned canConfirmExecutionPlan capability may confirm; title inference is forbidden. |
| DEC-05 | PM timing | At least one primary-team PM candidate before Intake submit; at least one assigned PM before PM Schedule submit/approval. |
| DEC-06 | New Project notifications | Required actors and explicit assignees receive IN_APP. Ordinary whole-team broadcast defaults OFF; other channels are opt-in. |
| DEC-07 | Question visibility | Visibility enum is explicit and defaults to PROJECT_TEAM; company-wide and cross-company defaults are forbidden. |
| DEC-08 | QC approval | Technical: primary-team manager review then technical-HQ manager final approval. Claim and development use their responsible manager. Backend policy only. |
| DEC-09 | Delivery acknowledgement | DELIVERED and ACKNOWLEDGED are distinct and require recipient, method, timestamps, references, actor and audit evidence. |
| DEC-10 | Re-delivery | Each package version is immutable; a re-delivery creates a new version and retains prior package and acknowledgement history. |
| DEC-11 | Work log | A Project-level log is required on active workdays; PM/designated representative may author and completion reviews missing periods. |
| DEC-12 | Profitability | Backend capability selects summary/detail/restricted; PM never receives individual salary or individual labor cost. |
| DEC-13 | GOU coexistence | v1 is a read-only metadata bridge. No dual write, full attachment migration, full approval/mail migration or ERP edit of GOU data. |
| DEC-14 | Completion/archive | Completion and archive have explicit gates; archive is read-only and default waiting period is 30 policy-configurable days. |
| DEC-15 | Official UI name | The official user-facing name is 수주·실적 데이터 관리; it is not a database server or SQL administration tool. |

## Change Control

These decisions are contract policy, not runtime implementation. A later change requires a
versioned contract change request and may not silently alter the frozen common contract.
