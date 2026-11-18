# DESIGN.md — Proactive 31-Day Habit Tracker Design System

> **System Identity**: **Dual-Mode Modular Bento & Hardware Telemetry System**  
> **Core Philosophy**: *Plan Tonight. Execute Tomorrow.* Tactile, zero-shadow Bento modularity paired with hardware-inspired segmented telemetry across **8 Core Pillars**—supporting both **Light/Warm Stone** (default) and **Obsidian-Violet Dark** modes.

---

## 1. Visual Direction & Core DNA

1. **Modular Bento Grid Geometry**:
   - Every screen is structured as an asymmetrical, puzzle-like Bento grid with generous outer card radii (`24px`–`32px`, default `28px`) and tight, uniform gutters (`12px`–`16px` / `gap-3`–`gap-4`).
   - **Zero Drop Shadows**: Floating drop shadows (`shadow-sm`, `shadow-lg`, `shadow-2xl`) are strictly prohibited on cards, buttons, chrome docks, and modals. Visual hierarchy is established solely through surface-color contrast and `1px` hairline borders.
2. **Stadium Pills Everywhere (`rounded-full`)**:
   - Buttons, navigation tabs, status badges, chart bars, progress segments, input controls, and inline headline icon containers all use full stadium pill geometry (`9999px` radius).
3. **High-Contrast Anchor Chrome**:
   - Navigation is anchored by a stark, solid container—a floating vertical pill dock on desktop (`#121212` matte black in Light/Warm mode; `#171224` elevated plum with `1px solid rgba(255,255,255,0.06)` in Dark mode) paired with a recessed top pill bar (`rounded-full`) housing the Theme Toggle, live `Day XX / 31` telemetry pill, and session controls.
   - Active navigation states use solid high-contrast stadium pills (`#E6FA72` Acid Lime in Light/Warm; `#B69ACC` Orchid / `#D4A968` Amber in Dark) rather than muted text shifts.
4. **Editorial & Utilitarian Typography**:
   - Oversized, tightly tracked geometric sans-serif headings and primary KPI numerals (`36px`–`48px`, `tracking-[-0.03em]`, `Plus Jakarta Sans`).
   - **Inline Icon Badges**: Main headings embed stadium-pill icon containers directly inline between words.
   - **Tabular Telemetry Micro-Copy**: Metadata, axes, timestamps, and day numerals (`01`..`31`) use `10px`–`12px` uppercase tracked-out `JetBrains Mono` with `tabular-nums`.
5. **Bespoke Hardware-Style Data Visualization (`HardwareViz.tsx`)**:
   - Data is rendered as tactile, segmented geometry instead of generic line/pie charts:
     - **Segmented Pill Batteries (`SegmentedBattery`)**: Rows of thick vertical stadium capsules (filled vs. diagonal-hatched empty).
     - **Capsule Bar Charts (`CapsuleBarChart`)**: Vertical stadium bars (`rounded-full`) inside dashed ghost-tracks with internal indicator dots and diagonal hatch states for inactive/projected days.
     - **Concentric Rings (`ConcentricRing`)**: Thick circular SVG telemetry rings with `tabular-nums` centerpiece readouts.
     - **Dot-Matrix Ribbons (`DotMatrixRibbon`)**: 31-node stadium capsule/dot-matrix sprint inspectors.
     - **Contextual 2D Vector Diagrams (`PillarCompassDiagram`)**: Precision 2D vector 8-pillar architectural diagram overlaid with frosted-glass stadium pills (`backdrop-filter: blur(12px)`).

---

## 2. Dual-Mode Surface & Color Palettes

Theme state is persisted via `useThemeStore` (`localStorage` key `'proactive31-theme'`, defaulting to `'light'`) and applied pre-paint via `.dark` on `<html>` alongside Tailwind v4 `@custom-variant dark (&:where(.dark, .dark *));`.

### Light / Warm Mode (`:root`, Default)

