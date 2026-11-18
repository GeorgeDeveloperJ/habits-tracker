# Handoff Report — `explorer_ui_1` (Frontend Technical & Design Audit)

> **Executive Summary**: The current frontend on commit `bb6ddeb` implements all Phase 1–4 functional requirements using a dark-only `"Focused Obsidian & Electric Violet"` palette (`#090A0F` / `#11131C` / `#7C3AED`), `rounded-2xl` (16px) cards with drop shadows, `recharts` charts, and lacks both Light/Warm + Dark theme switching and Forgot Password UI/API support. Rebuilding the UI to match the Modular Bento Grid + Hardware-Style Data Visualization specification requires updating `index.html`, `index.css`, `ui/*` primitives, `AppLayout.tsx`, `Login.tsx`/`Register.tsx` (+ new `ForgotPassword.tsx`), `StartSprintScreen.tsx`, `HabitGrid.tsx`, and `AnalyticsDashboard.tsx` (replacing Recharts with bespoke SVG/CSS Capsule Bars, Segmented Pill Batteries, Concentric Rings, and Frosted Vector Diagrams) while preserving every `HabitContext` and REST API contract.

---

## 1. Observation

All observations below were directly verified via `view_file` and `run_command` on commit `bb6ddeb`:

### 1.1 Build, Tooling & Global Tokens
- **`frontend/package.json` (lines 1–41)**:
  - React `^19.2.6`, Vite `^8.0.12`, `@tailwindcss/vite` `^4.3.0`, `tailwindcss` `^4.3.0`, `react-router-dom` `^7.17.0`, `zustand` `^5.0.14`, `axios` `^1.17.0`, `lucide-react` `^1.17.0`, `recharts` `^3.8.1`, `clsx` `^2.1.1`, `tailwind-merge` `^3.6.0`.
  - Current `npm run build` (`tsc -b && vite build`) succeeds in 788ms (`dist/assets/index-DzQkBxqR.js` is `869.05 kB` / `253.56 kB` gzip — Vite warns chunks > 500 kB, largely due to `recharts`).
- **`frontend/index.html` (lines 1–21)**:
  - Line 2 hardcodes `<html lang="en" class="dark">`.
  - Lines 10–13 load Google Fonts `Inter`, `JetBrains Mono`, and `Plus Jakarta Sans`.
  - Line 16 hardcodes dark classes on `<body>`: `class="bg-[#090A0F] text-[#F8FAFC] antialiased selection:bg-[#7C3AED]/30 selection:text-[#F8FAFC]"`.
- **`frontend/src/index.css` (lines 1–66)**:
  - Uses Tailwind v4 (`@import "tailwindcss";` at line 1, `@theme` at lines 25–28).
  - Lines 3–23 define a single `:root` dark palette (`--bg-canvas: #090A0F`, `--bg-surface: #11131C`, `--bg-elevated: #171A26`, `--border-subtle: #1E2330`, `--accent-violet: #7C3AED`, `--accent-emerald: #10B981`, `--accent-amber: #F59E0B`). No light mode variables or `.dark` / `[data-theme]` switching exist.
  - Lines 39–42 define `.font-mono-tabular` (`font-variant-numeric: tabular-nums`).
  - Lines 52–65 hardcode dark scrollbar colors (`#090A0F`, `#1E2330`, `#7C3AED`).

### 1.2 Core Wiring, State & API Contracts
- **`frontend/src/main.tsx` (lines 1–14)**: Wraps `<App />` in `<HabitProvider>`.
- **`frontend/src/App.tsx` (lines 1–34)**:
  - Public routes: `/login` (`<Login />`), `/register` (`<Register />`). No `/forgot-password` or `/reset-password` route exists.
  - Protected routes wrapped in `<ProtectedRoute><AppLayout /></ProtectedRoute>`: `/` (`<Tracker />`), `/analytics` (`<AnalyticsDashboard />`).
