# FE-CONTRACT-03 Final Decisions

Status: **COLLABORATION_CONTRACT_FROZEN_V1**

## Source question semantic verification

| Source No | Source Question | This Directive | Meaning Match | Action |
|---:|---|---|---|---|
| 1 | 신규 ERP 메일을 실제 사서함으로 운영할까요, 아니면 GOU 링크/읽기 전용으로 시작할까요? | COLLAB-DEC-01: GOU를 운영 Mail SSOT로 유지하고 ERP는 pre-cutover에 GOU Link/승인된 read-only 또는 provider 미설정 상태로 운영 | YES | FINAL_FROZEN |
| 2 | 메일 Provider는 무엇으로 할까요? | COLLAB-DEC-02: 제품을 고정하지 않고 Provider-neutral Adapter와 /mail/capabilities 사용 | YES | FINAL_FROZEN |
| 3 | 메일 보존기간과 휴지통 보관기간은 얼마로 할까요? | COLLAB-DEC-03: Trash·Spam 30일, Draft stale 90일, 장기 보존은 회사·Provider 정책 | YES | FINAL_FROZEN |
| 4 | 메일 작성 시 Project 자동 추천을 허용할까요? | COLLAB-DEC-04: 추천은 허용하되 사용자 확인 전 canonical projectId Link 생성 금지 | YES | FINAL_FROZEN |
| 5 | 전자결재 병렬 결재를 지원할까요? | COLLAB-DEC-05: v1은 SEQUENTIAL·PARALLEL_ALL·REFERENCE_ONLY 지원, PARALLEL_ANY 비활성 | YES | FINAL_FROZEN |
| 6 | 결재 회수는 언제까지 허용할까요? | COLLAB-DEC-06: 첫 Decision 전 작성자 직접 Recall, 이후 승인된 회수/취소요청, 최종 승인 후 정정·대체 | YES | FINAL_FROZEN |
| 7 | 대리결재 지정 권한과 최대 기간은? | COLLAB-DEC-07: 승인·사유·유효기간 필수, 기본 최대 30일 | YES | FINAL_FROZEN |
| 8 | 결재 문서 보존·삭제 정책은? | COLLAB-DEC-08: 최종문서는 Immutable, 일반 사용자 물리삭제 금지, Draft stale 90일 | YES | FINAL_FROZEN |
| 9 | 캘린더 기본 공개범위는? | COLLAB-DEC-09: 개인 BUSY_ONLY, 팀·Project scoped details, 회사 일정 COMPANY_VISIBLE | YES | FINAL_FROZEN |
| 10 | 반복일정 수정 기본값은? | COLLAB-DEC-10: THIS_OCCURRENCE 기본, THIS_AND_FUTURE/ENTIRE_SERIES 명시 선택 | YES | FINAL_FROZEN |
| 11 | 기한 초과 할 일 알림 정책은? | COLLAB-DEC-11: -24h, Due, +24h APP 기본; EMAIL/BROWSER opt-in | YES | FINAL_FROZEN |
| 12 | 필독 공지 읽음 확인을 강제할까요? | COLLAB-DEC-12: 승인된 중요공지만 MANDATORY_READ; 단순 노출은 acknowledgement 아님 | YES | FINAL_FROZEN |
| 13 | 게시판 게시 승인 Workflow를 사용할까요? | COLLAB-DEC-13: 회사 공식공지는 DRAFT→IN_REVIEW→APPROVED→PUBLISHED, 일반 게시판은 capability에 따라 직접 게시 | YES | FINAL_FROZEN |
| 14 | GOU 읽기 전용 연동을 어떤 협업 모듈부터 할까요? | COLLAB-DEC-14: 공지·회사일정 → 결재 Metadata → Mail Link 순서 | YES | FINAL_FROZEN |
| 15 | 협업 Pilot 순서는? | COLLAB-DEC-15: 개발팀·관리자: Task/APP → Board/Calendar → Approval Sandbox → Mail Sandbox | YES | FINAL_FROZEN |

All 15 source questions have exactly one directive decision. Different final values replace earlier recommendations; they do not change the question meaning. Decision mismatch count: **0**.

## Frozen policy

| Decision | Final policy | Final classification | Follow-up gate |
|---|---|---|---|
| COLLAB-DEC-01 | GOU=LEGACY_GOU_ONLY. ERP=GOU_LINK|READ_ONLY_MIRROR|API_SANDBOX. Provider READY 전 Send 성공 금지. | GOU_UNKNOWN_READ_ONLY_DEFERRED | Mail Provider Pilot and Cutover approval |
| COLLAB-DEC-02 | providerType=PROVIDER_TBD. Backend/보안/IT가 별도 선정. | PROVIDER_TBD_CONTRACT_COMPLETE | Provider selection and capability conformance |
| COLLAB-DEC-03 | Soft delete only for general users; legal hold and hard delete are backend policy. | CONTRACT_DEFINED | Company retention policy publication |
| COLLAB-DEC-04 | SuggestedProjectLink.requiresConfirmation=true. Title/name-only matching forbidden. | CONTRACT_DEFINED | Backend recommendation capability |
| COLLAB-DEC-05 | Backend policyVersion/completionRule is authoritative. | CONTRACT_DEFINED | Approval engine capability |
| COLLAB-DEC-06 | Decision ledger and audit are immutable. | CONTRACT_DEFINED | Recall/correction command implementation |
| COLLAB-DEC-07 | Cross-company, self delegation and approval-line bypass are forbidden. | CONTRACT_DEFINED | Delegation policy capability |
| COLLAB-DEC-08 | Archive/retention/legal hold replace physical deletion. | CONTRACT_DEFINED | Retention policy endpoint |
| COLLAB-DEC-09 | Private title/description/file metadata are filtered before projection. | CONTRACT_DEFINED | Calendar visibility enforcement |
| COLLAB-DEC-10 | Frontend shows affected range before save. | CONTRACT_DEFINED | Recurrence engine conformance |
| COLLAB-DEC-11 | Critical project follow-up escalation is policy-controlled and deduplicated. | CONTRACT_DEFINED | Task scheduler and delivery capability |
| COLLAB-DEC-12 | Explicit acknowledge action and versioned receipt required. | CONTRACT_DEFINED | Read receipt and reminder capability |
| COLLAB-DEC-13 | Approver names and lines are backend policy, never frontend constants. | CONTRACT_DEFINED | Board policy capability |
| COLLAB-DEC-14 | Read-only metadata/deep link only; no GOU write or dual write. | GOU_UNKNOWN_READ_ONLY_DEFERRED | Authenticated GOU capability audit |
| COLLAB-DEC-15 | Each pilot has success, stop, rollback, feedback and security gates. | PILOT_PHASE_DEFERRED | Pilot readiness approval |

## Invariants

- GOU remains the operational Mail and Approval SSOT until a separately approved cutover.
- A missing Mail Provider never yields a Send success state or success toast.
- Approval authority is resolved from backend policy and opaque personnel IDs, never display names.
- Search permission filtering happens before title, filename, Mail subject, metadata, count, snippet or ranking.
- Notification Event history is independent from Delivery, Read State and Preference.
- No production mock fallback or GOU dual write is allowed.
