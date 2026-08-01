# Business and Support Search Contract

Business search extends the frozen Collaboration search behavior with providers for Customer, Contact, Opportunity, Sales Activity, Finance metadata, Tax Invoice metadata, Personnel summary, Organization, Drive metadata, Internal Claim, Claim Service, Issue, Evidence metadata and Report metadata.

## Security

- X-Company-Id and allowedCompanyIds are mandatory.
- Each provider evaluates permission before returning title, filename, identifier or snippet.
- Finance amount, payroll, contact PII, claim confidentiality, evidence name and Drive ACL are redacted or omitted by field permission.
- Provider failures are isolated; response status is PARTIAL and names only the unavailable provider, never hidden records.
- Results contain sourceType, sourceId, safe title/subtitle/snippet, route, companyId, optional projectId, sourceSystem and readOnly.
- Browser history, direct route, back/forward and KR/VI localization reuse the Collaboration contract.

Search is read-only. It never creates a name-based relationship or bypasses source permissions.
