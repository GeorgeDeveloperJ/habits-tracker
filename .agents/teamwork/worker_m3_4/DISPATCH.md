# Worker Dispatch — `worker_m3_4` (Iteration 3 `HardwareViz.tsx` Fix)

## Mandatory First Reads
1. `/home/antigravity/GeorgeDeveloperJ/habits-tracker/.agents/teamwork/ORIGINAL_REQUEST.md`
2. `/home/antigravity/GeorgeDeveloperJ/habits-tracker/.agents/teamwork/sub_orch_m3/SCOPE.md`
3. `/home/antigravity/GeorgeDeveloperJ/habits-tracker/.agents/teamwork/challenger_m3_5/handoff.md`

## Mandatory Integrity Warning
> DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Exclusive File to Edit
- `frontend/src/components/charts/HardwareViz.tsx`

## Required Fixes
1. **`DotMatrixRibbon` (`HardwareViz.tsx:476–544`)**:
   - Sanitize `d.dayNumber`: `const safeDayNumber = Number.isFinite(d.dayNumber) ? Math.max(1, Math.floor(d.dayNumber)) : idx + 1;`.
   - Use `safeDayNumber` for display (`String(safeDayNumber).padStart(2, '0')`), `title` (`Day ${safeDayNumber}...`), `onSelectDay?.(safeDayNumber)`, and unique React `key={`${safeDayNumber}-${idx}`}` so `NaN`, `Infinity`, `-Infinity`, or negative/non-finite values never emit `"NaN"`, `"Infinity"`, `"-Infinity"`, or duplicate React keys.
2. **`ConcentricRing` (`HardwareViz.tsx:425`)**:
   - Update `sublabel` color class to respect `variant`:
     - `variant === 'contrast'`: `'text-[#F4F4F2]/75 dark:text-[#F7F5FF]/75'`
     - `variant === 'accent'`: `'text-[#121212]/75 dark:text-[#0D0914]/75'`
     - `variant === 'default'`: `'text-[var(--text-muted)]'`
3. Zero `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, or `shadow-*` classes.

## Verification Before Reporting
Run:
```bash
npm --prefix /home/antigravity/GeorgeDeveloperJ/habits-tracker/frontend run lint && npm --prefix /home/antigravity/GeorgeDeveloperJ/habits-tracker/frontend run build
```
Write `/home/antigravity/GeorgeDeveloperJ/habits-tracker/.agents/teamwork/worker_m3_4/progress.md` and `/home/antigravity/GeorgeDeveloperJ/habits-tracker/.agents/teamwork/worker_m3_4/handoff.md`, and report via `send_message` (`57d6af351858b37e2a02ddb1ad7aa418`).
