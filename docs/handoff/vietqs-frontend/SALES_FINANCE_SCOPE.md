# Sales and Finance Scope

## Sales v1 Frontend

Implemented for handoff:

- dashboard shell
- Opportunity list and detail
- basic Opportunity input
- Demo/Sandbox/Production boundary
- loading, empty, error, permission, and Backend-required states
- OpenAPI mapping for `listOpportunities` and `createOpportunity`

The existing ERP sales dashboard remains available. Business-card review links
to the Contact capability. Sales Quote reuses the Project Chain Estimate
Request; no second quote system should be created.

Deferred:

- advanced CRM automation
- company pipeline editor
- advanced reports
- real Google Contacts sync
- Backend persistence

## Finance v1 Frontend

Implemented for handoff:

- dashboard shell
- transaction list and detail
- basic transaction input
- Project profitability entry point
- Demo/Sandbox/Production boundary
- loading, empty, error, permission, Provider, and Backend-required states
- OpenAPI mapping for dashboard, list, and create transaction

Deferred:

- statutory ledger
- automatic journal entry
- tax filing
- real-time bank and corporate-card integration
- live tax invoice Provider
- advanced closing

Demo amounts are sample values only and are not real balances. Provider-missing
states never show issuance, reconciliation, payment, or live-balance success.

## Authorization

Finance detail permissions must be separated by role and sensitivity. HR title
or rank does not automatically grant finance, approval, or administrative
permissions.
