# PI-POLICY-ORG-01 FINAL DECISION

## 0. Decision Identity

| Item | Value |
|---|---|
| Status | `POLICY_FROZEN_CON_COST_V1` |
| Decision authority | User-approved organization policy |
| Target repository | `E:/■ 개발_TF팀/Groupware System(Web_finish)/workspace` |
| Branch | `feat/login-board-refresh` |
| Target HEAD at freeze | `ec2428093ff732ea41b082821c648095cd10d373` |
| Source decision sheet | `PI_POLICY_ORG_01_DECISION_SHEET.md` |
| Source unit review | `PI_POLICY_ORG_01_UNIT_APPROVAL.csv` |
| Source manager review | `PI_POLICY_ORG_01_MANAGER_APPROVAL.csv` |
| Source Viet QS review | `PI_POLICY_ORG_01_VIETQS_REVIEW.md` |
| Mutation boundary | Policy documents only; no code, schema, migration, seed, data, stage, commit, or push |

This document freezes organization policy. It does not create database rows, grant permissions, or authorize implementation.

## 1. Approved CON-COST Organization Units

Exactly ten CON-COST organization units are approved for v1.

| Code | Name | Kind | Parent | ProjectAssignable | Primary organization | Primary team | Decision |
|---|---|---|---|---:|---:|---:|---|
| `CON_COST` | CON-COST | `COMPANY` | - | false | false | false | Approved non-project unit |
| `CON_COST.EXECUTIVE` | 임원 | `DEPARTMENT` | `CON_COST` | false | false | false | Approved non-project unit |
| `CON_COST.MANAGEMENT_SUPPORT` | 경영지원본부 | `HEADQUARTERS` | `CON_COST` | false | false | false | Approved non-project unit |
| `CON_COST.TECHNICAL_HQ` | 기술본부 | `HEADQUARTERS` | `CON_COST` | false | true | false | Approved project organization |
| `CON_COST.TECHNICAL_HQ.FINISH` | 마감팀 | `TEAM` | `CON_COST.TECHNICAL_HQ` | true | false | true | Approved project team |
| `CON_COST.TECHNICAL_HQ.STRUCTURE` | 구조팀 | `TEAM` | `CON_COST.TECHNICAL_HQ` | true | false | true | Approved project team |
| `CON_COST.TECHNICAL_HQ.STRUCTURE.BIM_PART` | BIM파트 | `TEAM` | `CON_COST.TECHNICAL_HQ.STRUCTURE` | false | false | false | Approved support-only unit |
| `CON_COST.TECHNICAL_HQ.CIVIL_LANDSCAPE` | 토목·조경팀 | `TEAM` | `CON_COST.TECHNICAL_HQ` | true | false | true | Approved project team |
| `CON_COST.CLAIM_CENTER` | 클레임센터 | `ORG_TEAM` | `CON_COST` | true | true | true | Approved project organization/team |
| `CON_COST.DEVELOPMENT` | 개발팀 | `ORG_TEAM` | `CON_COST` | true | true | true | Approved permanent project organization/team |

### Frozen cardinality

- `primaryOrganizationUnitId`: exactly one.
- `primaryTeamUnitId`: exactly one.
- `participantTeamUnitIds`: zero or more, unique.
- `supportOrganizationUnitIds`: zero or more, unique.
- Multiple primary teams are forbidden.
- A Technical HQ project must select exactly one of Finish, Structure, or Civil/Landscape as its primary team.
- Claim Center and Development use the same `ORG_TEAM` unit ID as both primary organization and primary team.
- Department-specific Project copies, mirror arrays, and name-based joins are forbidden.
- Every projection and workflow uses the same canonical `projectId`.

## 2. Non-Project Unit Policy

The following units remain visible in the organization chart with `ProjectAssignable=false`.

