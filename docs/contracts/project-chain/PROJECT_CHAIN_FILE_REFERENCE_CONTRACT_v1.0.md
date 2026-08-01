# PROJECT CHAIN FILE REFERENCE CONTRACT v1.0

Binary content never appears in Project DTOs. APIs carry opaque FileDto references governed
by FE-CONTRACT-01.

## Transition Gate

Required files must be `READY` before Intake submit, QC approval/export, estimate issue or
delivery submit. `UPLOADED`, `SCANNING`, `QUARANTINED`, `FAILED` and deleted references
are not READY and produce `FILE_NOT_READY` or the corresponding common error.

## Immutable Documents

Issued Estimate Sheet versions and Delivery Package versions retain immutable File references,
documentHash/checksum, version, timestamps and audit history. Reissue or re-delivery creates a
new version and never overwrites the prior binary.

Examples use synthetic filenames and hashes only. No token, signed URL or binary is embedded.
