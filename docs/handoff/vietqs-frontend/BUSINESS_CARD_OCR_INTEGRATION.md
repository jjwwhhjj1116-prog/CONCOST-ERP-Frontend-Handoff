# Business Card OCR Integration

## User Flow

```text
Capture or select image
→ create capture
→ start OCR job
→ processing
→ field review
→ duplicate comparison
→ create Contact or request merge
→ optional ERP-to-Google sync
```

The Frontend covers image preview, progress, editable fields, confidence,
duplicate candidates, review, create/merge actions, and one-way sync status.

## Required Backend Operations

- `createBusinessCardCapture`
- `startBusinessCardOcr`
- `reviewBusinessCardOcr`
- `createContactFromBusinessCard`

Additional duplicate, merge-request, and Google-sync operations must follow the
frozen Business Contract before they are enabled.

## Safety Rules

- OCR never confirms a Contact without human review.
- A name alone is not a valid merge key.
- Duplicate evidence should use verified email and/or verified phone.
- Merge requires the approved CRM data steward or sales manager workflow.
- Google Contacts is ERP-to-Google, one-way, and opt-in.
- Google-to-ERP data enters Import Review.
- Image and Contact data are company-scoped.
- Browser code stores no OAuth token or Provider secret.
- Server modes do not create a local Contact after an API failure.

## Provider States

| State | Frontend behavior |
|---|---|
| OCR not configured | capture/review UI remains visible; OCR start is blocked |
| OCR ready, adapter missing | capability shown; command blocked |
| OCR and adapter ready | server request may be issued |
| Google Contacts unavailable | Contact can remain ERP-only; sync stays disabled |
