# FE-CONTRACT-04 Final Decisions

Status: `BUSINESS_CONTRACT_FROZEN_V1`

The 18 source questions were checked before policy application. No question was added, removed or repurposed.

| No | Source Question | Approved Decision | Meaning Match | Action |
|---|---|---|---|---|
| 1 | 고객·Contact 중복 Merge의 최종 승인자는 누구인가? | Final approval requires CRM_DATA_STEWARD or SALES_MANAGER. Strong duplicate signals only create a review candidate; canonical contact, tombstone, conflict decisions and audit are retained. | MATCH | FROZEN |
| 2 | 명함 OCR Provider는 누가 선정하는가? | Provider selection is jointly approved by the Viet QS Backend lead, CON-COST security/IT and the Sales owner, with privacy/legal review when required. Contract state remains provider-neutral. | MATCH | FROZEN |
| 3 | Google Contacts Sync는 단방향인가 양방향인가? | ERP to Google is one-way user opt-in. Google to ERP is IMPORT_REVIEW only; automatic continuous two-way synchronization is excluded. | MATCH | FROZEN |
| 4 | Lead·Opportunity 기본 Pipeline 단계는 무엇인가? | Versioned company-configurable Lead and Opportunity pipelines use the approved defaults; Stage, status and probability remain separate. | MATCH | FROZEN |
| 5 | Opportunity→Estimate Request 생성권한은 누구인가? | Opportunity owner or approved Sales roles may create the Project Chain Estimate Request only when canCreateEstimateRequest is true; duplicate Sales Quote entities are forbidden. | MATCH | FROZEN |
| 6 | 재무 v1 범위에 일반전표·원장까지 포함하는가? | Finance v1 covers operational finance workflow and Project profitability projection. A full statutory ledger is ACCOUNTING_BACKEND_PHASE_2. | MATCH | FROZEN |
| 7 | 전자세금계산서 Provider와 승인선은? | Provider remains TBD. Author to Finance review to Finance Manager approval to authorized issuer submission is required; provider absence blocks submission and success. | MATCH | FROZEN |
| 8 | 은행·법인카드 연동은 v1인가 후속인가? | Real-time bank/card integration is deferred. v1 permits approved CSV/XLSX import, manual entry, deduplication, reconciliation and audit with explicit sourceType. | MATCH | FROZEN |
| 9 | 재무 상세금액 조회권한은? | Finance permissions are separated by business role and sensitivity: SUMMARY, DETAIL, RESTRICTED, PAYROLL_RESTRICTED, BANK_RESTRICTED and TAX_RESTRICTED. | MATCH | FROZEN |
| 10 | 인사 Source 우선순위는 GOU·Excel·신규 HR 중 무엇인가? | GOU is the current HR SSOT; approved Excel is an import snapshot; the new HR Backend becomes SSOT only after cutover with source version and conflict metadata. | MATCH | FROZEN |
| 11 | 휴가·근태는 v1 범위인가? | v1 is a read-only approved leave/absence overlay with GOU reference. Application, attendance, accrual, payroll and dual write are deferred. | MATCH | FROZEN |
| 12 | Google Shared Drive를 기본 Provider로 승인하는가? | Google Shared Drive is the default Drive provider. General ERP attachments remain on the Common File API and storage adapter; secrets are server-only. | MATCH | FROZEN |
| 13 | Project Folder 자동생성 시점은? | PROJECT_ACTIVATED emits an idempotent Drive Folder Intent through outbox. Folder failure retries independently and never rolls back Project activation. | MATCH | FROZEN |
| 14 | 내부 Claim과 외부 Claim 용역을 완전히 분리하는가? | Internal Claim and external Claim Service are separate bounded contexts with separate IDs, permissions, retention and report semantics. | MATCH | FROZEN |
| 15 | Claim Evidence 보존·Legal Hold 승인자는? | Legal Hold approval requires the Claim Center owner plus Legal/Compliance or a designated executive approver. Release requires approval, reason and audit. | MATCH | FROZEN |
| 16 | 통화녹음·녹취 보존기간과 동의정책은? | Recording requires consent or approved legal basis. Retention is returned by legal/security policy capability; original audio is immutable and transcript review is separate. | MATCH | FROZEN |
| 17 | Local AI만 허용하는 자료등급은? | Restricted legal, HR-sensitive and finance-restricted data use Local/Private AI; SECURITY_SECRET is prohibited from every AI input. Citation and human review are mandatory. | MATCH | FROZEN |
| 18 | Pilot 모듈 순서는? | Pilot order is Contacts/OCR, Sales, Drive, Internal Claim, Finance Sandbox, Claim Service/AI, then Tax/Bank for the development team and designated administrators. | MATCH | FROZEN |
