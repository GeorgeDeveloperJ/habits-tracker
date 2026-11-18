# Milestone M4 Explorer Handoff (`explorer_m4_1`)

> Scope Reference: `.agents/teamwork/sub_orch_m4/SCOPE.md`  
> Target Design System: `DESIGN.md` (**Dual-Mode Modular Bento & Hardware Telemetry System**)  
> Build Constraints (`frontend/tsconfig.app.json` + `eslint.config.js`): `verbatimModuleSyntax: true` (must use `import type` for type-only imports), `noUnusedLocals: true`, `noUnusedParameters: true`, `erasableSyntaxOnly: true`, React 19 + `eslint-plugin-react-hooks` v7 flat recommended.

---

## 1. M3 Shared Foundation & Primitives (Exact Exports & Signatures)

### 1.1 `frontend/src/components/charts/HardwareViz.tsx`

1. **`SegmentedBattery`** (`L8-120`):
   ```ts
   export interface SegmentedBatteryProps {
     total?: number;        // default 8, clamped >= 1
     filled: number;        // clamped [0, total]
     label?: string;
     showCount?: boolean;   // default true -> renders "04 / 08"
     size?: 'sm' | 'md' | 'lg'; // default 'md'
     variant?: 'default' | 'contrast' | 'accent'; // default 'default'
     className?: string;
   }
   ```
   - `variant='contrast'`: designed for dark `#121212` / `#171224` Bento blocks; empty capsules have white diagonal hatching; filled capsules are `#E6FA72` (light) / `#D96BFF` (dark), or `#5CE68A` when `filled >= total`.
   - `variant='accent'`: designed for `#E6FA72` / `#D96BFF` accent-filled Bento blocks; filled capsules are `#121212` / `#0D0914`.
   - `variant='default'`: designed for light/dark card surfaces; empty uses `.bg-hatch-fine`.

2. **`CapsuleBarChart`** (`L125-287`):
   ```ts
   export interface CapsuleBarDatum {
     id: string | number;
     label: string;
     value: number;
     max?: number; // default 100; if omitted or 100, readout shows "%"; if custom >0 and !=100, readout shows "val/max"
     state?: 'active' | 'closed' | 'today' | 'tomorrow' | 'empty' | 'projected' | 'hatched' | 'muted';
     meta?: string; // appended to readout after " · "
   }
   export interface CapsuleBarChartProps {
     data: CapsuleBarDatum[];
     height?: number;       // default 196
     showDots?: boolean;    // default true (internal hardware indicator dot)
     onBarClick?: (id: string | number) => void;
     className?: string;
   }
   ```
   - Renders a top flat telemetry readout pill (`Telemetry Readout` / `Hover bar to inspect`) + vertical stadium-pill columns (`rounded-full`) inside dashed ghost-tracks (`border-dashed`).
   - States `'empty' | 'projected' | 'hatched'` or `value <= 0` render a full-height `.bg-hatch` capsule; `'closed'` renders `#5CE68A`; `'today'` renders `#E6FA72` (light) / `#D96BFF` (dark); `'tomorrow'` renders `#F5B841`; `'active'` renders `#5CE68A` if `ratio >= 0.75` else `#121212` / `#D96BFF`.
   - Note for 31-day series on narrow viewports: bars use `flex-1` with `gap-1.5 sm:gap-2` (`L208`). Wrapping `CapsuleBarChart` in `<div className="overflow-x-auto pb-1"><div className="min-w-[640px]">...</div></div>` ensures 31 bars (`D01`..`D31` or `01`..`31`) never crush on mobile.

3. **`ConcentricRing`** (`L292-447`):
   ```ts
   export interface ConcentricRingProps {
     percentage: number;            // 0..100 outer ring
     secondaryPercentage?: number;  // optional inner #F5B841 ring (only rendered when innerRadius > 12)
     size?: number;                 // default 116
     strokeWidth?: number;          // default 10
     label?: string;
     sublabel?: string;
     variant?: 'default' | 'accent' | 'contrast'; // default 'default'
     className?: string;
   }
   ```

