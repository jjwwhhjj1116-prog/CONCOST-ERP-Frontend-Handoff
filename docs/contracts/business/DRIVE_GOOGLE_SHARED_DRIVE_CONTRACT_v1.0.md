# Drive and Google Shared Drive Contract v1.0

Google Shared Drive is the approved default Drive provider. General ERP Attachment remains the frozen Common File API and Backend storage adapter.

- Personal My Drive is not an official Project store.
- OAuth, service-account token and secrets are server-only.
- Public links are forbidden by default; external sharing requires approval, ACL and audit.
- PROJECT_ACTIVATED emits an idempotent Drive Folder Intent after canonical projectId/projectNo and ownership are established.
- Folder creation failure uses outbox/retry and never rolls back Project activation.
- Claim Service folders use separate conflict-check and retention policy.
- Version, retention, sync status and Legal Hold are preserved.
- Provider absence returns DRIVE_PROVIDER_NOT_CONFIGURED and no false success.
