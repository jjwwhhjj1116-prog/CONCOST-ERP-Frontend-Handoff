# Collaboration Frontend/Backend Contract

- Contract Version: COLLABORATION_CONTRACT_FROZEN_V1
- Common Dependency: COMMON_CONTRACT_FROZEN_V1
- Project Dependency: PROJECT_CHAIN_CONTRACT_FROZEN_V1
- Current GOU SSOT: Mail, Approval and operational collaboration until approved cutover
- Mail Provider: PROVIDER_TBD
- GOU read-only priority: Notice/Company Calendar -> Approval Metadata -> Mail Link
- User Decisions: COLLAB-DEC-01 through COLLAB-DEC-15
- Pilot: Task/APP -> Board/Calendar -> Approval Sandbox -> Mail Sandbox
- Runtime implemented: No
- Backend implemented: No
- Mock implemented: No
- Next contract: FE-CONTRACT-04 after separate approval

## Precedence

1. Common Contract
2. Project Chain Contract
3. Collaboration Contract
4. OpenAPI
5. State/Permission/Error documents
6. Runtime/Fixture

Changes require a new reviewed contract version. A module contract cannot weaken Common or Project security and identity rules.
