# Collaboration Permission-first Projection Policy v1.0.1

Status: `CONTRACT_SET_V1_0_1_PATCH`

This PATCH clarifies the frozen Collaboration Contract. It does not add an endpoint, change a DTO, relax a permission, or implement runtime authorization.

## Mandatory Evaluation Order

1. Authenticate the session.
2. Validate `X-Company-Id` against `allowedCompanyIds`; no default-company fallback.
3. Resolve the resource and verify `resource.companyId`.
4. Apply organization, project, participant, ownership, delegation, and provider scopes.
5. Evaluate the operation permission.
6. Apply the authorized scope to the query or mutation.
7. Materialize a safe projection only after all prior checks pass.

## Query and Projection Rules

- List and search operations push company and resource scope into the query before rows are materialized.
- Detail operations return `404` or the frozen non-disclosing error policy when the resource is outside scope.
- Mutation operations authorize both the resource and requested transition before loading protected response fields.
- Mail subjects, recipients, attachment names, and provider metadata are protected.
- Approval titles, form fields, approver identities, attachments, and decision metadata are protected.
- Calendar private details follow visibility scope; unavailable details project as busy-only where the frozen policy allows it.
- Task, Board, Notification, and Search projections expose only fields permitted by the resolved scope.
- Provider capability checks occur after permission evaluation and before any provider result is projected.
- Public or pre-auth exceptions: none among the 66 protected operations in this PATCH.

## Exact Operation Inventory

### mail

| Method | Path | Operation ID | Permission | Permission Before Projection |
|---|---|---|---|---:|
| GET | `/api/v1/mail/capabilities` | `getMailCapabilities` | `MAIL_VIEW` | true |
| GET | `/api/v1/mail/folders` | `listMailFolders` | `MAIL_VIEW` | true |
| GET | `/api/v1/mail/messages` | `listMailMessages` | `MAIL_VIEW` | true |
| GET | `/api/v1/mail/messages/{id}` | `getMailMessage` | `MAIL_VIEW` | true |
| POST | `/api/v1/mail/messages/actions` | `applyMailBulkAction` | `MAIL_MANAGE` | true |
| GET | `/api/v1/mail/drafts` | `listMailDrafts` | `MAIL_COMPOSE` | true |
| POST | `/api/v1/mail/drafts` | `createMailDraft` | `MAIL_COMPOSE` | true |
| GET | `/api/v1/mail/drafts/{id}` | `getMailDraft` | `MAIL_COMPOSE` | true |
| PATCH | `/api/v1/mail/drafts/{id}` | `updateMailDraft` | `MAIL_COMPOSE` | true |
| DELETE | `/api/v1/mail/drafts/{id}` | `deleteMailDraft` | `MAIL_COMPOSE` | true |
| POST | `/api/v1/mail/drafts/{id}/send` | `sendMailDraft` | `MAIL_SEND` | true |
| POST | `/api/v1/mail/messages/{id}/reply` | `replyToMailMessage` | `MAIL_COMPOSE` | true |
| POST | `/api/v1/mail/messages/{id}/reply-all` | `replyAllToMailMessage` | `MAIL_COMPOSE` | true |
| POST | `/api/v1/mail/messages/{id}/forward` | `forwardMailMessage` | `MAIL_COMPOSE` | true |

### approvals

| Method | Path | Operation ID | Permission | Permission Before Projection |
|---|---|---|---|---:|
| GET | `/api/v1/approval/forms` | `listApprovalForms` | `APPROVAL_VIEW` | true |
| GET | `/api/v1/approval/policies/resolve` | `resolveApprovalPolicy` | `APPROVAL_CREATE` | true |
| GET | `/api/v1/approval/drafts` | `listApprovalDrafts` | `APPROVAL_CREATE` | true |
| POST | `/api/v1/approval/drafts` | `createApprovalDraft` | `APPROVAL_CREATE` | true |
| GET | `/api/v1/approval/drafts/{id}` | `getApprovalDraft` | `APPROVAL_CREATE` | true |
| PATCH | `/api/v1/approval/drafts/{id}` | `updateApprovalDraft` | `APPROVAL_CREATE` | true |
| DELETE | `/api/v1/approval/drafts/{id}` | `deleteApprovalDraft` | `APPROVAL_CREATE` | true |
| POST | `/api/v1/approval/drafts/{id}/submit` | `submitApprovalDraft` | `APPROVAL_SUBMIT` | true |
| GET | `/api/v1/approvals` | `listApprovals` | `APPROVAL_VIEW` | true |
| GET | `/api/v1/approvals/{id}` | `getApproval` | `APPROVAL_VIEW` | true |
| POST | `/api/v1/approvals/{id}/decisions` | `decideApprovalStep` | `APPROVAL_DECIDE` | true |
| POST | `/api/v1/approvals/{id}/recall` | `recallApproval` | `APPROVAL_RECALL` | true |
| GET | `/api/v1/approval-delegations` | `listApprovalDelegations` | `APPROVAL_DELEGATION_VIEW` | true |
| POST | `/api/v1/approval-delegations` | `createApprovalDelegation` | `APPROVAL_DELEGATION_MANAGE` | true |
| DELETE | `/api/v1/approval-delegations/{id}` | `revokeApprovalDelegation` | `APPROVAL_DELEGATION_MANAGE` | true |

