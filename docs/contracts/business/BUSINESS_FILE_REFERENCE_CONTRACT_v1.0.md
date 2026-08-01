# Business File Reference Contract

The frozen Common File Reference lifecycle is reused unchanged: upload intent → upload → finalize → scan → READY/QUARANTINED. Business records store only fileId/provider reference metadata. No token, secret, binary or public URL is stored in browser state.

| Module | Categories | Classification | Guard | Retention |
|---|---|---|---|---|
| Sales | BUSINESS_CARD_IMAGE; CUSTOMER_DOCUMENT; SALES_ACTIVITY_ATTACHMENT; PROPOSAL_REFERENCE | PII; company-scoped | READY before OCR/irreversible command | Retention policy + consent |
| Finance | SALES_EVIDENCE; PURCHASE_EVIDENCE; TAX_INVOICE_ATTACHMENT; EXPENSE_RECEIPT; CARD_RECEIPT; BUDGET_SUPPORT; CLOSING_SUPPORT | ACCOUNTING_RECORD | READY before submit/post | Finance retention and audit |
| HR | PERSONNEL_PROFILE_ATTACHMENT; EMPLOYMENT_DOCUMENT; ORGANIZATION_IMPORT_FILE; LEAVE_REFERENCE | SECURITY_RESTRICTED | READY before import/decision | Field-level and purpose-limited access |
| Drive | DRIVE_PROVIDER_REFERENCE | ACL-mapped | File Reference READY plus provider item state READY | No frontend token or public-link default |
| Claims | CLAIM_INTAKE_DOCUMENT; CONTRACT_DOCUMENT; DRAWING; SPECIFICATION; BOQ; CALL_RECORDING; TRANSCRIPT; MEETING_DOCUMENT; EVIDENCE_ORIGINAL; EVIDENCE_DERIVATIVE; REPORT_DRAFT; REPORT_ISSUED; LEGAL_REFERENCE | LEGAL_RECORD | READY; checksum/version/audit; legal hold checked | Deletion blocked by legal hold |
| AI | DERIVED_OCR; DERIVED_TRANSCRIPT; DERIVED_SUMMARY; DERIVED_INDEX | Inherits source ACL and retention | Source READY and permission rechecked | Derived data purged with policy, not source mutation |

Claim evidence additionally requires checksum, immutable version, chain-of-custody auditEventId and legalHold. AI output is always derived and never overwrites the original file.
