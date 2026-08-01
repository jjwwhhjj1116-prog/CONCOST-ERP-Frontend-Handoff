# Architecture Decision Record (ADR): Deployment Model

## 1. Title
Cloudflare Pages Static Export and Render API/PostgreSQL Adoption

## 2. Context
Previous deployment attempts (Plan 30/31) resulted in a conflict on Cloudflare Pages. The Next.js frontend was configured for static export (`output: "export"` in `next.config.ts`), while Cloudflare was incorrectly configured to use OpenNext / Wrangler (`npx wrangler deploy` with `Next.js` framework preset). This mismatch caused persistent build and deployment failures.

Additionally, the backend requires a robust relational database (PostgreSQL) and a dedicated Node.js Express server to handle authentications, business logic, and authoritative state securely.

## 3. Decision
We explicitly adopt the following architecture:
- **Frontend**: Cloudflare Pages using **Static Export**.
- **Backend API**: Render Web Service (Express Node.js).
- **Database**: Render PostgreSQL.

### 3.1 Rejection of OpenNext / Cloudflare Workers
OpenNext and Cloudflare Workers (Edge Rendering) are explicitly **rejected** for this phase. 
- Using standard Static Export (`out/`) is significantly simpler, highly performant, and fully supported natively by Cloudflare Pages as simple static assets.
- OpenNext introduces edge compatibility issues with certain Node.js APIs and requires Wrangler adapters which complicate the immediate goal of deploying a stable staging environment.

### 3.2 Cloudflare Pages Configuration
To enforce static export, the Cloudflare Pages dashboard must be configured exactly as follows:
- **Framework preset**: `None` (Crucial: do not use `Next.js` to avoid automatic OpenNext injection)
- **Build command**: `npm run build`
- **Build output directory**: `out`

### 3.3 API URL Ownership and Authority
- The frontend will rely on a build-time environment variable (e.g., `NEXT_PUBLIC_API_BASE_URL`) pointing to the Render API domain.
- The Render API service acts as the absolute authority for state (PostgreSQL). Local state (Zustand/localStorage) is strictly for UI caching and must not silently overwrite or bypass server-side verification.

## 4. Consequences
- We must ensure that Next.js dynamic features (e.g., Next.js Image Optimization without a custom loader, or Server Actions) are not used, as `output: "export"` does not support them natively.
- `next.config.ts` must maintain `images: { unoptimized: true }`.
