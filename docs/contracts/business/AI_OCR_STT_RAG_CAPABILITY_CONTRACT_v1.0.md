# AI, OCR, STT and RAG Capability Contract v1.0

AI is draft and search assistance only. It cannot finalize legal or accounting conclusions, mutate source records or bypass company scope, ACL or human review.

| Classification | Allowed Provider |
|---|---|
| PUBLIC | Approved External or Local |
| INTERNAL_GENERAL | Approved Enterprise External or Local |
| CONFIDENTIAL | Local or approved Private/VPC |
| RESTRICTED_LEGAL | LOCAL_ONLY or separately approved Private |
| HR_SENSITIVE | LOCAL_ONLY |
| FINANCE_RESTRICTED | LOCAL_ONLY |
| SECURITY_SECRET | PROHIBITED |

Every query validates company scope, user permission, document ACL, Provider capability and classification. RAG output includes fileId, version, page/chunk citation and human-review state. Provider absence or policy denial is explicit; no fallback success is allowed.
