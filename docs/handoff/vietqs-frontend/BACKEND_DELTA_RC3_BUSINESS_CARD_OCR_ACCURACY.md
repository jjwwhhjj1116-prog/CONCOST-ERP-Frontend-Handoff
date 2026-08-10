# RC3 Business Card OCR Accuracy Backend Delta

## Purpose

This delta preserves the human-reviewed Contact OS flow while upgrading the OCR boundary from flat text to structured layout evidence. It does not change the frozen OpenAPI contract and does not select or connect a production provider.

## Frontend Behavior

- `DEMO_LOCAL` may run browser-local Tesseract.js and is labeled `LOCAL OCR`.
- `API_SANDBOX` and `PRODUCTION_SERVER` never fall back to local OCR.
- The parser compares `STANDARD`, `CONTRAST`, and `THRESHOLD` passes and uses rotation retries only when the structured score is low.
- Line and word bounding boxes are normalized to the `0..1` range.
- Field candidates retain OCR, pattern, label, layout, semantic, and exclusion scores.
- Logo text, company text, marketing claims, and code tokens are rejected as person-name candidates.
- Numeric pseudo-domains such as `No.1`, `BIM.7`, and `Ver.2` are rejected.
- Low-confidence identity fields remain blank and require human review.
- Images, bounding boxes, candidates, and raw OCR diagnostics are not persisted by the browser.

## Required Provider Capability

| Company/language | Candidate | Required behavior | Selection state |
|---|---|---|---|
| CON-COST / Korean | NAVER CLOVA OCR Business Card | Return structured name-card fields with field confidence and source evidence when available | CANDIDATE_NOT_SELECTED |
| Viet QS / Vietnamese | Google Cloud Vision `DOCUMENT_TEXT_DETECTION` plus approved layout parser, or another approved provider with verified Vietnamese support | Return block, line, word, bounding box, language, and confidence evidence | CANDIDATE_NOT_SELECTED |

Vietnamese traffic must not be forced through a provider until Vietnamese card accuracy, data residency, retention, and security controls are approved.

## Server-only Security

- Provider credentials, tokens, signed requests, and billing identifiers remain server-side.
- Browser responses must not expose secrets, provider raw credentials, or unrestricted storage references.
- OCR requests require authenticated user, `X-Company-Id`, company authorization, file readiness, MIME/size validation, and correlation ID.
- Provider logs and audit events must redact card text except approved field-level review references.
- Production images use the approved file lifecycle and retention policy; browser object URLs are not durable storage.

## Structured Result Requirement

The backend adapter should return:

- provider and model/version identifier;
- detected language and pass/orientation metadata;
- normalized line/word boxes with confidence;
- candidate fields with source box references and rejection reason;
- capture-quality warnings;
- provider request/correlation ID;
- explicit `REVIEW_REQUIRED`, `READY_FOR_REVIEW`, `PROVIDER_NOT_CONFIGURED`, or typed error state.

No response may create or merge a Contact before a person confirms the OCR fields and duplicate decision.

## Acceptance Scenarios

1. Brand text is not selected as a person name.
2. `No.1`, `BIM.7`, and `Ver.2` are not accepted as websites.
3. Department and position are split without trailing internal code tokens.
4. Phone, fax, and email regressions remain zero.
5. Multiline addresses retain ordered lines.
6. Low-score identity candidates remain blank.
7. Company A OCR evidence and Contact candidates are not returned in Company B.
8. Provider unavailable in server modes returns a blocked state and never local success.
9. Admin QA can inspect redacted evidence; ordinary users see only confidence and review state.

## Backend Implementation Gate

Provider selection, credential provisioning, retention policy, Vietnamese accuracy benchmark, and security review remain `BACKEND_REQUIRED`. The frontend is ready to consume a structured adapter without a production-success fallback.