| Unit | Project owner/team/participant selection | Project notifications | Special rule |
|---|---|---|---|
| CON-COST root | Forbidden | Excluded by organization assignment | Company boundary only |
| Executive | Forbidden | Excluded by organization assignment | Approval-policy personnel may still be explicitly designated |
| Management Support | Forbidden | Excluded by organization assignment | Excluded from Project Intake approval lines |
| BIM Part | Forbidden | Excluded as a unit | Active individuals may be assigned as project support personnel |

BIM leadership does not imply Project Intake approval authority.

## 3. Approved Personnel Mapping

Relationships are stored by `personnelCardId`. Excel `NO.` is not an official employee number.

| Responsibility | personnelCardId | Display name | Policy |
|---|---|---|---|
| Representative final approver | `demo-cc-admin-001` | [DEMO] CONCOST Executive 001 | Explicit approval-policy binding |
| Vice-president approver | `demo-cc-executive-002` | [DEMO] CONCOST Executive 002 | Explicit approval-policy binding |
| Technical HQ primary manager/reviewer | `demo-cc-technical-001` | [DEMO] CONCOST Manager 008 | Explicit unit and review binding |
| Technical HQ temporary delegate candidate | `demo-cc-technical-002` | [DEMO] CONCOST Manager 024 | No standing authority; delegation record required |
| Claim Center manager/reviewer | `demo-cc-claim-001` | [DEMO] CONCOST Manager 009 | Explicit unit and review binding |
| Development manager/reviewer | `demo-cc-development-001` | [DEMO] CONCOST Manager 010 | Explicit unit and review binding |
| Finish manager | `demo-cc-finish-001` | [DEMO] CONCOST Manager 012 | Explicit unit binding |
| Structure manager | `demo-cc-structure-001` | [DEMO] CONCOST Team Lead 025 | Explicit unit binding |
| Civil/Landscape manager | `demo-cc-civil-001` | [DEMO] CONCOST Team Lead 032 | Explicit unit binding |
| BIM support-unit manager | `demo-cc-structure-007` | [DEMO] CONCOST Team Lead 031 | Support-unit binding only |

Job title, organization rank, and system role alone never grant PM, reviewer, approver, or manager authority.

## 4. Frozen Intake Approval Lines

| Policy scope | Review | Approval | Final approval |
|---|---|---|---|
| Technical HQ | `demo-cc-technical-001` / [DEMO] CONCOST Manager 008 | `demo-cc-executive-002` / [DEMO] CONCOST Executive 002 | `demo-cc-admin-001` / [DEMO] CONCOST Executive 001 |
| Claim Center | `demo-cc-claim-001` / [DEMO] CONCOST Manager 009 | `demo-cc-executive-002` / [DEMO] CONCOST Executive 002 | `demo-cc-admin-001` / [DEMO] CONCOST Executive 001 |
| Development | `demo-cc-development-001` / [DEMO] CONCOST Manager 010 | `demo-cc-executive-002` / [DEMO] CONCOST Executive 002 | `demo-cc-admin-001` / [DEMO] CONCOST Executive 001 |

### Delegation

- `demo-cc-technical-002` is only a candidate for a temporary Technical HQ reviewer delegation.
- A valid delegation requires delegate ID, delegator ID, validity period, reason, designating actor, and immutable audit history.
- Vice-president, representative, Claim Center, and Development delegates are currently unassigned.
- Missing or inactive approvers block progression and display an administrator-configuration request.
- The server must not use the current user as a fallback or skip an approval step.
- The Intake author and final approver must be different personnel.

## 5. Membership, PM, and Employment Policy

- Internal relationship keys use `personnelCardId`.
- Excel `NO.` is retained only as import sequence or employee-number candidate.
- Exactly one active `PRIMARY` membership exists per person and company.
- `SECONDARY`, `ACTING`, and `TEMPORARY` memberships are allowed with validity periods.
- HR membership and Project role are separate.
- PM eligibility requires an explicit `canBeProjectPm` grant.
- New assignment requires active employment and matching company.
- Terminated or suspended personnel remain in historical records but cannot receive new assignments.
- During initial transition, the latest user-approved workforce workbook is the temporary employment source. Its hash and effective date must be recorded and re-approved after modification.
- Long-term employment SSOT is the ERP HR database with termination, leave, reinstatement, `validFrom`, and `validTo` history.