4. **`DotMatrixRibbon`** (`L452-560`):
   ```ts
   export interface DotMatrixDay {
     dayNumber: number;
     isClosed?: boolean;
     isToday?: boolean;
     isTomorrow?: boolean;
     isLogged?: boolean;
     isSelected?: boolean;
     completionRate?: number;
   }
   export interface DotMatrixRibbonProps {
     days: DotMatrixDay[];
     onSelectDay?: (dayNumber: number) => void;
     interactive?: boolean; // default true
     compact?: boolean;     // default false
     className?: string;
   }
   ```
   - Renders stadium pill nodes (`rounded-full`, `h-10` or `h-9` when `compact`) with `01`..`31` and hardware status dot.
   - `isSelected && !isToday` adds `ring-2 ring-[#121212] dark:ring-[#F5B841]`.

5. **`PillarCompassDiagram`** (`L565-707`):
   ```ts
   export interface PillarCompassDiagramProps {
     activePillarIndex?: number; // default 0
     className?: string;
   }
   ```
   - 2D vector chassis + central `31D` core + 8 `.glass-pill` frosted overlays.

### 1.2 UI Primitives (`frontend/src/components/ui/*`)

- **`card.tsx`** (`L4-92`):
  - `Card`: `interface CardProps extends React.HTMLAttributes<HTMLDivElement> { variant?: 'default' | 'sand' | 'contrast' | 'accent' | 'emerald' }` (`rounded-[28px]`, zero drop shadows).
  - `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` (all `React.forwardRef`, zero shadows, `text-inherit` on Title/Description so `variant="contrast" | "accent" | "emerald"` works automatically).
- **`button.tsx`** (`L5-85`):
  - `ButtonProps`: `variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'emerald' | 'lime' | 'danger'`, `size?: 'default' | 'sm' | 'lg' | 'icon'`. Always `rounded-full`.
  - `ButtonLinkProps`: `LinkProps` + same `variant` and `size`.
- **`input.tsx`** (`L4-22`):
  - `InputProps = React.InputHTMLAttributes<HTMLInputElement>`. Styled `h-11 w-full rounded-full` with `--bg-canvas-warm` / `dark:bg-[#120D1D]`. (Note: pass `className="h-9 text-xs"` or `className="h-10 text-xs"` to override height for compact inline forms.)
- **`table.tsx`** (`L4-86`):
  - `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` — uses `--border-hairline`, `--bg-sand`, `.font-mono-tabular`, `--text-primary` / `--text-muted`.
- **`avatar.tsx`** (`L4-45`):
  - `Avatar`, `AvatarImage`, `AvatarFallback`.

### 1.3 Styling Tokens & Utilities (`frontend/src/index.css`)

- **Light / Warm Mode (`:root`, `L4-40`)**:
  - `--bg-canvas: #F4F4F2` (Stone), `--bg-canvas-warm: #EAE9E4` (Alabaster), `--bg-card: #FFFFFF`, `--bg-sand: #EBE6DC`, `--bg-contrast: #121212`, `--bg-recessed: #EAE9E4`
  - `--text-contrast: #F4F4F2`, `--text-contrast-muted: #9C998E`
  - `--accent-primary: #E6FA72` (Acid Lime), `--accent-primary-fg: #121212`
  - `--accent-secondary: #5CE68A` (Spring Green), `--accent-secondary-fg: #121212`
  - `--accent-amber: #D98200`, `--accent-danger: #DC2626`
  - `--border-hairline: rgba(18, 18, 18, 0.08)`, `--border-strong: rgba(18, 18, 18, 0.16)`
  - `--text-primary: #121212`, `--text-secondary: #5A5850`, `--text-muted: #8B887E`
- **Dark Mode (`.dark`, `L42-76`)**:
  - `--bg-canvas: #0D0914`, `--bg-canvas-warm: #120D1C`, `--bg-card: #171224`, `--bg-sand: #1E1730`, `--bg-contrast: #231B38`, `--bg-recessed: #120D1D`
  - `--text-contrast: #F7F5FF`, `--text-contrast-muted: #9E92BC`
  - `--accent-primary: #D96BFF` (Orchid), `--accent-primary-fg: #0D0914`
  - `--accent-secondary: #F5B841` (Warm Amber), `--accent-secondary-fg: #0D0914`
  - `--accent-emerald: #5CE68A`, `--accent-amber: #F5B841`, `--accent-danger: #F87171`
  - `--border-hairline: rgba(255, 255, 255, 0.06)`, `--border-strong: rgba(255, 255, 255, 0.14)`
  - `--text-primary: #F7F5FF`, `--text-secondary: #A99EC4`, `--text-muted: #6E628C`
