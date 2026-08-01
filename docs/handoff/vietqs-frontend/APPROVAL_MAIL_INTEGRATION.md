# Approval and Mail Integration

## Electronic Approval

Frontend coverage:

- form selection and renderer
- draft editing
- dynamic policy preview
- sequential/parallel/reference steps
- submit, approve, reject, request changes, recall
- Project/Claim link, file references, comments, and history
- revision and permission state

The Backend supplies actors and policy. The Frontend must not hardcode approver
names or use the current user as an approver fallback.

In `DEMO_LOCAL`, every action is a simulation and is not an official approval.
In server modes, missing server, adapter, or policy blocks the command. A local
state change is never presented as `APPROVED`.

## Electronic Mail

Frontend coverage:

- folders and user folders
- message list and thread detail
- compose, reply, reply all, and forward
- attachment metadata and Project link
- search and Provider status

Mail remains Provider-neutral. The Backend capability response decides whether
mail is read-only, GOU-linked, sandbox-ready, or send-ready.

In `DEMO_LOCAL`, send is a visible simulation. In server modes, a missing
Provider or adapter blocks the command and no `SENT` state is produced.

## Common Backend Rules

- Secure session and server-side permissions
- Required company scope and resource company validation
- Permission filtering before list/search projection
- Revision on mutable records
- Idempotency on submit/send/decision commands
- File references must be `READY`
- Audit event for approval decisions and mail send attempts
- Project linking requires explicit user confirmation
- Unauthorized mail subject, recipient, attachment name, or approval metadata
  must never appear in list/search results

## Provider Capability

Capability readiness and API adapter readiness are separate. A build flag may
enable the Frontend integration point, but the Backend capability response and
actual command response remain authoritative.
