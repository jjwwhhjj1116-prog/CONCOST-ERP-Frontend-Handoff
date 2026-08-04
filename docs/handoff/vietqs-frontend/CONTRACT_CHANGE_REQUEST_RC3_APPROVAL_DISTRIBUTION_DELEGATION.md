# Contract Change Request RC3: Approval Distribution and Delegation

Status: `USER_APPROVAL_REQUIRED`

## Distribution

Model recipient, reference, circulation, and post-approval distribution independently from approval steps. Each target needs company scope, target type/id, delivery timing, read/acknowledgement state, and audit events.

## Delegation

Delegation requires delegator, delegate, company, optional organization/form scope, reason, validity period, approving authority, status, revocation, and audit. It must not be inferred from absence and must never fall back to the current user.

## Submission Snapshot

Snapshot line, policy version, distribution targets, form schema version, author organization, retention, security level, project/claim links, and READY file references in the submit transaction.

## Permission and Search

Authorization and resource scope must run before projection. Unauthorized users receive neither document title nor author, recipient, attachment, or distribution metadata.

This file requests a future OpenAPI patch. It does not change the frozen OpenAPI in this branch.