- **`frontend/src/store/authStore.ts` (lines 1–29)**: Persists `{ token, user: { id, email } }` under `localStorage` key `'auth-storage'`.
- **`frontend/src/api/client.ts` (lines 1–39)**: Axios instance (`VITE_API_URL || 'http://localhost:3000/api'`), attaches `Bearer ${token}`, auto-logs out on `401`.
- **`frontend/src/context/HabitContext.tsx` (lines 1–273) & `useHabits.ts` (lines 1–50)**:
  - Subscribes reactively to `useAuthStore((state) => state.token)` (line 57).
  - Exposes `categories`, `activeCycle`, `cycleHistory`, `progress`, `todayLog`, `tomorrowLog`, `selectedDayNumber`, `selectedDayLog`, `setSelectedDayNumber`, `loading`, `error`, `refreshCycle`, `refreshProgress`, `refreshAll`, `startSprint`, `saveGoal`, `editGoal`, `removeGoal`, `closeToday`.
- **`frontend/src/services/api.ts` (lines 1–256)**:
  - Exposes typed interfaces (`HabitCategory`, `Cycle`, `CycleHistoryItem`, `PlannedAction`, `DailyLog`, `CycleStats`, `PillarStat`, `DailySeriesPoint`, `RecentActivityItem`, `CycleProgressResponse`, `InitialGoalInput`) and functions (`fetchHabitCategories`, `fetchActiveCycle`, `fetchCycleHistory`, `startNewCycle`, `createDailyLog`, `fetchDays`, `closeDailyLog`, `fetchCycleProgress`, `createAction`, `updateAction`, `toggleActionStatus`, `deleteAction`).
  - No forgot-password / reset-password API helpers exist.
- **`frontend/src/lib/pillars.ts` (lines 1–101)**: Maps the 8 Core Pillars (`Learning`, `Physical Health`, `Nutrition`, `Mindfulness`, `Work / Focus`, `Finance`, `Organization`, `Rest`) with `shortName`, `tagline`, `suggestions`, `accentColor`, and `LucideIcon`.

### 1.3 Backend Auth Contract Audit (for Forgot Password)
- **`backend/src/routes/auth.routes.ts` (lines 1–13)**: Only `POST /register` and `POST /login`.
- **`backend/src/controllers/auth.controller.ts` (lines 1–88)**: Only `register` and `login` controllers.
- **`backend/prisma/schema.prisma` (lines 79–92)**: `User` model has `id`, `email`, `hashedPassword`, `cycles`, `logs`, `plans`, `createdAt`, `updatedAt`. No password-reset columns exist.

### 1.4 UI Primitives & Components Audit
- **`frontend/src/components/ui/card.tsx` (lines 1–65)**:
  - Line 11: `rounded-2xl border border-[#1E2330] bg-[#11131C] text-[#F8FAFC] shadow-sm` — hardcoded dark colors, `16px` radius (`rounded-2xl`), and `shadow-sm` drop shadow.
- **`frontend/src/components/ui/button.tsx` (lines 1–49)**:
  - Lines 13–24: Hardcoded dark hex colors, `rounded-xl` (`12px`), and drop shadows (`shadow-sm shadow-[#7C3AED]/20` on line 14, `shadow-sm shadow-[#10B981]/20` on line 22). Not stadium pills (`rounded-full`).
- **`frontend/src/components/ui/input.tsx` (lines 1–22)**:
  - Line 13: Hardcoded dark hex (`border-[#1E2330] bg-[#171A26] text-[#F8FAFC]`), `rounded-xl`.
- **`frontend/src/components/ui/table.tsx` (lines 1–83)** & **`avatar.tsx` (lines 1–45)**: Hardcoded `#1E2330`, `#171A26`, `#7C3AED`, `#F8FAFC`.
- **`frontend/src/components/AppLayout.tsx` (lines 1–230)**:
  - Lines 44–159: Standard full-height `#12151E` collapsible sidebar with `#1E2330` right border. Brand box has `shadow-sm shadow-[#7C3AED]/30` (line 53). Active NavLink uses `bg-[#7C3AED]/15 border-[#8B5CF6]/40` (line 115) instead of a stark solid high-contrast stadium pill or glowing indicator bar. Lacks theme toggle.
  - Lines 164–219: Standard rectangular mobile top bar.
