# ZioYou Document State Machine

```mermaid
stateDiagram-v2
  [*] --> DRAFT
  DRAFT --> PENDING: submit with immutable snapshot
  PENDING --> MANAGER_REVIEWING: first decision
  MANAGER_REVIEWING --> MANAGER_REVIEWING: next sequential or parallel group
  PENDING --> RECALLED: author recall before first decision
  MANAGER_REVIEWING --> CHANGES_REQUESTED: request changes
  PENDING --> REJECTED: reject
  MANAGER_REVIEWING --> REJECTED: reject
  MANAGER_REVIEWING --> APPROVED: final required step approved
  CHANGES_REQUESTED --> DRAFT: author revises a new revision
  DRAFT --> CANCELLED: author cancels draft
  APPROVED --> ARCHIVED: retention policy
  REJECTED --> ARCHIVED: retention policy
  RECALLED --> ARCHIVED: retention policy
```

Rules:

1. Submission stores a line version and deep-copied steps. Later saved-line edits do not mutate the document.
2. The author cannot be the final approver.
3. Missing policy candidates block submission; the current user is never used as a fallback.
4. Parallel steps complete only when the Backend confirms every required member.
5. Distribution delivery and approval decisions are different contexts.
6. Production transitions require server revision, idempotency, company scope, permission, and audit responses.
