# Collaboration ID Lineage

| Resource | Canonical ID owner | Parent/FK | Idempotency identity | Name matching |
|---|---|---|---|---|
| Mail Draft | Backend | companyId, providerAccountId, projectId? | companyId + actor + Idempotency-Key | Forbidden |
| Mail Message | Provider adapter + backend mapping | mailboxAccountId, threadId?, projectId? | providerMessageId + providerAccountId | Forbidden |
| Approval Form | Backend policy catalog | companyId | versioned form key | Forbidden |
| Approval Draft/Document | Backend | formId, policyId?, projectId? | companyId + actor + Idempotency-Key | Forbidden |
| Approval Step/Decision | Backend | approvalId | approvalId + stepId + actor + decision command key | Forbidden |
| Delegation | Backend | delegator/delegate personnelCardId | companyId + delegator + scope + interval | Forbidden |
| Calendar/Event | Backend/provider adapter | calendarId, projectId? | companyId + actor + Idempotency-Key | Forbidden |
| Attendee response | Backend | eventId + personnelCardId | eventId + attendee + revision | Forbidden |
| Task | Backend | scopeId, projectId? | companyId + actor + Idempotency-Key | Forbidden |
| Checklist/Comment/Reminder | Backend | taskId | taskId + actor + Idempotency-Key | Forbidden |
| Board Space/Post | Backend | boardSpaceId, projectId? | companyId + actor + Idempotency-Key | Forbidden |
| Read Receipt | Backend | postId + personnelCardId | postId + reader | Forbidden |
| Notification Event | Backend domain outbox | resourceType + resourceId | eventType + resourceId + transition revision | Forbidden |
| Notification Delivery | Backend provider worker | eventId + recipient + channel | unique(eventId, recipient, channel) | Forbidden |
| Search Result | Source provider | canonical source resource ID | no persistence | Forbidden |

All project-linked resources use the frozen Project Chain canonical `projectId`. Project names are display-only and cannot establish a relationship.

## Frozen additions

- GOU projections retain `sourceSystem=GOU`, `externalId`, `lastSyncedAt`, `syncStatus` and `readOnly=true`; they do not mint ERP ownership IDs for the source record.
- Project Mail suggestions are ephemeral until a user confirms the canonical `projectId`.
- Approval Delegation IDs are created only after an approved delegation request; display names and role strings never identify authority.
