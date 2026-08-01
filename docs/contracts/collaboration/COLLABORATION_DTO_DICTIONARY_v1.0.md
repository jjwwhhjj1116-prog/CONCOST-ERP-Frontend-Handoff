# Collaboration DTO Dictionary v1.0

## Contract-wide fields

| Field | Rule |
|---|---|
| companyId | Selected workspace company; `X-Company-Id` and resource company must match |
| organizationId/projectId/personnelCardId | Opaque IDs; names never authorize or link |
| revision | Non-negative integer; mutations use `If-Match` |
| fileId | Common File lifecycle ID; irreversible actions require READY |
| timestamps | RFC 3339 UTC; Calendar also carries IANA timezone |
| sourceSystem/externalId | Read-only bridge identity; never grants write authority |

## Module DTOs

| Module | Normative DTO additions | Frozen rule |
|---|---|---|
| Mail | MailProviderCapabilitiesDto, MailRetentionPolicyDto, MailDeliveryDto, SuggestedProjectLinkDto, GouMailLinkDto | PROVIDER_TBD; no false Send success |
| Approval | ApprovalPolicyDto, ApprovalRecallRequest, ApprovalDelegationDto, ApprovalRetentionPolicyDto | backend policy authority; final immutable |
| Calendar | CalendarVisibility, RecurrenceEditScope | BUSY_ONLY and THIS_OCCURRENCE defaults |
| Tasks | TaskReminderPolicyDto | APP -24h/0h/+24h |
| Board | BoardSpaceDto capabilities, BoardPostDto acknowledgement policy | official notice approval workflow |
| Notifications | NotificationEventDto, NotificationDeliveryDto, NotificationPreferenceDto | Event/Delivery/Read/Preference separated |
| Search | CollaborationSearchResultDto | permission filter before metadata projection |

The machine-readable schemas under `openapi/schemas/` are normative.
