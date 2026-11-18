# Worker Dispatch — `worker_m3_3` (Remove `eslint-disable` via `ButtonLink` Component)

## Mandatory First Reads
1. `/home/antigravity/GeorgeDeveloperJ/habits-tracker/.agents/teamwork/ORIGINAL_REQUEST.md`
2. `/home/antigravity/GeorgeDeveloperJ/habits-tracker/.agents/teamwork/sub_orch_m3/SCOPE.md`
3. `/home/antigravity/GeorgeDeveloperJ/habits-tracker/.agents/teamwork/explorer_m3_2/handoff.md`
4. `/home/antigravity/GeorgeDeveloperJ/habits-tracker/.agents/teamwork/auditor_m3_2/handoff.md`

## Mandatory Integrity Warning
> DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Exclusive Files to Edit
- `frontend/src/components/ui/button.tsx`
- `frontend/src/components/auth/ForgotPassword.tsx`

## Exact Fix Instructions
1. **`frontend/src/components/ui/button.tsx`**:
   - Delete `// eslint-disable-next-line react-refresh/only-export-components` (line 37) — ZERO `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, or `@ts-nocheck` comments may remain anywhere.
   - Make `buttonVariants` module-private (`function buttonVariants(...)`, NOT exported).
   - Keep `ButtonProps` and `Button` 100% compatible with all existing M3 and M4 usages.
   - Export `ButtonLinkProps` (`LinkProps & { variant?: ButtonVariant; size?: ButtonSize }`) and `ButtonLink` (`React.forwardRef<HTMLAnchorElement, ButtonLinkProps>`) wrapping `Link` from `'react-router-dom'` using `buttonVariants({ variant, size, className })`, with `ButtonLink.displayName = 'ButtonLink'`.
2. **`frontend/src/components/auth/ForgotPassword.tsx`**:
   - Import `{ Button, ButtonLink }` from `'../ui/button'` (remove direct `Link` import if no longer used elsewhere in `ForgotPassword.tsx`, or keep only if needed).
   - Replace the two `<Link className={buttonVariants(...)}>` elements (`L119–125` and `L130–135`) with `<ButtonLink variant="lime" size="lg" className="w-full">` and `<ButtonLink variant="outline" className="w-full">` (preserving exact `to` targets and labels).

## Verification Before Reporting
Run:
```bash
npm --prefix /home/antigravity/GeorgeDeveloperJ/habits-tracker/frontend run lint && npm --prefix /home/antigravity/GeorgeDeveloperJ/habits-tracker/frontend run build
```
Confirm `grep -rnE "eslint-disable|@ts-ignore|@ts-expect-error|@ts-nocheck|shadow-|drop-shadow" frontend/src/components/ui/button.tsx frontend/src/components/auth/ForgotPassword.tsx` returns no matches.
Write `/home/antigravity/GeorgeDeveloperJ/habits-tracker/.agents/teamwork/worker_m3_3/progress.md` and `/home/antigravity/GeorgeDeveloperJ/habits-tracker/.agents/teamwork/worker_m3_3/handoff.md`, and report via `send_message` (`57d6af351858b37e2a02ddb1ad7aa418`).
