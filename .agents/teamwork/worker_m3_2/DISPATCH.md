# Worker Dispatch — `worker_m3_2` (Fix Iteration 1 Gate Failures)

## Mandatory First Reads
1. `/home/antigravity/GeorgeDeveloperJ/habits-tracker/.agents/teamwork/ORIGINAL_REQUEST.md`
2. `/home/antigravity/GeorgeDeveloperJ/habits-tracker/PROJECT.md`
3. `/home/antigravity/GeorgeDeveloperJ/habits-tracker/.agents/teamwork/sub_orch_m3/SCOPE.md`
4. `/home/antigravity/GeorgeDeveloperJ/habits-tracker/.agents/teamwork/sub_orch_m3/GATE_STATUS.md`
5. `/home/antigravity/GeorgeDeveloperJ/habits-tracker/.agents/teamwork/challenger_m3_1/handoff.md`
6. `/home/antigravity/GeorgeDeveloperJ/habits-tracker/.agents/teamwork/challenger_m3_2/handoff.md`

## Mandatory Integrity Warning
> DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Exclusive File Ownership
Only edit the M3-owned files needed to resolve the Iteration 1 findings (strictly within `SCOPE.md`):
- `frontend/src/components/charts/HardwareViz.tsx`
- `frontend/src/components/ui/card.tsx`
- `frontend/src/components/ui/button.tsx` (only if exporting `buttonVariants` helper alongside `Button`)
- `frontend/src/components/auth/ForgotPassword.tsx`

## Required Fixes
1. **`frontend/src/components/charts/HardwareViz.tsx`**:
   - **`SegmentedBattery`**: Normalize `total` and `filled` with `Number.isFinite(...)` (`safeTotal = Number.isFinite(total) ? Math.max(1, Math.floor(total)) : 1`, `safeFilled = Number.isFinite(filled) ? Math.max(0, Math.min(safeTotal, Math.floor(filled))) : 0`) so `NaN` never appears in rendered text or `aria-valuenow`/`aria-valuemax`.
   - **`CapsuleBarChart`**: Normalize `item.value` (`Number.isFinite(item.value) ? Math.max(0, item.value) : 0`) and `item.max` (`typeof item.max === 'number' && Number.isFinite(item.max) && item.max > 0 ? item.max : 100`) so `NaN` never produces `height:NaN%` or `NaN` telemetry text. Add `'hatched'` (renders `.bg-hatch` empty/hatched track without indicator dot) and `'muted'` (renders muted translucent capsule fill) to `CapsuleBarDatum['state']` and `getFillClass`.
   - **`ConcentricRing`**: Normalize `percentage` (`Number.isFinite(percentage) ? percentage : 0`), `secondaryPercentage` (`typeof secondaryPercentage === 'number' && Number.isFinite(secondaryPercentage)`), and `size`/`strokeWidth` (`outerRadius > 0`) so `NaN` never triggers React's `Received NaN for the strokeDashoffset attribute` warning or renders `NaN%`.
2. **`frontend/src/components/ui/card.tsx`**:
   - Fix `CardTitle` (`L53`): remove hardcoded `text-[var(--text-primary)]` so it inherits `Card`'s contrast-aware foreground color (`text-[var(--text-primary)]` on `default`/`sand`, `text-[var(--text-contrast)]` on `contrast`, `text-[#121212] dark:text-[#0D0914]` on `accent`/`emerald`).
   - Fix `CardDescription` (`L67`): replace hardcoded `text-[var(--text-secondary)]` with `opacity-75` (inheriting `Card`'s foreground color) so descriptions remain high-contrast on `contrast`, `accent`, and `emerald` cards as well as `default`/`sand`.
3. **`frontend/src/components/auth/ForgotPassword.tsx`** (and optional `buttonVariants` in `button.tsx`):
   - Validate email format client-side (`!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)`) before calling `requestPasswordReset(trimmed)` so invalid non-empty emails fail fast with `role="alert"`.
   - Remove `<Button>` nested inside `<Link>` (`<a><button>`) by styling the `<Link>` directly (e.g. using an exported `buttonVariants` helper from `ui/button.tsx`).
   - Render the dev `resetToken` readout as a clean borderless `<code>` or `rounded-full` pill rather than a nested `rounded-[16px]` card-box inside two outer cards.
   - Ensure ZERO `shadow-*` or `drop-shadow` classes anywhere.

## Verification Before Reporting
Run:
```bash
npm --prefix /home/antigravity/GeorgeDeveloperJ/habits-tracker/frontend run lint && npm --prefix /home/antigravity/GeorgeDeveloperJ/habits-tracker/frontend run build
```
Write your report to `/home/antigravity/GeorgeDeveloperJ/habits-tracker/.agents/teamwork/worker_m3_2/handoff.md` and report back via `send_message` (`57d6af351858b37e2a02ddb1ad7aa418`).