- **`frontend/src/components/auth/Login.tsx` (lines 1–283) & `Register.tsx` (lines 1–206)**:
  - `AuthShowcasePanel` (`Login.tsx:10–111`): Uses `rounded-2xl` / `rounded-xl`, blurred radial violet/emerald glow divs (`lines 16–23`), standard 11-column square-ish day grid (`lines 58–80`), and 2-column pillar cards (`lines 89–107`). No frosted-glass pill overlays on a 2D vector diagram.
  - Auth Card (`Login.tsx:174`, `Register.tsx:80`): `rounded-2xl ... shadow-2xl backdrop-blur-xl` (floating drop shadow!).
  - `Login.tsx` form (`lines 188–254`): Email (`#login-email`), Password (`#login-password`), Submit (`#login-submit-btn`). **No "Forgot password?" button/link anywhere.**
  - `Register.tsx` form (`lines 94–178`): Email (`#register-email`), Password (`#register-password`), Confirm (`#register-confirm-password`), Submit (`#register-submit-btn`).
- **`frontend/src/components/StartSprintScreen.tsx` (lines 1–235)**:
  - Lines 68, 116: `rounded-2xl` cards, `gap-6` / `gap-4` (`24px` / `16px`).
  - Lines 98–112: 31-node strip uses `rounded-lg` square chips (`h-8`) rather than hardware-style vertical capsules (`rounded-full`).
  - Lines 138–194: Uniform 2-column grid of `rounded-xl` cards (`#kickoff-input-${category.id}`, `#launch-sprint-btn`).
- **`frontend/src/pages/Tracker.tsx` (lines 1–41)**:
  - Loading, Error, `!activeCycle -> <StartSprintScreen />`, else `<HabitGrid />`. Uses hardcoded dark colors in loading/error states (lines 13–25).
- **`frontend/src/components/HabitGrid.tsx` (lines 1–841)**:
  - Line 230: Page title `h1` is `text-2xl sm:text-3xl` (24px–30px) with no inline icon badge.
  - Line 279: Day 31 banner uses `shadow-lg`.
  - Lines 326–520: 12-column Bento header (`lg:col-span-7` 31-day ribbon with `rounded-lg` pills, `lg:col-span-2` 80x80 SVG circle ring, `lg:col-span-3` linear `h-2` progress bar for Close Day Gatekeeper).
  - Lines 551–835: Single uniform `rounded-2xl` table-like list with `divide-y`, `rounded-xl` goal boxes, `rounded-md` checkboxes (lines 627–634), inline edit (`Enter`/`Escape`/`onBlur`), delete, `#today-input-${category.id}`, `#tomorrow-input-${category.id}`, `#close-today-btn`.
- **`frontend/src/pages/AnalyticsDashboard.tsx` (lines 1–565)**:
  - Lines 4–19, 329–441: Uses `recharts` (`RadarChart`, `BarChart`, `AreaChart`) with standard line/area/bar styling.
  - Lines 191–287: 4 symmetric KPI cards (`text-3xl` = 30px numerals, uniform `lg:grid-cols-4`, `rounded-2xl`, `shadow-sm`).
  - Lines 447–559: Table (`lg:col-span-8`) + Recent Activity (`lg:col-span-4`).
- **`frontend/src/components/HabitCard.tsx` (lines 1–50)** & **`PlanningModal.tsx` (lines 1–109)**:
  - `HabitCard.tsx`: Unused or standalone primitive with hardcoded dark colors (`#11131C`, `#1E2330`).
  - `PlanningModal.tsx`: Hardcoded dark modal with `shadow-2xl` (line 50) and `rounded-2xl`.

---

## 2. Logic Chain

1. **Why a Token & Theme Architecture Overhaul (`index.html` + `index.css` + `themeStore.ts`) Must Come First**:
   - Currently every component hardcodes `#090A0F`, `#11131C`, `#12151E`, `#171A26`, `#1E2330`, `#7C3AED`, `#F8FAFC` directly in JSX class strings. Supporting both **Light/Warm Mode** (`#F4F4F2` / `#EAE9E4` canvas, `#FFFFFF` & `#EBE6DC` & `#121212` cards, `#E6FA72` acid lime / `#5CE68A` spring green accents) AND **Dark Mode** (`#0D0914` obsidian-violet canvas, `#171224` plum cards, `1px solid rgba(255,255,255,0.06)` hairline borders, `#D96BFF` orchid purple & `#F5B841` warm amber luminous accents) is impossible cleanly without semantic CSS custom properties mapped via `@theme` / Tailwind v4 variables.
   - Moving colors to semantic CSS variables (`--bg-canvas`, `--surface-card`, `--surface-sand`, `--surface-contrast`, `--surface-accent`, `--border-hairline`, `--text-primary`, `--text-secondary`, `--text-muted`, `--accent-primary`, `--accent-secondary`, `--accent-success`, `--pattern-hatch`) switched by `.dark` vs `:root` (or `data-theme="light" | "dark"`) allows every Bento card, hardware chart, and anchor chrome element to adapt seamlessly when toggled.

