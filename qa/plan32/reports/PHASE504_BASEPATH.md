# Base-path and Environment Configuration Design

## 1. Context and Problem
The `next.config.ts` file currently hardcodes `basePath: "/workspace"`. This is required for GitHub Pages (`https://<user>.github.io/workspace/`), but it breaks Cloudflare Pages (`https://<project>.pages.dev/`), which serves from the domain root (`/`).

A naive fix like `const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/workspace'` fails because JavaScript treats an empty string `""` (which we want for Cloudflare) as falsy, causing it to incorrectly fall back to `'/workspace'`.

## 2. Design Solution
To safely support both environments, we will use strict undefined checking:
```typescript
const basePath = process.env.NEXT_PUBLIC_BASE_PATH !== undefined 
  ? process.env.NEXT_PUBLIC_BASE_PATH 
  : "/workspace";
```
This ensures that if Cloudflare injects `NEXT_PUBLIC_BASE_PATH=""`, it is strictly evaluated as a string (not undefined), resulting in an empty base path, while local development and GitHub Actions (without the variable) safely default to `/workspace`.

## 3. Environment Table

| Environment | `NEXT_PUBLIC_BASE_PATH` Env Var | Resulting `basePath` | Next.js Asset Prefix |
| :--- | :--- | :--- | :--- |
| **Local Dev** | (undefined) | `/workspace` | `/_next/` (served at `/workspace/_next/`) |
| **GitHub Pages** | (undefined) or `/workspace` | `/workspace` | `/_next/` (served at `/workspace/_next/`) |
| **Cloudflare Pages** | `""` (empty string) | `""` (root) | `/_next/` (served at `/_next/`) |

## 4. Expected Routes and Asset URLs

### 4.1 Cloudflare Pages
- **App Route Example**: `https://eumditravel-oss-web-staging.pages.dev/projects`
- **Asset URL Example**: `https://eumditravel-oss-web-staging.pages.dev/_next/static/css/main.css`

### 4.2 GitHub Pages
- **App Route Example**: `https://eumditravel-oss.github.io/workspace/projects`
- **Asset URL Example**: `https://eumditravel-oss.github.io/workspace/_next/static/css/main.css`

## 5. Rollback Plan
If this dynamic base path breaks GitHub Pages CI/CD or local development, the immediate rollback strategy is to revert `next.config.ts` to the hardcoded `basePath: "/workspace"` and evaluate alternative branching strategies (e.g., maintaining a separate `cloudflare` branch).
