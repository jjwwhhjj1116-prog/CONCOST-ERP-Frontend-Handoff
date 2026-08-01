# CONTRACT CHANGE REQUEST RC2

Status: `PROPOSED_FOR_APPROVAL`

This document does not modify the frozen OpenAPI contract. It records new operations
required by RC2 screens. Existing Drive and Business Card OCR operations remain
unchanged and should be reused.

## New Operations Requested

| Operation ID | Method and path | Purpose | Permission |
|---|---|---|---|
| `createBusinessCardUploadSession` | `POST /api/v1/business-card-upload-sessions` | Create a one-time, company-scoped mobile upload session | `CREATE_CONTACT` |
| `getBusinessCardUploadSession` | `GET /api/v1/business-card-upload-sessions/{sessionId}` | Read state without returning upload credentials after consume | creator or `CREATE_CONTACT` |
| `consumeBusinessCardUploadSession` | `POST /api/v1/business-card-upload-sessions/{sessionId}/consume` | Convert a READY File Reference into an OCR capture | creator or `CREATE_CONTACT` |
| `revokeBusinessCardUploadSession` | `POST /api/v1/business-card-upload-sessions/{sessionId}/revoke` | Revoke an unused session | creator or `MANAGE_CONTACT` |
| `listBusinessCardInbox` | `GET /api/v1/business-card-inbox` | List company-scoped received captures | `CREATE_CONTACT` |
| `createProfilePhotoUploadIntent` | `POST /api/v1/profile-photo-versions/upload-intents` | Create an authenticated profile-image upload | self or `MANAGE_PERSONNEL` |
| `createProfilePhotoVersion` | `POST /api/v1/profile-photo-versions` | Register original and edit metadata after File READY | self or `MANAGE_PERSONNEL` |
| `createProfilePhotoAiJob` | `POST /api/v1/profile-photo-versions/{versionId}/ai-jobs` | Request identity-preserving ID-photo candidate | self |
| `reviewProfilePhotoVersion` | `POST /api/v1/profile-photo-versions/{versionId}/review` | Approve or reject a candidate | self |
| `activateProfilePhotoVersion` | `POST /api/v1/profile-photo-versions/{versionId}/activate` | Activate an approved version | self |
| `listProfilePhotoVersions` | `GET /api/v1/profile-photo-versions` | List original and derived versions without raw binary | self |
| `rollbackProfilePhotoVersion` | `POST /api/v1/profile-photo-versions/{versionId}/rollback` | Restore a previously approved version | self |

## Common Contract

All operations require:

- authenticated session;
- `X-Company-Id`;
- company authorization before projection;
- standard response envelope and error schema;
- `X-Request-Id`;
- `Idempotency-Key` on mutations;
- revision on mutable resources;
- safe File Reference contract;
- audit event;
- no secret, token, raw binary, or unrestricted signed URL in DTOs.

## Proposed DTOs

### BusinessCardUploadSessionDto

```json
{
  "id": "bcu_session_example",
  "companyId": "CON_COST",
  "state": "CREATED",
  "expiresAt": "2026-07-29T09:10:00Z",
  "consumedAt": null,
  "fileId": null,
  "captureId": null,
  "revision": 1
}
```

### ProfilePhotoVersionDto

```json
{
  "id": "profile_photo_version_example",
  "companyId": "CON_COST",
  "personnelId": "personnel_example",
  "state": "AI_REVIEW_REQUIRED",
  "originalFileId": "file_original_example",
  "derivedFileId": "file_derived_example",
  "transform": {
    "zoom": 1.08,
    "rotation": 0,
    "brightness": 104,
    "alignX": 50,
    "alignY": 48,
    "background": "WHITE"
  },
  "identityChangeAllowed": false,
  "revision": 2
}
```

## Proposed Error Codes

- `BUSINESS_CARD_UPLOAD_SESSION_EXPIRED` (`410`)
- `BUSINESS_CARD_UPLOAD_SESSION_CONSUMED` (`409`)
- `BUSINESS_CARD_UPLOAD_COMPANY_MISMATCH` (`403`)
- `BUSINESS_CARD_FILE_NOT_READY` (`409`)
- `PROFILE_PHOTO_IDENTITY_POLICY_FAILED` (`422`)
- `PROFILE_PHOTO_REVIEW_REQUIRED` (`409`)
- `PROFILE_PHOTO_VERSION_CONFLICT` (`409`)
- `PROFILE_PHOTO_PROVIDER_NOT_CONFIGURED` (`503`)

## Explicit Non-Changes

- no change to canonical Contact IDs;
- no automatic Contact confirmation without human review;
- no automatic two-way Google Contacts synchronization;
- no change to frozen Drive binding semantics;
- no provider selection;
- no Frontend secret handling;
- no production fallback to Demo.
