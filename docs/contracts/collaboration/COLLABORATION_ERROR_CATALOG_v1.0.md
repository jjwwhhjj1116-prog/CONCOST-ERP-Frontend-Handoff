# Collaboration Error Catalog v1.0

The frozen Common errors remain authoritative. Error details never contain secrets, provider tokens or unauthorized titles/filenames.

| Code | HTTP | Module | Meaning |
|---|---:|---|---|
| COMPANY_REQUIRED | 400 | all | X-Company-Id missing |
| COMPANY_FORBIDDEN | 403 | all | selected company not allowed |
| ACTION_FORBIDDEN | 403 | all | resource/action denied |
| REVISION_CONFLICT | 409 | mutable | If-Match is stale |
| IDEMPOTENCY_CONFLICT | 409 | commands | key reused with different payload |
| FILE_NOT_READY | 409 | file actions | irreversible action requires READY |
| MAIL_PROVIDER_NOT_CONFIGURED | 503 | Mail | Provider not READY; Send success forbidden |
| MAIL_SEND_REJECTED | 422/503 | Mail | provider rejected command |
| PROJECT_LINK_CONFIRMATION_REQUIRED | 409 | Mail | suggested Project link lacks user confirmation |
| APPROVAL_POLICY_NOT_RESOLVED | 409 | Approval | no valid server policy/approver chain |
| RECALL_NOT_ALLOWED_AFTER_DECISION | 409 | Approval | direct recall attempted after first Decision |
| FINAL_RECORD_IMMUTABLE | 409 | Approval | mutation/delete attempted on final record |
| DELEGATION_DURATION_EXCEEDED | 422 | Approval | delegation exceeds default 30 days |
| DELEGATION_NOT_ALLOWED | 403/409 | Approval | scope, identity or policy violation |
| RECURRENCE_SCOPE_REQUIRED | 422 | Calendar | recurring edit scope missing |
| BOARD_PUBLISH_POLICY_REQUIRED | 409 | Board | official notice approval unresolved |
| MANDATORY_READ_REQUIRED | 409 | Board | explicit acknowledgement outstanding |
| SEARCH_PROVIDER_PARTIAL_FAILURE | 200 meta/503 | Search | one/all providers failed without leaking hidden metadata |