| Token Role | Hex / Value | CSS Variable | Usage |
| :--- | :--- | :--- | :--- |
| **Canvas (Stone)** | `#F4F4F2` | `--bg-canvas` | Primary application backdrop |
| **Canvas (Alabaster)** | `#EAE9E4` | `--bg-canvas-warm` | Recessed pill bars, subtle secondary canvas |
| **Card Surface** | `#FFFFFF` | `--bg-card` | Pure white Bento cards |
| **Warm Sand Surface** | `#EBE6DC` | `--bg-sand` | Warm neutral Bento blocks, pillar tracks |
| **Jet Contrast Surface** | `#121212` | `--bg-contrast` | Navigation pill dock, high-contrast gatekeeper/KPI blocks |
| **Primary Accent (Acid Lime)** | `#E6FA72` | `--accent-primary` | Active nav pills, hero KPI surface fills, primary badges |
| **Secondary Accent (Spring Green)** | `#5CE68A` | `--accent-secondary` | Completed states, unlocked gatekeeper, positive telemetry |
| **Hairline Border** | `rgba(18, 18, 18, 0.08)` | `--border-hairline` | Subtle structural `1px` borders |
| **Text Primary** | `#121212` | `--text-primary` | Headlines, KPI numerals, primary labels |
| **Text Secondary** | `#5A5850` | `--text-secondary` | Supporting copy, descriptions |
| **Text Muted** | `#8B887E` | `--text-muted` | Micro-labels, inactive tracks |

### Dark Mode (`.dark`)

| Token Role | Hex / Value | CSS Variable | Usage |
| :--- | :--- | :--- | :--- |
| **Canvas (Obsidian-Violet)** | `#0D0914` | `--bg-canvas` | Deep obsidian-violet backdrop |
| **Card Surface (Plum)** | `#171224` | `--bg-card` | Elevated plum-tinted Bento cards & dock |
| **Elevated Plum** | `#1E1730` | `--bg-sand` | Secondary Bento blocks & interactive inputs |
| **Deep Contrast** | `#231B38` | `--bg-contrast` | Contrast KPI/gatekeeper surface |
| **Primary Accent (Orchid Purple)** | `#B69ACC` | `--accent-primary` | Selected indicators, primary accents |
| **Secondary Accent (Warm Amber)** | `#D4A968` | `--accent-secondary` | Warm amber highlights, proactive plans |
| **Completed (Sage)** | `#AAB8AA` | `--accent-complete` | Completed actions, closed day states |
| **Hairline Border** | `rgba(255, 255, 255, 0.06)` | `--border-hairline` | Ultra-thin low-opacity card dividers |
| **Text Primary** | `#F7F5FF` | `--text-primary` | Headlines, KPI numerals, active descriptions |
| **Text Secondary** | `#A99EC4` | `--text-secondary` | Supporting copy, pillar subtitles |
| **Text Muted** | `#A093B6` | `--text-muted` | Micro-labels, empty hatched states |

---

## 3. Typography & Micro-Copy Scale

- **Display & UI Sans (`--font-sans`)**: `'Plus Jakarta Sans', 'Inter', system-ui, sans-serif`
  - **Hero / Page `<h1>`**: `36px`–`48px` (`text-4xl sm:text-[44px] leading-[1.04] tracking-[-0.03em] font-semibold`) with inline stadium-pill icon badge.
  - **KPI Hero Numerals**: `36px`–`48px` (`font-mono-tabular font-semibold tracking-[-0.04em]`).
  - **Bento Card Title**: `16px`–`18px` (`font-semibold tracking-[-0.015em]`).
- **Telemetry Mono (`--font-mono`)**: `'JetBrains Mono', monospace` (`tabular-nums`)
  - **Micro-Labels & Axes**: `10px`–`11px` uppercase (`tracking-[0.14em] font-medium`).
  - **Day Counters & Readouts**: `Day 04 / 31`, `8 / 8 PILLARS`, `89%`.

---

## 4. 4-Screen Architecture + Password Recovery

