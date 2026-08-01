# Known Limitations

- Actual Backend, database, and providers are not connected.
- Mail, Drive, OCR, notification, tax, bank, AI, and other provider operations require backend capabilities.
- Sales and Finance are basic workbench scope; statutory accounting and real-time provider features are not included.
- Production mode forbids demo fallback and must not display success without a verified server response.
- Real employee data is intentionally absent. The included dataset is synthetic and uses `example.invalid`.
- Existing development history is not distributed because it contained identity-bearing source history.
- The previous Windows `.next` lock affected an earlier browser gate attempt; the final PII-safe static build and browser regression completed successfully after the task-owned server was closed.
- Browser coverage focused on login, organization, access, finance, approval, company/locale switching, desktop, and mobile data-dependent flows.
