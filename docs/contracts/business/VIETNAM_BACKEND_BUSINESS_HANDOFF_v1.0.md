# Vietnam Backend Business Handoff

## Non-negotiable common contract

- Secure HttpOnly session; X-Company-Id; server allowedCompanyIds/resource.companyId check.
- Explicit organization/project permission before any field projection.
- If-Match revision and Idempotency-Key where marked; same key + different payload = 409.
- Frozen File Reference lifecycle and READY guard.
- No provider token/secret in Frontend; capability endpoints fail explicitly.
- No GOU dual write, no production mock fallback and no localStorage business SSOT.
- Canonical IDs only.

## Endpoint implementation checklist

| Module | Endpoint | Permission | Revision | Idempotency | File | Provider | Notification |
|---|---|---|---|---|---|---|---|
| sales | GET /api/v1/customers | VIEW_CUSTOMER | false | false | NOT_APPLICABLE_OR_DRAFT | NOT_APPLICABLE | none |
| sales | POST /api/v1/customers | VIEW_CUSTOMER | false | true | NOT_APPLICABLE_OR_DRAFT | NOT_APPLICABLE | none |
| sales | GET /api/v1/customers/{customerId} | VIEW_CUSTOMER | false | false | NOT_APPLICABLE_OR_DRAFT | NOT_APPLICABLE | none |
| sales | PATCH /api/v1/customers/{customerId} | VIEW_CUSTOMER | true | false | NOT_APPLICABLE_OR_DRAFT | NOT_APPLICABLE | none |
| sales | POST /api/v1/customers/{customerId}/archive | VIEW_CUSTOMER | true | true | NOT_APPLICABLE_OR_DRAFT | NOT_APPLICABLE | none |
| sales | GET /api/v1/customers/{customerId}/timeline | VIEW_CUSTOMER | false | false | NOT_APPLICABLE_OR_DRAFT | NOT_APPLICABLE | none |
| sales | GET /api/v1/leads | VIEW_CUSTOMER | false | false | NOT_APPLICABLE_OR_DRAFT | NOT_APPLICABLE | none |
| sales | POST /api/v1/leads | VIEW_CUSTOMER | false | true | NOT_APPLICABLE_OR_DRAFT | NOT_APPLICABLE | none |
| sales | GET /api/v1/leads/{leadId} | VIEW_CUSTOMER | false | false | NOT_APPLICABLE_OR_DRAFT | NOT_APPLICABLE | none |
| sales | PATCH /api/v1/leads/{leadId} | VIEW_CUSTOMER | true | false | NOT_APPLICABLE_OR_DRAFT | NOT_APPLICABLE | none |
| sales | POST /api/v1/leads/{leadId}/qualify | VIEW_CUSTOMER | true | true | NOT_APPLICABLE_OR_DRAFT | NOT_APPLICABLE | none |
| sales | POST /api/v1/leads/{leadId}/disqualify | VIEW_CUSTOMER | true | true | NOT_APPLICABLE_OR_DRAFT | NOT_APPLICABLE | none |
| sales | POST /api/v1/leads/{leadId}/convert | VIEW_CUSTOMER | true | true | NOT_APPLICABLE_OR_DRAFT | NOT_APPLICABLE | none |
| sales | GET /api/v1/opportunities | VIEW_CUSTOMER | false | false | NOT_APPLICABLE_OR_DRAFT | NOT_APPLICABLE | none |
| sales | POST /api/v1/opportunities | VIEW_CUSTOMER | false | true | NOT_APPLICABLE_OR_DRAFT | NOT_APPLICABLE | none |
| sales | GET /api/v1/opportunities/{opportunityId} | VIEW_CUSTOMER | false | false | NOT_APPLICABLE_OR_DRAFT | NOT_APPLICABLE | none |
| sales | PATCH /api/v1/opportunities/{opportunityId} | VIEW_CUSTOMER | true | false | NOT_APPLICABLE_OR_DRAFT | NOT_APPLICABLE | none |
| sales | POST /api/v1/opportunities/{opportunityId}/win | VIEW_CUSTOMER | true | true | NOT_APPLICABLE_OR_DRAFT | NOT_APPLICABLE | none |
| sales | POST /api/v1/opportunities/{opportunityId}/lose | VIEW_CUSTOMER | true | true | NOT_APPLICABLE_OR_DRAFT | NOT_APPLICABLE | none |
| sales | POST /api/v1/opportunities/{opportunityId}/hold | VIEW_CUSTOMER | true | true | NOT_APPLICABLE_OR_DRAFT | NOT_APPLICABLE | none |
| sales | POST /api/v1/opportunities/{opportunityId}/create-estimate-request | CREATE_ESTIMATE_REQUEST | true | true | NOT_APPLICABLE_OR_DRAFT | NOT_APPLICABLE | sales.estimate-request-linked |
| sales | GET /api/v1/sales-activities | VIEW_CUSTOMER | false | false | NOT_APPLICABLE_OR_DRAFT | NOT_APPLICABLE | none |
| sales | POST /api/v1/sales-activities | VIEW_CUSTOMER | false | true | NOT_APPLICABLE_OR_DRAFT | NOT_APPLICABLE | none |
| sales | GET /api/v1/sales-activities/{activityId} | VIEW_CUSTOMER | false | false | NOT_APPLICABLE_OR_DRAFT | NOT_APPLICABLE | none |
| sales | PATCH /api/v1/sales-activities/{activityId} | VIEW_CUSTOMER | true | false | NOT_APPLICABLE_OR_DRAFT | NOT_APPLICABLE | none |
| sales | POST /api/v1/sales-activities/{activityId}/complete | VIEW_CUSTOMER | true | true | NOT_APPLICABLE_OR_DRAFT | NOT_APPLICABLE | none |
| contacts | GET /api/v1/contacts | CREATE_CONTACT | false | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| contacts | POST /api/v1/contacts | CREATE_CONTACT | false | true | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| contacts | GET /api/v1/contacts/{contactId} | CREATE_CONTACT | false | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| contacts | PATCH /api/v1/contacts/{contactId} | CREATE_CONTACT | true | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| contacts | POST /api/v1/contacts/{contactId}/archive | CREATE_CONTACT | true | true | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| contacts | POST /api/v1/contacts/merge-preview | CREATE_CONTACT | false | true | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| contacts | POST /api/v1/contacts/merge | MERGE_CONTACT | true | true | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| contacts | GET /api/v1/contact-sync/capabilities | CREATE_CONTACT | false | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| contacts | GET /api/v1/contact-sync/status | CREATE_CONTACT | false | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| contacts | POST /api/v1/contacts/{contactId}/sync | CREATE_CONTACT | true | true | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| contacts | POST /api/v1/contact-sync/pull | CREATE_CONTACT | false | true | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| business-cards | POST /api/v1/business-card-captures | CREATE_CONTACT | false | true | READY_REQUIRED | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| business-cards | GET /api/v1/business-card-captures/{captureId} | CREATE_CONTACT | false | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| business-cards | POST /api/v1/business-card-captures/{captureId}/start-ocr | CREATE_CONTACT | true | true | READY_REQUIRED | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| business-cards | PATCH /api/v1/business-card-captures/{captureId}/review | CREATE_CONTACT | true | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| business-cards | GET /api/v1/business-card-captures/{captureId}/duplicates | CREATE_CONTACT | false | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| business-cards | POST /api/v1/business-card-captures/{captureId}/create-contact | CREATE_CONTACT | true | true | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| business-cards | POST /api/v1/business-card-captures/{captureId}/merge-contact | MERGE_CONTACT | true | true | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| finance | GET /api/v1/finance/dashboard | VIEW_SUMMARY | false | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| finance | GET /api/v1/finance-transactions | VIEW_SUMMARY | false | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| finance | POST /api/v1/finance-transactions | VIEW_SUMMARY | false | true | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| finance | GET /api/v1/finance-transactions/{transactionId} | VIEW_SUMMARY | false | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| finance | PATCH /api/v1/finance-transactions/{transactionId} | VIEW_SUMMARY | true | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| finance | POST /api/v1/finance-transactions/{transactionId}/submit | VIEW_SUMMARY | true | true | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| finance | POST /api/v1/finance-transactions/{transactionId}/approve | APPROVE_TRANSACTION | true | true | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| finance | POST /api/v1/finance-transactions/{transactionId}/post | POST_TRANSACTION | true | true | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| finance | POST /api/v1/finance-transactions/{transactionId}/void | POST_TRANSACTION | true | true | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| finance | GET /api/v1/receivables | VIEW_SUMMARY | false | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| finance | POST /api/v1/receivables | VIEW_SUMMARY | false | true | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| finance | GET /api/v1/receivables/{receivableId} | VIEW_SUMMARY | false | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| finance | POST /api/v1/receivables/{receivableId}/record-receipt | RECORD_PAYMENT | true | true | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| finance | GET /api/v1/payables | VIEW_SUMMARY | false | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| finance | POST /api/v1/payables | VIEW_SUMMARY | false | true | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| finance | GET /api/v1/payables/{payableId} | VIEW_SUMMARY | false | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| finance | POST /api/v1/payables/{payableId}/record-payment | RECORD_PAYMENT | true | true | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| finance | GET /api/v1/expense-claims | VIEW_SUMMARY | false | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| finance | POST /api/v1/expense-claims | VIEW_SUMMARY | false | true | DRAFT_REFERENCES_ALLOWED | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| finance | GET /api/v1/expense-claims/{expenseClaimId} | VIEW_SUMMARY | false | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| finance | PATCH /api/v1/expense-claims/{expenseClaimId} | VIEW_SUMMARY | true | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| finance | POST /api/v1/expense-claims/{expenseClaimId}/submit | VIEW_SUMMARY | true | true | READY_REQUIRED | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| finance | GET /api/v1/corporate-card-transactions | VIEW_SUMMARY | false | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| finance | POST /api/v1/corporate-card-transactions/{cardTransactionId}/allocate | VIEW_SUMMARY | true | true | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| finance | GET /api/v1/budgets | VIEW_SUMMARY | false | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| finance | POST /api/v1/budgets | VIEW_SUMMARY | false | true | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| finance | GET /api/v1/budgets/{budgetId} | VIEW_SUMMARY | false | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| finance | PATCH /api/v1/budgets/{budgetId} | VIEW_SUMMARY | true | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| finance | POST /api/v1/budgets/{budgetId}/submit | VIEW_SUMMARY | true | true | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| finance | POST /api/v1/budgets/{budgetId}/approve | MANAGE_BUDGET | true | true | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| finance | GET /api/v1/cash-position | VIEW_SUMMARY | false | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| finance | GET /api/v1/closing-periods | VIEW_SUMMARY | false | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| finance | POST /api/v1/closing-periods | VIEW_SUMMARY | false | true | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| finance | POST /api/v1/closing-periods/{closingPeriodId}/close | CLOSE_PERIOD | true | true | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| finance | GET /api/v1/finance-reports | VIEW_SUMMARY | false | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| finance | GET /api/v1/finance-reports/{reportId} | VIEW_SUMMARY | false | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| tax-invoices | GET /api/v1/tax-invoice/capabilities | MANAGE_TAX_INVOICE | false | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| tax-invoices | GET /api/v1/tax-invoices | MANAGE_TAX_INVOICE | false | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| tax-invoices | POST /api/v1/tax-invoices | MANAGE_TAX_INVOICE | false | true | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| tax-invoices | GET /api/v1/tax-invoices/{taxInvoiceId} | MANAGE_TAX_INVOICE | false | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| tax-invoices | PATCH /api/v1/tax-invoices/{taxInvoiceId} | MANAGE_TAX_INVOICE | true | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| tax-invoices | POST /api/v1/tax-invoices/{taxInvoiceId}/submit-for-approval | MANAGE_TAX_INVOICE | true | true | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| tax-invoices | POST /api/v1/tax-invoices/{taxInvoiceId}/approve | MANAGE_TAX_INVOICE | true | true | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| tax-invoices | POST /api/v1/tax-invoices/{taxInvoiceId}/submit-provider | MANAGE_TAX_INVOICE | true | true | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| tax-invoices | POST /api/v1/tax-invoices/{taxInvoiceId}/cancel | MANAGE_TAX_INVOICE | true | true | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| tax-invoices | POST /api/v1/tax-invoices/{taxInvoiceId}/create-correction | MANAGE_TAX_INVOICE | true | true | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| hr | GET /api/v1/organization-units | VIEW_DIRECTORY | false | false | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| hr | POST /api/v1/organization-units | MANAGE_ORGANIZATION | false | true | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| hr | GET /api/v1/organization-units/{organizationUnitId} | VIEW_DIRECTORY | false | false | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| hr | PATCH /api/v1/organization-units/{organizationUnitId} | MANAGE_ORGANIZATION | true | false | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| hr | GET /api/v1/personnel | VIEW_DIRECTORY | false | false | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| hr | POST /api/v1/personnel | EDIT_PERSONNEL | false | true | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| hr | GET /api/v1/personnel/{personnelId} | VIEW_DIRECTORY | false | false | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| hr | PATCH /api/v1/personnel/{personnelId} | EDIT_PERSONNEL | true | false | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| hr | GET /api/v1/personnel/{personnelId}/memberships | VIEW_DIRECTORY | false | false | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| hr | POST /api/v1/personnel/{personnelId}/memberships | MANAGE_MEMBERSHIP | false | true | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| hr | POST /api/v1/memberships/{membershipId}/end | MANAGE_MEMBERSHIP | true | true | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| hr | GET /api/v1/accounts | MANAGE_ACCOUNT | false | false | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| hr | POST /api/v1/accounts/{accountId}/invite | MANAGE_ACCOUNT | true | true | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| hr | PATCH /api/v1/accounts/{accountId}/status | MANAGE_ACCOUNT | true | false | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| hr | GET /api/v1/business-role-assignments | ASSIGN_ROLE | false | false | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| hr | POST /api/v1/business-role-assignments | ASSIGN_ROLE | false | true | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| hr | GET /api/v1/delegations | MANAGE_DELEGATION | false | false | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| hr | POST /api/v1/delegations | MANAGE_DELEGATION | false | true | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| hr | GET /api/v1/leave-references | VIEW_DIRECTORY | false | false | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| drive | GET /api/v1/drive/capabilities | VIEW | false | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| drive | GET /api/v1/drive/roots | VIEW | false | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| drive | GET /api/v1/drive/items/{driveItemId} | VIEW | false | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| drive | GET /api/v1/drive/items/{driveItemId}/children | VIEW | false | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| drive | POST /api/v1/drive/folders | VIEW | false | true | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| drive | GET /api/v1/drive-bindings | MANAGE_PROVIDER | false | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| drive | POST /api/v1/drive-bindings | MANAGE_PROVIDER | false | true | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| drive | POST /api/v1/project-folders | MANAGE_PROVIDER | false | true | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| drive | POST /api/v1/claim-folders | MANAGE_PROVIDER | false | true | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| drive | GET /api/v1/drive/items/{driveItemId}/permissions | MANAGE_PERMISSION | false | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| drive | POST /api/v1/drive/items/{driveItemId}/permissions | MANAGE_PERMISSION | true | true | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| drive | POST /api/v1/drive/items/{driveItemId}/file-references | VIEW | true | true | READY_REQUIRED | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| drive | GET /api/v1/drive/recent | VIEW | false | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| drive | GET /api/v1/drive/shared | VIEW | false | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| drive | GET /api/v1/drive/favorites | VIEW | false | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| drive | GET /api/v1/drive/trash | VIEW | false | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| drive | POST /api/v1/drive/sync-jobs | MANAGE_PROVIDER | false | true | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| drive | GET /api/v1/drive/sync-jobs/{syncJobId} | VIEW | false | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| drive | GET /api/v1/drive/sync-conflicts | MANAGE_PROVIDER | false | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| drive | POST /api/v1/drive/sync-conflicts/{conflictId}/resolve | MANAGE_PROVIDER | true | true | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| internal-claims | GET /api/v1/internal-claims | VIEW_CASE | false | false | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| internal-claims | POST /api/v1/internal-claims | VIEW_CASE | false | true | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | internal-claim.created |
| internal-claims | GET /api/v1/internal-claims/{claimId} | VIEW_CASE | false | false | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| internal-claims | PATCH /api/v1/internal-claims/{claimId} | VIEW_CASE | true | false | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| internal-claims | POST /api/v1/internal-claims/{claimId}/triage | VIEW_CASE | true | true | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| internal-claims | POST /api/v1/internal-claims/{claimId}/assign | VIEW_CASE | true | true | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | internal-claim.assigned |
| internal-claims | POST /api/v1/internal-claims/{claimId}/resolve | VIEW_CASE | true | true | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| internal-claims | POST /api/v1/internal-claims/{claimId}/close | VIEW_CASE | true | true | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| internal-claims | POST /api/v1/internal-claims/{claimId}/reopen | VIEW_CASE | true | true | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| internal-claims | GET /api/v1/internal-claims/{claimId}/issues | VIEW_CASE | false | false | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| internal-claims | POST /api/v1/internal-claims/{claimId}/issues | VIEW_CASE | false | true | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| internal-claims | GET /api/v1/internal-claims/{claimId}/evidence | VIEW_CASE | false | false | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| internal-claims | POST /api/v1/internal-claims/{claimId}/evidence | VIEW_CASE | false | true | READY_REQUIRED | BACKEND_REQUIRED | none |
| internal-claims | POST /api/v1/internal-claims/{claimId}/evidence/{evidenceId}/legal-hold | MANAGE_LEGAL_HOLD | true | true | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| internal-claims | GET /api/v1/internal-claims/{claimId}/deadlines | VIEW_CASE | false | false | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| internal-claims | POST /api/v1/internal-claims/{claimId}/deadlines | VIEW_CASE | false | true | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | internal-claim.deadline-created |
| claim-service | GET /api/v1/claim-service-projects | VIEW_CASE | false | false | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| claim-service | POST /api/v1/claim-service-projects | VIEW_CASE | false | true | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | claim-service.created |
| claim-service | GET /api/v1/claim-service-projects/{claimServiceProjectId} | VIEW_CASE | false | false | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| claim-service | PATCH /api/v1/claim-service-projects/{claimServiceProjectId} | VIEW_CASE | true | false | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| claim-service | POST /api/v1/claim-service-projects/{claimServiceProjectId}/conflict-check | VIEW_CASE | true | true | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| claim-service | POST /api/v1/claim-service-projects/{claimServiceProjectId}/activate | VIEW_CASE | true | true | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| claim-service | POST /api/v1/claim-service-projects/{claimServiceProjectId}/close | VIEW_CASE | true | true | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| claim-service | GET /api/v1/claim-service-projects/{claimServiceProjectId}/disputes | VIEW_CASE | false | false | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| claim-service | POST /api/v1/claim-service-projects/{claimServiceProjectId}/disputes | VIEW_CASE | false | true | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| claim-service | GET /api/v1/claim-service-projects/{claimServiceProjectId}/issues | VIEW_CASE | false | false | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| claim-service | POST /api/v1/claim-service-projects/{claimServiceProjectId}/issues | VIEW_CASE | false | true | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| claim-service | GET /api/v1/claim-service-projects/{claimServiceProjectId}/evidence | VIEW_CASE | false | false | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| claim-service | POST /api/v1/claim-service-projects/{claimServiceProjectId}/evidence | VIEW_CASE | false | true | READY_REQUIRED | BACKEND_REQUIRED | none |
| claim-service | GET /api/v1/claim-service-projects/{claimServiceProjectId}/meetings | VIEW_CASE | false | false | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| claim-service | POST /api/v1/claim-service-projects/{claimServiceProjectId}/meetings | VIEW_CASE | false | true | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| claim-service | GET /api/v1/claim-service-projects/{claimServiceProjectId}/call-records | VIEW_CASE | false | false | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| claim-service | POST /api/v1/claim-service-projects/{claimServiceProjectId}/call-records | VIEW_CASE | false | true | READY_REQUIRED | BACKEND_REQUIRED | none |
| claim-service | GET /api/v1/claim-service-projects/{claimServiceProjectId}/reports | VIEW_CASE | false | false | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| claim-service | POST /api/v1/claim-service-projects/{claimServiceProjectId}/reports | VIEW_CASE | false | true | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| claim-service | POST /api/v1/claim-reports/{reportId}/versions | VIEW_CASE | true | true | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| claim-service | POST /api/v1/claim-reports/{reportId}/review | REVIEW_REPORT | true | true | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| claim-service | POST /api/v1/claim-reports/{reportId}/approve | APPROVE_REPORT | true | true | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| claim-service | POST /api/v1/claim-reports/{reportId}/issue | ISSUE_REPORT | true | true | READY_REQUIRED | BACKEND_REQUIRED | claim-report.issued |
| ai | GET /api/v1/ai/capabilities | USE_AI_ASSISTANCE | false | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| ai | POST /api/v1/ai/ocr-jobs | USE_AI_ASSISTANCE | false | true | READY_REQUIRED | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| ai | POST /api/v1/ai/transcription-jobs | USE_AI_ASSISTANCE | false | true | READY_REQUIRED | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| ai | POST /api/v1/ai/summarization-jobs | USE_AI_ASSISTANCE | false | true | READY_REQUIRED | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| ai | POST /api/v1/ai/rag-queries | USE_AI_ASSISTANCE | false | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| ai | GET /api/v1/ai/jobs/{jobId} | USE_AI_ASSISTANCE | false | false | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| ai | POST /api/v1/ai/jobs/{jobId}/cancel | USE_AI_ASSISTANCE | true | true | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| ai | POST /api/v1/ai/outputs/{outputId}/feedback | USE_AI_ASSISTANCE | false | true | NOT_APPLICABLE_OR_DRAFT | PROVIDER_TBD_CONTRACT_COMPLETE | none |
| business-search | GET /api/v1/business-search | SOURCE_PERMISSION_REQUIRED | false | false | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |
| business-search | GET /api/v1/business-search/providers | SOURCE_PERMISSION_REQUIRED | false | false | NOT_APPLICABLE_OR_DRAFT | BACKEND_REQUIRED | none |

## Backend acceptance gates

1. Contract tests for headers, DTO schemas, errors and localized message keys.
2. Company/org/project cross-scope negative tests.
3. Permission-before-projection tests, including title/filename redaction.
4. Transaction/outbox/idempotency tests for merge, conversion, payment, folder, evidence, report and AI jobs.
5. Provider NOT_CONFIGURED/DEGRADED tests.
6. Audit, retention, legal hold, checksum and immutable version tests.
7. No real business data in sandbox fixtures.