### calendar

| Method | Path | Operation ID | Permission | Permission Before Projection |
|---|---|---|---|---:|
| GET | `/api/v1/calendars` | `listCalendars` | `CALENDAR_VIEW` | true |
| GET | `/api/v1/calendar/events` | `listCalendarEvents` | `CALENDAR_VIEW` | true |
| POST | `/api/v1/calendar/events` | `createCalendarEvent` | `CALENDAR_CREATE` | true |
| GET | `/api/v1/calendar/events/{id}` | `getCalendarEvent` | `CALENDAR_VIEW` | true |
| PATCH | `/api/v1/calendar/events/{id}` | `updateCalendarEvent` | `CALENDAR_EDIT` | true |
| DELETE | `/api/v1/calendar/events/{id}` | `cancelCalendarEvent` | `CALENDAR_EDIT` | true |
| POST | `/api/v1/calendar/events/{id}/responses` | `respondToCalendarEvent` | `CALENDAR_RESPOND` | true |
| GET | `/api/v1/calendar/free-busy` | `getCalendarFreeBusy` | `CALENDAR_VIEW_AVAILABILITY` | true |

### tasks

| Method | Path | Operation ID | Permission | Permission Before Projection |
|---|---|---|---|---:|
| GET | `/api/v1/tasks` | `listCollaborationTasks` | `TASK_VIEW` | true |
| POST | `/api/v1/tasks` | `createCollaborationTask` | `TASK_CREATE` | true |
| GET | `/api/v1/tasks/{id}` | `getCollaborationTask` | `TASK_VIEW` | true |
| PATCH | `/api/v1/tasks/{id}` | `updateCollaborationTask` | `TASK_EDIT` | true |
| DELETE | `/api/v1/tasks/{id}` | `deleteCollaborationTask` | `TASK_DELETE` | true |
| POST | `/api/v1/tasks/{id}/transitions` | `transitionCollaborationTask` | `TASK_TRANSITION` | true |
| POST | `/api/v1/tasks/{id}/checklist-items` | `createTaskChecklistItem` | `TASK_EDIT` | true |
| PATCH | `/api/v1/tasks/{id}/checklist-items/{itemId}` | `updateTaskChecklistItem` | `TASK_EDIT` | true |
| DELETE | `/api/v1/tasks/{id}/checklist-items/{itemId}` | `deleteTaskChecklistItem` | `TASK_EDIT` | true |
| POST | `/api/v1/tasks/{id}/comments` | `createTaskComment` | `TASK_COMMENT` | true |
| GET | `/api/v1/tasks/{id}/comments` | `listTaskComments` | `TASK_VIEW` | true |
| GET | `/api/v1/tasks/{id}/reminders` | `listTaskReminders` | `TASK_VIEW` | true |
| POST | `/api/v1/tasks/{id}/reminders` | `createTaskReminder` | `TASK_EDIT` | true |
| DELETE | `/api/v1/tasks/{id}/reminders/{reminderId}` | `deleteTaskReminder` | `TASK_EDIT` | true |

### board

| Method | Path | Operation ID | Permission | Permission Before Projection |
|---|---|---|---|---:|
| GET | `/api/v1/board-spaces` | `listBoardSpaces` | `BOARD_VIEW` | true |
| GET | `/api/v1/board-posts` | `listBoardPosts` | `BOARD_VIEW` | true |
| POST | `/api/v1/board-posts` | `createBoardPost` | `BOARD_CREATE` | true |
| GET | `/api/v1/board-posts/{id}` | `getBoardPost` | `BOARD_VIEW` | true |
| PATCH | `/api/v1/board-posts/{id}` | `updateBoardPost` | `BOARD_EDIT` | true |
| DELETE | `/api/v1/board-posts/{id}` | `deleteBoardPost` | `BOARD_DELETE` | true |
| POST | `/api/v1/board-posts/{id}/publish-actions` | `publishBoardPost` | `BOARD_PUBLISH` | true |
| POST | `/api/v1/board-posts/{id}/read-receipts` | `recordBoardReadReceipt` | `BOARD_VIEW` | true |
| GET | `/api/v1/board-posts/{id}/read-receipts` | `listBoardReadReceipts` | `BOARD_READ_RECEIPTS_VIEW` | true |

### notifications

| Method | Path | Operation ID | Permission | Permission Before Projection |
|---|---|---|---|---:|
| GET | `/api/v1/notifications/capabilities` | `getNotificationCapabilities` | `NOTIFICATION_VIEW` | true |
| GET | `/api/v1/notifications` | `listNotifications` | `NOTIFICATION_VIEW` | true |
| PATCH | `/api/v1/notifications/{id}/read` | `markNotificationRead` | `NOTIFICATION_VIEW` | true |
| POST | `/api/v1/notifications/read-all` | `markAllNotificationsRead` | `NOTIFICATION_VIEW` | true |
| GET | `/api/v1/notification-preferences` | `getNotificationPreferences` | `NOTIFICATION_PREFERENCE_VIEW` | true |
| PUT | `/api/v1/notification-preferences` | `updateNotificationPreferences` | `NOTIFICATION_PREFERENCE_MANAGE` | true |
