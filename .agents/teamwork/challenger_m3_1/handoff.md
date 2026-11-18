# Adversarial Challenge Report — `challenger_m3_1` (M3 `UI-02a`)

**Overall Verdict:** `FAIL`

Probe 1 (Pre-paint Theme Hydration) and Probe 3 (CSS Tokens, Zero-Shadow, Bento Radii, TypeScript & Vite/Tailwind v4 CSS compilation) **PASS**. Probe 2 (`HardwareViz.tsx` Geometric & Math Edge Cases) **FAILS** on `NaN` safety in `ConcentricRing` (explicitly required), `SegmentedBattery`, and `CapsuleBarChart`, plus a contrast-override defect discovered in `frontend/src/components/ui/card.tsx`.

---

## 1. Pre-paint Theme Hydration Script (`frontend/index.html`) — `PASS`

Extracted the inline `<script>` (`frontend/index.html` L15–L37) and evaluated it in Node `vm.runInNewContext` against mocked `localStorage` (`'proactive31-theme'`) and `document.documentElement` (`classList.toggle`, `classList.remove`, `dataset`):

| Case | `localStorage` Value | Pre-existing `.dark` | Threw? | Final `.dark` | `dataset.theme` | Result |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Default (`null`) | `null` | `false` | `false` | `false` | `'light'` | `PASS` |
| Default (`null`, pre-dark) | `null` | `true` | `false` | `false` | `'light'` | `PASS` |
| Zustand dark JSON | `'{"state":{"theme":"dark"}}'` | `false` | `false` | `true` | `'dark'` | `PASS` |
| Zustand light JSON | `'{"state":{"theme":"light"}}'` | `true` | `false` | `false` | `'light'` | `PASS` |
| Raw string `'dark'` | `'dark'` | `false` | `false` | `true` | `'dark'` | `PASS` |
| Raw string `'light'` | `'light'` | `true` | `false` | `false` | `'light'` | `PASS` |
| Invalid JSON `'broken{'` | `'broken{'` | `true` | `false` | `false` | `'light'` | `PASS` |
| Storage throws `SecurityError` | throws | `true` | `false` | `false` | `'light'` | `PASS` |
| Unexpected theme value | `'{"state":{"theme":"neon"}}'` | `true` | `false` | `false` | `'light'` | `PASS` |

---

## 2. `HardwareViz.tsx` Geometric & Math Edge Cases — `FAIL`

Compiled `frontend/src/components/charts/HardwareViz.tsx` (with `lib/utils.ts` and `lib/pillars.ts`) in an isolated temp directory and rendered every component via `ReactDOMServer.renderToStaticMarkup`.

### Failures (Blocking)

1. **`ConcentricRing` (`frontend/src/components/charts/HardwareViz.tsx` L278–L290) fails `NaN` safety:**
   - **Code:**
     ```ts
     const clamped = Math.max(0, Math.min(100, Math.round(percentage)));
     ...
     const hasInner = typeof secondaryPercentage === 'number';
     const clampedInner = hasInner
       ? Math.max(0, Math.min(100, Math.round(secondaryPercentage)))
       : 0;
     ```
   - **Reproduction Output:**
     - `ConcentricRing({ percentage: Number.NaN })`:
       - React runtime error/warning: `Received NaN for the strokeDashoffset attribute. If this is expected, cast the value to a string.`
       - Rendered HTML: centerpiece text `"NaN%"`, `stroke-dasharray="301.59289474462014"`, `stroke-dashoffset="NaN"`.
     - `ConcentricRing({ percentage: 80, secondaryPercentage: Number.NaN })`:
       - `typeof NaN === 'number'` is `true`, so inner ring renders `stroke-dashoffset="NaN"`.
   - **Fix:** Normalize with `Number.isFinite(percentage) ? percentage : 0` and guard `hasInner = typeof secondaryPercentage === 'number' && Number.isFinite(secondaryPercentage)` (also clamp `size` / `strokeWidth` so `outerRadius > 0`).

