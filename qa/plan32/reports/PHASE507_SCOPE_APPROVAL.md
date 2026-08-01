# Remediation Scope Approval Checkpoint

## 1. Approved Scope and Phase Order
Based on the investigations in Phases 500-506, the following remediation steps will be executed in order to repair the repository hygiene, fix the CI pipeline, and ensure a stable Cloudflare deployment:

- **Phase 508**: Repair `.gitignore` encoding (remove NUL bytes) and explicitly ignore server build artifacts.
- **Phase 509**: Remove incorrectly tracked generated files (`server/node_modules/`, `server/dist/`) from Git tracking without deleting the local working copy.
- **Phase 510**: Repair server dependencies (e.g., ensure `@prisma/client` is a runtime dependency), pin Node.js version, and add reproducible scripts for build, start, and migration.
- **Phase 511**: Repair lint boundaries so that generated server code is excluded, and fix the remaining true lint errors in the source code to establish a clean quality gate.
- **Phase 512**: Perform a clean Next.js build locally to verify static export reproducibility and ensure `out/` is generated correctly without OpenNext artifacts.
- **Phase 513**: Implement the approved build-time `basePath` logic (`NEXT_PUBLIC_BASE_PATH !== undefined`) to safely support both GitHub Pages and Cloudflare Pages.
- **Phase 514**: Finalize the exact Cloudflare static deployment configuration instructions for the dashboard.

## 2. Explicit Exclusions
The following items are explicitly **excluded** from this remediation plan:
- **Cloudflare Workers / OpenNext**: We will not attempt to convert the Next.js app to an Edge-rendered application. The deployment will remain strictly Static Export (`output: "export"`).
- **Cross-Site Cookies**: Due to domain limitations (`*.pages.dev` vs `*.onrender.com`), we will not attempt to use `Set-Cookie` for authentication. JWT Bearer Tokens in `localStorage` will be used instead.
- **Production Data Migration**: As this is a staging environment, no real production data is being migrated. Mock data will be wiped and replaced by authoritative DB records.