## 6. Demo Account Exclusion

The following accounts remain available only in explicit validation mode:

- `demo-vq-structure-023`
- `demo-vq-structure-024`

They are excluded from production organization memberships, Project assignments, approval policies, approver resolution, and production notification recipients.

## 7. Viet QS Deferred Policy

The 19-unit Viet QS structure remains a review draft and is not approved for operational assignment.

- Do not copy the CON-COST hierarchy.
- Organization assignment flag remains OFF.
- Intake approval flag remains OFF.
- Project owner, primary team, participant, and support-unit selection remains OFF.
- General Workspace and organization-directory read access may remain available under normal company authorization.
- No candidate receives authority automatically.

Unresolved local decisions:

1. P&O2 primary leader: [DEMO] Viet QS Team Lead 029 or [DEMO] Viet QS Team Lead 030.
2. Horizon1 primary leader: [DEMO] Viet QS Team Lead 034 or [DEMO] Viet QS Team Lead 035; [DEMO] Viet QS Deputy Lead 036 deputy status.
3. Horizon3 primary leader: [DEMO] Viet QS Team Lead 042 or [DEMO] Viet QS Team Lead 043.
4. Civil official manager.
5. All remaining local leader candidates require official confirmation, including Development candidate [DEMO] Viet QS Team Lead 058.

## 8. Cross-Company Boundary

Cross-company participation is excluded from PI-API-01 v1 and deferred to:

`PI-XCO-01 CROSS-COMPANY PROJECT PARTICIPATION`

For v1:

- Each Project has exactly one owner company.
- Organization units and personnel assigned to the Project must belong to that company.
- A foreign-company OrganizationUnit cannot be added to an Assignment.
- CON-COST and Viet QS permissions, notifications, Project data, and query caches remain isolated.

## 9. Server Invariants for Later Implementation

1. Resolve relationships by canonical IDs, never display names.
2. Validate `X-Company-Id`, account access, resource company, unit company, and personnel company on the server.
3. Validate unit kind, active state, `ProjectAssignable`, hierarchy, and cardinality.
4. Resolve approval actors only from a versioned explicit policy.
5. Fail closed when a required actor, membership, employment status, or policy is unresolved.
6. Preserve one canonical `projectId` across Intake, Assignment, schedule, QC, delivery, work log, and profit analysis.
7. Feature flags never grant authorization.

## 10. Validation Record

| Requirement | Expected | Result |
|---|---:|---|
| Approved CON-COST units | 10 | PASS |
| ProjectAssignable units | 5 | PASS: Finish, Structure, Civil/Landscape, Claim Center, Development |
| Primary organization candidates | 3 | PASS: Technical HQ, Claim Center, Development |
| Non-project units | 4 | PASS |
| Explicit CON-COST personnel IDs | 10 unique IDs | PASS |
| Approval-line missing IDs | 0 | PASS |
| Author equals final approver allowed | No | PASS |
| Demo-account authority candidates | 0 | PASS |
| Viet QS operational authorities | 0 | PASS |
| Automatic permission grants | 0 | PASS |
| Code/schema/migration/seed/data mutation | 0 | PASS |

Technical HQ is an allowed primary organization but is intentionally excluded from the five `ProjectAssignable` team units.

## 11. Implementation Gate

This freeze authorizes only the PI-API-01 v1.1 design update. It does not authorize:

- PI-BLK-03B;
- OrganizationUnit Prisma models;
- seed or migration creation;
- production organization data writes;
- PI-API-01A;
- ProjectIntake server CREATE;
- actual permission grants.

The next permitted step after this freeze is a separate `PI-ENV-01` isolated PostgreSQL validation-environment plan.

**Final verdict: `POLICY_FROZEN_CON_COST_V1`**
