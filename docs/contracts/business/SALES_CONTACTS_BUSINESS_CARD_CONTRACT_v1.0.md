# Sales, Contacts and Business Card Contract v1.0

## Frozen policy

- Customer and Contact are separate canonical entities; names and company strings are never joins.
- Contact Merge requires a review request and CRM_DATA_STEWARD or SALES_MANAGER approval. Originals become merge tombstones and remain auditable.
- Strong duplicate signals are normalized email, verified phone or provider external ID; all still require human review.
- OCR Provider selection is joint Backend, security/IT and Sales governance. Provider state is NOT_CONFIGURED, READY, DEGRADED, FAILED or DISABLED.
- OCR completion never creates a Contact. REVIEW_REQUIRED and DUPLICATE_REVIEW must complete first.
- Google Contacts is ERP-to-Google one-way user opt-in. Google-to-ERP results enter IMPORT_REVIEW; continuous two-way synchronization is excluded.
- Lead and Opportunity pipelines are company-versioned. Opportunity Estimate creation reuses Project Chain estimateRequestId and requires canCreateEstimateRequest.
- No Sales Quote duplicate entity is permitted.

## Failure contract

Provider absence, scope denial, revision conflict, duplicate review and Estimate linkage conflicts remain visible. PRODUCTION_SERVER never falls back to fixture or browser persistence.