- **Utility classes (`L93-125`)**:
  - `.font-mono-tabular` (`font-family: var(--font-mono); font-variant-numeric: tabular-nums`)
  - `.bg-hatch` (diagonal hatch for empty/projected capsules)
  - `.bg-hatch-fine` (finer diagonal hatch for smaller battery capsules/cells)
  - `.glass-pill` (`backdrop-filter: blur(12px)` frosted stadium pill)
- **Theme Store (`frontend/src/store/themeStore.ts`)**: `useThemeStore` (`theme: 'light' | 'dark'`, `setTheme`, `toggleTheme`).

### 1.4 `pillars.ts`, `HabitContext.tsx`, `useHabits.ts`, and `services/api.ts`

- **`frontend/src/lib/pillars.ts`** (`L13-100`):
  - `PillarMeta`: `{ name, shortName, tagline, suggestions: string[], accentColor, icon: LucideIcon }`.
  - `CORE_PILLARS: PillarMeta[]` (8 items matching seeded categories).
  - `getPillarMeta(name: string): PillarMeta` (case-insensitive match with fallback).
- **`frontend/src/context/useHabits.ts`** (`L11-49`):
  - `useHabits(): HabitContextType`:
    - State: `categories: HabitCategory[]`, `activeCycle: Cycle | null`, `cycleHistory: CycleHistoryItem[]`, `progress: CycleProgressResponse | null`, `todayLog: DailyLog | null`, `tomorrowLog: DailyLog | null`, `selectedDayNumber: number | null`, `selectedDayLog: DailyLog | null`, `loading: boolean`, `error: string | null`.
    - Actions: `setSelectedDayNumber(day: number | null)`, `refreshCycle()`, `refreshProgress()`, `refreshAll()`, `startSprint(initialGoals?)`, `saveGoal(categoryId, description, targetDate = 'tomorrow', logId?)`, `editGoal(actionId, { description?, isCompleted? })`, `removeGoal(actionId)`, `closeToday(forceClose = false)`.
- **`frontend/src/services/api.ts`** (`L53-118`, `237-260`):
  - `CycleProgressResponse`:
    - `stats: CycleStats` (`cycleId`, `startDate`, `endDate`, `isActive`, `currentDayNumber`, `totalDays`, `daysLogged`, `closedDays`, `totalActions`, `completedActions`, `skippedActions`, `overallCompletionRate`, `currentStreak`, `bestStreak`, `todayPlannedCount`, `todayCompletedCount`, `tomorrowPlannedCount`, `canCloseToday`)
    - `logs: DailyLog[]`
    - `todayLog: DailyLog | null`
    - `tomorrowLog: DailyLog | null`
    - `pillarStats: PillarStat[]` (`categoryId`, `categoryName`, `description`, `plannedCount`, `completedCount`, `skippedCount`, `completionRate`, `currentStreak`)
    - `dailySeries: DailySeriesPoint[]` (`dayNumber`, `date`, `logId`, `isClosed`, `isToday`, `isTomorrow`, `planned`, `completed`, `skipped`, `completionRate`)
    - `recentActivity: RecentActivityItem[]` (`id`, `type: 'completed' | 'planned'`, `description`, `categoryId`, `categoryName`, `isCompleted`, `logId`, `date`, `timestamp`)
  - `fetchCycleProgress(cycleId = 'current'): Promise<CycleProgressResponse | null>`.

### 1.5 Surrounding Chrome (`AppLayout.tsx`, `L50-310`)

- `<main className="flex-1 p-3 sm:p-6 lg:p-8"><div className="mx-auto max-w-7xl"><Outlet /></div></main>`.
- `AppLayout` already renders the floating matte vertical pill dock (`#121212` / `#171224`) and recessed top pill bar with `#theme-toggle-btn`, `SPRINT DAY XX / 31`, and user session pill. M4 pages render directly inside `max-w-7xl` with `space-y-4` (matching `StartSprintScreen.tsx`).

---

## 2. M4 Target Files Inventory (DOM IDs, Flows, Violations & Edge Cases)

