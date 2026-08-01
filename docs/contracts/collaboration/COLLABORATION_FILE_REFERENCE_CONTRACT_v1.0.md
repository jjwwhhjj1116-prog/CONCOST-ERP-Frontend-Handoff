# Collaboration File Reference Contract

This contract reuses the frozen Common File Lifecycle. Collaboration resources store only `fileId` references and display-safe metadata.

| Module/action | Draft behavior | Irreversible gate | Download |
|---|---|---|---|
| Mail Draft | UPLOADED/SCANNING references may remain in Draft | Send requires every file READY | Provider/message permission plus File permission |
| Approval Draft | References may be attached while scanning | Submit requires READY | Approval visibility rechecked |
| Board Draft | References may be attached while scanning | Publish requires READY | Board post visibility rechecked |
| Task Comment/Artifact | Upload intent allowed by capability | Publish/comment commit policy is backend-defined | Task permission rechecked |
| Calendar | No binary in v1 core event | Separate approved extension only | n/a |
| Notification | Never stores file binary; route points to protected resource | n/a | Target resource permission rechecked |
| Search | Indexes filename only after file permission filtering | n/a | Result opens protected download flow |

Rules:

1. Browser storage never contains file binary, signed URL, provider token or scan result authority.
2. Signed download URLs are short-lived and minted only after company and resource permission checks.
3. Declared MIME is untrusted; backend performs detection, malware scanning and quarantine.
4. File deletion is reference-aware and audited.
5. A Draft save can succeed with a non-READY reference, but Send/Submit/Publish cannot.
6. Search snippets never reveal filenames for unauthorized files.

## Final freeze

GOU read-only links are references, not imported binaries. Mail Provider selection does not change the Common File READY gate. Search filters file permission before matching or returning filenames and metadata.
