# Backend Delta RC3 Customer Project Relationship

## Purpose

Implement the server-authoritative customer, contact, and Project relationship used by the RC3 Sales customer directory. The frontend currently provides a PII-safe Demo simulation and returns `BACKEND_REQUIRED` in server modes without an adapter.

## Canonical Model

`CustomerProjectRelationship` requires:

- `id`, `companyId`
- canonical `counterpartyId`, optional canonical `contactId`
- canonical `projectId`, `projectIntakeId`
- relationship role
- source: `PROJECT_INTAKE`, `ESTIMATE_REQUEST`, or approved manual legacy link
- `sourceRevision`
- immutable historical contact snapshot
- `active`, timestamps, and before/after audit

Do not copy Project fields into the relationship. Resolve current title, state, PM, units, and schedule from the Project domain after permission checks.

## Acceptance Transaction

The authoritative Intake completion command must atomically complete:

1. Intake Accepted
2. Project Published
3. execution assignments
4. estimate database upsert
5. customer/counterparty resolution
6. contact resolution or review candidate creation
7. customer-project relationship create/revise/deactivate
8. audit events
9. notification outbox records

An idempotency key must include company, intake, project, source contact row, and source revision. Retry must produce one Project, one Intake, and no duplicate customer, contact, or relationship.

## Contact Resolution

- Enforce the selected company before every lookup.
- Exact normalized email is the first automatic match.
- Exact normalized mobile is second and is only used when source email is absent.
- Name/company/department/position similarity creates `REVIEW_REQUIRED` only.
- Blank identity values never auto-match.
- Existing Contact identity remains unchanged until an authorized reviewer confirms a link or field-level merge.

## Revision And History

Accepted Intake revisions retain the same `intakeId`, `projectId`, and `projectNo`. Update source revision, append the contact snapshot, create candidates for ambiguous changes, and set removed contacts inactive. Never hard-delete relationship history.

## Required APIs

- complete Intake atomically with relationship results
- list customer directory with permission-scoped Project aggregates
- customer detail with contacts, Project history, card history, and relationship audit
- review and resolve link candidates
- create an authorized manual legacy link without Project duplication
- export contacts with explicit capability and audit
- permission-scoped global search deep links

All requests require explicit company scope, revision where mutable, and a correlation/request ID. Missing company is 400; unauthorized company/resource is 403; conflicts are 409.

## Search And Permission

Apply Session -> Company -> resource scope -> Project permission before selecting or indexing title, Project number, PM, units, contact fields, or snippets. Aggregates count visible projects only. Sales access does not grant Finance amounts.

## Notifications And Audit

Outbox candidates:

- `CUSTOMER_CONTACT_LINK_REVIEW_REQUIRED`
- `CUSTOMER_PROJECT_LINKED`
- `CUSTOMER_PROJECT_RELATIONSHIP_UPDATED`

Recipients are approved customer-data stewards, the Project PM, and authorized operators. Do not notify all employees by default. Audit create, link, review, reassign, deactivate, snapshot revision, manual legacy link, and export with before/after, actor, timestamp, and source revision.

## Data Migration

- Preserve legacy opportunities and activities as read-only migration evidence.
- Historical contacts without `companyId` remain quarantined for explicit company review.
- Never infer a company or relationship from a display name.
- Backfill must be additive, repeatable, and report unresolved candidates separately.

## Delivery Acceptance

- company leak: 0
- unauthorized Project metadata: 0
- duplicate Project/Intake/customer/contact/relationship on retry: 0
- server-mode Demo fallback: 0
- relation revision and snapshot history: preserved
- notification false-success before outbox/provider acceptance: 0