2. **Why `ui/` Primitives & Global Geometry Must Enforce Flat Bento Hierarchy**:
   - The prompt strictly forbids floating drop shadows (`shadow-sm`, `shadow-lg`, `shadow-2xl` currently on `card.tsx:11`, `button.tsx:14,22`, `Login.tsx:174`, `Register.tsx:80`, `AppLayout.tsx:53`, `HabitGrid.tsx:279`, `PlanningModal.tsx:50`) and specifies `24px–32px` card radii (`rounded-[24px]` / `rounded-[28px]` / `rounded-[32px]`), `12px–16px` gutters (`gap-3` / `gap-4`), and stadium pills (`rounded-full`) for buttons, tabs, badges, and bars.
   - Updating `card.tsx`, `button.tsx`, `input.tsx`, `table.tsx`, and `avatar.tsx` first ensures consistent flat color-blocked elevation across all 4 screens.

3. **Why Recharts Should Be Replaced by Bespoke "Hardware-Style" Visualizations (`HardwareViz.tsx`)**:
   - `ORIGINAL_REQUEST.md` (`2026-11-18T13:52:21Z`) explicitly states: *"Instead of standard Chart.js line graphs or pie charts, data is represented through tactile, segmented geometry: Pill Matrices / Segmented Batteries, Capsule Bar Charts (`border-radius: 9999px` with internal indicator dots, dashed ghost-tracks, diagonal hatch patterns), thick concentric rings & dot-matrix indicators, and Contextual Visual Anchors with frosted glass pill overlays (`backdrop-filter: blur(12px)`)."*
   - Replacing `recharts` in `AnalyticsDashboard.tsx` (lines 3–19, 329–441) and upgrading the 31-Day Ribbon, Circular Ring, and Readiness bar in `HabitGrid.tsx` (lines 351–519) & `StartSprintScreen.tsx` (lines 98–112) with bespoke SVG/CSS hardware components satisfies the design DNA 100% AND eliminates the >400 kB `recharts` bundle weight warning observed in `npm run build`.

4. **Why Editorial Typography & Inline Icon Badges Elevate Hierarchy**:
   - Upgrading hero `<h1>` titles and primary KPI numerals from `24px–30px` (`text-2xl`/`text-3xl`) to `36px–48px` (`text-4xl sm:text-[44px] leading-[1.05] tracking-[-0.03em]`), paired with `10px–12px` uppercase tracked micro-copy (`text-[10px] tracking-[0.14em] uppercase font-mono-tabular`) and inline stadium-pill icon badges embedded between words in main headings, establishes the exact editorial-meets-hardware aesthetic.

5. **Why Forgot Password Requires Both UI & Coordinated Backend Contract (or Explicit Fallback)**:
   - Inspection of `backend/src/routes/auth.routes.ts` and `backend/src/controllers/auth.controller.ts` confirms no password reset endpoints exist yet.
   - On the frontend, `Login.tsx` needs a visible **"Forgot password?"** button right by the password field, routing to `/forgot-password` (new `ForgotPassword.tsx` page using the split-screen Auth layout) or toggling a clean recovery flow with:
     - Request Reset step (`POST /api/auth/forgot-password` with `{ email }`)
     - Reset Password step (`POST /api/auth/reset-password` with `{ token, password }`)
   - Note: A backend worker (or coordinated auth update) must implement `POST /api/auth/forgot-password` and `POST /api/auth/reset-password` (for example using a stateless 15-minute HMAC/JWT signed with `JWT_SECRET + user.hashedPassword.slice(0, 12)` so it requires zero Prisma schema migration, returning `{ resetToken }` in non-production/dev or sending email if configured). Until the backend endpoints exist, the UI should handle `404`/`501` gracefully with clear inline error feedback rather than crashing.

6. **Preserving Zero-Regression Contracts**:
   - Every existing DOM ID (`#login-email`, `#login-password`, `#login-submit-btn`, `#register-email`, `#register-password`, `#register-confirm-password`, `#register-submit-btn`, `#kickoff-input-${category.id}`, `#launch-sprint-btn`, `#close-today-btn`, `#today-input-${category.id}`, `#tomorrow-input-${category.id}`) and every `HabitContext` method (`startSprint`, `saveGoal`, `editGoal`, `removeGoal`, `closeToday`, `setSelectedDayNumber`) must be preserved intact in the rebuilt components.

