# Worker Dispatch — `worker_m3_1` (`M3 / UI-02a`)

## Mandatory First Reads
1. `/home/antigravity/GeorgeDeveloperJ/habits-tracker/.agents/teamwork/ORIGINAL_REQUEST.md` (especially `## Follow-up — 2026-11-18T13:52:21Z`)
2. `/home/antigravity/GeorgeDeveloperJ/habits-tracker/PROJECT.md` (especially `§ 1b` Forgot/Reset Password API contract & Code Layout)
3. `/home/antigravity/GeorgeDeveloperJ/habits-tracker/.agents/teamwork/sub_orch_m3/SCOPE.md`
4. `/home/antigravity/GeorgeDeveloperJ/habits-tracker/.agents/teamwork/explorer_ui_1/handoff.md`
5. `/home/antigravity/GeorgeDeveloperJ/habits-tracker/.agents/teamwork/explorer_auth_2/handoff.md`
6. Call `lookup_skill` for `web-app-development` before designing/editing UI files.

## Mandatory Integrity Warning
> DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Exclusive File Ownership
You may create/modify ONLY these files:
- `DESIGN.md`
- `frontend/index.html`
- `frontend/src/index.css`
- `frontend/src/store/themeStore.ts` (new)
- `frontend/src/services/api.ts`
- `frontend/src/App.tsx`
- `frontend/src/components/ui/card.tsx`
- `frontend/src/components/ui/button.tsx`
- `frontend/src/components/ui/input.tsx`
- `frontend/src/components/ui/table.tsx`
- `frontend/src/components/ui/avatar.tsx`
- `frontend/src/components/charts/HardwareViz.tsx` (new)
- `frontend/src/components/AppLayout.tsx`
- `frontend/src/components/auth/Login.tsx`
- `frontend/src/components/auth/Register.tsx`
- `frontend/src/components/auth/ForgotPassword.tsx` (new)
- `frontend/src/components/auth/ResetPassword.tsx` (new)
- `frontend/src/components/StartSprintScreen.tsx`

## Forbidden Files (Read-Only Only — DO NOT EDIT)
- `backend/**` (owned by M2)
- `TEST_READY.md` (owned by M4)
- `frontend/src/pages/Tracker.tsx` (owned by M4)
- `frontend/src/components/HabitGrid.tsx` (owned by M4)
- `frontend/src/components/HabitCard.tsx` (owned by M4)
- `frontend/src/components/PlanningModal.tsx` (owned by M4)
- `frontend/src/pages/AnalyticsDashboard.tsx` (owned by M4)
- `PROJECT.md`, `.agents/teamwork/ORIGINAL_REQUEST.md`

*Important*: Read the M4-owned files above (read-only) before finalizing `ui/*`, `api.ts`, etc. to verify that every existing export/prop/variant used by M4 continues to compile cleanly without error.

