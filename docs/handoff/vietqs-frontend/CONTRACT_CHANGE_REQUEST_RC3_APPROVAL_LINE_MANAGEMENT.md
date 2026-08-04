# Contract Change Request RC3: Approval Line Management

Status: `USER_APPROVAL_REQUIRED`

Requested resources:

- `ApprovalLineDefinition`: id, companyId, ownerId, departmentId, scope, name, formType, steps, default, version, usageCount, createdAt, updatedAt.
- `ApprovalLineStep`: sequence, kind, departmentId, approverId or approverRole, positionTitle, displayTitle, executionMode, groupId, immediateArrival, canEditLine, canEditContent, required, policyLocked.
- CRUD, copy, set-default, list-by-scope, and usage operations.

Rules:

- A saved line update increments its version.
- Policy-locked steps cannot be removed or demoted by users.
- A line cannot use the author as its final approver.
- A submission references an immutable snapshot, not a mutable saved line.
- Mobile ordering uses explicit move operations as well as optional drag.
- Company and organization scope is enforced before any line name or member is projected.

This file requests a future OpenAPI patch. It does not change the frozen OpenAPI in this branch.