2. **`SegmentedBattery` (`frontend/src/components/charts/HardwareViz.tsx` L27–L28) fails `NaN` safety:**
   - **Reproduction Output:**
     - `SegmentedBattery({ filled: Number.NaN, total: 8 })` -> renders count `"NaN / 08"` and `aria-valuenow="NaN"`.
     - `SegmentedBattery({ filled: 0, total: Number.NaN })` -> renders `"NaN / NaN"`, `aria-valuenow="NaN"`, `aria-valuemax="NaN"`, and `0` capsules.
   - **Fix:** Guard `safeTotal = Number.isFinite(total) ? Math.max(1, Math.floor(total)) : 1` and `safeFilled = Number.isFinite(filled) ? Math.floor(filled) : 0`.

3. **`CapsuleBarChart` (`frontend/src/components/charts/HardwareViz.tsx` L187–L190) fails `NaN` safety on `value` (and state alias check):**
   - **Reproduction Output:**
     - `CapsuleBarChart({ data: [{ id: 7, label: 'D07', value: Number.NaN, max: 100, state: 'active' }] })` -> `item.value <= 0` is `false`, `ratio` is `NaN`, renders `style="height:NaN%"`.
     - Note on `'hatched'` / `'muted'` statuses: `CapsuleBarDatum['state']` (`L126`) defines `'active' | 'closed' | 'today' | 'tomorrow' | 'empty' | 'projected'`, where `'empty'` and `'projected'` render `.bg-hatch`. Passing `'hatched'` or `'muted'` falls through to the solid fill branch (`bg-[#121212]...`) instead of hatched/muted styling.
   - **Fix:** Guard `const safeValue = Number.isFinite(item.value) ? item.value : 0;` and `const safeMax = Number.isFinite(item.max) && (item.max ?? 0) > 0 ? item.max! : 100;` (and optionally support `'hatched' | 'muted'` aliases in `CapsuleBarDatum['state']` & `getFillClass` if callers expect those names).

### Passing Edge Cases in `HardwareViz.tsx`

- `SegmentedBattery`:
  - `filled=0, total=8` -> `count="00 / 08"`, `aria=0/8`, no `NaN`.
  - `filled=8, total=8` -> `count="08 / 08"`, `aria=8/8`, `8` filled capsules.
  - `filled=12, total=8` -> clamped to `count="08 / 08"`, `aria=8/8`, `8` capsules.
  - `total=0, filled=0` -> clamped `total` to `1`, renders `count="00 / 01"`, `aria=0/1`, `0` filled capsules (no crash/`NaN`; note `/ 01` display if `total=0` is ever passed).
  - `filled=-3, total=8` -> clamped to `count="00 / 08"`, `aria=0/8`.
- `CapsuleBarChart`:
  - `data=[]` -> renders cleanly without error (`heights=["196px"]`).
  - `value=0, max=0` -> falls back `max` to `100`, renders `height:100%` with `border-dashed` ghost track and `bg-hatch`, no `NaN`/`Infinity`.
  - `value=150, max=100` -> clamped `ratio=1`, renders `height:100%` with internal indicator dot (`h-1.5 w-1.5 rounded-full`) and `border-dashed` ghost track.
  - `state='empty'` & `state='projected'` -> both render `bg-hatch` + `border-dashed` ghost track without indicator dot.
  - `state='closed'`, `showDots=true` -> renders `height:80%`, `border-dashed` ghost track, and internal dot `h-1.5 w-1.5 rounded-full`.
- `ConcentricRing` (finite inputs):
  - `0%` -> `text="0%"`, `dashoffset=["301.59289474462014"]` (`=== circumference`).
  - `100%` -> `text="100%"`, `dashoffset=["0"]`.
  - `-5%` -> clamped to `text="0%"`, `dashoffset=["301.59289474462014"]`.
  - `150%` -> clamped to `text="100%"`, `dashoffset=["0"]`.
  - Dual `75% / 120%` -> `text="75%"`, `dasharray=["301.59289474462014","207.34511513692635"]`, `dashoffset=["75.39822368615503","0"]`.
  - Small `size=40, strokeWidth=10` -> `innerRadius = -5` guarded by `innerRadius > 12`, renders single valid ring (`dasharray=["62.83185307179586"]`, `dashoffset=["31.41592653589793"]`).