### 2.1 `recharts` & `shadow-*` Violations Found
Verified via `rg -n "shadow-|recharts" frontend/src`:
1. `frontend/src/pages/AnalyticsDashboard.tsx:19` — imports `recharts` (`AreaChart`, `BarChart`, `RadarChart`, etc.). Must be **completely removed** and replaced with `HardwareViz.tsx` (`CapsuleBarChart`, `SegmentedBattery`, `ConcentricRing`).
2. `frontend/src/components/HabitGrid.tsx:279` — `shadow-lg` on Day 31 Completion Celebration Banner. Must be **removed**.
3. `frontend/src/components/PlanningModal.tsx:50` — `shadow-2xl` on modal dialog container. Must be **removed**.
4. Hardcoded legacy dark-only hexes (`#11131C`, `#1E2330`, `#171A26`, `#12151E`, `#7C3AED`, `#090A0F`, `#F8FAFC`) appear throughout `Tracker.tsx`, `HabitGrid.tsx`, `HabitCard.tsx`, `PlanningModal.tsx`, and `AnalyticsDashboard.tsx` — all must be migrated to dual-mode CSS vars + Light/Dark DESIGN.md tokens.

### 2.2 `frontend/src/pages/Tracker.tsx` (`L1-41`)
- Renders loading spinner (`L10-17`), error Bento state with `Retry Connection` calling `refreshAll` (`L19-33`), `<StartSprintScreen />` when `!activeCycle` (`L35-37`), or `<HabitGrid />` (`L39`).
- Legacy colors (`#8B5CF6`, `#94A3B8`, `#11131C`, `#1E2330`, `#EF4444`, `#F8FAFC`, `rounded-2xl`) need dual-mode Bento update (`rounded-[32px]`, `var(--bg-card)`, `var(--border-hairline)`, `#121212` / `#D96BFF`, `border-[#DC2626]/30`).

### 2.3 `frontend/src/components/HabitGrid.tsx` (`L1-841`)
- **Preserved DOM IDs (CRITICAL)**:
  - `#close-today-btn` (`L495`) — Close Today & Lock Tomorrow button (`disabled={!canCloseToday || isClosingDay}`).
  - `#today-input-${category.id}` (`L700`) — Inline form input for setting Today's goal when `todayAction` is absent and `canMutateDisplayedDay` is true.
  - `#tomorrow-input-${category.id}` (`L807`) — Inline form input for planning Tomorrow's goal when `tomorrowAction` is absent and `currentDayNumber < 31`.
- **Preserved interactive flows & edge cases**:
  1. `isInspectingHistory`: `selectedDayNumber !== null && selectedDayNumber !== currentDayNumber`. Shows History Inspector banner (`L523-548`) with `Return to Today (Day XX)` button (`setSelectedDayNumber(null)`), disables `canMutateDisplayedDay`, and shows `Day XX Execution (Read-Only)` in Zone 2 (`L558`, `L609`).
  2. **Day 31 Completion & Rollover (`L68-69`, `L278-323`, `L736-740`)**: When `currentDayNumber >= 31 && todayLog?.isClosed`, displays Day 31 completion banner with `Start Next 31-Day Sprint` button (`handleStartNextSprint` -> `startSprint()`). When `currentDayNumber >= 31`, Zone 3 displays `"Final Sprint Day — ready to complete!"` instead of tomorrow input (`L736-740`), and Close Day gatekeeper shows `"Final Day 31 ready to close"` (`L472-473`).
  3. **Inline Create (`handleSaveInline`, `L105-132`)**: `todayDrafts` / `tomorrowDrafts` per `categoryId`; `saveGoal(categoryId, text, targetDate)`; toast feedback via `role="status"` banner (`L250-275`).
  4. **Inline Edit (`beginEdit`, `commitEdit`, `L147-173`)**: Click description text or `<Pencil>` button -> `<input autoFocus>` supporting `Enter` to save, `Escape` to cancel, `onBlur` to commit. Note: in Light/Warm mode, ensure inline `<input>` uses `rounded-full` (or clean pill border) and dual-mode `--bg-card` / `--text-primary` tokens.
  5. **Toggle Completion (`handleToggle`, `L134-145`)**: Only enabled when `canMutateDisplayedDay` (`!isInspectingHistory && Boolean(todayLog) && !todayLog?.isClosed`).
  6. **Delete Goal (`handleDelete`, `L175-186`)**: Available on editable Today goals and Tomorrow goals.
  7. **Suggested quick-fill chips**: Can optionally surface `getPillarMeta(category.name).suggestions` or keep rows crisp & uncluttered (consider compact `+ suggestion` chips on empty Tomorrow/Today inputs or via `HabitCard` / `PlanningModal` if helpful, keeping `#today-input-${category.id}` and `#tomorrow-input-${category.id}` always directly rendered and accessible!).
  8. **Bento Header (`L325-520`)**:
     - Currently uses hand-rolled `ribbonDays` (`L351-396`), hand-rolled SVG ring (`L400-443`), and flat progress bar in Close Today card (`L446-519`).
     - Replace with `DotMatrixRibbon`, `ConcentricRing`, and high-contrast `SegmentedBattery` (`variant="contrast"` inside `#121212` / `#171224` Bento card)!

