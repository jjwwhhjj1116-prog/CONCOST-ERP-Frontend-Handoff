# ZioYou Approval Role Semantics

## Evidence Boundary

- `TARGET_VERIFIED`: the ERP implementation in this branch.
- `LEGACY_VERIFIED`: labels or behavior observed in a read-only ZioYou browser session.
- No document submit, approval, rejection, recall, delete, line save, or default-line write was executed.
- No cookie, token, employee name, document title, or document body is recorded.

## Verified Semantics

| Legacy label | Verified meaning | ERP contract |
|---|---|---|
| 결재 | Approval decision step | `APPROVER` |
| 전결 | Final-authority decision step | `FINAL_APPROVER` |
| 협조 | Cooperation step | `COOPERATION` |
| A | Permission to edit the approval line | `canEditLine` |
| B | Permission to edit document content | `canEditContent` |
| 결재라인 사용 | Saved line can be selected for compose | `ApprovalLineDefinition` |

`합의`, `참조`, `회람`, `배포`, delegation, acting approval, and final authority are modeled separately. Backend policy decides whether a form and organization permit each capability. Frontend job titles never grant permission by themselves.

## Unverified Semantics

`바로도착` is present as a `MustBe` Y/N field. Its exact queue-routing and bypass behavior was not proven without performing a write. The ERP preserves the field in the contract but must not execute special routing until the Backend returns a supported policy capability.
