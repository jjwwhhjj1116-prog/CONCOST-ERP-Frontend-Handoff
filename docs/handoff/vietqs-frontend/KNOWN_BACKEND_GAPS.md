# Known Backend Gaps

These gaps are expected dependencies, not completed Runtime features.

| Priority | Area | Missing Backend capability | Required result |
|---:|---|---|---|
| 0 | Common | secure session and company authorization | permission-first API access |
| 0 | Common | common error, revision, idempotency | deterministic conflict/retry UX |
| 0 | Project | Project, Execution Plan, Intake persistence | canonical Project lifecycle |
| 0 | Project | organization assignment and approval | ID-based team views |
| 0 | Drive | file lifecycle, scan, binding, download | server-issued READY references |
| 0 | Drive | Google Shared Drive Adapter | capability and permission-safe access |
| 0 | Approval | form/policy/draft/decision service | official immutable approval records |
| 0 | Mail | Provider-neutral mail service | no false send success |
| 0 | Business Card | OCR jobs, duplicate service, Contact commands | reviewed Contact creation |
| 0 | AI | STT, summary, citation, output persistence | reviewed AI artifacts |
| 1 | Calendar | scoped event API | personal/team/org/company/Project events |
| 1 | Task | scoped task/checklist/comment API | Project and personal tasks |
| 1 | Notification | event/read/preference/delivery split | deep links and delivery control |
| 2 | Sales | Opportunity persistence | company-scoped CRM |
| 2 | Finance | transaction and dashboard API | permission-sensitive finance data |

## Mandatory Cross-cutting Work

- Validate `X-Company-Id` against the session and every resource.
- Include `companyId` in query/cache keys.
- Filter permissions before projecting titles or metadata.
- Enforce revision and idempotency on commands.
- Keep audit events even when delivery preferences disable notification delivery.
- Return Provider capability truthfully.
- Keep file binary storage behind a server-issued lifecycle.
- Never use display names as foreign keys.

## Explicitly Out of Scope

- Frontend-owned database or Provider implementation
- OAuth token storage in browser code
- Production fixtures or automatic Demo fallback
- GOU dual write or migration
- real customer, employee, legal, mail, or finance data in samples
