# Business Mock Scenarios

Mocks are explicit execution-mode adapters. DEMO_LOCAL shows a non-production badge and synthetic data. API_SANDBOX uses only test APIs/data. PRODUCTION_SERVER fails closed and never falls back to fixtures or localStorage.

| Module | Scenario | Mode | Expected UI | Production rule |
|---|---|---|---|---|
| Sales CRM | success | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII success state | No PRODUCTION_SERVER fallback |
| Sales CRM | empty | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII empty state | No PRODUCTION_SERVER fallback |
| Sales CRM | loading | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII loading state | No PRODUCTION_SERVER fallback |
| Sales CRM | slow | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII slow state | No PRODUCTION_SERVER fallback |
| Sales CRM | validation | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII validation state | No PRODUCTION_SERVER fallback |
| Sales CRM | unauthorized | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII unauthorized state | No PRODUCTION_SERVER fallback |
| Sales CRM | forbidden | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII forbidden state | No PRODUCTION_SERVER fallback |
| Sales CRM | revision | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII revision state | No PRODUCTION_SERVER fallback |
| Sales CRM | idempotency | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII idempotency state | No PRODUCTION_SERVER fallback |
| Sales CRM | provider-not-configured | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII provider-not-configured state | No PRODUCTION_SERVER fallback |
| Sales CRM | provider-degraded | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII provider-degraded state | No PRODUCTION_SERVER fallback |
| Sales CRM | file-scanning | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII file-scanning state | No PRODUCTION_SERVER fallback |
| Sales CRM | quarantine | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII quarantine state | No PRODUCTION_SERVER fallback |
| Sales CRM | partial-search | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII partial-search state | No PRODUCTION_SERVER fallback |
| Sales CRM | session-expiry | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII session-expiry state | No PRODUCTION_SERVER fallback |
| Sales CRM | company-switch-stale | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII company-switch-stale state | No PRODUCTION_SERVER fallback |
| Sales CRM | GOU-read-only | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII GOU-read-only state | No PRODUCTION_SERVER fallback |
| Sales CRM | security-restricted | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII security-restricted state | No PRODUCTION_SERVER fallback |
| Contacts and Google Contacts | success | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII success state | No PRODUCTION_SERVER fallback |
| Contacts and Google Contacts | empty | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII empty state | No PRODUCTION_SERVER fallback |
| Contacts and Google Contacts | loading | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII loading state | No PRODUCTION_SERVER fallback |
| Contacts and Google Contacts | slow | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII slow state | No PRODUCTION_SERVER fallback |
| Contacts and Google Contacts | validation | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII validation state | No PRODUCTION_SERVER fallback |
| Contacts and Google Contacts | unauthorized | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII unauthorized state | No PRODUCTION_SERVER fallback |
| Contacts and Google Contacts | forbidden | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII forbidden state | No PRODUCTION_SERVER fallback |
| Contacts and Google Contacts | revision | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII revision state | No PRODUCTION_SERVER fallback |
| Contacts and Google Contacts | idempotency | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII idempotency state | No PRODUCTION_SERVER fallback |
| Contacts and Google Contacts | provider-not-configured | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII provider-not-configured state | No PRODUCTION_SERVER fallback |
| Contacts and Google Contacts | provider-degraded | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII provider-degraded state | No PRODUCTION_SERVER fallback |
| Contacts and Google Contacts | file-scanning | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII file-scanning state | No PRODUCTION_SERVER fallback |
| Contacts and Google Contacts | quarantine | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII quarantine state | No PRODUCTION_SERVER fallback |
| Contacts and Google Contacts | partial-search | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII partial-search state | No PRODUCTION_SERVER fallback |
| Contacts and Google Contacts | session-expiry | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII session-expiry state | No PRODUCTION_SERVER fallback |
| Contacts and Google Contacts | company-switch-stale | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII company-switch-stale state | No PRODUCTION_SERVER fallback |
| Contacts and Google Contacts | GOU-read-only | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII GOU-read-only state | No PRODUCTION_SERVER fallback |
| Contacts and Google Contacts | security-restricted | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII security-restricted state | No PRODUCTION_SERVER fallback |
| Business Card OCR | success | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII success state | No PRODUCTION_SERVER fallback |
| Business Card OCR | empty | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII empty state | No PRODUCTION_SERVER fallback |
| Business Card OCR | loading | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII loading state | No PRODUCTION_SERVER fallback |
| Business Card OCR | slow | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII slow state | No PRODUCTION_SERVER fallback |
| Business Card OCR | validation | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII validation state | No PRODUCTION_SERVER fallback |
| Business Card OCR | unauthorized | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII unauthorized state | No PRODUCTION_SERVER fallback |
| Business Card OCR | forbidden | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII forbidden state | No PRODUCTION_SERVER fallback |
| Business Card OCR | revision | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII revision state | No PRODUCTION_SERVER fallback |
| Business Card OCR | idempotency | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII idempotency state | No PRODUCTION_SERVER fallback |
| Business Card OCR | provider-not-configured | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII provider-not-configured state | No PRODUCTION_SERVER fallback |
| Business Card OCR | provider-degraded | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII provider-degraded state | No PRODUCTION_SERVER fallback |
| Business Card OCR | file-scanning | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII file-scanning state | No PRODUCTION_SERVER fallback |
| Business Card OCR | quarantine | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII quarantine state | No PRODUCTION_SERVER fallback |
| Business Card OCR | partial-search | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII partial-search state | No PRODUCTION_SERVER fallback |
| Business Card OCR | session-expiry | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII session-expiry state | No PRODUCTION_SERVER fallback |
| Business Card OCR | company-switch-stale | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII company-switch-stale state | No PRODUCTION_SERVER fallback |
| Business Card OCR | GOU-read-only | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII GOU-read-only state | No PRODUCTION_SERVER fallback |
| Business Card OCR | security-restricted | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII security-restricted state | No PRODUCTION_SERVER fallback |
| Finance ERP | success | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII success state | No PRODUCTION_SERVER fallback |
| Finance ERP | empty | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII empty state | No PRODUCTION_SERVER fallback |
| Finance ERP | loading | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII loading state | No PRODUCTION_SERVER fallback |
| Finance ERP | slow | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII slow state | No PRODUCTION_SERVER fallback |
| Finance ERP | validation | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII validation state | No PRODUCTION_SERVER fallback |
| Finance ERP | unauthorized | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII unauthorized state | No PRODUCTION_SERVER fallback |
| Finance ERP | forbidden | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII forbidden state | No PRODUCTION_SERVER fallback |
| Finance ERP | revision | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII revision state | No PRODUCTION_SERVER fallback |
| Finance ERP | idempotency | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII idempotency state | No PRODUCTION_SERVER fallback |
| Finance ERP | provider-not-configured | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII provider-not-configured state | No PRODUCTION_SERVER fallback |
| Finance ERP | provider-degraded | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII provider-degraded state | No PRODUCTION_SERVER fallback |
| Finance ERP | file-scanning | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII file-scanning state | No PRODUCTION_SERVER fallback |
| Finance ERP | quarantine | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII quarantine state | No PRODUCTION_SERVER fallback |
| Finance ERP | partial-search | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII partial-search state | No PRODUCTION_SERVER fallback |
| Finance ERP | session-expiry | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII session-expiry state | No PRODUCTION_SERVER fallback |
| Finance ERP | company-switch-stale | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII company-switch-stale state | No PRODUCTION_SERVER fallback |
| Finance ERP | GOU-read-only | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII GOU-read-only state | No PRODUCTION_SERVER fallback |
| Finance ERP | security-restricted | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII security-restricted state | No PRODUCTION_SERVER fallback |
| Electronic Tax Invoices | success | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII success state | No PRODUCTION_SERVER fallback |
| Electronic Tax Invoices | empty | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII empty state | No PRODUCTION_SERVER fallback |
| Electronic Tax Invoices | loading | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII loading state | No PRODUCTION_SERVER fallback |
| Electronic Tax Invoices | slow | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII slow state | No PRODUCTION_SERVER fallback |
| Electronic Tax Invoices | validation | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII validation state | No PRODUCTION_SERVER fallback |
| Electronic Tax Invoices | unauthorized | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII unauthorized state | No PRODUCTION_SERVER fallback |
| Electronic Tax Invoices | forbidden | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII forbidden state | No PRODUCTION_SERVER fallback |
| Electronic Tax Invoices | revision | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII revision state | No PRODUCTION_SERVER fallback |
| Electronic Tax Invoices | idempotency | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII idempotency state | No PRODUCTION_SERVER fallback |
| Electronic Tax Invoices | provider-not-configured | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII provider-not-configured state | No PRODUCTION_SERVER fallback |
| Electronic Tax Invoices | provider-degraded | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII provider-degraded state | No PRODUCTION_SERVER fallback |
| Electronic Tax Invoices | file-scanning | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII file-scanning state | No PRODUCTION_SERVER fallback |
| Electronic Tax Invoices | quarantine | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII quarantine state | No PRODUCTION_SERVER fallback |
| Electronic Tax Invoices | partial-search | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII partial-search state | No PRODUCTION_SERVER fallback |
| Electronic Tax Invoices | session-expiry | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII session-expiry state | No PRODUCTION_SERVER fallback |
| Electronic Tax Invoices | company-switch-stale | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII company-switch-stale state | No PRODUCTION_SERVER fallback |
| Electronic Tax Invoices | GOU-read-only | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII GOU-read-only state | No PRODUCTION_SERVER fallback |
| Electronic Tax Invoices | security-restricted | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII security-restricted state | No PRODUCTION_SERVER fallback |
| HR, Organization and Account | success | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII success state | No PRODUCTION_SERVER fallback |
| HR, Organization and Account | empty | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII empty state | No PRODUCTION_SERVER fallback |
| HR, Organization and Account | loading | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII loading state | No PRODUCTION_SERVER fallback |
| HR, Organization and Account | slow | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII slow state | No PRODUCTION_SERVER fallback |
| HR, Organization and Account | validation | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII validation state | No PRODUCTION_SERVER fallback |
| HR, Organization and Account | unauthorized | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII unauthorized state | No PRODUCTION_SERVER fallback |
| HR, Organization and Account | forbidden | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII forbidden state | No PRODUCTION_SERVER fallback |
| HR, Organization and Account | revision | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII revision state | No PRODUCTION_SERVER fallback |
| HR, Organization and Account | idempotency | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII idempotency state | No PRODUCTION_SERVER fallback |
| HR, Organization and Account | provider-not-configured | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII provider-not-configured state | No PRODUCTION_SERVER fallback |
| HR, Organization and Account | provider-degraded | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII provider-degraded state | No PRODUCTION_SERVER fallback |
| HR, Organization and Account | file-scanning | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII file-scanning state | No PRODUCTION_SERVER fallback |
| HR, Organization and Account | quarantine | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII quarantine state | No PRODUCTION_SERVER fallback |
| HR, Organization and Account | partial-search | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII partial-search state | No PRODUCTION_SERVER fallback |
| HR, Organization and Account | session-expiry | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII session-expiry state | No PRODUCTION_SERVER fallback |
| HR, Organization and Account | company-switch-stale | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII company-switch-stale state | No PRODUCTION_SERVER fallback |
| HR, Organization and Account | GOU-read-only | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII GOU-read-only state | No PRODUCTION_SERVER fallback |
| HR, Organization and Account | security-restricted | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII security-restricted state | No PRODUCTION_SERVER fallback |
| Drive and Google Shared Drive | success | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII success state | No PRODUCTION_SERVER fallback |
| Drive and Google Shared Drive | empty | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII empty state | No PRODUCTION_SERVER fallback |
| Drive and Google Shared Drive | loading | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII loading state | No PRODUCTION_SERVER fallback |
| Drive and Google Shared Drive | slow | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII slow state | No PRODUCTION_SERVER fallback |
| Drive and Google Shared Drive | validation | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII validation state | No PRODUCTION_SERVER fallback |
| Drive and Google Shared Drive | unauthorized | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII unauthorized state | No PRODUCTION_SERVER fallback |
| Drive and Google Shared Drive | forbidden | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII forbidden state | No PRODUCTION_SERVER fallback |
| Drive and Google Shared Drive | revision | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII revision state | No PRODUCTION_SERVER fallback |
| Drive and Google Shared Drive | idempotency | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII idempotency state | No PRODUCTION_SERVER fallback |
| Drive and Google Shared Drive | provider-not-configured | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII provider-not-configured state | No PRODUCTION_SERVER fallback |
| Drive and Google Shared Drive | provider-degraded | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII provider-degraded state | No PRODUCTION_SERVER fallback |
| Drive and Google Shared Drive | file-scanning | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII file-scanning state | No PRODUCTION_SERVER fallback |
| Drive and Google Shared Drive | quarantine | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII quarantine state | No PRODUCTION_SERVER fallback |
| Drive and Google Shared Drive | partial-search | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII partial-search state | No PRODUCTION_SERVER fallback |
| Drive and Google Shared Drive | session-expiry | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII session-expiry state | No PRODUCTION_SERVER fallback |
| Drive and Google Shared Drive | company-switch-stale | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII company-switch-stale state | No PRODUCTION_SERVER fallback |
| Drive and Google Shared Drive | GOU-read-only | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII GOU-read-only state | No PRODUCTION_SERVER fallback |
| Drive and Google Shared Drive | security-restricted | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII security-restricted state | No PRODUCTION_SERVER fallback |
| Internal Claims | success | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII success state | No PRODUCTION_SERVER fallback |
| Internal Claims | empty | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII empty state | No PRODUCTION_SERVER fallback |
| Internal Claims | loading | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII loading state | No PRODUCTION_SERVER fallback |
| Internal Claims | slow | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII slow state | No PRODUCTION_SERVER fallback |
| Internal Claims | validation | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII validation state | No PRODUCTION_SERVER fallback |
| Internal Claims | unauthorized | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII unauthorized state | No PRODUCTION_SERVER fallback |
| Internal Claims | forbidden | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII forbidden state | No PRODUCTION_SERVER fallback |
| Internal Claims | revision | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII revision state | No PRODUCTION_SERVER fallback |
| Internal Claims | idempotency | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII idempotency state | No PRODUCTION_SERVER fallback |
| Internal Claims | provider-not-configured | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII provider-not-configured state | No PRODUCTION_SERVER fallback |
| Internal Claims | provider-degraded | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII provider-degraded state | No PRODUCTION_SERVER fallback |
| Internal Claims | file-scanning | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII file-scanning state | No PRODUCTION_SERVER fallback |
| Internal Claims | quarantine | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII quarantine state | No PRODUCTION_SERVER fallback |
| Internal Claims | partial-search | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII partial-search state | No PRODUCTION_SERVER fallback |
| Internal Claims | session-expiry | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII session-expiry state | No PRODUCTION_SERVER fallback |
| Internal Claims | company-switch-stale | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII company-switch-stale state | No PRODUCTION_SERVER fallback |
| Internal Claims | GOU-read-only | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII GOU-read-only state | No PRODUCTION_SERVER fallback |
| Internal Claims | security-restricted | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII security-restricted state | No PRODUCTION_SERVER fallback |
| External Claim Service | success | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII success state | No PRODUCTION_SERVER fallback |
| External Claim Service | empty | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII empty state | No PRODUCTION_SERVER fallback |
| External Claim Service | loading | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII loading state | No PRODUCTION_SERVER fallback |
| External Claim Service | slow | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII slow state | No PRODUCTION_SERVER fallback |
| External Claim Service | validation | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII validation state | No PRODUCTION_SERVER fallback |
| External Claim Service | unauthorized | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII unauthorized state | No PRODUCTION_SERVER fallback |
| External Claim Service | forbidden | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII forbidden state | No PRODUCTION_SERVER fallback |
| External Claim Service | revision | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII revision state | No PRODUCTION_SERVER fallback |
| External Claim Service | idempotency | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII idempotency state | No PRODUCTION_SERVER fallback |
| External Claim Service | provider-not-configured | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII provider-not-configured state | No PRODUCTION_SERVER fallback |
| External Claim Service | provider-degraded | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII provider-degraded state | No PRODUCTION_SERVER fallback |
| External Claim Service | file-scanning | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII file-scanning state | No PRODUCTION_SERVER fallback |
| External Claim Service | quarantine | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII quarantine state | No PRODUCTION_SERVER fallback |
| External Claim Service | partial-search | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII partial-search state | No PRODUCTION_SERVER fallback |
| External Claim Service | session-expiry | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII session-expiry state | No PRODUCTION_SERVER fallback |
| External Claim Service | company-switch-stale | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII company-switch-stale state | No PRODUCTION_SERVER fallback |
| External Claim Service | GOU-read-only | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII GOU-read-only state | No PRODUCTION_SERVER fallback |
| External Claim Service | security-restricted | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII security-restricted state | No PRODUCTION_SERVER fallback |
| AI, OCR, STT and RAG | success | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII success state | No PRODUCTION_SERVER fallback |
| AI, OCR, STT and RAG | empty | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII empty state | No PRODUCTION_SERVER fallback |
| AI, OCR, STT and RAG | loading | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII loading state | No PRODUCTION_SERVER fallback |
| AI, OCR, STT and RAG | slow | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII slow state | No PRODUCTION_SERVER fallback |
| AI, OCR, STT and RAG | validation | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII validation state | No PRODUCTION_SERVER fallback |
| AI, OCR, STT and RAG | unauthorized | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII unauthorized state | No PRODUCTION_SERVER fallback |
| AI, OCR, STT and RAG | forbidden | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII forbidden state | No PRODUCTION_SERVER fallback |
| AI, OCR, STT and RAG | revision | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII revision state | No PRODUCTION_SERVER fallback |
| AI, OCR, STT and RAG | idempotency | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII idempotency state | No PRODUCTION_SERVER fallback |
| AI, OCR, STT and RAG | provider-not-configured | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII provider-not-configured state | No PRODUCTION_SERVER fallback |
| AI, OCR, STT and RAG | provider-degraded | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII provider-degraded state | No PRODUCTION_SERVER fallback |
| AI, OCR, STT and RAG | file-scanning | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII file-scanning state | No PRODUCTION_SERVER fallback |
| AI, OCR, STT and RAG | quarantine | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII quarantine state | No PRODUCTION_SERVER fallback |
| AI, OCR, STT and RAG | partial-search | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII partial-search state | No PRODUCTION_SERVER fallback |
| AI, OCR, STT and RAG | session-expiry | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII session-expiry state | No PRODUCTION_SERVER fallback |
| AI, OCR, STT and RAG | company-switch-stale | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII company-switch-stale state | No PRODUCTION_SERVER fallback |
| AI, OCR, STT and RAG | GOU-read-only | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII GOU-read-only state | No PRODUCTION_SERVER fallback |
| AI, OCR, STT and RAG | security-restricted | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII security-restricted state | No PRODUCTION_SERVER fallback |
| Business and Support Search | success | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII success state | No PRODUCTION_SERVER fallback |
| Business and Support Search | empty | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII empty state | No PRODUCTION_SERVER fallback |
| Business and Support Search | loading | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII loading state | No PRODUCTION_SERVER fallback |
| Business and Support Search | slow | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII slow state | No PRODUCTION_SERVER fallback |
| Business and Support Search | validation | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII validation state | No PRODUCTION_SERVER fallback |
| Business and Support Search | unauthorized | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII unauthorized state | No PRODUCTION_SERVER fallback |
| Business and Support Search | forbidden | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII forbidden state | No PRODUCTION_SERVER fallback |
| Business and Support Search | revision | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII revision state | No PRODUCTION_SERVER fallback |
| Business and Support Search | idempotency | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII idempotency state | No PRODUCTION_SERVER fallback |
| Business and Support Search | provider-not-configured | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII provider-not-configured state | No PRODUCTION_SERVER fallback |
| Business and Support Search | provider-degraded | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII provider-degraded state | No PRODUCTION_SERVER fallback |
| Business and Support Search | file-scanning | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII file-scanning state | No PRODUCTION_SERVER fallback |
| Business and Support Search | quarantine | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII quarantine state | No PRODUCTION_SERVER fallback |
| Business and Support Search | partial-search | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII partial-search state | No PRODUCTION_SERVER fallback |
| Business and Support Search | session-expiry | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII session-expiry state | No PRODUCTION_SERVER fallback |
| Business and Support Search | company-switch-stale | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII company-switch-stale state | No PRODUCTION_SERVER fallback |
| Business and Support Search | GOU-read-only | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII GOU-read-only state | No PRODUCTION_SERVER fallback |
| Business and Support Search | security-restricted | DEMO_LOCAL/API_SANDBOX only | Synthetic non-PII security-restricted state | No PRODUCTION_SERVER fallback |