### Screen 1 — Auth Bento Split-Screen (`/login`, `/register`, `/forgot-password`, `/reset-password`)
- **Left Architectural Panel (`lg:w-[52%]`)**:
  - Asymmetrical Bento stack inside the canvas gutter (`p-4`):
    - Hero manifesto card with `42px` heading + inline stadium-pill icon badge (*"Plan [pill] Tonight. Execute Tomorrow."*).
    - **2D Vector 8-Pillar Compass Diagram (`PillarCompassDiagram`)** with frosted-glass stadium pill overlays (`backdrop-blur-md`).
    - Hardware 31-day `DotMatrixRibbon` & `SegmentedBattery` preview tile.
- **Right Auth Card (`lg:w-[48%]`)**:
  - Flat `rounded-[32px]` Bento card with top-right Theme Toggle pill, zero drop shadows, stadium-pill CTAs.
  - **Login (`/login`)**: Email (`#login-email`), Password (`#login-password`), prominent **`Forgot password?`** link (`#forgot-password-link` → `/forgot-password`), optional `?reset=success` confirmation banner, and Submit (`#login-submit-btn`).
  - **Register (`/register`)**: Email (`#register-email`), Password (`#register-password`), Confirm (`#register-confirm-password`), Submit (`#register-submit-btn`).
  - **Forgot Password (`/forgot-password`)**: Email input (`#forgot-email`, `#forgot-submit-btn`) calling `POST /api/auth/forgot-password`; displays uniform confirmation and, when running in dev/demo (`resetToken` returned), offers a one-click button to `/reset-password?token=...` plus manual entry link.
  - **Reset Password (`/reset-password`)**: Token input (`#reset-token`, auto-filled from `?token=`), New Password (`#reset-password`), Confirm Password (`#reset-confirm-password`), Submit (`#reset-submit-btn`) calling `POST /api/auth/reset-password` and redirecting to `/login?reset=success`.

### Screen 2 — 31-Day Sprint Launchpad (`StartSprintScreen.tsx`)
- **Asymmetrical Top Bento Row (`gap-4`)**:
  - `lg:col-span-8`: Editorial `40px` heading with inline stadium-pill icon badge + interactive 31-node `DotMatrixRibbon` preview.
  - `lg:col-span-4`: High-contrast readiness block (`#121212` with `#E6FA72` accents in light; `#171224` with `#B69ACC`/`#D4A968` in dark) showing Sprint Window dates and `SegmentedBattery` (`plannedCount / 8`).
- **Day 1 Kickoff Bento Grid**:
  - 8 Pillar Bento cards (`rounded-[24px]`) with `#kickoff-input-${category.id}`, stadium suggestion chips, one-click kit prefill, and stadium-pill `#launch-sprint-btn`.

### Screen 3 — Primary Command Center (`AppLayout.tsx` + `Tracker.tsx` + `HabitGrid.tsx`)
- **Anchor Chrome (`AppLayout.tsx`)**:
  - Floating vertical matte pill dock (`w-[76px]` collapsed / `w-[248px]` expanded, `rounded-[28px]`) + recessed top pill bar (`rounded-full`) with `#theme-toggle-btn`, live `Day XX / 31` badge, and user session controls.
- **Command Workspace (`HabitGrid.tsx`)**:
  - Asymmetrical Bento header (`DotMatrixRibbon` 31-day inspector + `ConcentricRing` telemetry + high-contrast `SegmentedBattery` Close Today Gatekeeper `#close-today-btn`) above the **Unified 8-Pillar Bento Matrix** (`#today-input-${category.id}`, `#tomorrow-input-${category.id}`, inline edit/delete, Day 31 rollover).

### Screen 4 — Hardware Telemetry Analytics (`/analytics`, `AnalyticsDashboard.tsx`)
- **Asymmetrical Bento KPI Cluster**: Accent-filled hero completion card (`#E6FA72` / `#5CE68A` or `#B69ACC`) with `48px` numeral + `ConcentricRing`, paired with white/sand/contrast KPI tiles and `SegmentedBattery` readiness.
- **Hardware Data Visualizations**: `CapsuleBarChart` for 31-Day Consistency Trend (dashed ghost tracks, internal indicator dots, diagonal hatch states) and 8-Pillar Balance, plus flat Bento breakdown table and activity stream.
