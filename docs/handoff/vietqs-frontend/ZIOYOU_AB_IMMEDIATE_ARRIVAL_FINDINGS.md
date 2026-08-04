# ZioYou A/B and Immediate Arrival Findings

## A/B

Read-only browser help text confirmed:

- **A**: approval-line edit permission.
- **B**: document-content edit permission.

The ERP stores these independently as `canEditLine` and `canEditContent`. Neither flag grants approve/reject permission.

## Immediate Arrival

The popup contains a `MustBe` Y/N value and source annotation identifying it as `바로도착여부`. No safe read-only evidence established whether it skips earlier steps, changes notification timing, or only changes inbox projection.

Final classification: `BACKEND_CAPABILITY_PENDING`.

The Frontend may collect and display the value, but the Backend must reject it unless the policy preview explicitly advertises support and returns the routing semantics and audit event.
