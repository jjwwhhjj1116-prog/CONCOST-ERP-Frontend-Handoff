# RC3 Business Card Contact-Face OCR Backend Delta

## Scope

This delta defines the server capability required to preserve the RC3 dual-panel business-card workflow in `API_SANDBOX` and `PRODUCTION_SERVER`. It does not change the frozen OpenAPI contract. Until an approved backend adapter is available, server modes must report `BACKEND_REQUIRED` and must not fall back to browser OCR.

## Runtime Boundary

| Runtime | OCR path | Permitted fallback |
|---|---|---|
| `DEMO_LOCAL` | Browser panel detection and Tesseract.js | Manual human entry |
| `API_SANDBOX` | Backend OCR adapter | None |
| `PRODUCTION_SERVER` | Approved specialized provider | None |

Provider credentials, access tokens, cookies, and raw secret values are server-only. The frontend receives capability state and redacted correlation metadata only.

## Provider Routing

- CON-COST candidate: NAVER CLOVA OCR Business Card followed by ERP normalization and human review.
- Viet QS: an approved Vietnamese-capable layout provider followed by the same ERP normalization and human review.
- Provider selection is company-scoped and capability-driven. A missing provider is not a successful OCR result.

## Request Context

The backend request must carry authenticated `companyId`, locale, language profile, capture metadata, optional user panel override, and a READY file reference. Raw images must use the approved file pipeline; base64 image persistence in browser storage is prohibited.

## Panel Evidence

Return normalized coordinates in the `0..1` range:

```ts
type CardPanel = {
  id: 'LEFT' | 'RIGHT' | 'FULL';
  kind: 'CONTACT_FACE' | 'BRAND_PROMO_FACE' | 'UNKNOWN';
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  score: number;
  contactScore: number;
  promoScore: number;
};
```

The response also needs separator position/confidence, detection reasons, OCR line/word boxes, candidate score, rejection reason, and the selected source panel for every accepted field.

## Field Policy

- Contact-face only: name, department, position, mobile, telephone, fax, email, address.
- Contact-face preferred with promo assistance: company and homepage.
- Marketing slogans and service lists cannot replace a legal company candidate.
- Promo data may provide only a validated company brand or valid hostname.
- Low-confidence name, company, department, or position must be returned as review-required; blank is preferred to an unsafe guess.

## Structured Provider Fields

The adapter should normalize provider evidence into name, company, department, specialty, position, mobile, telephone including extension, fax, email, homepage, multiline address, OCR confidence, source boxes, source panel, language, model/provider version, and rejection reasons. Original provider payloads must not be exposed to unauthorized clients.

## Contact Crop and Field ROI Evidence

The server must return the actual source pixels used for recognition as a READY file derivative or authorized transient crop reference. Panel selection evidence includes requested selection (`AUTO`, `LEFT`, `RIGHT`, or `FULL`), actual source panel, normalized crop bounds, source dimensions, crop dimensions, selected pass, and detection reasons. A manual panel override must rerun recognition against that crop; changing only the label is invalid.

Field-specific re-recognition evidence is required for name, department/position, multiline address, and contact lines:

```ts
type FieldRoiEvidence = {
  field: 'name' | 'department' | 'position' | 'address' | 'telephone' | 'mobile' | 'fax' | 'email';
  sourcePanelId: 'LEFT' | 'RIGHT' | 'FULL';
  normalizedBounds: { x0: number; y0: number; x1: number; y1: number };
  upscale: 3 | 4;
  languageProfile: string;
  segmentationMode: string;
  previousValue: string | null;
  candidateValue: string | null;
  previousScore: number;
  candidateScore: number;
  accepted: boolean;
  rejectionReasons: string[];
};
```

A candidate may replace the current field only when its field validator passes and its score is higher. Contact-face-only fields cannot be promoted from a brand/promo crop. Name evidence must support spaced Hangul clustering without inventing a transliteration. Department and position remain separate candidates. Address continuation and telephone extensions preserve their source lines.

## Identity Review State

Identity-bearing fields use `REVIEW_REQUIRED`, `REVIEWED`, or `REJECTED`. OCR completion alone is not identity approval. Contact creation or merge requires a human-reviewed snapshot containing reviewed field values, source evidence versions, reviewer, reviewed timestamp, and revision. Retrying OCR invalidates only affected unapproved candidates and never creates a Contact automatically.
## Human Review and Contact OS

OCR never creates or merges a Contact automatically. The existing four-stage flow remains authoritative: image, OCR review, duplicate review, and customer DB registration. Preserve canonical `contactId`, company isolation, field-level merge, revision history, customer 360, opportunity, and mail links.

## Duplicate and Idempotency

Duplicate candidates remain company-scoped and use normalized email, mobile, and name plus company evidence. Contact creation and merge commands require idempotency and revision checks. Retrying OCR or changing the selected panel must not create a Contact.

## Security and Audit

- Validate company access before reading files or projecting OCR evidence.
- Redact provider secrets and sensitive diagnostics.
- Audit provider, model/version, file reference/version/checksum, panel selection, reviewer, review decision, and resulting Contact command.
- Do not copy raw image bytes, tokens, or full private payloads into audit events.
- Enforce retention and deletion through the approved file and privacy policies.

## Backend Acceptance

1. Server modes never invoke local OCR.
2. Contact-only fields never originate from a promo panel.
3. Valid promo homepage can supplement a missing contact-face homepage.
4. Marketing text never becomes the company.
5. Field source and normalized bbox evidence are returned.
6. Provider absence and partial provider failure are explicit errors.
7. Human review is required before Contact create or merge.
8. CON-COST and Viet QS data, provider routing, and duplicate search remain isolated.
