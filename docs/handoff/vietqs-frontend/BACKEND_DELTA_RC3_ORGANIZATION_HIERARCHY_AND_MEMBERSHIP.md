# RC3 Organization Hierarchy and Membership Backend Delta

## Scope

This delta defines the server capability required by the RC3 company-scoped hierarchy, personnel directory, approval picker, staffing filters, and finance access checks. It is a backend handoff note only and does not modify the frozen OpenAPI contract.

## Runtime Boundary

`DEMO_LOCAL` may render the approved synthetic hierarchy. `API_SANDBOX` and `PRODUCTION_SERVER` require an authenticated organization adapter. Server modes must not accept browser-local hierarchy state as the system of record or silently fall back to demo memberships.

## Canonical Models

```ts
type OrganizationNode = {
  id: string;
  companyId: 'CON_COST' | 'VIET_QS';
  code: string;
  displayOrderCode: string;
  canonicalName: string;
  parentId: string | null;
  kind: 'COMPANY' | 'EXECUTIVE' | 'DIVISION' | 'CENTER' | 'DEPARTMENT' | 'TEAM' | 'PART';
  sortOrder: number;
  leaderPersonnelId: string | null;
  projectExecutionUnitId: 'FINISH' | 'STRUCTURE' | 'CIVIL_LANDSCAPE' | 'CLAIM' | 'DEVELOPMENT' | null;
  accessScope: 'MANAGEMENT_SUPPORT' | null;
  active: boolean;
  revision: number;
  effectiveFrom: string;
  effectiveTo: string | null;
};

type PersonnelOrganizationMembership = {
  id: string;
  companyId: 'CON_COST' | 'VIET_QS';
  personnelId: string;
  organizationNodeId: string;
  membershipType: 'PRIMARY' | 'SECONDARY';
  isLeader: boolean;
  active: boolean;
  effectiveFrom: string;
  effectiveTo: string | null;
  revision: number;
};
```

## Frozen Company Trees

CON-COST follows `CC_ROOT -> CC_EXEC_CEO -> CC_EXEC_VP`, then Technical HQ, Claim Center, Management Support HQ, and Development TF. Technical HQ contains Finish, Structure, Civil/Landscape, and BIM.

Viet QS follows `VQS_ROOT -> VQS_EXEC_CEO -> VQS_EXEC_VP`, then FINISH, Structure, Civil, Development TF, and Management Support. Their approved teams remain separate canonical nodes.

Node IDs and display labels are different fields. A renamed display label must not change IDs, project links, permissions, or history.

## Membership Invariants

- A person has at most one active PRIMARY membership per company and may have multiple active SECONDARY memberships.
- The person card is projected once under the PRIMARY node. SECONDARY memberships are badges or links, not duplicate cards.
- CEO and vice-president placement requires an explicit active membership. A system role, job title, or rank alone cannot infer executive placement.
- A leader must have active membership in that node; a global manager role cannot assign leadership to an unrelated node.
- Unmapped personnel remain company-scoped and return `UNASSIGNED`; the server must not guess another team.
- Inactive and resigned personnel are excluded from active projections without deleting history.

## Project and Access Mapping

The existing project execution enum remains unchanged:

| Organization | Execution/access mapping |
|---|---|
| CON-COST Finish | `FINISH` |
| CON-COST Structure | `STRUCTURE` |
| CON-COST Civil/Landscape | `CIVIL_LANDSCAPE` |
| CON-COST Claim Center | `CLAIM` |
| CON-COST Development TF | `DEVELOPMENT` |
| CON-COST Management Support | `MANAGEMENT_SUPPORT` access |
| CON-COST BIM | organization only |
| Viet QS External/Internal/P&O | `FINISH` |
| Viet QS Horizon/Vertical | `STRUCTURE` |
| Viet QS Civil team | `CIVIL_LANDSCAPE` |
| Viet QS Development | `DEVELOPMENT` |
| Viet QS Admin | `MANAGEMENT_SUPPORT` access |

Organization nodes do not create project copies. Staffing and project queries continue to use the canonical `projectId` plus execution assignment.

## Query and Projection Requirements

Every organization request requires authenticated company scope. Apply company and permission filters before projecting node names, personnel names, titles, leadership, search results, or approval candidates. A cross-company node or personnel ID returns the approved not-found/forbidden response without metadata leakage.

Required capabilities:

- tree by company and effective date;
- node descendants;
- active personnel for a node, optionally recursive;
- search by organization, person, and title inside authorized company scope;
- explicit primary/secondary membership history;
- project execution unit lookup;
- approval candidate lookup by selected organization and descendants;
- management-support capability evidence for finance access.

## Alias Migration

Legacy department/team strings may be accepted only by a controlled migration mapper. Normalize whitespace and case, resolve against a company-specific alias table, record the source alias and target canonical node, and send ambiguous or unknown values to a review queue. Runtime business joins must not use display-name matching.

## Mutation, Audit, and Concurrency

Create, move, lead-change, deactivate, and membership mutations require revision checks, idempotency, before/after node IDs, reason, actor, company, timestamp, and correlation ID. Never place secret values, private contact data, or full personnel records in audit events.

## Frontend Capability States

- `DEMO_SIMULATED`: approved synthetic tree only.
- `BACKEND_REQUIRED`: adapter unavailable; no server-persistence success.
- `READY`: company-scoped tree, membership, search, and permission evidence verified.
- `DEGRADED`: read-only tree available while a noncritical capability is unavailable.
- `ERROR`: safe redacted diagnostics with retry.

## Backend Acceptance

1. CON-COST tree returns no Viet QS nodes or personnel, and vice versa.
2. Parent/order snapshots match the frozen trees.
3. One active PRIMARY membership is enforced; secondary projection creates no duplicate card.
4. Executive and leader placement require membership evidence.
5. Unmapped personnel are returned as `UNASSIGNED` without silent guessing.
6. Approval descendant lookup preserves submitted approval snapshots.
7. Finance access accepts active approved Management Support membership and rejects unrelated roles.
8. Project execution unit IDs remain unchanged.
9. Server modes never treat frontend demo hierarchy as persisted success.
10. Effective-date and revision history survive organization changes.