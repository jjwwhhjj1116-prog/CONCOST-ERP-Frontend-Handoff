# PHASE 501 PLAN-TO-REQUIREMENT MATRIX

| Subject | Previous Plan (1-31) Requirement | Plan 32 Override Requirement | Plan 32 Section |
| :--- | :--- | :--- | :--- |
| **Deployment Model** | Plan 31 used `npx wrangler deploy` (OpenNext/Workers) for Cloudflare | Must use Static Export (`out/`) for Cloudflare Pages. No OpenNext/Wrangler. | 2. Target architecture, Rule 1 |
| **Base Path** | Plan 1-31 used `basePath: "/workspace"` globally (for GitHub Pages) | Split configuration: `/workspace` for GitHub Pages, `/` (empty) for Cloudflare Pages. | 2. Target architecture, Rule 3 |
| **Git Tracking** | Generated files in `server/node_modules` and `server/dist` were accidentally tracked | Must be untracked; `.gitignore` must be fixed (UTF-8, no NUL bytes). | 1. P32-003 |
| **Authentication** | Mock super admin state & client-side role switching (Plan 1-29) | Real server-authenticated accounts, real login/activation/logout. | 1. P32-004 |
| **Database Migration** | Prisma schema created but no migration/deployment pipeline (Plan 30) | Must add reproducible PostgreSQL migration and Render deployment scripts. | 1. P32-005 |
| **State Authority** | Client-side Zustand/localStorage was authoritative (Plan 1-29) | API/PostgreSQL state is strictly authoritative. No silent merge with stale data. | 2. Target architecture, Rule 6 |
| **Security & Secrets** | Secrets were sometimes hardcoded or visible in previous plans | Never put DB passwords, Cloudflare tokens, API keys, or invite tokens in source/logs/Git. | 2. Target architecture, Rule 4 |

## Source Documents
- `docs/workspace plan30_account_server_db_cloudflare_render_prompt.md`
- `docs/workspace plan31_actual_staging_cloudflare_render_prompt.md`
- `docs/workspace plan32.txt`
