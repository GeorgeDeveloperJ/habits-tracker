# Adversarial Challenge Report — `challenger_m3_3` (M3 `UI-02a`, Iteration 2)

**Overall Verdict:** `PASS`

All three adversarial probe suites passed with **0** `NaN`, **0** `Infinity`, **0** React `console.error`/`console.warn` messages, **0** contrast-override regressions in `card.tsx`, and **0** `shadow-*`/`drop-shadow`/`box-shadow` occurrences across all M3 files. All isolated probe scripts and temporary Vite build outputs were executed inside `mktemp -d` and removed via `trap 'rm -rf "$TMP"' EXIT`.

---

## 1. Probe 1: `HardwareViz.tsx` SSR & `NaN`/`Infinity`/Edge-Case Probe — `PASS` (32/32)

Rendered all 5 components from `frontend/src/components/charts/HardwareViz.tsx` via `ReactDOMServer.renderToStaticMarkup` while intercepting `console.error` and `console.warn`.

### 1.1 `SegmentedBattery` (8/8 PASS)
- `filled=NaN, total=8` -> `threw=null`, `NaN=false`, `Infinity=false`, `logs=0` (renders `00 / 08`, `aria-valuenow="0"`, `aria-valuemax="8"`).
- `filled=0, total=NaN` -> `threw=null`, `NaN=false`, `Infinity=false`, `logs=0` (clamped `safeTotal=1`, `00 / 01`).
- `filled=NaN, total=NaN` -> `threw=null`, `NaN=false`, `Infinity=false`, `logs=0`.
- `filled=Infinity, total=8` -> `threw=null`, `NaN=false`, `Infinity=false`, `logs=0` (clamped `00 / 08`).
- `filled=-Infinity, total=Infinity` -> `threw=null`, `NaN=false`, `Infinity=false`, `logs=0`.
- `filled=0, total=0` -> `threw=null`, `NaN=false`, `Infinity=false`, `logs=0`.
- `filled=12, total=8` -> `threw=null`, `NaN=false`, `Infinity=false`, `logs=0` (clamped to `08 / 08`).
- `filled=-5, total=-2` -> `threw=null`, `NaN=false`, `Infinity=false`, `logs=0`.

### 1.2 `CapsuleBarChart` (9/9 PASS)
- `data=[]` -> `threw=null`, `NaN=false`, `Infinity=false`, `logs=0`.
- `value=NaN, max=100` -> `threw=null`, `NaN=false`, `Infinity=false`, `logs=0` (`safeValue=0`, renders hatched full-height track `height:100%`).
- `value=50, max=NaN` -> `threw=null`, `NaN=false`, `Infinity=false`, `logs=0` (`safeMax=100`).
- `value=50, max=0` -> `threw=null`, `NaN=false`, `Infinity=false`, `logs=0` (`safeMax=100`).
- `value=Infinity, max=Infinity` -> `threw=null`, `NaN=false`, `Infinity=false`, `logs=0`.
- `value=-Infinity, max=-5` -> `threw=null`, `NaN=false`, `Infinity=false`, `logs=0`.
- `height=NaN` & `height=Infinity` -> `threw=null`, `NaN=false`, `Infinity=false`, `logs=0` (falls back to `safeChartHeight=196`).
- `state` variants (`hatched`, `muted`, `empty`, `projected`, `closed`) -> all render expected classes (`bg-hatch`, `text-[var(--text-secondary)]`, `bg-[#5CE68A]`) with `logs=0`.

### 1.3 `ConcentricRing` (12/12 PASS)
- `percentage=NaN`, `percentage=Infinity`, `percentage=-Infinity` -> `threw=null`, `NaN=false`, `Infinity=false`, `logs=0` (centerpiece `0%`, finite `stroke-dasharray` / `stroke-dashoffset`).
- `percentage=80, secondaryPercentage=NaN` & `secondaryPercentage=Infinity` -> `hasInner` is `false` (`Number.isFinite` guard), `NaN=false`, `Infinity=false`, `logs=0`.
- `size=NaN, strokeWidth=NaN` & `size=Infinity, strokeWidth=Infinity` -> falls back to `safeSize=116, safeStroke=10`, `NaN=false`, `Infinity=false`, `logs=0`.
- `size=10, strokeWidth=20` -> `effectiveStroke=3`, `outerRadius=2`, `stroke-dasharray="12.566370614359172"`, `stroke-dashoffset="6.283185307179586"`, inner ring omitted (`innerRadius <= 12`), `logs=0`.
- `0%`, `100%`, `-5%`, `150%` -> clamped to `0%`–`100%`, `NaN=false`, `Infinity=false`, `logs=0`.