### 2.4 `frontend/src/components/HabitCard.tsx` (`L1-50`)
- Currently unused anywhere in `frontend/src` (`rg` confirmed only self-references).
- Props: `{ name, description, icon?, badge?, onClick?, className? }`.
- Rebuild as a clean dual-mode Bento primitive (`rounded-[24px]`, `border-[var(--border-hairline)]`, `bg-[var(--bg-card)]`, stadium icon pill, zero drop shadows) keeping the exported default component & props compatible (plus optional `children` / `accent` if desired).

### 2.5 `frontend/src/components/PlanningModal.tsx` (`L1-109`)
- Currently unused externally, exports `PlanningModal` with `{ category, targetDate?: 'today' | 'tomorrow', onClose, onSuccess }` and DOM ID `#modal-goal-textarea` (`L73`).
- Remove `shadow-2xl` (`L50`). Rebuild with `rounded-[32px]` flat Bento card, `border-[var(--border-hairline)]`, `bg-[var(--bg-card)]`, backdrop scrim `bg-black/45 dark:bg-[#0D0914]/75 backdrop-blur-sm`, stadium pill category badge + pillar suggestion chips from `getPillarMeta(category.name)`, dual-mode textarea (`rounded-[20px]`), and stadium pill `Button` actions.

### 2.6 `frontend/src/pages/AnalyticsDashboard.tsx` (`L1-565`)
- **All `recharts` imports (`L3-19`) and charts (`L328-441`) MUST be removed.**
- **Existing live wiring & edge cases to preserve**:
  1. `selectedCycleId` (`'current'` or historical `cycle.id`) via `<select aria-label="Select sprint cycle">` (`L166-179`).
  2. Loading state (`loading || loadingCycle`), empty state when `!displayedProgress && cycleHistory.length === 0 && !activeCycle` (`L94-112`) with link to `/` (`Go to Sprint Launchpad`).
  3. **React Hooks v7 lint hazard (`L56-60`)**: Currently `loadSelected` calls `setHistoricalProgress(null)` before any `await`. Cleaner pattern with zero lint risk:
     - Store `historicalData: { cycleId: string; data: CycleProgressResponse | null } | null` and only call `setState` inside async `.then` / after `await` (or in an effect that guards `selectedCycleId === 'current'` by returning early and computing `displayedProgress = selectedCycleId === 'current' ? currentProgress : (historicalData?.cycleId === selectedCycleId ? historicalData.data : null)`). Also track `loadingCycle` via `historicalData?.cycleId !== selectedCycleId && selectedCycleId !== 'current'` or `setLoadingCycle` in async resolution so there is no synchronous `setState` at the top of `useEffect`!
  4. **Data visualizations to build using `HardwareViz.tsx`**:
     - **Asymmetrical Hero KPI Cluster**:
       - Hero Accent Card (`Card variant="accent"` — `#E6FA72` light / `#D96BFF` dark): `48px` `font-mono-tabular` `overallCompletionRate%` + `ConcentricRing` (`variant="accent"`, `percentage={overallRate}`, `secondaryPercentage={todayRate}`) + closed days count.
       - Contrast Readiness Card (`Card variant="contrast"` — `#121212` light / `#171224` dark): `tomorrowPlannedCount / 8` + `SegmentedBattery` (`total={8}`, `filled={tomorrowPlannedCount}`, `variant="contrast"`, `size="md"`).
       - Actions Completed Card (`Card variant="default"`): `completedActions / totalActions` + `skippedActions` pending/skipped.
       - Sprint & Streak Card (`Card variant="sand"`): `Day XX / 31` + `currentStreak` & `bestStreak` with flame indicator.
     - **31-Day Consistency Trend (`CapsuleBarChart`)**:
       - Build all 31 days (`1..31`) combining `dailySeries` + projected empty slots (`state: 'projected'`, `value: 0`).
       - Wrap in `overflow-x-auto` (`min-w-[640px]`) so all 31 stadium capsule bars with dashed ghost-tracks, dots, and diagonal hatches render cleanly at any viewport width.
       - Include a small stadium legend (Closed `#5CE68A`, Today `#E6FA72`/`#D96BFF`, Tomorrow `#F5B841`, Projected Hatched).
     - **8-Pillar Balance (`CapsuleBarChart` + Segmented Matrix Toggle)**:
       - View toggle stadium pill (`Capsules` | `Matrix`) replacing `Radar | Bar`.
       - `Capsules` view: `CapsuleBarChart` with 8 `CapsuleBarDatum` items (`label: meta.shortName`, `value: p.completionRate`, `max: 100`, `state: p.plannedCount === 0 ? 'hatched' : p.completionRate >= 75 ? 'closed' : 'active'`, `meta: '${p.completedCount}/${p.plannedCount} · ${p.currentStreak}d'`).
       - `Matrix` view: 8 compact rows each showing pillar icon, name, `completionRate%`, and `<SegmentedBattery total={Math.max(1, stats?.daysLogged ?? 8)} ... />` or `<SegmentedBattery total={8} filled={Math.round((p.completionRate / 100) * 8)} size="sm" showCount={false} />`.
     - **8-Pillar Breakdown Table (`ui/table.tsx`)** + **Recent Activity Feed** (`rounded-[24px]` flat cards with dual-mode tokens).

