# RC3 Sales Customer Project Relationship Source of Truth

## Decision

Sales is a customer relationship and project-history projection. It is not a second opportunity, estimate, award, or project workflow.

| Information | Canonical owner | Sales behavior |
|---|---|---|
| Customer / counterparty | Customer domain | Read and edit the company-scoped customer identity through the approved adapter |
| Contact | Business Card Contact OS (`businessOperationsStore.contacts` in Demo) | Reuse the same contact; do not create a third contact store |
| Estimate request and sheet | Project estimate domain | Deep-link with customer/contact prefill only |
| Intake | Project Intake domain | Create relationship candidates while Draft; publish relationships only on Accepted completion |
| Project | Project domain | Project status, PM, units, dates, and title are live projections by canonical `projectId` |
| Customer-project relationship | Relationship association | Store IDs, role, source revision, and historical contact snapshot only |
| Amount and profitability | Finance domain | Excluded from the default Sales projection |
| Legacy opportunity and activity | Legacy read-only migration source | Preserve for audit and deep links; never create a Project from Sales |

## Identity And Compatibility

- `businessOperationsStore.contacts` is the active Contact OS source used by business-card registration and the customer directory.
- `src/store/contactStore.ts` only reads the historical unscoped browser key. Those records require explicit company review and are never silently migrated.
- Relationship schema version is `1`. Demo relationships are in-memory synthetic data; no production persistence is claimed.
- Server modes require a company-scoped backend association and cannot fall back to Demo records.

## Relationship Rules

1. Match within the selected `companyId` only.
2. Prefer canonical `counterpartyId`; never join by customer name.
3. Exact normalized email can link an existing contact.
4. Exact normalized mobile can link only when the source email is absent.
5. Name, department, or position similarity creates a review candidate and never auto-merges.
6. An Accepted Intake and Published Project create or revise one relationship per source contact.
7. Repeating the same source revision is idempotent.
8. Removing an Intake contact deactivates the relationship and retains history.
9. A revision retains previous snapshots and increments `sourceRevision` without changing `projectId`, `projectIntakeId`, or `projectNo`.

## Permission And Projection

The order is Session -> Company -> Customer/Contact access -> Project permission -> Projection -> Search ranking. Unauthorized Project title, number, PM, units, and existence metadata are not projected. Counts contain visible projects only. Finance amounts are not part of the Sales projection.

## Runtime Boundary

- `DEMO_LOCAL`: an atomic frontend simulation may update Intake, Project, assignments, relationship plan, audit, and notification candidates together.
- `API_SANDBOX` and `PRODUCTION_SERVER`: Backend is authoritative. Missing adapters return `BACKEND_REQUIRED`; no local relationship or false-success is created.

## Legacy Routes

- Pipeline / opportunities -> customer directory notice and canonical estimate-request CTA.
- Quotes -> canonical estimate-sheet management.
- Contracts -> canonical estimate-request award and Intake flow.
- Activities -> customer relationship audit timeline.

Official OpenAPI changes in this phase: **0**.