### 1.4 `DotMatrixRibbon` & `PillarCompassDiagram` (3/3 PASS)
- `DotMatrixRibbon` with 31 nodes & `NaN` active/selected index -> renders 31 `<button type="button">` nodes, `NaN=false`, `Infinity=false`, `logs=0`.
- `PillarCompassDiagram` with `activePillarIndex=NaN` & `Infinity` -> renders 8 axes + 8 `.glass-pill` overlays, `NaN=false`, `Infinity=false`, `logs=0`.

---

## 2. Probe 2: `Card` Contrast & Token Inheritance (`card.tsx`) — `PASS` (5/5)

Rendered `<Card variant="..."><CardHeader><CardTitle>Title</CardTitle><CardDescription>Desc</CardDescription></CardHeader><CardContent>Body</CardContent><CardFooter>Footer</CardFooter></Card>` for all 5 variants (`contrast`, `accent`, `emerald`, `default`, `sand`):

- `CardTitle` (`frontend/src/components/ui/card.tsx` L53): uses `text-inherit` (no hardcoded `text-[var(--text-primary)]`).
- `CardDescription` (`frontend/src/components/ui/card.tsx` L67): uses `text-inherit opacity-75` (no hardcoded `text-[var(--text-secondary)]`).
- `Card` surface/text pairs verified:
  - `contrast`: `bg-[var(--bg-contrast)] text-[var(--text-contrast)] border border-white/[0.06]`
  - `accent`: `bg-[#E6FA72] text-[#121212] border border-[#121212]/10 dark:bg-[#D96BFF] dark:text-[#0D0914] dark:border-white/10`
  - `emerald`: `bg-[#5CE68A] text-[#121212] border border-[#121212]/10 dark:bg-[#1E1730] dark:text-[#F7F5FF] dark:border-[#5CE68A]/25`
  - `default`: `bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-hairline)]`
  - `sand`: `bg-[var(--bg-sand)] text-[var(--text-primary)] border border-[var(--border-hairline)]`

---

## 3. Probe 3: Hydration Script, CSS Tokens, Zero-Shadow & Build — `PASS`

- **`frontend/index.html` pre-paint hydration script (9/9 PASS):**
  - Evaluated via Node `vm.runInNewContext` across `null`, pre-existing `.dark` + `null`, Zustand JSON (`dark`/`light`), raw `'dark'`/`'light'`, malformed JSON, throwing `localStorage.getItem`, and unexpected theme values (`'neon'`). Zero exceptions; exact `.dark` class and `data-theme` outcomes.
- **`frontend/src/index.css` tokens (15/15 PASS):**
  - `@custom-variant dark (&:where(.dark, .dark *));` present (`L2`).
  - Light/Warm tokens: `--bg-canvas: #F4F4F2`, `--bg-canvas-warm: #EAE9E4`, `--bg-card: #FFFFFF`, `--bg-sand: #EBE6DC`, `--bg-contrast: #121212`, `--accent-primary: #E6FA72`, `--accent-secondary: #5CE68A`.
  - Dark tokens: `--bg-canvas: #0D0914`, `--bg-card: #171224`, `--border-hairline: rgba(255, 255, 255, 0.06)`, `--accent-primary: #D96BFF`, `--accent-secondary: #F5B841`.
  - `.bg-hatch` and `.glass-pill` (`backdrop-filter: blur(12px)`) verified.
- **Zero-Shadow scan across all 17 M3 source files:**
  - `0` matches for `\bshadow-[a-zA-Z0-9_\[\]-]+|drop-shadow(?:-[a-zA-Z0-9_\[\]-]+)?|box-shadow`.
- **Isolated TypeScript & Vite build check (`outDir` in `mktemp -d`, cleaned up):**
  - `tsc --noEmit -p frontend/tsconfig.app.json` -> exit `0`.
  - `vite build` -> exit `0` (`index-D_HxNI_v.css` 46.13 kB, `index-fbgj3jGZ.js` 898.31 kB).
