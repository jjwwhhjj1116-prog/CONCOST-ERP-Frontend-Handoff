# Business Module Scope and GOU Boundary

## Evidence

| Source | Classification | Finding |
|---|---|---|
| Current ERP Frontend | FRONTEND_VERIFIED | Sales/contact/business-card UI exists; contactStore is browser-persisted; Finance and Drive are provider-waiting shells; dedicated Claim domain and AI gateway are absent. |
| offday2 @ 4406d2607ace6b64e8a165e4aae8d67e082b992b | LEGACY_VERIFIED | Estimate, won/project flow, DB/performance and profitability behaviors exist in browser JavaScript/localStorage; persistence method is not adopted. |
| Organization policy | POLICY_FROZEN | POLICY_FROZEN_CON_COST_V1: canonical IDs, explicit role binding, five project-assignable units, Viet QS assignment disabled pending approval. |
| Common contract | COMMON_CONTRACT | COMMON_CONTRACT_FROZEN_V1: session cookie, X-Company-Id, revision, idempotency, File Reference and execution-mode rules. |
| Project Chain contract | PROJECT_CONTRACT | PROJECT_CHAIN_CONTRACT_FROZEN_V1: Estimate Request is the only sales quote path; canonical projectId and immutable issued versions. |
| Collaboration contract | COLLABORATION_CONTRACT | COLLABORATION_CONTRACT_FROZEN_V1: notifications, search, approval, mail/calendar/task/board boundaries. |
| GOU | GOU_UNKNOWN_READ_ONLY_DEFERRED | GOU is operational SSOT, but business-module API, DB, export and synchronization capabilities are not evidenced; no dual write is authorized. |
| CLM/Drive/AI audit | PROPOSAL | Internal Claim and Claim Service are separate proposed contexts; Drive provider and AI gateway/RAG/STT are unimplemented; local model evidence does not equal product capability. |

## Bounded contexts

- SALES owns Customer, Contact, Lead, Opportunity, Activity, card capture and merge history. It does not own Estimate versions or Projects.
- COMMERCIAL remains in the frozen Project Chain contract. There is no duplicate Sales Quote entity.
- FINANCE owns accounting records and Project profitability projections consume them.
- HR_ORGANIZATION owns personnel, membership, account lifecycle and explicit role assignment; rank never grants permission.
- FILES_DRIVE owns provider/file metadata and ACL references, not business entities.
- INTERNAL_CLAIM and CLAIM_SERVICE are separate contexts.
- AI_ASSISTANCE owns jobs/outputs only and cannot make final legal or accounting decisions.

## GOU coexistence

| Module | GOU Current | New ERP Current | v1 Target | Read-only | Dual Write | Cutover Gate |
|---|---|---|---|---|---|---|
| Organization | GOU operational SSOT | Fixture/persisted directory and frozen policy | Read-only bridge first; new HR requires approved cutover | true | false | Source priority decision + backend capability |
| Personnel | GOU operational SSOT | Fixture/local state | Read-only personnel directory then governed HR | true | false | Identity mapping and privacy review |
| Contacts | GOU capability unknown | Browser contactStore | Canonical Contact server; optional provider sync | false | false | GOU export/API evidence and provider decision |
| Sales | GOU capability unknown | UI/local derived pipeline | Server CRM linked to Project Chain Estimate Request | false | false | Pilot data owner and pipeline decision |
| Finance | GOU capability unknown | Empty/read-only shell | Accounting/provider-backed records | false | false | Accounting scope/provider approval |
| Drive | GOU capability unknown | Provider-waiting demo | Server-side Google Shared Drive binding if approved | false | false | Provider/security review |
| Internal Claim | GOU capability unknown | No dedicated domain | Separate internal claim context | false | false | Owner and retention decision |
| Claim Service | GOU capability unknown | No dedicated domain | External consulting context linked to Project | false | false | Legal/evidence policy |

Unknown GOU capabilities remain GOU_UNKNOWN_READ_ONLY_DEFERRED. No GOU write, dual-write or cutover is authorized by this design.