---

## 3. Caveats

1. **Backend Forgot-Password Endpoint Missing**: `backend/src/routes/auth.routes.ts` currently only exposes `/register` and `/login`. Frontend Forgot Password UI can be built completely against a defined REST contract (`POST /api/auth/forgot-password`, `POST /api/auth/reset-password`), but end-to-end password reset execution will require adding those two backend handlers (or coordinating a backend worker).
2. **Dark Mode vs. `web-app-development` Skill Default Rule**: The `web-app-development` skill advises against purple-on-dark *"UNLESS explicitly requested by the user"*. Here `ORIGINAL_REQUEST.md` (`2026-11-18T13:52:21Z`) explicitly specifies Dark Mode (`#0D0914` obsidian-violet canvas, `#171224` plum cards, `#D96BFF` orchid purple, `#F5B841` warm amber) alongside Light/Warm Mode (`#F4F4F2` / `#EAE9E4` stone canvas, `#FFFFFF`, `#EBE6DC`, `#121212`, `#E6FA72`, `#5CE68A`). Both palettes must be implemented cleanly without cliché grid-line backgrounds, pulsing headline biscuit badges, or 3+ deep card nesting.
3. **Mobile & Small-Viewport Responsiveness**: Dense asymmetrical Bento grids (e.g., 12-column grids with 31 capsule bars) must gracefully collapse to 2-column / 1-column stacks or horizontal snap/compact grids below `md` (`768px`) without horizontal page overflow.
4. **`recharts` Removal**: If `recharts` is fully replaced in `AnalyticsDashboard.tsx`, `frontend/package.json` can optionally uninstall `recharts` (or keep it unused without importing it so Vite tree-shakes it out completely).

---

## 4. Conclusion — Concrete Redesign & File-by-File Strategy

### Step 0: Update `DESIGN.md`
Rewrite `/home/antigravity/GeorgeDeveloperJ/habits-tracker/DESIGN.md` to replace the dark-only `Focused Obsidian & Electric Violet` spec with the **Dual-Mode Modular Bento & Hardware Telemetry System**:
- **Modes**: Light/Warm Mode (`#F4F4F2` / `#EAE9E4` stone canvas, `#FFFFFF` pure white, `#EBE6DC` warm sand, `#121212` jet black accent blocks, `#E6FA72` acid lime / `#5CE68A` spring green surface fills) + Dark Mode (`#0D0914` obsidian-violet canvas, `#171224` plum cards, `1px solid rgba(255,255,255,0.06)` hairline borders, `#D96BFF` orchid purple & `#F5B841` warm amber luminous gradients/accents).
- **Geometry**: Asymmetrical Bento grids, `24px–32px` outer radii (`rounded-[24px]`–`rounded-[32px]`), `12px–16px` gutters (`gap-3` / `gap-4`), **zero drop shadows**, stadium pills (`rounded-full`) everywhere.
- **Anchor Chrome**: Floating/full-height solid high-contrast vertical pill dock / matte black sidebar (`#121212` in light, `#171224` with ultra-thin border in dark) + recessed top pill bar on mobile/sub-headers, active solid contrast pills (`rounded-full`) and luminous indicator bars, plus integrated Theme Switcher.
- **Typography**: `36px–48px` tightly tracked geometric sans-serif headings & KPI numerals (`Plus Jakarta Sans`), inline stadium-pill icon badges embedded mid-headline, and `10px–12px` uppercase tracked `JetBrains Mono` (`tabular-nums`) micro-labels.
- **Hardware Data Viz**: Segmented Pill Batteries, Capsule Bar Charts (stadium tracks, dashed ghost-tracks, internal indicator dots, diagonal SVG/CSS hatch patterns), Thick Concentric Rings, Dot-Matrix Indicators, and 2D Vector Diagrams with Frosted Glass Pill Overlays (`backdrop-blur-md`).

