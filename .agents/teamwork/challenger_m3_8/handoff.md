# Challenger M3-8 Adversarial Audit Report (Iteration 4)

**Verdict:** **PASS**

All adversarial probes for Milestone M3 (`UI-02a`) passed with zero defects across `ForgotPassword.tsx` SSR states, `ui/button.tsx` exports and semantics, `services/api.ts` contract parity (`PROJECT.md § 1b`), `App.tsx` public/protected routing, all 17 DOM IDs, M4 backwards-compatibility, TypeScript typechecking, ESLint, and production build.

---

## 1. Probe Summary

| # | Probe | Result | Evidence |
|---|-------|--------|----------|
| 1 | `ForgotPassword.tsx` SSR (`MemoryRouter`) — initial, `submitted + resetToken`, `submitted + null` | **PASS** | Rendered via `react-dom/server` `renderToStaticMarkup` inside `<MemoryRouter>`. Initial state renders `#forgot-email` and `#forgot-submit-btn`. `submitted + resetToken` renders `role="status"` banner, token `<code>`, `<ButtonLink>` to `/reset-password?token=...` (single `<a>`, 4 total anchors, **0** nested `<button>` inside `<a>`), and `<ButtonLink>` to `/reset-password`. `submitted + null` renders uniform confirmation text, omits token card, and renders `<ButtonLink>` to `/reset-password` (3 total anchors, **0** nested `<button>` inside `<a>`). |
| 2 | `ForgotPassword.tsx` client-side email validation | **PASS** | Invoked `ForgotPassword` `<form onSubmit>` directly in isolated `mktemp -d` harness: all 11 malformed inputs (`""`, `"   "`, `"not-an-email"`, `"user@"`, `"@example.com"`, `"user@localhost"`, `"user name@example.com"`, `"user@example .com"`, `"user@@example.com"`, `"user@.com"`, `"user@example."`) triggered client-side error with **0** API requests; valid emails (`"user@example.com"`, `"  Test.User+1@sub.example.co.uk  "`) passed validation and invoked `requestPasswordReset`. |
| 3 | `ui/button.tsx` exports & hygiene | **PASS** | Verified runtime exports are exactly `['Button', 'ButtonLink']` and compile-time exports include `Button`, `ButtonProps`, `ButtonLink`, `ButtonLinkProps` (via `tsc --noEmit`). Negative `tsc` test confirmed `buttonVariants` is **not** exported. Zero `eslint-disable` comments in `ui/button.tsx` (and entire `frontend/src/`). All 7 variants (`default`, `secondary`, `outline`, `ghost`, `emerald`, `lime`, `danger`) render `<button>` for `Button` and single `<a>` for `ButtonLink` with zero `shadow-*` classes. |
| 4 | `services/api.ts` parity with `PROJECT.md § 1b` | **PASS** | Verified `requestPasswordReset('  exists@example.com  ')` -> `POST /auth/forgot-password` with `{ email: 'exists@example.com' }`, mapping `{ resetToken, expiresAt, message }` and handling `data: null` gracefully; `resetPassword({ token: '  tok_1  ', password })` -> `POST /auth/reset-password` with trimmed `token` and `password`, returning `{ message }`. |
| 5 | `App.tsx` public routes & all 17 DOM IDs | **PASS** | Verified `/login`, `/register`, `/forgot-password`, and `/reset-password` sit outside `ProtectedRoute`, while `/` and `/analytics` sit inside `ProtectedRoute`. SSR of `Login`, `Register`, `ForgotPassword`, `ResetPassword`, `StartSprintScreen`, and `AppLayout` confirmed all 17 DOM IDs (`#login-email`, `#login-password`, `#login-submit-btn`, `#forgot-password-link`, `#register-email`, `#register-password`, `#register-confirm-password`, `#register-submit-btn`, `#forgot-email`, `#forgot-submit-btn`, `#reset-token`, `#reset-password`, `#reset-confirm-password`, `#reset-submit-btn`, `#kickoff-input-${category.id}`, `#launch-sprint-btn`, `#theme-toggle-btn`), plus `?reset=success` banner in `Login.tsx` and `?token=` prefill in `ResetPassword.tsx`. |
| 6 | M4 import compatibility, `tsc`, `lint`, `build` | **PASS** | Confirmed all M4 imports (`Card*`, `Button`, `Input`, `Table*`, `Avatar*`, `api.ts` types & functions) resolve cleanly. Ran in `frontend/`: `npx tsc -p tsconfig.app.json --noEmit` (exit 0), `npm run lint` (exit 0, 0 errors/warnings), and `npm run build` (`tsc -b && vite build`, exit 0, `dist/` emitted cleanly). |

---

## 2. Exact Commands & Evidence

1. **Typecheck, Lint, Build (`frontend/`)**:
   ```bash
   npx tsc -p tsconfig.app.json --noEmit && npm run lint && npm run build
   ```
   - `eslint .`: exit `0`
   - `tsc -b && vite build`: exit `0` (`2226 modules transformed`, built in `884ms`)
2. **`eslint-disable` & drop-shadow scan**:
   - `grep -rn "eslint-disable" frontend/src/ DESIGN.md`: 0 matches
   - `grep -rn 'shadow-' frontend/src/components/ui/ frontend/src/components/charts/ frontend/src/components/AppLayout.tsx frontend/src/components/StartSprintScreen.tsx frontend/src/components/auth/ frontend/src/index.css`: 0 matches
3. **Isolated `mktemp -d` SSR, Validation, Export & Type-Check Probe**:
   - Bundled actual project modules with `esbuild` (`jsx: 'automatic'`) and executed in Node `v24.22.2` + `tsc --noEmit` positive/negative export checks; temp directory cleaned up via `trap 'rm -rf "$TMP_DIR"' EXIT`.
   - Output:
     - `PROBE 1 (ui/button.tsx runtime exports & variants): PASS -> [ 'Button', 'ButtonLink' ]`
     - `PROBE 2a (ForgotPassword initial SSR): PASS`
     - `PROBE 2b (ForgotPassword submitted + resetToken SSR): PASS (anchors=4, nested_buttons=0)`
     - `PROBE 2c (ForgotPassword submitted + null SSR): PASS (anchors=3, nested_buttons=0)`
     - `PROBE 3 (ForgotPassword email validation: 11 malformed rejected, 2 valid accepted): PASS`
     - `PROBE 4 (All 17 DOM IDs + ?reset=success + ?token= prefill): PASS`
     - `PROBE 5 (App.tsx public routes + ProtectedRoute): PASS`
     - `PROBE 6 (services/api.ts parity + M4 UI/API exports): PASS`
     - `PROBE 7a (TypeScript positive export check for Button, ButtonProps, ButtonLink, ButtonLinkProps & M4 imports): PASS`
     - `PROBE 7b (TypeScript negative check: buttonVariants is NOT exported): PASS`
