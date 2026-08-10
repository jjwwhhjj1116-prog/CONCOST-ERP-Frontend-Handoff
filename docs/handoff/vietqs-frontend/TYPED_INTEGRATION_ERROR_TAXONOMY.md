# Typed Integration Error Taxonomy

| Code | Meaning | Frontend behavior | Retry |
|---|---|---|---|
| `RUNTIME_MODE_INVALID` | build/runtime mode violates contract | block integration | after deployment correction |
| `API_BASE_MISSING` | server mode has no API base | block adapter | after configuration |
| `AUTH_REQUIRED` | no valid session | show login/recovery | after authentication |
| `COMPANY_REQUIRED` | no selected company | block request | after selection |
| `COMPANY_CONTEXT_MISMATCH` | selected/request company differs | reject response | after context refresh |
| `STALE_COMPANY_RESPONSE` | company changed in flight | discard response | yes, in current company |
| `PERMISSION_DENIED` | server denied capability | forbidden state | only after permission change |
| `ADAPTER_UNAVAILABLE` | backend endpoint/capability missing | `BACKEND_REQUIRED` | after backend readiness |
| `PROVIDER_NOT_CONFIGURED` | external provider missing | blocked provider state | after provider setup |
| `NETWORK_ERROR` | request did not complete | preserve input/error | yes |
| `TIMEOUT` | request exceeded contract | preserve input/error | controlled retry |
| `REVISION_CONFLICT` | optimistic concurrency conflict | reload/compare | after user review |
| `IDEMPOTENCY_CONFLICT` | key reused with different input | block and inspect | no automatic retry |
| `RESPONSE_INVALID` | response violates DTO/schema | fail safely | after backend correction |
| `UNKNOWN_ERROR` | unclassified safe fallback | generic error with request ID | controlled retry |

Error diagnostics may contain code, status, safe route, company ID, timestamp,
and correlation ID. They must not contain authorization data, cookies, secrets,
request/response bodies, file names from restricted records, or personal data.
