# RC3 Business Card True OCR Backend Delta

## Status

- Frontend hotfix: browser-local OCR is available only in DEMO_LOCAL.
- API_SANDBOX and PRODUCTION_SERVER: BACKEND_REQUIRED until an approved adapter and OCR provider are ready.
- Recommended provider candidate: NAVER Cloud CLOVA OCR, Document OCR, Business Card domain.
- Provider selection, credentials, storage, retention, and production rollout remain Backend and security responsibilities.

## Non-negotiable boundaries

1. The browser must never receive CLOVA Secret Key, Invoke URL credentials, OAuth client secrets, or storage credentials.
2. API_SANDBOX and PRODUCTION_SERVER must not fall back to local OCR or synthetic contact values after an adapter or provider error.
3. OCR output is a candidate. It becomes a contact only after human review and an explicit registration command.
4. Images and raw OCR text must not be written to browser localStorage or persisted client stores.
5. Company scope is mandatory on capture, OCR job, review, duplicate search, and contact registration.
6. Empty or uncertain incoming fields must never erase existing contact fields during merge.

## Proposed backend flow

~~~text
READY file reference
  -> create OCR job
  -> provider capability and company permission check
  -> CLOVA Business Card OCR
  -> normalized candidate DTO
  -> human review
  -> duplicate decision
  -> canonical contact create or field-level merge
  -> audit and notification
~~~

## Required API capabilities

| Capability | Minimum behavior |
|---|---|
| Create capture | Accept metadata and a READY file reference, never browser Base64 in production |
| Start OCR job | Idempotent by companyId + fileVersionId + request key |
| Read OCR job | Return queued, processing, review-required, failed, or cancelled |
| Cancel OCR job | Stop work when supported and prevent stale result application |
| Review OCR result | Persist reviewer edits, field confidence, and source version |
| Duplicate search | Scope by company before projecting names, emails, or phone metadata |
| Register contact | Create or field-merge only after explicit human decision |

## Candidate DTO

~~~ts
type BusinessCardOcrCandidate = {
  jobId: string;
  companyId: string;
  fileVersionId: string;
  contact: {
    name: string;
    company: string;
    department: string;
    position: string;
    mobile: string;
    telephone: string;
    fax: string;
    email: string;
    homepage: string;
    address: string;
  };
  rawText: string;
  overallConfidence: number | null;
  fieldConfidence: Partial<Record<keyof BusinessCardOcrCandidate['contact'], number | null>>;
  languageProfile: string[];
  engine: 'BACKEND_PROVIDER';
  provider: 'NAVER_CLOVA_OCR' | 'PROVIDER_TBD';
  warnings: string[];
  createdAt: string;
  revision: number;
};
~~~

## Security and privacy

- The provider call is server-to-server.
- The provider request must use an approved region, retention policy, and data-processing agreement.
- Logs must redact image bytes, raw OCR text, email, phone, address, cookies, tokens, and provider credentials.
- Audit events store IDs, versions, hashes, actor, decision, and timestamps instead of duplicating card content.
- File malware scan and READY state are required before OCR.
- Access to raw OCR text follows the same company and contact permissions as the reviewed candidate.

## Error contract

| Code | Frontend behavior |
|---|---|
| BACKEND_REQUIRED | Block start and show adapter requirement |
| PROVIDER_NOT_CONFIGURED | Block start; never report OCR success |
| OCR_ENGINE_LOAD_FAILED | Offer retry, another image, or manual entry |
| LANGUAGE_DATA_FAILED | Offer profile change and retry |
| NO_TEXT_DETECTED | Keep the image and offer retry/manual entry |
| LOW_CONFIDENCE | Open human review with warnings |
| PARSER_NO_CANDIDATE | Keep raw text for review; no automatic contact |
| COMPANY_SCOPE_FORBIDDEN | Return 403 without contact metadata |
| STALE_REVISION | Return 409 with the current safe revision metadata |

## Frontend fixtures

The following synthetic PNG files contain no real personnel data:

- /public/demo/business-cards/business-card-ko.png
- /public/demo/business-cards/business-card-en.png
- /public/demo/business-cards/business-card-vi.png

All emails use example.invalid. They are test inputs only and must never be seeded as production contacts.
