# RC3 Semantic Action System

## Contract

Visible commands use `SemanticActionButton`. Navigation, tab selection, calendar dates, row selection, and disclosure controls remain navigation controls and are not assigned a business command color.

| Meaning | Variant | Color role |
|---|---|---|
| Create, proceed, submit | `primary` | CON-COST orange |
| Edit, change | `edit` | Blue |
| Save, draft | `save` | Teal |
| Copy, revision | `duplicate` | Violet |
| Delete | `danger` | Red |
| Archive, remove from queue | `archive` | Rose |
| Approve, win, complete | `success` | Green |
| Reject, lost | `reject` | Red soft |
| Hold, request changes | `warning` | Amber |
| Estimate, mail, Excel, PDF | `document` | Teal soft |
| Detail, history | `view` | Indigo |
| Upload, add person/file | `add-resource` | Sky |
| Cancel, close, refresh | `neutral` | Gray |

Every disabled semantic action provides a reason. Async actions expose loading state and `aria-busy`. Each command combines label, icon where available, tooltip, hover, pressed, and focus-visible feedback. A section may contain at most one primary orange command; destructive commands are separated through `DangerActionSection`.

## RC3 Workflow Amendments

- Project board cards expose one contextual staffing command and no duplicate board navigation command.
- Staffing receives the current group, unit, project, and source route. It does not select the first assignment as a fallback.
- Project Intake Step 4 uses `접수 완료`. Completion stays on the intake screen and displays the delivery receipt before any optional navigation.
- Backend operation names such as `complete-won` remain implementation details and are not shown to users.

## Backend Handoff

Semantic variants do not change OpenAPI operations. Server adapters must continue to return authoritative success before the UI displays completion. Disabled reasons and provider-unavailable states must be mapped from capability and permission responses rather than hidden with CSS.
