# RC3 Request Worklist Archive/Restore Backend Delta

## Scope

The estimate request worklist is an operational projection, not the record system. The canonical `estimateRequestId` remains unchanged across transfer, archive, and restore.

## Required contract

- `worklistState`: `ACTIVE | TRANSFERRED_TO_INTAKE | ARCHIVED`
- Won confirmation creates one Intake draft and changes the request to `TRANSFERRED_TO_INTAKE` atomically.
- Archive changes only the projection state. It must not delete request, sheet, decision, intake, project, attachment metadata, or audit history.
- Restore changes the same record to `ACTIVE`; it must not create a sheet, intake, or project.
- Every mutation requires `X-Company-Id`, permission, revision, idempotency, before/after audit, actor, reason, and timestamp.
- Lists default to `ACTIVE`; DB views can explicitly filter every state.

## Endpoints required

- `POST /api/v1/estimate-requests/{id}/archive`
- `POST /api/v1/estimate-requests/{id}/restore`
- `POST /api/v1/estimate-requests/{id}/confirm-won`
- `GET /api/v1/estimate-requests?worklistState=...`

## Safety

Server modes must never fall back to browser persistence or return a false success. Restore is idempotent and returns the existing linked `projectIntakeId` when present.
