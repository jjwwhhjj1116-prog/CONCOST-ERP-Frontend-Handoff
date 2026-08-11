# RC3 Operational Board Backend Delta

## Scope

This handoff defines the backend capability required by the RC3 operational board frontend. It does not modify the frozen OpenAPI contract. The organization route remains owned by the organization domain; placing it under Board navigation is frontend-only.

## Runtime Boundary

- `DEMO_LOCAL` uses synthetic, company-scoped browser data and labels every file or notification action as simulation.
- `API_SANDBOX` and `PRODUCTION_SERVER` require a board adapter. Missing adapters return `BACKEND_REQUIRED`; they never mutate the demo store.
- Provider absence cannot produce upload, notification, scheduled-publication, download, or search success.

## Required Models

All records require `companyId`, canonical opaque IDs, timestamps, and revision where mutable.

- `BoardGroup`: name, order, active.
- `BoardDefinition`: group, localized labels, view type, company/organization/member scope, read/write member and organization IDs, managers, comment/reply/reaction/attachment policies, notice policy, default notification, order, active.
- `BoardPost`: board, author snapshots, safe content, lifecycle, notice/must-read/pin flags, schedule/publication dates, attachment references, counters, revision, deletion metadata.
- `BoardComment`: one-level parent, author snapshot, content, mentions, READY attachment references, status, revision.
- `BoardReaction`: unique `(companyId, postId, personnelId, kind)`.
- `BoardReadReceipt`: unique `(companyId, postId, personnelId)` with first/last read times.
- `BoardAttachment`: immutable file reference/version/checksum/scan state; official use requires `READY`.
- `BoardRevision` and `BoardAuditEvent`: actor, correlation ID, before/after safe metadata, reason, time, revision.

## Permission Order

Every list, search, detail, mutation, export, notification and file operation follows:

1. Authenticate session.
2. Require and authorize `X-Company-Id` against `allowedCompanyIds`.
3. Apply company scope in the query.
4. Resolve BoardDefinition scope and active state.
5. Authorize `BOARD_READ`, `BOARD_WRITE`, `BOARD_COMMENT`, `BOARD_NOTICE`, `BOARD_MANAGE`, or `BOARD_EXPORT`.
6. Resolve resource and revision.
7. Project only authorized title, body, author and filename metadata.

A system administrator role alone must not bypass restricted business-content policy. Break-glass access, if supported, requires approved scope, expiry, step-up authentication and full audit.

## Operations

Recommended adapter operations:

| Area | Capability |
|---|---|
| Catalog | list/create/update/archive/restore/reorder groups and boards |
| Posts | list/search/get/create draft/update/publish/schedule/archive/soft-delete/restore/permanent-delete |
| Moderation | notice period, pin, must-read, move, copy |
| Collaboration | comment/reply edit/delete, mention, reaction toggle |
| Read state | mark read, unread counts, must-read completion, reminder candidate |
| Files | upload intent, transfer, finalize, scan, READY reference, authorized download/preview |
| Notifications | publish, notice, must-read, comment, reply, mention, reminder events |
| Audit | append-only mutation and permission-change history |

Post detail deep links use `/board/post?postId=<id>`. Search and notification DTOs return that route only after permission filtering.

## Lifecycle and Concurrency

Post lifecycle is `DRAFT -> PUBLISHED`, `DRAFT -> SCHEDULED -> PUBLISHED`, `PUBLISHED -> ARCHIVED`, and `PUBLISHED -> DELETED -> RESTORED`; permanent deletion is manager-only and audited. A scheduled item remains `SCHEDULED` until a backend worker publishes it.

Mutations require revision or `If-Match`. Create, copy, move, publish, reminder and notification commands require an idempotency key scoped by company, actor and operation. Conflicts return a typed `REVISION_CONFLICT` with safe current revision metadata.

## Attachments

The frontend sends no file bytes as durable browser storage. The server issues an upload intent, records `QUEUED/UPLOADING/SCANNING/READY/FAILED`, validates company and owner scope, and accepts only `READY` references in posts or comments. Tokens, signed URLs and storage credentials remain server-side or short-lived and are never logged.

## Notifications and Read Receipts

Events: `BOARD_POST_PUBLISHED`, `BOARD_NOTICE_PUBLISHED`, `BOARD_MUST_READ`, `BOARD_COMMENT_ADDED`, `BOARD_REPLY_ADDED`, `BOARD_MENTIONED`, and `BOARD_REMINDER`. Recipient deduplication key is `(eventId, personnelId, channel)`. User preferences control delivery, not event retention. Reminder requests require board management permission and use an outbox; a request response is not delivery success.

## Company and Search Isolation

Every index and cache key includes `companyId`. Search applies board visibility before ranking or snippets. Unauthorized boards expose zero title, author, body, attachment filename, count or existence metadata. Mentions accept only active personnel in the selected company and permitted directory scope.

## Migration

Legacy `concost-board-posts-v1` data may map category, content, pin and synthetic attachment count only when its source company is verifiable. Unknown records remain in `LEGACY_UNSCOPED_DEMO`; never assign a default company. Server migration must be additive, idempotent and auditable.

## Error Contract

Use stable errors: `AUTH_REQUIRED`, `COMPANY_REQUIRED`, `COMPANY_FORBIDDEN`, `BOARD_FORBIDDEN`, `RESOURCE_NOT_FOUND`, `REVISION_CONFLICT`, `VALIDATION_ERROR`, `FILE_NOT_READY`, `PROVIDER_NOT_CONFIGURED`, `BACKEND_REQUIRED`, and `INTERNAL_ERROR`. Return a redacted correlation ID. Do not include secrets, cookies, private content, or file bodies.

## Acceptance

Backend readiness requires company-isolated catalog/post/comment/reaction/read-receipt tests; direct-route permission tests; author/manager/notice policy tests; revision and idempotency tests; scheduled worker tests; READY-file tests; unread reminder outbox tests; permission-before-projection search tests; and production no-demo-fallback tests.