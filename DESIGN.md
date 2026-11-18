# DESIGN.md — Proactive 31-Day Habit Tracker Design System

> **Theme Polarity**: **"Focused Obsidian & Electric Violet"** (Intentional Dark-First Command Workspace)
> **Core Philosophy**: *Plan Tonight. Execute Tomorrow.* High-precision, zero-friction daily execution paired with proactive evening planning across the **8 Core Pillars**—eliminating modal fatigue and visual clutter.

---

## 1. Visual Direction & Aesthetic Principles

1. **Zero Modal Fatigue**: Planning tomorrow's 8 pillars and executing today's 8 goals happen side-by-side inside a unified, scannable **8-Pillar Command Matrix** with inline quick-inputs (`Enter` to save) and one-click inline editing.
2. **Tabular Telemetry**: Every sprint counter (`Day 04 / 31`), completion percentage (`87%`), and streak badge uses `JetBrains Mono` with `tabular-nums` so numbers align with architectural precision.
3. **Semantic State Clarity**:
   - **Electric Violet (`#8B5CF6`)**: Active sprint focus, today's active node, primary actions, interactive highlights.
   - **Emerald (`#10B981`)**: Completed pillar actions, closed days, and "Ready to Close Today" gatekeeper unlocked state.
   - **Amber (`#F59E0B`)**: Tomorrow's proactive plan in progress (`X/8 Pillars Planned`), pending tomorrow actions.
   - **Obsidian Slate (`#0B0D13` / `#12151E`)**: Calm, low-glare dark surfaces layered with hairline `1px` borders (`#1E2330`).

---

## 2. Color Tokens

| Token Role | Hex / Value | Tailwind / CSS Usage | Description |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `#090A0F` / `#0B0D13` | `bg-[#090A0F]` / `--bg-canvas` | Deep obsidian root background |
| **Elevated Surface** | `#11131C` / `#12151E` | `bg-[#11131C]` / `--bg-surface` | Primary cards, navigation rail, matrix container |
| **Interactive Surface** | `#171A26` / `#181C28` | `bg-[#171A26]` / `--bg-elevated` | Elevated card, row hover state, input backgrounds |
| **Glass Surface** | `rgba(17, 19, 28, 0.85)` | `bg-[#11131C]/85 backdrop-blur-xl` | Auth card, floating banners, celebration overlays |
| **Hairline Border** | `#1E2330` | `border-[#1E2330]` / `--border-subtle` | Default `1px solid` structural dividers and card borders |
| **Active Focus Border** | `#7C3AED` / `#8B5CF6` | `border-[#7C3AED]` / `border-[#8B5CF6]` | Focused inputs, active day pill ring |
| **Primary Accent** | `#7C3AED` / `#8B5CF6` | `bg-[#7C3AED]` / `text-[#8B5CF6]` | Electric Violet primary CTAs, active indicators |
| **Primary Hover** | `#6D28D9` / `#7C3AED` | `hover:bg-[#6D28D9]` / `hover:bg-[#7C3AED]` | Primary button hover state |
| **Completion State** | `#10B981` | `text-[#10B981]` / `bg-[#10B981]/15` | Completed checkboxes, closed day pills, unlocked gatekeeper |
| **Proactive Plan State** | `#F59E0B` | `text-[#F59E0B]` / `bg-[#F59E0B]/15` | Tomorrow's planned goals, pending gatekeeper progress |
| **Danger / Missed** | `#EF4444` | `text-[#EF4444]` / `bg-[#EF4444]/15` | Missed actions in past day inspector, delete hover, errors |
| **Text Primary** | `#F8FAFC` | `text-[#F8FAFC]` | Headlines, active goal descriptions, primary labels |
| **Text Secondary** | `#94A3B8` | `text-[#94A3B8]` | Subtitles, pillar descriptions, navigation labels |
| **Text Muted** | `#64748B` | `text-[#64748B]` | Placeholders, disabled controls, upcoming day numerals |

---

## 3. Typography System

- **UI & Display Font (`--font-sans`)**: `'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif`
  - **Page Title (`h1`)**: `1.5rem`–`1.875rem` (`24px`–`30px`), `font-bold`, `tracking-tight`, `#F8FAFC`
  - **Section / Bento Header (`h2`, `h3`)**: `0.95rem`–`1.125rem` (`15px`–`18px`), `font-semibold`, `#F8FAFC`
  - **Pillar Name**: `0.9375rem` (`15px`), `font-semibold`, `#F8FAFC`
  - **Goal / Action Copy**: `0.875rem` (`14px`), `font-normal`, `leading-snug`
- **Telemetry & Counter Font (`--font-mono`)**: `'JetBrains Mono', monospace` (`font-mono tabular-nums`)
  - Used for:
    - 31-Day Ribbon numerals (`01` .. `31`)
    - Sprint progress counters (`Day 04 / 31`)
    - Completion rings & KPI values (`87%`, `6/8 Pillars`)
    - Streak badges (`4d streak`)

---

## 4. Layout & 4-Screen Architecture