### 2.7 `TEST_READY.md` & `backend/tests/e2e.test.ts` Breakdown
Verified from `backend/tests/e2e.test.ts`:
- **Total E2E tests**: **52 / 52** (up from 40):
  - **Tier 1 (Happy-Path)**: **20** tests — Auth & Habits (5), Forgot & Reset Password (5), Cycles & Progress (5), Daily Logs & Actions (5).
  - **Tier 2 (Validation, Boundary & Negative)**: **20** tests — Auth & JWT Security (5), Forgot & Reset Password Validation & Anti-Enumeration (5), Cycles & Progress Boundaries (5), Days & Actions Validation & Gatekeeper (5).
  - **Tier 3 (Pairwise Cross-Feature Interactions)**: **5** tests (`T3-PAIR-01`..`T3-PAIR-05`, adding Password Reset × Multi-Tenancy & Data Retention).
  - **Tier 4 (Real-World E2E Scenarios)**: **7** tests (`T4-SCEN-01`..`T4-SCEN-07`, adding Locked-Out User Password Recovery & Sprint Continuation).

---

## 3. Concrete File-by-File M4 Blueprint

1. **`frontend/src/pages/Tracker.tsx`**:
   - Dual-mode loading Bento card (`bg-[var(--bg-card)] border border-[var(--border-hairline)] rounded-[32px]`) + dual-mode error Bento card with stadium-pill `Button` calling `refreshAll`. Zero `shadow-*`.
