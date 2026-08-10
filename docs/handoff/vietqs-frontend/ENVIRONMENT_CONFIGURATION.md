# Environment Configuration

## Public Build Variables

These values are build-time capability declarations. They must not contain
secrets and must not replace Backend authorization.

| Variable | Allowed value | Purpose |
|---|---|---|
| `NEXT_PUBLIC_BASE_PATH` | path such as `/workspace` | Next.js deployment base path |
| `NEXT_PUBLIC_RUNTIME_MODE` | `DEMO_LOCAL`, `API_SANDBOX`, `PRODUCTION_SERVER` | immutable runtime mode |
| `NEXT_PUBLIC_API_BASE_URL` | HTTPS or same-origin API path | public API origin/path; no credentials or query tokens |
| `NEXT_PUBLIC_AUTH_ADAPTER_READY` | `true` or unset | session and company adapter capability |
| `NEXT_PUBLIC_PROJECT_ADAPTER_READY` | `true` or unset | Project adapter capability |
| `NEXT_PUBLIC_DRIVE_PROVIDER_READY` | `true` or unset | Drive Provider capability |
| `NEXT_PUBLIC_DRIVE_ADAPTER_READY` | `true` or unset | Drive API adapter capability |
| `NEXT_PUBLIC_APPROVAL_SERVER_READY` | `true` or unset | Approval server capability |
| `NEXT_PUBLIC_APPROVAL_ADAPTER_READY` | `true` or unset | Approval adapter capability |
| `NEXT_PUBLIC_APPROVAL_POLICY_READY` | `true` or unset | approval policy capability |
| `NEXT_PUBLIC_MAIL_PROVIDER_READY` | `true` or unset | mail Provider capability |
| `NEXT_PUBLIC_MAIL_ADAPTER_READY` | `true` or unset | mail adapter capability |
| `NEXT_PUBLIC_BUSINESS_CARD_OCR_PROVIDER_READY` | `true` or unset | OCR capability |
| `NEXT_PUBLIC_BUSINESS_CARD_OCR_ENDPOINT` | public route only | optional OCR route declaration |
| `NEXT_PUBLIC_BUSINESS_CARD_ADAPTER_READY` | `true` or unset | business-card adapter |
| `NEXT_PUBLIC_GOOGLE_CONTACTS_PROVIDER_READY` | `true` or unset | one-way sync capability |
| `NEXT_PUBLIC_AI_PROVIDER_READY` | `true` or unset | AI capability |
| `NEXT_PUBLIC_PRIVATE_AI_PROVIDER_READY` | `true` or unset | private AI capability |
| `NEXT_PUBLIC_AI_ADAPTER_READY` | `true` or unset | AI API adapter |
| `NEXT_PUBLIC_SALES_ADAPTER_READY` | `true` or unset | Sales CRM adapter capability |
| `NEXT_PUBLIC_FINANCE_ADAPTER_READY` | `true` or unset | Finance adapter capability |
| `NEXT_PUBLIC_CLAIM_ADAPTER_READY` | `true` or unset | Claim adapter capability |
| `NEXT_PUBLIC_*_INTEGRATION_HEALTH` | `HEALTHY`, `DEGRADED`, `ERROR` | non-secret diagnostic declaration for Project, Collaboration, Business, or Claim/AI |

Do not expose API keys, OAuth credentials, SMTP credentials, storage tokens, or
database connection strings through public variables.
## Recommended Profiles

### Local UI Review

```text
NEXT_PUBLIC_RUNTIME_MODE=DEMO_LOCAL
```

All writes must display that they are simulated and not persisted.

### API Sandbox

```text
NEXT_PUBLIC_RUNTIME_MODE=API_SANDBOX
```

Set an adapter or Provider flag only after its capability endpoint and
permission tests pass. Missing capabilities remain blocked.

Build-time `READY` is not a smoke-test PASS. The Integration Diagnostics page
keeps each M0-M7 milestone `NOT_TESTED` until an explicit probe result exists.

### Production

```text
NEXT_PUBLIC_RUNTIME_MODE=PRODUCTION_SERVER
```

Production must use secure same-origin APIs. Demo fallback, fixture responses,
and browser-selected mode overrides are forbidden.

## Backend Environment

The Backend team owns secret configuration, Provider credentials, session
secrets, database configuration, encryption keys, storage credentials, and
notification credentials. None of those values belong in this Frontend package.
