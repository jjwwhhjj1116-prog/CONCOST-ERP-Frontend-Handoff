# Collaboration Mock Scenarios v1.0

These are contract test scenarios only. No product Runtime mock is implemented and production fallback is forbidden.

| ID | Decision | Scenario | Expected contract behavior |
|---|---|---|---|
| MAIL-01 | DEC-01 | Provider NOT_CONFIGURED | Send disabled or MAIL_PROVIDER_NOT_CONFIGURED; no success toast |
| MAIL-02 | DEC-01 | GOU Mail link | readOnly=true and deep link; no ERP write |
| MAIL-03 | DEC-01 | provider accepts message | ACCEPTED_BY_PROVIDER with delivery UNKNOWN, not DELIVERED |
| MAIL-04 | DEC-04 | Project suggestion | requiresConfirmation=true; link absent until confirm |
| APR-01 | DEC-05 | PARALLEL_ALL | every actor Decision retained; completion only when all approve |
| APR-02 | DEC-06 | recall before first Decision | RECALLED |
| APR-03 | DEC-06 | recall after first Decision | RECALL_NOT_ALLOWED_AFTER_DECISION |
| APR-04 | DEC-07 | 30-day delegation | accepted only with approval, reason and valid interval |
| APR-05 | DEC-08 | final record mutation | FINAL_RECORD_IMMUTABLE |
| CAL-01 | DEC-09 | private calendar queried by peer | BUSY_ONLY projection |
| CAL-02 | DEC-10 | recurring event edit without override | THIS_OCCURRENCE |
| TASK-01 | DEC-11 | task due | APP reminders at -24h, Due and +24h |
| BRD-01 | DEC-12 | mandatory notice | explicit acknowledgement receipt |
| BRD-02 | DEC-13 | company official notice | DRAFT->IN_REVIEW->APPROVED->PUBLISHED |
| GOU-01 | DEC-14 | GOU read-only result | source and freshness shown; edit absent |
| SEA-01 | DEC-14 | one provider fails | authorized groups retained, partial warning |
| SEA-02 | SECURITY | hidden Mail/File/Approval match | zero title, filename, metadata, snippet and count leakage |
| PILOT-01 | DEC-15 | Pilot phase unavailable | PILOT_PHASE_DEFERRED, no false production readiness |
