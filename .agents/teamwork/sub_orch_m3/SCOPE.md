# Scope — M3 (`UI-02a`)

## Exclusive File Ownership
M3 owns ONLY the following files:
1. `DESIGN.md`
2. `frontend/index.html`
3. `frontend/src/index.css`
4. `frontend/src/store/themeStore.ts` (new)
5. `frontend/src/services/api.ts` (add `requestPasswordReset` + `resetPassword` matching `PROJECT.md § 1b`, preserving all existing exports/types)
6. `frontend/src/App.tsx` (add `/forgot-password` & `/reset-password` public routes)
7. `frontend/src/components/ui/card.tsx`
8. `frontend/src/components/ui/button.tsx`
9. `frontend/src/components/ui/input.tsx`
10. `frontend/src/components/ui/table.tsx`
11. `frontend/src/components/ui/avatar.tsx`
12. `frontend/src/components/charts/HardwareViz.tsx` (new bespoke SVG/CSS hardware data viz suite: `SegmentedBattery`, `CapsuleBarChart`, `ConcentricRing`, `DotMatrixRibbon`, `PillarCompassDiagram`)
13. `frontend/src/components/AppLayout.tsx`
14. `frontend/src/components/auth/Login.tsx`
15. `frontend/src/components/auth/Register.tsx`
16. `frontend/src/components/auth/ForgotPassword.tsx` (new)
17. `frontend/src/components/auth/ResetPassword.tsx` (new)
18. `frontend/src/components/StartSprintScreen.tsx`

## Strictly Excluded Files (DO NOT MODIFY)
- `backend/**` (owned by M2)
- `TEST_READY.md` (owned by M4)
- `frontend/src/pages/Tracker.tsx` (owned by M4)
- `frontend/src/components/HabitGrid.tsx` (owned by M4)
- `frontend/src/components/HabitCard.tsx` (owned by M4)
- `frontend/src/components/PlanningModal.tsx` (owned by M4)
- `frontend/src/pages/AnalyticsDashboard.tsx` (owned by M4)
- `PROJECT.md`, `.agents/teamwork/ORIGINAL_REQUEST.md` (read-only)

## Critical Compatibility & Design Contract
1. **Backwards-Compatible Exports for M4**: All existing exported component names, prop types, variants (including `Button` variants like `default`, `secondary`, `outline`, `ghost`, `emerald`, `danger`, etc., `Card` subcomponents `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `Input`, `Table*`, `Avatar*`), and `api.ts` functions/types MUST remain compatible so existing M4 files (`Tracker.tsx`, `HabitGrid.tsx`, `HabitCard.tsx`, `PlanningModal.tsx`, `AnalyticsDashboard.tsx`) compile with `npm run build` and `npm run lint` without error!
2. **Modular Bento Grid Geometry**: Asymmetrical puzzle-like grid of cards, `24px–32px` border radii (`rounded-[24px]`–`rounded-[32px]`), `12px–16px` gutters (`gap-3`/`gap-4`), **ZERO floating drop shadows** (`shadow-*` prohibited on Bento cards/buttons; hierarchy strictly via flat surface contrast).
3. **High-Contrast Anchor Chrome**: Solid stark navigation dock/sidebar (floating vertical pill dock / matte anchor) + recessed top pill bar + Theme Toggle + active stadium pills (`rounded-full`) or glowing indicator bars.
4. **Dual Surface-Driven Color Palettes**:
   - **Light/Warm Mode (default)**: Stone/alabaster canvas (`#F4F4F2` / `#EAE9E4`), pure white (`#FFFFFF`), warm sand (`#EBE6DC`), jet black (`#121212`) accent cards, acid lime (`#E6FA72`) & spring green (`#5CE68A`) primary/surface fills.
   - **Dark Mode**: Deep obsidian-violet canvas (`#0D0914`), plum-tinted cards (`#171224`), `1px solid rgba(255,255,255,0.06)` ultra-thin borders, luminous orchid purple (`#D96BFF`) & warm amber (`#F5B841`) accents.
5. **Editorial & Utilitarian Typography**: Oversized tightly tracked geometric headings/KPIs (`36px–48px`), inline stadium-pill icon badges embedded directly between words in main headings, crisp `10px–12px` uppercase tracked-out `JetBrains Mono` (`tabular-nums`) micro-copy.
6. **Bespoke Hardware-Style Data Visualization (`HardwareViz.tsx`)**:
   - `SegmentedBattery`: rows of thick vertical capsules (`rounded-full`), filled vs muted/hatched.
   - `CapsuleBarChart`: vertical stadium bars (`rounded-full`), internal indicator dots, dashed ghost-tracks for max capacity, diagonal hatch patterns for inactive/projected states.
   - `ConcentricRing`: thick dual/single SVG stroke ring with `tabular-nums` centerpiece.
   - `DotMatrixRibbon`: 31 clickable stadium capsule / dot-matrix nodes.
   - `PillarCompassDiagram`: 2D vector geometric 8-pillar diagram with frosted glass pill overlays (`backdrop-filter: blur(12px)`).
7. **Forgot Password UI & API (`PROJECT.md § 1b`)**:
   - `api.ts`: `requestPasswordReset(email)` -> `POST /api/auth/forgot-password` returning `{ resetToken?: string; expiresAt?: string } | null`; `resetPassword({ token, password })` -> `POST /api/auth/reset-password`.
   - `Login.tsx`: Prominent `"Forgot password?"` button/link (`#forgot-password-link`) -> `/forgot-password`; reads `?reset=success` to show confirmation banner.
   - `ForgotPassword.tsx`: Email form (`#forgot-email`, `#forgot-submit-btn`) -> uniform confirmation + one-click dev/demo link to `/reset-password?token=...` when `resetToken` is returned + manual `/reset-password` link.
   - `ResetPassword.tsx`: Reads `?token=` (or manual input `#reset-token`), `#reset-password`, `#reset-confirm-password`, `#reset-submit-btn` -> redirects/links to `/login?reset=success`.
8. **Preserved Functional Contracts & DOM IDs**:
   - `#login-email`, `#login-password`, `#login-submit-btn`, `#forgot-password-link`
   - `#register-email`, `#register-password`, `#register-confirm-password`, `#register-submit-btn`
   - `#forgot-email`, `#forgot-submit-btn`, `#reset-token`, `#reset-password`, `#reset-confirm-password`, `#reset-submit-btn`
   - `#kickoff-input-${category.id}`, `#launch-sprint-btn`
   - Full `HabitContext` & `useAuthStore` compatibility.