### Screen 1 — Auth Split-Screen (`/login`, `/register`)
- **Left Showcase Panel (`hidden lg:flex lg:w-1/2`)**:
  - Obsidian `#0B0D13` canvas with subtle radial violet/emerald atmospheric lighting.
  - Displays the core manifesto: *"Plan Tonight. Execute Tomorrow."*
  - Interactive 31-day visual preview strip + 8 Core Pillars overview grid (*Learning, Physical Health, Nutrition, Mindfulness, Work / Focus, Finance, Organization, Rest*).
- **Right Auth Panel (`w-full lg:w-1/2`)**:
  - Centered glassmorphic card (`bg-[#12151E]/90 border border-[#1E2330] rounded-2xl p-8 shadow-2xl`).
  - Accessible email & password inputs with inline validation, instant feedback, and one-click registration auto-login.

### Screen 2 — 31-Day Sprint Launchpad (`StartSprintScreen.tsx`)
- **Interactive 31-Node Calendar Preview**:
  - Displays nodes `01` through `31` with start and target completion dates in `JetBrains Mono`.
- **Day 1 Pillar Kickoff Wizard**:
  - Allows users to immediately set Day 1 goals across all 8 Core Pillars (with one-click suggestion chips per pillar, e.g., *"Read 20 pages"*, *"30m strength training"*, *"2L water & whole foods"*) so the sprint launches with an active Day 1 execution checklist rather than an empty screen.

### Screen 3 — Primary Command Center (`AppLayout.tsx` + `Tracker.tsx` + `HabitGrid.tsx`)
- **Collapsible Left Navigation Rail (`AppLayout.tsx`)**:
  - Toggleable between `w-64` (expanded) and `w-20` (collapsed icon rail) on `#12151E` with `#1E2330` right border.
  - Displays brand identity, live `Day XX / 31` sprint badge, navigation links (**Command Center** `/`, **Analytics & Balance** `/analytics`), authenticated user profile (`useAuthStore.user.email`), and a functional **Log Out** button.
- **Top 12-Column Bento Header**:
  1. **31-Day Interactive Progress Ribbon (`lg:col-span-7`)**:
     - 31 clickable day pills (`01`..`31` in `JetBrains Mono`).
     - Status color coding:
       - **Closed / Completed**: `#10B981` emerald badge
       - **Logged (Open)**: `#8B5CF6` violet badge
       - **Today**: Electric Violet active ring + indicator dot
       - **Tomorrow (Planned)**: `#F59E0B` amber dashed border
       - **Upcoming**: `#181C28` muted surface
     - Clicking any day `1..31` activates the **Sprint History Day Inspector** (with a `"Return to Today"` banner).
  2. **Circular Completion Ring & Telemetry (`lg:col-span-2`)**:
     - SVG circular progress ring displaying `overallCompletionRate%`, `Days Logged`, and `Current Streak`.
  3. **"Close Today" Gatekeeper Card (`lg:col-span-3`)**:
     - Live readiness bar: `${tomorrowPlannedCount} / 8 Pillars Planned for Tomorrow`.
     - **"Close Today & Lock Tomorrow"** button: Unlocks (`#10B981`) once all 8 core pillars are planned for tomorrow (or on Day 31), calling `PATCH /api/days/:id { isClosed: true }`.
- **Unified 8-Pillar Matrix (Zero Modal Fatigue)**:
  - Each of the 8 Core Pillars renders as a structured 3-zone row:
    - **Zone 1 — Pillar Identity**: Distinct Lucide icon, pillar title, and concise subtitle.
    - **Zone 2 — Today's Execution (or Inspected Day)**:
      - One-click completion checkbox (`PATCH /api/actions/:id { isCompleted }`).
      - Inline click-to-edit description (`Enter` to save, `Escape` to cancel) and delete button (`DELETE /api/actions/:id`).
      - If no goal is set for today yet (and `!todayLog.isClosed`), displays an inline `+ Set today's goal...` input (`POST /api/actions` with `targetDate: 'today'`).
    - **Zone 3 — Tomorrow's Proactive Plan**:
      - Inline quick-input (`+ Plan tomorrow's action...` + `Enter` to save via `POST /api/actions` with `targetDate: 'tomorrow'`).
      - When planned, displays the tomorrow goal with an Amber/Emerald readiness badge, inline click-to-edit, and delete action.

### Screen 4 — Analytics & Pillar Balance Dashboard (`/analytics`, `AnalyticsDashboard.tsx`)
- **Row 1 — 4 Live KPI Cards**:
  1. *Overall Completion Rate* (`overallCompletionRate%`)
  2. *Actions Completed* (`completedActions / totalActions`)
  3. *Sprint Progress & Streak* (`Day X / 31`, `currentStreak` days)
  4. *Tomorrow Readiness* (`tomorrowPlannedCount / 8 Pillars`)
- **Row 2 — Recharts Visualizations**:
  - **8-Pillar Balance Radar / Bar Chart**: Compares `completionRate%` across all 8 Core Pillars (*Learning, Physical Health, Nutrition, Mindfulness, Work / Focus, Finance, Organization, Rest*).
  - **31-Day Consistency Trend Chart**: Plots daily `Planned` vs. `Completed` actions across the 31-day sprint (`dailySeries`).
- **Row 3 — 8-Pillar Breakdown Table & Recent Activity Feed**:
  - Tabular breakdown of each pillar's `plannedCount`, `completedCount`, `skippedCount`, `currentStreak`, and `completionRate%`, paired with a live feed of recent habit actions.
