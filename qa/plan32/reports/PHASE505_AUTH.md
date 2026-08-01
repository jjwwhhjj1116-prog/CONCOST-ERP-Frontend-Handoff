# Authentication, Cookie, CORS, and Domain Feasibility Design

## 1. Domain and Cookie Feasibility
**Current Domains:**
- Frontend: `https://eumditravel-oss-web-staging.pages.dev`
- Backend API: `https://eumditravel-api-staging.onrender.com`

**Browser Limitation:**
These domains do not share a common effective Top-Level Domain (eTLD+1). Therefore, any cookies set by the Render API for the Cloudflare Pages frontend will be treated as **Cross-Site (Third-Party) Cookies**.
Modern browsers heavily restrict or completely block third-party cookies by default (e.g., Safari ITP, Chrome Privacy Sandbox). While `SameSite=None; Secure` can technically work, it is increasingly unreliable and subject to user privacy settings.

**Conclusion:**
Without a registered custom domain (e.g., `app.eumditravel.com` and `api.eumditravel.com`), relying on HTTP-only cookies for authentication is not feasible for this staging environment.

## 2. Approved Alternative: JWT Bearer Tokens
Instead of cookies, the application will use **JWT (JSON Web Token) Bearer Tokens** passed via the HTTP `Authorization` header.

- **Storage:** Tokens will be temporarily stored in client-side storage (e.g., `localStorage` or `sessionStorage`). While this introduces an XSS (Cross-Site Scripting) risk profile compared to HTTP-only cookies, it is the only viable cross-site authentication method without a custom domain or a dedicated reverse proxy.
- **Transmission:** `Authorization: Bearer <JWT_TOKEN>` will be attached to every protected API request by the `apiClient`.

## 3. CORS Strategy
The Render API must configure Cross-Origin Resource Sharing (CORS) to explicitly allow the authorized frontends.
- **Allowed Origins:**
  - `https://eumditravel-oss-web-staging.pages.dev` (Cloudflare Pages Staging)
  - `https://eumditravel-oss.github.io` (GitHub Pages)
  - `http://localhost:3000` (Local Development)
- **Allowed Headers:** `Content-Type`, `Authorization`
- **Allowed Methods:** `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `OPTIONS`

## 4. CSRF Strategy
Because we are using Bearer tokens attached manually via JavaScript instead of automatically-attached cookies, the system is naturally immune to classic Cross-Site Request Forgery (CSRF). No additional CSRF tokens (like `csurf`) are required for the API endpoints.

## 5. Session Expiry and Revocation Policy
- **Token Lifespan:** Access tokens will have a relatively short lifespan (e.g., 24 hours for staging convenience).
- **Revocation:** Since JWTs are stateless, immediate revocation requires a server-side deny-list (blacklist) or checking a `user.isActive` flag in the database on critical requests. The API will verify the user's current status in the DB on state-mutating operations to ensure revoked users cannot perform actions even if their token hasn't expired.