### Step 1: Foundation Files
| Target File | Exact Changes |
| :--- | :--- |
| `frontend/index.html` | Remove hardcoded `class="dark"` on `<html>` (line 2) and dark-only classes on `<body>` (line 16). Add inline theme-init script reading `localStorage.getItem('proactive31-theme')` (default `'light'` or `'dark'`, toggling `.dark` class on `<html>` pre-paint to prevent FOUC). Keep `Plus Jakarta Sans`, `Inter`, `JetBrains Mono` Google Fonts. |
| `frontend/src/store/themeStore.ts` *(NEW)* | Small Zustand store (`persist` key `'proactive31-theme'`) exposing `{ theme: 'light' | 'dark', toggleTheme, setTheme }` and syncing `document.documentElement.classList.toggle('dark', theme === 'dark')`. |
| `frontend/src/index.css` | Define complete `:root` (Light/Warm tokens: `--bg-canvas: #F4F4F2`, `--bg-canvas-warm: #EAE9E4`, `--bg-card: #FFFFFF`, `--bg-sand: #EBE6DC`, `--bg-contrast: #121212`, `--accent-primary: #E6FA72`, `--accent-secondary: #5CE68A`, `--border-hairline: rgba(18,18,18,0.08)`, `--text-primary: #121212`, `--text-secondary: #5A5850`, `--text-muted: #8B887E`, `--hatch-color: rgba(18,18,18,0.12)`) and `.dark` overrides (`--bg-canvas: #0D0914`, `--bg-card: #171224`, `--bg-sand: #1E1730`, `--bg-contrast: #231B38`, `--accent-primary: #D96BFF`, `--accent-secondary: #F5B841`, `--accent-emerald: #5CE68A`, `--border-hairline: rgba(255,255,255,0.06)`, `--text-primary: #F7F5FF`, `--text-secondary: #A99EC4`, `--text-muted: #6E628C`, `--hatch-color: rgba(255,255,255,0.10)`). Add `.bg-hatch` diagonal stripe utility and `.glass-pill` (`backdrop-filter: blur(12px)`). Remove dark-only scrollbar hardcoding. |

### Step 2: Shared UI Primitives & Hardware Viz Library
| Target File | Exact Changes |
| :--- | :--- |
| `frontend/src/components/ui/card.tsx` | Replace `rounded-2xl border-[#1E2330] bg-[#11131C] shadow-sm` (line 11) with `rounded-[28px] border border-[var(--border-hairline)] bg-[var(--bg-card)] text-[var(--text-primary)]` — **ZERO shadows**, plus optional `variant` prop (`'default' | 'sand' | 'contrast' | 'accent'`) for flat Bento color blocking. |
| `frontend/src/components/ui/button.tsx` | Convert base shape from `rounded-xl` (line 38) to stadium pill `rounded-full`; remove all `shadow-sm` classes (lines 14, 22); wire `default`, `secondary`, `outline`, `ghost`, `emerald`, `lime`, `danger` variants to CSS tokens. |
| `frontend/src/components/ui/input.tsx` | Use `rounded-full` (or `rounded-2xl` for dense inputs), `bg-[var(--bg-canvas-warm)] dark:bg-[#120E1D]`, `border-[var(--border-hairline)]`, focus ring using `var(--accent-primary)`. |
| `frontend/src/components/ui/table.tsx` & `avatar.tsx` | Replace hardcoded `#1E2330`, `#171A26`, `#7C3AED`, `#F8FAFC` with theme CSS variables; use `rounded-full` pills and `1px` hairline dividers. |
| `frontend/src/components/charts/HardwareViz.tsx` *(NEW)* | Reusable hardware-style data visualization suite: (1) `SegmentedBattery` (row of thick vertical `rounded-full` capsules for `8` pillars or `N` units, filled vs diagonal-hatched empty); (2) `CapsuleBarChart` (vertical stadium bars `rounded-full`, dashed ghost-track max capacity, internal indicator dot at bar cap, diagonal hatch for unlogged/projected days, interactive hover tooltip); (3) `ConcentricRing` (thick dual/single SVG stroke ring with `tabular-nums` centerpiece); (4) `DotMatrixRibbon` (31 clickable stadium capsule / dot-matrix nodes); (5) `PillarCompassDiagram` (2D vector geometric 8-node visual anchor with `backdrop-blur-md` frosted glass pill overlays). |

