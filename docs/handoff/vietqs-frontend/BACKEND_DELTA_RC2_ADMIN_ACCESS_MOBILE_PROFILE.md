# BACKEND DELTA RC2: ADMIN, ACCESS, MOBILE CARD, PROFILE

## Backend Immediate Tasks

1. Enforce access grade and capability claims in the authenticated session.
2. Enforce finance access on menu-equivalent API queries, detail reads, search, widgets, and exports.
3. Implement company-scoped Google Shared Drive binding and provider health APIs without returning OAuth secrets.
4. Implement short-lived, one-time mobile business-card upload sessions and connect them to the existing OCR capture flow.
5. Implement immutable profile-photo originals, derived versions, AI jobs, human review, and explicit apply.
6. Return capability and provider state so the Frontend never guesses success.

The RC2 Frontend is ready to bind these capabilities. It does not implement OAuth,
provider calls, database persistence, file storage, or AI processing.

## Frozen Frontend Boundary

| Area | Frontend behavior | Backend authority |
|---|---|---|
| Runtime mode | Build-time `DEMO_LOCAL`, `API_SANDBOX`, or `PRODUCTION_SERVER` | Deployment configuration |
| Company | Sends the selected company on every protected request | Validates `allowedCompanyIds` |
| Access grade | Renders `ADMIN`, `GRADE_1` through `GRADE_4` | Issues and persists grade |
| Finance | Hides and blocks ineligible routes locally | Returns `FINANCE_ACCESS` capability and enforces every operation |
| Drive | Collects non-secret binding metadata and displays provider states | Owns OAuth token, Shared Drive ACL, refresh, revocation, tests |
| Mobile card | Captures image and displays one-time session/inbox states | Creates upload intent, stores file, scans, starts OCR |
| Profile photo | Edits a local candidate and requires explicit review | Stores original and versions, runs AI, activates approved version |

## Access Grade and Finance Contract

### Grades

- `ADMIN`: system or workspace administrator.
- `GRADE_1`: representative director or vice president.
- `GRADE_2`: director or team leader.
- `GRADE_3`: project manager.
- `GRADE_4`: senior, professional, and general employee.
- `FINANCE_ACCESS`: separate capability, never inferred from grade alone.

### Finance eligibility

The Backend may issue `FINANCE_ACCESS` only when the authenticated person is:

- `ADMIN`;
- `GRADE_1`; or
- an active member of the Management Support organization.

Both eligibility and the capability are required in server modes. The Backend must
deny direct route APIs, global search projections, widgets, and exports with `403`.
CSS visibility is not an authorization boundary.

### Session payload delta

```json
{
  "accessGrade": "GRADE_2",
  "capabilities": ["FINANCE_ACCESS"],
  "organizationMemberships": [
    {
      "organizationId": "org-management-support",
      "status": "ACTIVE",
      "membershipType": "PRIMARY"
    }
  ]
}
```

## Google Shared Drive Administration

The existing Drive contracts remain authoritative. RC2 requires the following
capabilities to be implemented behind them.

| Capability | Required behavior |
|---|---|
| Connect | Administrator starts a server-generated OAuth flow |
| Change account | New authorization replaces a binding only after verification |
| Reauthenticate | Refreshes authorization without exposing a token to the browser |
| Disconnect | Revokes provider access and marks the binding `DISABLED` |
| Select Shared Drive | Lists only drives visible to the connected service identity |
| Root folder | Accepts a folder picker result or validated HTTPS folder URL |
| Connection test | Returns provider reachability and account metadata |
| Permission test | Verifies required read/write/create permissions |
| Company binding | Stores a distinct binding per company |
| Folder template | Stores versioned Project, Claim, Approval, and Meeting templates |

Provider states:

`NOT_CONFIGURED`, `CONNECTING`, `READY`, `DEGRADED`, `FAILED`, `DISABLED`.

The response must never contain OAuth access tokens, refresh tokens, client secrets,
service-account keys, signed URLs beyond their approved lifetime, or raw provider
credentials.

## Mobile Business Card Upload

### Session requirements

