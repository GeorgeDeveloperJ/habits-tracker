# Exploration Report — `explorer_m3_2` (Milestone M3 / `UI-02a` Integrity Violation Investigation)

## 1. Executive Summary

- **Root Cause of `auditor_m3_2` Integrity Violation**: `frontend/src/components/ui/button.tsx:37` contains `// eslint-disable-next-line react-refresh/only-export-components` to suppress the ESLint error triggered by exporting the non-component helper function `buttonVariants` (`L38`) alongside the `Button` React component (`L55`).
- **Repo-wide Suppression & `.tsx` Export Scan**:
  - `frontend/src/components/ui/button.tsx:37` is the **only** lint or type suppression (`eslint-disable`, `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`) across all of `frontend/src/` and `backend/src/`.
  - `buttonVariants` (`frontend/src/components/ui/button.tsx:38`) is the **only** non-component runtime export in any `.tsx` file across all of `frontend/src/`.
  - `buttonVariants` is only imported in one file: `frontend/src/components/auth/ForgotPassword.tsx:16` (used at `L121` and `L132`).
- **Clean Fix Strategy (Strictly Within M3's 18-File Ownership)**:
  - Keep `buttonVariants` module-private (remove `export` and remove line 37's `// eslint-disable-next-line ...`) inside `frontend/src/components/ui/button.tsx`.
  - Export a `ButtonLink` React component (`React.forwardRef<HTMLAnchorElement, ButtonLinkProps>`) wrapping `react-router-dom`'s `Link` from `frontend/src/components/ui/button.tsx`.
  - Update `frontend/src/components/auth/ForgotPassword.tsx` to use `<ButtonLink>` instead of `<Link className={buttonVariants(...)}>`.

---

## 2. ESLint & `react-refresh/only-export-components` Analysis

- **Config**: `frontend/eslint.config.js:16` extends `reactRefresh.configs.vite` (`eslint-plugin-react-refresh@^0.5.2`), which configures:
  ```json
  "react-refresh/only-export-components": ["error", { "allowConstantExport": true }]
  ```
- **Rule Behavior**:
  - Any `.tsx` module exporting React components must export **only** React components (plus erased TypeScript types/interfaces and simple constant expressions allowed by `allowConstantExport: true`).
  - Exporting a lowercase helper function like `export function buttonVariants(...)` triggers `namedExport` (*"Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components."*).
  - PascalCase `React.forwardRef` components (`Button`, `ButtonLink`, `Card`, `Input`, `Table`, `Avatar`) are recognized as React components by `eslint-plugin-react-refresh` and pass with zero warnings/errors.
- **Scope Constraint**:
  - `.agents/teamwork/sub_orch_m3/SCOPE.md` defines an exclusive 18-file ownership list for M3 (which includes `frontend/src/components/ui/button.tsx` and `frontend/src/components/auth/ForgotPassword.tsx`, and does **not** include creating a new `buttonVariants.ts` file).
  - Therefore, making `buttonVariants` internal to `button.tsx` and exporting `ButtonLink` keeps changes strictly within M3's owned files without introducing any new files or modifying any excluded M4/M2 files.

---

## 3. Codebase-Wide Verification Findings

### 3.1 Lint / Type Suppressions (`frontend/src/` & `backend/src/`)
Command run: `grep -rn "eslint-disable\|@ts-ignore\|@ts-expect-error\|@ts-nocheck" frontend/src/ backend/src/`
- **1 match total**: `frontend/src/components/ui/button.tsx:37:// eslint-disable-next-line react-refresh/only-export-components`
- **0 matches** in any other file.

### 3.2 All `.tsx` Exports in `frontend/src/`
Command run: `grep -rn "\bexport\b" frontend/src/ --include="*.tsx"`
- **All `.tsx` files except `button.tsx`** export exclusively React components and TypeScript `interface`/`type` declarations:
  - `App.tsx`: `App`
  - `AppLayout.tsx`: `AppLayout`
  - `StartSprintScreen.tsx`: `StartSprintScreen`
  - `HabitCard.tsx`, `HabitGrid.tsx`, `PlanningModal.tsx`, `Tracker.tsx`, `AnalyticsDashboard.tsx`: default component exports
  - `Login.tsx`: `AuthShowcasePanel`, `AuthThemeToggleBar`, `Login` (all React components)
  - `Register.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx`, `ProtectedRoute.tsx`: default component exports
  - `ui/avatar.tsx`, `ui/card.tsx`, `ui/input.tsx`, `ui/table.tsx`: `React.forwardRef` components + TypeScript types
  - `charts/HardwareViz.tsx`: 5 `React.FC` components + TypeScript interfaces
  - `context/HabitContext.tsx`: `HabitProvider` (`HabitContext` and `useHabits` are already isolated in `context/useHabits.ts`)
- **`ui/button.tsx`**: `ButtonProps` (interface), `buttonVariants` (non-component function — **violation source**), `Button` (`React.forwardRef` component).

### 3.3 `Button` & `Link` Usages Across M3 Files
- `ForgotPassword.tsx`:
  - Line 16: `import { Button, buttonVariants } from '../ui/button';`
  - Lines 119–125: `<Link to={...} className={buttonVariants({ variant: 'lime', size: 'lg', className: 'w-full' })}>`
  - Lines 130–135: `<Link to="/reset-password" className={buttonVariants({ variant: 'outline', className: 'w-full' })}>`
  - Lines 205–217: Plain text/pill `<Link>` links (`Back to Sign In`, `Have a token?`) — keep as `<Link>`.
  - Line 182: `<Button id="forgot-submit-btn" type="submit" ...>` — keep as `<Button>`.
- `Login.tsx`, `Register.tsx`, `ResetPassword.tsx`, `AppLayout.tsx`, `StartSprintScreen.tsx`:
  - None import `buttonVariants` and none nest `<Button>` inside `<Link>`.
- M4-owned files (`Tracker.tsx`, `HabitGrid.tsx`, `PlanningModal.tsx`, `AnalyticsDashboard.tsx`):
  - Only import `{ Button } from '.../ui/button'` (not touched by M3; 100% backwards-compatible).

---

## 4. Concrete Fix Specification (For `worker_m3_3`)

### File 1: `frontend/src/components/ui/button.tsx`
1. Import `Link` and `type LinkProps` from `'react-router-dom'`.
2. Delete line 37 (`// eslint-disable-next-line react-refresh/only-export-components`).
3. Change `export function buttonVariants(` (line 38) to `function buttonVariants(` so it remains an unexported internal helper.
4. Keep `ButtonProps` and `Button` exports completely unchanged for full M4 backwards compatibility.
5. Add and export `ButtonLinkProps` and `ButtonLink`:
   ```tsx
   export interface ButtonLinkProps extends LinkProps {
     variant?: keyof typeof buttonVariantClasses;
     size?: keyof typeof buttonSizeClasses;
   }

   export const ButtonLink = React.forwardRef<HTMLAnchorElement, ButtonLinkProps>(
     ({ className, variant = 'default', size = 'default', ...props }, ref) => {
       return (
         <Link
           ref={ref}
           className={buttonVariants({ variant, size, className })}
           {...props}
         />
       );
     }
   );
   ButtonLink.displayName = 'ButtonLink';
   ```
   - Zero `shadow-*` classes, zero `eslint-disable` / `@ts-*` suppressions, and clean `React.forwardRef<HTMLAnchorElement, ButtonLinkProps>` typing matching `react-router-dom` v7 `Link`.

### File 2: `frontend/src/components/auth/ForgotPassword.tsx`
1. Line 16: Change `import { Button, buttonVariants } from '../ui/button';` to:
   ```tsx
   import { Button, ButtonLink } from '../ui/button';
   ```
2. Lines 119–125: Replace `<Link ... className={buttonVariants({ variant: 'lime', size: 'lg', className: 'w-full' })}>` with:
   ```tsx
   <ButtonLink
     to={`/reset-password?token=${encodeURIComponent(result.resetToken)}`}
     variant="lime"
     size="lg"
     className="w-full"
   >
     Continue to Reset Password
     <ArrowRight className="h-4 w-4" />
   </ButtonLink>
   ```
3. Lines 130–135: Replace `<Link ... className={buttonVariants({ variant: 'outline', className: 'w-full' })}>` with:
   ```tsx
   <ButtonLink
     to="/reset-password"
     variant="outline"
     className="w-full"
   >
     Enter reset token manually
   </ButtonLink>
   ```

### Post-Fix Verification Commands
```bash
grep -rnE "eslint-disable|@ts-ignore|@ts-expect-error|@ts-nocheck" frontend/src/ backend/src/
npm --prefix /home/antigravity/GeorgeDeveloperJ/habits-tracker/frontend run lint
npm --prefix /home/antigravity/GeorgeDeveloperJ/habits-tracker/frontend run build
```
Expected result: `grep` returns 0 matches; `npm run lint` passes with 0 errors/warnings; `npm run build` (`tsc -b && vite build`) exits 0.