### Step 3: Anchor Chrome & Routing
| Target File | Exact Changes |
| :--- | :--- |
| `frontend/src/components/AppLayout.tsx` | Rebuild desktop rail into a **High-Contrast Anchor Chrome** floating vertical pill dock / matte black sidebar (`bg-[#121212] text-[#F4F4F2]` in Light/Warm mode; `bg-[#171224] border border-white/[0.06]` in Dark mode, `rounded-[28px]` floating dock inside `p-3`–`p-4` gutter or crisp matte anchor). Active NavLink uses solid high-contrast stadium pill (`bg-[#E6FA72] text-[#121212]` in Light/Warm; `bg-gradient-to-r from-[#D96BFF] to-[#F5B841] text-[#0D0914]` or glowing indicator bar in Dark). Add recessed top pill bar (`rounded-full`) with **Theme Toggle** (Sun/Moon pill), Sprint Day counter, and user session pill. Keep `Log Out` button and mobile navigation functional. |
| `frontend/src/App.tsx` | Add `<Route path="/forgot-password" element={<ForgotPassword />} />` alongside `/login` and `/register`. |

### Step 4: Auth Screens + Forgot Password
| Target File | Exact Changes |
| :--- | :--- |
| `frontend/src/services/api.ts` | Add `requestPasswordReset(email: string)` (`POST /api/auth/forgot-password`) and `confirmPasswordReset(token: string, password: string)` (`POST /api/auth/reset-password`). |
| `frontend/src/components/auth/Login.tsx` | (1) Rebuild `AuthShowcasePanel` (`lines 10–111`) with flat Bento blocks (`rounded-[28px]`, `gap-4`, zero drop shadows), an oversized `40px+` heading with an **inline stadium-pill icon badge**, a 2D vector **8-Pillar Radial Diagram** (`PillarCompassDiagram`) with **frosted glass pill overlays** (`backdrop-blur-md`), and a hardware-style 31-day capsule strip. (2) Rebuild the Auth card (`line 174`) with `rounded-[28px]` and zero drop shadow, theme toggle in corner, `#login-email`, `#login-password`, `#login-submit-btn`. (3) Add a crisp **"Forgot password?"** button (`Link to="/forgot-password"` with `id="forgot-password-link"`) aligned next to the Password label (`lines 208–225`). |
| `frontend/src/components/auth/Register.tsx` | Match the rebuilt Bento split-screen, zero-shadow `rounded-[28px]` card, inline icon badge heading, stadium pill CTA (`#register-submit-btn`), preserving `#register-email`, `#register-password`, `#register-confirm-password`. |
| `frontend/src/components/auth/ForgotPassword.tsx` *(NEW)* | Split-screen page reusing `AuthShowcasePanel`, with 2-step flow: (1) Request Reset Email (`#forgot-email`, `#forgot-submit-btn`) calling `requestPasswordReset`, showing feedback/confirmation (and optional dev token prefill if backend returns one); (2) Reset Password (`#reset-token`, `#reset-password`, `#reset-confirm-password`, `#reset-submit-btn`) calling `confirmPasswordReset` with validation & "Back to Sign In" link. |