## Key Implementation Requirements
1. **Tailwind v4 Dual-Mode Foundation (`index.html`, `index.css`, `themeStore.ts`)**:
   - Declare `@custom-variant dark (&:where(.dark, .dark *));` in `frontend/src/index.css` so Tailwind `dark:` utilities respond to `.dark` on `<html>` (not only OS `prefers-color-scheme`).
   - Light/Warm Mode (`:root`, default): Canvas `#F4F4F2` / `#EAE9E4`, pure white `#FFFFFF`, warm sand `#EBE6DC`, jet black `#121212` contrast cards, acid lime `#E6FA72` & spring green `#5CE68A` primary/surface fills.
   - Dark Mode (`.dark`): Deep obsidian-violet `#0D0914` canvas, plum `#171224` cards, `1px solid rgba(255,255,255,0.06)` hairline borders, orchid purple `#D96BFF` & warm amber `#F5B841` accents.
   - Pre-paint theme script in `frontend/index.html` reading `localStorage.getItem('proactive31-theme')` (parsing Zustand's persisted JSON `{ state: { theme } }` cleanly) and toggling `.dark` on `document.documentElement` before paint.
   - Define `.bg-hatch`, `.glass-pill` (`backdrop-filter: blur(12px)`), `.font-mono-tabular`, and theme-aware scrollbar rules in `index.css`.
2. **Modular Bento Geometry & Zero Drop Shadows**:
   - `24px–32px` border radii (`rounded-[24px]`–`rounded-[32px]`) on Bento cards/containers; `12px–16px` gutters (`gap-3` / `gap-4`); stadium pills (`rounded-full`) on buttons, tabs, badges, inputs/pills, and bars.
   - **ZERO drop shadows** (`shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl`, `drop-shadow-*`) on any M3 card, button, chrome dock, or modal. Elevation comes strictly from surface-color contrast and `1px` hairlines.
   - Follow `web-app-development` anti-cliché rules (no pulsing headline biscuit pills placed above headlines, no CSS gradient text fills on headlines, no grid-line/mesh backgrounds, no 3+ deep nested cards, single `<h1>` per page, tight tracking on oversized `36px–48px` headings).
3. **`HardwareViz.tsx` Bespoke SVG/CSS Components**:
   - `SegmentedBattery`, `CapsuleBarChart` (stadium bars `rounded-full`, internal indicator dot, dashed ghost-tracks, diagonal hatch patterns for inactive/projected states), `ConcentricRing` (thick concentric rings with `tabular-nums` centerpiece), `DotMatrixRibbon` (31 clickable stadium capsule / dot-matrix nodes), and `PillarCompassDiagram` (2D vector 8-pillar diagram with frosted glass pill overlays `backdrop-blur-md`).
4. **High-Contrast Anchor Chrome (`AppLayout.tsx`)**:
   - Floating/matte high-contrast vertical pill dock on desktop (`#121212` in light, `#171224` + `border-white/[0.06]` in dark, `rounded-[28px]`) + recessed top pill bar (`rounded-full`) with Theme Toggle (`#theme-toggle-btn`), live `Day XX / 31` badge, and user controls; active nav items use solid high-contrast stadium pills (`#E6FA72` in light, `#D96BFF`/`#F5B841` in dark).
5. **Auth Split-Screen + Forgot/Reset Password (`api.ts`, `App.tsx`, `Login.tsx`, `Register.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx`)**:
   - `api.ts`: `requestPasswordReset(email)` (`POST /auth/forgot-password`) and `resetPassword({ token, password })` (`POST /auth/reset-password`) matching `PROJECT.md § 1b`.
   - `Login.tsx`: Rebuilt Bento split-screen with `40px+` heading + inline stadium-pill icon badge, `PillarCompassDiagram` with frosted glass pill overlays, Theme Toggle, `#forgot-password-link` -> `/forgot-password`, `?reset=success` banner, preserving `#login-email`, `#login-password`, `#login-submit-btn`.
   - `Register.tsx`: Matching Bento split-screen preserving `#register-email`, `#register-password`, `#register-confirm-password`, `#register-submit-btn`.
   - `ForgotPassword.tsx` & `ResetPassword.tsx`: Full 2-page flow wired in `App.tsx` (`/forgot-password`, `/reset-password`) supporting both one-click dev/demo link when `resetToken` is returned and manual token entry (`#forgot-email`, `#forgot-submit-btn`, `#reset-token`, `#reset-password`, `#reset-confirm-password`, `#reset-submit-btn`).
6. **`StartSprintScreen.tsx`**:
   - Asymmetrical Bento Launchpad (`lg:col-span-8` hero with `36px–44px` heading + inline icon badge + `DotMatrixRibbon`; `lg:col-span-4` high-contrast readiness card with `SegmentedBattery`; 8 pillar cards with `#kickoff-input-${category.id}`, suggestion chips, and `#launch-sprint-btn`).
7. **`DESIGN.md`**:
   - Overhaul completely to document the Dual-Mode Modular Bento & Hardware Telemetry Design System accurately.

## Verification Before Reporting
Run:
```bash
npm --prefix /home/antigravity/GeorgeDeveloperJ/habits-tracker/frontend run lint && npm --prefix /home/antigravity/GeorgeDeveloperJ/habits-tracker/frontend run build
```
Write your completion summary to `/home/antigravity/GeorgeDeveloperJ/habits-tracker/.agents/teamwork/worker_m3_1/handoff.md` and report back via `send_message`.
