# Runtime Modes

## Resolver

`src/lib/runtimeExecutionMode.ts` reads `NEXT_PUBLIC_RUNTIME_MODE`. The browser
cannot change the mode through URL parameters or ordinary local storage.

| Mode | Read behavior | Write behavior | Fallback |
|---|---|---|---|
| `DEMO_LOCAL` | approved sample state | simulation only, `persisted: false` | not applicable |
| `API_SANDBOX` | Backend Adapter required | Backend response required | no Demo fallback |
| `PRODUCTION_SERVER` | Backend Adapter required | Backend response required | no Demo fallback |

When no valid mode is configured, development defaults to `DEMO_LOCAL` and a
production build defaults to `PRODUCTION_SERVER`.

## Module Boundary

`getFrontendModuleBoundary` resolves:

- runtime mode
- adapter readiness
- Provider readiness
- readable and mutable capability
- translated status message
- relevant OpenAPI operation IDs

`executeFrontendMutation` is the only approved mutation boundary for the new
handoff flows:

- Demo calls `simulate` and returns `SIMULATED`.
- Server mode calls `request` only when the module is `SERVER_READY`.
- Missing adapter or Provider returns `BLOCKED`.

## API Request Contract

Use `src/lib/apiClient.ts`.

- `X-Company-Id` is protected for company-scoped requests.
- `Accept-Language` follows the selected workspace.
- `X-Request-Id` is generated per request.
- A response is rejected if the active company changed while it was in flight.
- The Backend must validate allowed companies and resource ownership again.

The Frontend header is context, not authorization.

## Failure UX

For all server modes:

- preserve user input when practical
- show the mapped error
- expose retry only for retry-safe operations
- never generate a success ID locally
- never display a success toast before the API response
- never apply a stale response from the previous company
