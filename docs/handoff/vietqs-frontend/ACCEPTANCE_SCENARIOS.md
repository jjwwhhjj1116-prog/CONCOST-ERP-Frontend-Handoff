# Acceptance Scenarios

The Frontend team can run Demo scenarios. The Viet QS Backend team must repeat
the server scenarios in `API_SANDBOX` before Production.

## Common

| ID | Scenario | Expected |
|---|---|---|
| C-01 | Open each module in Demo | visible simulation notice; no persisted success |
| C-02 | Open each module in Sandbox without adapter | action blocked with Backend-required state |
| C-03 | Open Provider module without Provider | action blocked; no external success |
| C-04 | Change company while request is in flight | old response rejected |
| C-05 | Request without company | Backend returns `400` |
| C-06 | Request unauthorized company/resource | Backend returns `403` or contract-approved `404` |
| C-07 | Switch KO→VI→EN | core labels and capability messages update |
| C-08 | Desktop 1440×900 and mobile 390×844 | no horizontal page overflow or clipped commands |

## Project

| ID | Scenario | Expected |
|---|---|---|
| P-01 | Estimate→won→execution→intake→Project | one canonical `projectId` |
| P-02 | Assign structure and finishing teams | same Project shown in both team views |
| P-03 | Submit Intake twice with same key | one Project and one command result |
| P-04 | Open schedule/questions/meeting/Drive/Approval/AI links | correct module and Project context |
| P-05 | Server Intake failure | input preserved; retry offered; no local success ID |

## Drive

| ID | Scenario | Expected |
|---|---|---|
| D-01 | Open Project folder with Provider missing | blocked capability state |
| D-02 | Demo upload | simulated queue/progress/scan/READY clearly marked |
| D-03 | Server upload | intent→transfer→finalize→scan→READY |
| D-04 | Quarantined file | cannot attach or download as READY |

## Approval and Mail

| ID | Scenario | Expected |
|---|---|---|
| A-01 | Form→draft→policy→submit in Demo | simulation, not official approval |
| A-02 | Decide without server policy | blocked; no APPROVED state |
| A-03 | Recall after first decision | Backend rejects according to policy |
| M-01 | Compose/reply/forward in Demo | simulation, not sent |
| M-02 | Send without Provider | blocked; no SENT state |
| M-03 | Link Project mail | explicit user confirmation and canonical ID |

## Business Card and AI

| ID | Scenario | Expected |
|---|---|---|
| B-01 | Image→OCR→review | no Contact before human confirmation |
| B-02 | Duplicate by name only | merge unavailable |
| B-03 | Google sync unavailable | ERP Contact remains usable; sync blocked |
| AI-01 | Notes→structured minute | citations/review visible |
| AI-02 | Audio→STT→summary | job states visible; reviewed save candidate |
| AI-03 | Create Task/Event candidate | no downstream record before confirmation |

## P1 and P2

| ID | Scenario | Expected |
|---|---|---|
| P1-01 | Calendar/Task/Notification Demo mutation | simulated and not persisted |
| P1-02 | Same mutation in server mode without adapter | blocked |
| S-01 | Opportunity create in Demo | component-memory sample only |
| F-01 | Finance create in Demo | component-memory sample only |
| F-02 | Tax/bank/card Provider missing | no issuance, payment, or live-balance success |

## Quality Gate

- lint
- TypeScript typecheck
- unit tests
- production build
- `git diff --check`
- console error inspection
- failed network inspection
- direct route and refresh
- keyboard focus and primary commands
- original dirty worktree fingerprint unchanged