- `DotMatrixRibbon`:
  - 31 days (`closed`, `logged`, `today`, `tomorrow`, `upcoming`) -> renders 31 `<button type="button">` elements.
  - `onSelectDay` callback invoked on node click (`clickedDay=15`).
  - Responsive wrapping classes: `"grid gap-1.5 grid-cols-8 sm:grid-cols-11 lg:grid-cols-16"`, zero `min-w-[...]` overflow classes.
  - Confirmed Tailwind v4 emits `grid-template-columns:repeat(16,minmax(0,1fr))` in the compiled Vite CSS bundle.
- `PillarCompassDiagram`:
  - Renders 8 SVG radial lines/nodes + 8 `.glass-pill` overlays with valid percentage coordinates and zero `NaN`/`Infinity` across `activePillarIndex` in `[0, 4, 7, -1, 99, NaN]`.

---

## 3. Additional Component Contract Finding (`card.tsx`)

- **`CardTitle` / `CardDescription` contrast bug (`frontend/src/components/ui/card.tsx` L50–L70):**
  - `Card` `variant="contrast"` sets `bg-[var(--bg-contrast)] text-[var(--text-contrast)]` (`#121212` bg / `#F4F4F2` text in Light mode), and `variant="accent"` sets `dark:bg-[#D96BFF] dark:text-[#0D0914]`.
  - However, `CardTitle` (`L53`) hardcodes `text-[var(--text-primary)]` (`#121212` in Light mode, `#F7F5FF` in Dark mode) and `CardDescription` (`L67`) hardcodes `text-[var(--text-secondary)]`.
  - Using `<Card variant="contrast"><CardHeader><CardTitle>...</CardTitle></CardHeader></Card>` in Light mode produces `#121212` text on a `#121212` background (unreadable).
  - **Fix:** Remove `text-[var(--text-primary)]` from `CardTitle` (let it inherit `text-current` from `Card`) or use `opacity-75` for `CardDescription` when inside contrast/accent variants.

---

## 4. CSS Token, Zero-Shadow, & Build Probe — `PASS`

- **`frontend/src/index.css` token verification:**
  - `@custom-variant dark (&:where(.dark, .dark *));` -> `PASS`
  - Light/Warm tokens: `#F4F4F2` (`--bg-canvas`), `#EAE9E4` (`--bg-canvas-warm`), `#FFFFFF` (`--bg-card`), `#EBE6DC` (`--bg-sand`), `#121212` (`--bg-contrast`), `#E6FA72` (`--accent-primary`), `#5CE68A` (`--accent-secondary`) -> `PASS`
  - Dark tokens: `#0D0914` (`--bg-canvas`), `#171224` (`--bg-card`), `rgba(255, 255, 255, 0.06)` (`--border-hairline`), `#D96BFF` (`--accent-primary`), `#F5B841` (`--accent-secondary`) -> `PASS`
  - `.bg-hatch` and `.glass-pill` (`backdrop-filter: blur(12px)`) -> `PASS`
- **Zero-Shadow & Bento Radius scan across all 17 M3 source files:**
  - `shadow-*` / `drop-shadow` regex hits: `0` -> `PASS`
  - `box-shadow` hits: `0` -> `PASS`
  - `24px–32px` Bento radii (`rounded-[24px]`, `rounded-[28px]`, `rounded-[32px]`) verified in `card.tsx`, `HardwareViz.tsx`, `AppLayout.tsx`, `Login.tsx`, `Register.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx`, and `StartSprintScreen.tsx` -> `PASS`
- **TypeScript & Vite CSS Bundle Check (isolated `outDir` in `/tmp`, cleaned up):**
  - `tsc --noEmit -p tsconfig.app.json` -> exit `0`
  - `vite build --outDir $TMPDIR/dist` -> exit `0`; verified CSS bundle contains `grid-template-columns:repeat(16`, `.bg-hatch`, `.glass-pill`, `backdrop-filter:blur(12px)`, and `:where(.dark,.dark *)`.
