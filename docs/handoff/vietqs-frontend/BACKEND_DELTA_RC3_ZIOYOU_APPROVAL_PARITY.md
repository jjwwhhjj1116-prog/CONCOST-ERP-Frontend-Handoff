# Backend Delta RC3: ZioYou Approval Parity

## Required Capabilities

1. Form catalog and schema versions scoped by company and organization.
2. Policy preview by form, organization, amount, project, claim, and author.
3. Saved approval-line CRUD with personal, department, and company scopes.
4. Immutable submission snapshot containing line version, step targets, policy locks, and distribution targets.
5. Draft, submit, approve, reject, request-changes, recall, copy-revision, print, and archive APIs.
6. Delegation records with approver, reason, start/end, scope, approval, revocation, and audit.
7. READY-only file references; quarantine or scan-pending files must be rejected.
8. Permission-first list/search projection. Unauthorized titles, authors, recipient names, and attachment names must not be returned.
9. Company scope, revision, and idempotency enforcement on every mutation.
10. Notification outbox separated from approval transactions.

## Required Operation Mapping

| Frontend action | Backend operation | Failure behavior |
|---|---|---|
| Load form catalog | `listApprovalForms` | Error/empty state; no fixture success in server modes |
| Preview policy | `previewApprovalPolicy` | Submission blocked |
| Save line | `upsertApprovalLine` | Editor remains open with input preserved |
| Save draft | `createApprovalDraft` / `updateApprovalDraft` | No local official draft |
| Submit | `submitApprovalDraft` | No submitted status without response |
| Decide step | `decideApprovalStep` | No local approved/rejected status |
| Recall | `recallApprovalDocument` | No local recalled status |
| Distribute | `distributeApprovalDocument` | Approval state unchanged if delivery fails |

## Immediate Arrival

The Frontend sends the requested boolean only when policy capability `approval.immediateArrival` is READY. Backend owns routing semantics and audit. Until then return a capability error.

## Security

Use `X-Company-Id`, authorization scope, resource company match, revision precondition, and idempotency key. Do not infer an approver from job grade alone and never substitute the requester for a missing candidate.