2. **`frontend/src/components/HabitGrid.tsx`**:
   - Editorial `h1` (`text-4xl sm:text-[44px] font-semibold tracking-[-0.03em] leading-[1.06]`) with inline stadium-pill icon badge (matching `StartSprintScreen.tsx` / `Login.tsx`) + `DAY XX / 31` telemetry pill + Sprint started date pill.
   - Zero-shadow `role="status"` toast banner (`rounded-full` / `rounded-[20px]`) and Day 31 completion celebration Bento card (`Card variant="emerald"` or `#5CE68A` accent banner, **remove `shadow-lg`**).
   - **Asymmetrical 12-Col Bento Header (`gap-4`)**:
     - `lg:col-span-6` (`rounded-[28px] border border-[var(--border-hairline)] bg-[var(--bg-card)] p-6`): `DotMatrixRibbon` (`days` mapped from `1..31` with `isClosed`, `isToday`, `isTomorrow`, `isLogged`, `isSelected`, calling `setSelectedDayNumber(day === currentDayNumber ? null : day)`), plus legend pills.
     - `lg:col-span-2` (`rounded-[28px] border border-[var(--border-hairline)] bg-[var(--bg-sand)] p-5`): `ConcentricRing` (`percentage={overallRate}`, `secondaryPercentage={todayCompletionRate}`, `size={104}`, `sublabel="CYCLE"`) + `Logged` & `Streak` tabular readouts.
     - `lg:col-span-4` (`rounded-[28px] bg-[#121212] text-[#F4F4F2] dark:border dark:border-white/[0.06] dark:bg-[#171224] dark:text-[#F7F5FF] p-6`): Close Day Gatekeeper with `SegmentedBattery` (`total={totalPillars}`, `filled={tomorrowPlannedCount}`, `variant="contrast"`, `size="md"`) and stadium-pill `#close-today-btn` (`Button variant={canCloseToday ? 'lime' : 'secondary'}` or `'emerald'`).
   - **History Inspector Banner**: Flat `rounded-[24px]` Bento strip when `isInspectingHistory`, with stadium-pill `Return to Today` button.
   - **Unified 8-Pillar Bento Matrix**:
     - `rounded-[32px] border border-[var(--border-hairline)] bg-[var(--bg-card)] overflow-hidden`.
     - Dual-mode desktop header (`bg-[var(--bg-sand)]/60`, `font-mono-tabular text-[10px] uppercase tracking-[0.14em]`).
     - Each row (`divide-y divide-[var(--border-hairline)]`):
       - Zone 1 (Pillar Identity): Stadium-pill icon container + Pillar name & tagline.
       - Zone 2 (Today's Execution): Completed toggle button (`rounded-full`), inline edit `<input>` (dual-mode pill styling), edit/delete icon buttons, or `<form>` with `<Input id={`today-input-${category.id}`} ... />` + submit `Button`, or hatched/dashed locked state (`bg-hatch-fine`).
       - Zone 3 (Tomorrow's Proactive Plan): Day 31 notice if `currentDayNumber >= 31`, planned pill with `#F5B841` / `#D98200` dot + inline edit/delete + `PLANNED` badge, or `<form>` with `<Input id={`tomorrow-input-${category.id}`} ... />` + submit `Button`.
3. **`frontend/src/components/HabitCard.tsx`**:
   - Rebuild as `rounded-[24px]` dual-mode Bento card (`bg-[var(--bg-card)] border-[var(--border-hairline)] hover:border-[var(--border-strong)]`), stadium-pill icon & badge, zero shadows.
4. **`frontend/src/components/PlanningModal.tsx`**:
   - Rebuild as flat `rounded-[32px]` Bento modal (`bg-[var(--bg-card)] border-[var(--border-hairline)]`, **zero `shadow-2xl`**), dual-mode textarea, clickable suggestion chips from `getPillarMeta(category.name).suggestions`, preserve `#modal-goal-textarea` and `PlanningModalProps`.
5. **`frontend/src/pages/AnalyticsDashboard.tsx`**:
   - Remove all `recharts` imports and components.
   - Editorial `h1` with inline stadium-pill icon badge + date range pill + `<select>` cycle selector (`rounded-full`).
   - Asymmetrical Bento KPI Row (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`):
     - `Card variant="accent"` (Overall Completion + `ConcentricRing variant="accent" size={84}`)
     - `Card variant="default"` (Actions Completed)
     - `Card variant="sand"` (Sprint & Streak)
     - `Card variant="contrast"` (Tomorrow Readiness + `SegmentedBattery variant="contrast"`)
   - Hardware Telemetry Row (`lg:grid-cols-12 gap-4`):
     - `lg:col-span-5` (`Card variant="default"`): 8-Pillar Balance (`CapsuleBarChart` vs `Matrix` SegmentedBattery toggle using stadium pills).
     - `lg:col-span-7` (`Card variant="default"`): 31-Day Consistency Trend (`CapsuleBarChart` wrapped in `overflow-x-auto` with `min-w-[640px]` showing all 31 days with dashed ghost tracks & hatched projected days).
   - Breakdown & Activity Row (`lg:grid-cols-12 gap-4`):
     - `lg:col-span-8` (`Card variant="default"`): `Table` with dual-mode tokens & stadium-pill completion badges.
     - `lg:col-span-4` (`Card variant="default"`): Recent Activity stream (`rounded-[20px]` items with `bg-[var(--bg-sand)]/50` and stadium icon pills).
6. **`TEST_READY.md`**:
   - Update after verification runs to reflect `52 / 52` backend E2E tests (Tier 1: 20, Tier 2: 20, Tier 3: 5, Tier 4: 7), M2/M3/M4 verification results (backend typecheck/build/test + frontend lint/build), and zero `recharts`/`shadow-*` usage in M4 screens.
