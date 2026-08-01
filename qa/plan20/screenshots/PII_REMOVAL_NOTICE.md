# Historical Screenshot Removal Notice

The historical Plan 20 screenshots were removed from the PII-safe RC2 source.
At least one image contained an identity-like label that was not guaranteed to
be synthetic. The screenshots are not runtime assets and are not required to
build or operate the frontend.

Future QA evidence must be regenerated from the synthetic demo dataset and pass
`node scripts/check-release-pii.mjs <release-root>` before packaging.
