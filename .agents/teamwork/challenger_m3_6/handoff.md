# Challenger M3 Iteration 3 (`challenger_m3_6`) — Handoff

**Verdict:** `PASS`

All adversarial probes ran in isolated `mktemp -d` directories (automatically cleaned up via `trap 'rm -rf "$TMP_DIR"' EXIT`), with zero modifications to the project working tree.

---

## Probe 1 — `ForgotPassword.tsx` SSR Rendering, `<ButtonLink>` Markup & `handleSubmit` Validation
- **Status:** `PASS`
- **SSR States Verified (`ReactDOMServer.renderToStaticMarkup` inside `MemoryRouter`):**
  1. **Initial state (`submitted = false`):** Renders `#forgot-email` and `#forgot-submit-btn`; zero nested `<button>`/`<a>` violations.
  2. **`submitted + resetToken` state:** Renders status banner, token `tok_deadbeef_1234`, and two `<ButtonLink>` elements rendered strictly as single `<a>` elements (`href="/reset-password?token=tok_deadbeef_1234"` and `href="/reset-password"`), 4 total `<a>` tags, **0 nested `<button>` inside `<a>`**.
  3. **`submitted + null` state:** Renders uniform status banner without token box and renders manual `<ButtonLink>` as a single `<a>` (`href="/reset-password"`), 3 total `<a>` tags, **0 nested `<button>` inside `<a>`**.
- **`handleSubmit` Validation Probed:**
  - Rejected all 8 empty/malformed inputs (`""`, `"   "`, `"plainaddress"`, `"user@"`, `"@domain.com"`, `"user@domain"`, `"user name@domain.com"`, `"user@domain."`) with non-empty client validation error, `submitted !== true`, and **0 API calls**.
  - Accepted valid email (`"  User.Test+1@Example.COM  "`), trimmed to `"User.Test+1@Example.COM"`, posted to `/auth/forgot-password`, set `submitted = true`, and stored `{ resetToken: "hex999", expiresAt, message }`.

---

## Probe 2 — `ui/button.tsx` Exports, Lint Hygiene & M4 Compatibility
- **Status:** `PASS`
- **Runtime & Type Exports (`frontend/src/components/ui/button.tsx`):**
  - Runtime exports: `["Button", "ButtonLink"]` (`buttonVariants` is **not** exported).
  - Type exports verified via `tsc --ignoreConfig --noEmit --strict --verbatimModuleSyntax`: `ButtonProps` and `ButtonLinkProps` resolve cleanly alongside `Button` and `ButtonLink` (`TYPE_EXPORT_CHECK_PASS`).
  - Zero `eslint-disable` comments in `ui/button.tsx` or any of the 17 M3-owned files.
- **M4 Compatibility (`Tracker.tsx`, `HabitGrid.tsx`, `HabitCard.tsx`, `PlanningModal.tsx`, `AnalyticsDashboard.tsx`):**
  - Verified untouched in `git status --short`.
  - All 5 M4 modules loaded via Vite SSR (`ssrLoadModule`) cleanly with default component exports intact.

---

## Probe 3 — `services/api.ts` Parity, `App.tsx` Public Routes, 17 DOM IDs & Full Frontend Checks
- **Status:** `PASS`
- **`services/api.ts` Parity (`PROJECT.md § 1b`):**
  - `requestPasswordReset('  a@b.com  ')` sends trimmed `{ email: 'a@b.com' }` to `POST /auth/forgot-password`, returns `{ resetToken, expiresAt, message }` when `data` is populated and `{ message }` (no `resetToken`) when `data: null`.
  - `resetPassword({ token: '  tok123  ', password: 'secret123' })` sends `{ token: 'tok123', password: 'secret123' }` to `POST /auth/reset-password` and returns `{ message }`.
- **`App.tsx` Public Routes:** `/login`, `/register`, `/forgot-password`, and `/reset-password` all declared outside `ProtectedRoute`.
- **All 17 Required DOM IDs Verified in SSR Output (plus zero interactive nesting violations across `Login`, `Register`, `ForgotPassword`, `ResetPassword`, `StartSprintScreen`, `AppLayout`):**
  - `Login` (`/login?reset=success`): `#login-email`, `#login-password`, `#login-submit-btn`, `#forgot-password-link`, `#theme-toggle-btn`, plus reset success banner.
  - `Register` (`/register`): `#register-email`, `#register-password`, `#register-confirm-password`, `#register-submit-btn`.
  - `ForgotPassword` (`/forgot-password`): `#forgot-email`, `#forgot-submit-btn`.
  - `ResetPassword` (`/reset-password?token=testtok`): `#reset-token` (prefilled `value="testtok"`), `#reset-password`, `#reset-confirm-password`, `#reset-submit-btn`.
  - `StartSprintScreen`: `#kickoff-input-cat-1`, `#launch-sprint-btn`.
  - `AppLayout`: `#theme-toggle-btn` also present.
- **Typecheck, Lint & Build (`frontend/`):**
  - `npx tsc -p tsconfig.app.json --noEmit` -> exit `0`
  - `npm run lint` (`eslint .`) -> exit `0`
  - `npm run build` (`tsc -b && vite build`) -> exit `0` (`dist/assets/index-EjVv-8bV.js`, 2226 modules transformed)