### Step 5: Sprint Launchpad, Primary Command Center & Analytics
| Target File | Exact Changes |
| :--- | :--- |
| `frontend/src/components/StartSprintScreen.tsx` | Asymmetrical Bento layout (`rounded-[28px]`, `gap-4`, zero shadows): Top Hero Bento (`lg:col-span-8`) with `36px–44px` heading + inline icon badge + 31-node `DotMatrixRibbon` capsule preview; Right Contrast Bento (`lg:col-span-4`, matte `#121212` / `#E6FA72` in light, `#171224` + `#D96BFF`/`#F5B841` in dark) showing Sprint Window & `SegmentedBattery` (`plannedCount / 8`); Day 1 Kickoff 8-card Bento grid (`#kickoff-input-${category.id}`, stadium suggestion chips, `#launch-sprint-btn` pill CTA). |
| `frontend/src/pages/Tracker.tsx` | Update loading & error states (`lines 10–33`) to flat `rounded-[28px]` Bento cards using theme CSS variables. |
| `frontend/src/components/HabitGrid.tsx` | (1) Editorial Hero row (`lines 227–247`) with `40px–48px` tightly tracked title + inline stadium-pill icon badge + `11px` uppercase `tabular-nums` sprint metadata. (2) Asymmetrical Top Bento Header (`gap-4`): `lg:col-span-6` **31-Day Capsule Ribbon** (`DotMatrixRibbon` with closed/today/tomorrow/hatched future states + clickable Day Inspector); `lg:col-span-3` **Concentric Ring & Telemetry Card** (thick concentric SVG rings + `40px` KPI numeral); `lg:col-span-3` **High-Contrast Close Day Gatekeeper Card** (`#121212` / `#E6FA72` accent card in light, luminous plum/orchid-amber card in dark) featuring `SegmentedBattery` (`tomorrowPlannedCount / 8`) and stadium pill `#close-today-btn`. (3) **8-Pillar Bento Matrix**: Replace flat table-divide list (`lines 551–835`) with structured flat Bento rows/cards (`rounded-[24px]`), stadium-pill checkboxes, inline edit (`Enter`/`Escape`/`onBlur`), delete, `#today-input-${category.id}`, `#tomorrow-input-${category.id}`, Day Inspector banner, and Day 31 Completion Celebration Bento card + rollover button. |
| `frontend/src/pages/AnalyticsDashboard.tsx` | (1) Editorial `40px–44px` header with inline icon badge + cycle selector stadium pill. (2) **Asymmetrical Bento KPI Grid** (e.g. `lg:col-span-4` full-accent `#E6FA72` / `#5CE68A` or `#D96BFF` hero completion card with `48px` numeral + `ConcentricRing`, alongside `lg:col-span-8` grid of white/sand/obsidian KPI tiles with `SegmentedBattery` & dot-matrix indicators). (3) **Hardware-Style Charts Row**: Replace Recharts (`lines 329–441`) with `CapsuleBarChart` for **31-Day Consistency Trend** (31 vertical stadium bars with dashed ghost-tracks, internal indicator dots, diagonal hatch for unlogged days) and `CapsuleBarChart` / `SegmentedBattery` matrix for **8-Pillar Balance** (with view toggle pills). (4) **8-Pillar Breakdown & Recent Activity Bento Cards** (`rounded-[28px]`, flat color contrast, zero shadows). |
| `frontend/src/components/HabitCard.tsx` & `PlanningModal.tsx` | Update to `rounded-[24px]`–`rounded-[28px]`, zero drop shadows, theme CSS variables, and stadium pill buttons. |

---

## 5. Verification Method

After implementing `DESIGN.md` and the frontend rebuild, independently verify via:

1. **TypeScript & Production Bundle Verification**:
   ```bash
   cd /home/antigravity/GeorgeDeveloperJ/habits-tracker/frontend
   npm run lint
   npm run build
   ```
   - Expected: `0` TypeScript errors, `0` ESLint errors, clean Vite production bundle (note: bundle size should decrease substantially once `recharts` is replaced by bespoke SVG/CSS hardware components).
2. **Backend E2E Suite (if backend auth reset endpoints are also added)**:
   ```bash
   cd /home/antigravity/GeorgeDeveloperJ/habits-tracker/backend
   npm run typecheck && npm run build && npm test
   ```
   - Expected: All existing 40/40 E2E tests pass plus any new forgot-password tests.
3. **Browser Visual & Functional Verification** (against running dev servers):
   - Verify Light/Warm Mode (`#F4F4F2` canvas, `#FFFFFF`/`#EBE6DC`/`#121212`/`#E6FA72`/`#5CE68A` surfaces, zero drop shadows, `24px–32px` radii) AND Dark Mode (`#0D0914` canvas, `#171224` cards, `1px solid rgba(255,255,255,0.06)`, `#D96BFF` & `#F5B841` accents) via the Theme Toggle.
   - Verify **Forgot Password** link/button on `/login` navigates to `/forgot-password` and renders the recovery form cleanly.
   - Verify all existing functional flows: Register/Login -> Start Sprint (Day 1 kickoff) -> Today Execution toggle/inline-edit/delete -> Tomorrow Plan inline-save -> Close Today gatekeeper unlock at 8/8 -> Day Inspector click (`01..31`) -> Analytics live KPIs + Hardware Capsule Charts + Cycle Selector.
4. **Invalidation Conditions**:
   - Any remaining `shadow-sm` / `shadow-lg` / `shadow-2xl` on Bento cards, any `recharts` import remaining in `AnalyticsDashboard.tsx`, any broken `HabitContext` reactivity on login/logout, or missing `#forgot-password` trigger on `Login.tsx` invalidates the redesign.
