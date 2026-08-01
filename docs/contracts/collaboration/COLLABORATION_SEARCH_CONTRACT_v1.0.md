# Collaboration Search Contract v1.0

## Security order

1. Validate session and `X-Company-Id`.
2. Resolve company, organization, project, personal and source-provider permission.
3. Apply permission inside each provider query.
4. Only then match, count, highlight, snippet and rank.
5. Return a stable opaque-ID route.

Post-search filtering is forbidden. Unauthorized Mail subject, Approval title, File name/metadata and hidden result counts are all confidential.

## Sources

| Source | Projection | Restriction |
|---|---|---|
| NEW_ERP | authorized collaboration DTO | provider capability still applies |
| GOU_READ_ONLY | sourceSystem, externalId, deepLink, lastSyncedAt, syncStatus, readOnly | no write action; no unapproved body/attachment |

## Failure isolation

Partial success returns successful groups plus a localized provider error. It never substitutes fixtures, claims completeness or logs raw secret/body data. Every requested provider failing returns 503.

## UX and cache

- Debounce 250-350 ms; Ctrl/Cmd+K; Arrow keys, Enter and Escape.
- Loading, empty, error and partial-provider states; full-screen mobile search.
- Cache key includes companyId, permission fingerprint, locale, query, types and cursor.
- Workspace change invalidates previous-company results.