- company scoped;
- authenticated creator;
- one-time consume;
- short expiry;
- server-generated opaque ID and upload intent;
- maximum file size and MIME allowlist;
- malware scan and `READY` file state before OCR;
- no anonymous permanent upload URL;
- no company fallback;
- replay returns `409`;
- expired session returns `410`.

### State model

`CREATED → OPENED → UPLOADED → CONSUMED`

Terminal alternatives: `EXPIRED`, `REVOKED`.

Inbox state:

`RECEIVED → OCR_PENDING → OCR_PROCESSING → REVIEW_REQUIRED → DUPLICATE_REVIEW → READY_TO_CREATE → COMPLETED`

Failure and cancellation are explicit states. Human review cannot be skipped.

The existing business-card OCR, duplicate review, Contact create, and merge operations
remain authoritative after the uploaded file has a canonical File Reference.

## Profile Photo Versioning

### Required guarantees

- immutable original file;
- derived version for every edit or AI output;
- crop, rotation, zoom, alignment, brightness, and background metadata;
- AI job never overwrites the original;
- facial identity alteration prohibited;
- before/after preview;
- explicit user approval before activation;
- previous active version remains available for rollback;
- retention and deletion policy enforced server-side;
- EXIF and sensitive metadata removed from public derivatives;
- signed delivery URL with short lifetime.

### State model

`UPLOADED → EDITING → AI_PENDING → AI_REVIEW_REQUIRED → APPROVED → ACTIVE`

Alternatives: `REJECTED`, `FAILED`, `SUPERSEDED`.

An AI job result is not an approved profile photo. Activation must record the user,
version, timestamp, and source.

## Configurable Card and Drawer

The common card and drawer are Frontend components. Backend DTOs should expose:

- stable resource ID;
- revision;
- status;
- `permissions.canView`;
- `permissions.canEdit`;
- provider/capability state when relevant.

The Frontend opens the same resource in a right drawer on desktop and a full-screen
sheet on mobile. Unsaved changes require explicit discard confirmation.

## Required Audit Events

- `ACCESS_GRADE_CHANGED`
- `ACCESS_CAPABILITY_CHANGED`
- `DRIVE_BINDING_CONNECT_REQUESTED`
- `DRIVE_BINDING_READY`
- `DRIVE_BINDING_REAUTHENTICATED`
- `DRIVE_BINDING_DISCONNECTED`
- `DRIVE_PERMISSION_TESTED`
- `MOBILE_CARD_SESSION_CREATED`
- `MOBILE_CARD_SESSION_CONSUMED`
- `MOBILE_CARD_SESSION_EXPIRED`
- `PROFILE_PHOTO_UPLOADED`
- `PROFILE_PHOTO_AI_REQUESTED`
- `PROFILE_PHOTO_REVIEWED`
- `PROFILE_PHOTO_ACTIVATED`
- `PROFILE_PHOTO_ROLLED_BACK`

Audit entries include actor, company, resource ID, result, request correlation ID, and
timestamp. They exclude file binary, OCR text, image data, and provider secrets.

## Acceptance Scenarios

1. An administrator configures separate CON-COST and Viet QS Drive bindings.
2. A non-administrator receives `403` for Drive administration.
3. An eligible finance user with the capability can query and export finance data.
4. An eligible user without the capability is denied in server modes.
5. An ineligible user cannot gain finance access by editing browser state.
6. A one-time card session cannot be consumed twice or across companies.
7. OCR cannot start until the uploaded file is `READY`.
8. A profile AI result cannot activate without user approval.
9. Disconnecting Drive does not expose or return deleted credentials.
10. Company switching cannot reuse access, provider, inbox, or profile responses from the previous company.

## Frontend Status

| Area | Status |
|---|---|
| Drive administration UI | Ready with Backend dependency |
| Access grade and finance preview | Ready with Backend dependency |
| Common card and responsive drawer | Frontend ready |
| Mobile capture and inbox | Demo metadata flow ready; Backend upload required |
| Profile editor and human approval | Demo preview ready; Backend file and AI jobs required |
| Production persistence | Not implemented by Frontend |
