# Phase 1A Audit Plan for YatraSeva

## Goal Description

Perform a comprehensive audit and discovery of the YatraSeva ride‑hailing monorepo. The audit will cover project structure, rider and driver mobile apps, shared packages, dependencies, design system primitives, UI/UX consistency, production/security concerns, configuration, and error/warning checks. No code changes will be made in this phase.

## User Review Required

- **Scope Confirmation**: Is the current scope (full audit of all listed items) acceptable, or should any sections be omitted or expanded?
- **Depth Preference**: Do you want a high‑level summary or detailed line‑by‑line findings for each file?
- **Sensitive Data Handling**: Confirm that any discovered secrets should be reported only by file/path and variable name (no values).

## Proposed Changes

The audit will be performed by reading files and extracting information. No modifications will be made.

### [PROJECT STRUCTURE]
- List top‑level directories (`apps`, `packages`, etc.).
- Identify sub‑folders for rider‑mobile, driver‑mobile, API, shared packages.
- Record workspace configuration from `package.json` and `turbo.json`.

### [RIDER APP]
- Read `package.json`, `app.json`, `tsconfig.json`.
- Enumerate screens (`_layout.tsx`, `index.tsx`, `history.tsx`, `safety.tsx`).
- Scan `app` folder for components, hooks, services.
- Capture Expo SDK, React, React‑Native versions, navigation setup.
- List environment variables used.
- Record Android config (package name, permissions, adaptive icon).
- Identify existing styling (colors, spacing, components).

### [DRIVER APP]
- Perform the same steps as Rider for `driver-mobile`.
- Note any differences in dependencies, Expo Router version, permissions.

### [DEPENDENCY AUDIT]
- Parse root `package.json` and each app’s `package.json`.
- Detect duplicate Expo packages, version mismatches (e.g., `expo-router` differs).
- Check React/React‑Native version alignment across apps.
- Identify peer‑dependency conflicts, missing or unnecessary deps.
- Verify workspace lockfile consistency (`package-lock.json`).

### [COMMON DESIGN SYSTEM AUDIT]
- Search shared packages for design tokens (colors, typography, spacing, radius).
- Scan both apps for reusable UI components (Button, Input, Card, etc.).
- Record any duplicated implementations.

### [UI/UX BASELINE AUDIT]
- Review component style objects for inconsistent values (colors, spacing, font sizes).
- Identify missing states (loading, error, empty, disabled).
- Check touch target sizes and safe‑area handling.
- Note accessibility concerns (missing `accessibilityLabel`, low contrast).
- Flag Android‑specific layout issues (e.g., status bar handling).

### [PRODUCTION / SECURITY AUDIT]
- Grep for hard‑coded URLs (`localhost`, IPs), API keys, OTPs, mock credentials.
- Search for debug `console.log` statements.
- Locate TODOs or temporary bypass flags.
- Record file/path and variable name only.

### [CONFIGURATION AUDIT]
- Verify `app.json` fields: `slug`, `scheme`, `version`, `android.package`, `ios.bundleIdentifier`.
- Compare Rider vs Driver configurations for inconsistencies.
- Check environment files (`.env`, `.env.example`).
- Review CORS settings in API if present.

### [ERROR / WARNING AUDIT]
- Run read‑only lint/report commands (`npm run lint --silent` if safe) or inspect lint config.
- Scan for TypeScript errors via `tsc --noEmit` output.
- Document any obvious compile/runtime warnings.

### [DESIGN SYSTEM PROPOSAL]
- Based on findings, draft a token structure (colors, typography, spacing, radius, shadows, component variants).
- No implementation will be performed now.

## Open Questions

- Do you want the audit to include a **full list of every file** in each app, or only those relevant to UI and configuration?
- Should we also inspect the **backend API** (`apps/api`) for security/config issues, or limit to mobile apps?
- Are there any **specific secret patterns** (e.g., `API_KEY=`) you want us to prioritize?

## Verification Plan

### Automated Checks
- Use `grep_search` to locate hard‑coded secrets and duplicate dependencies.
- Use `list_dir` and `view_file` to collect file listings.
- Run `npm run type-check` in a read‑only mode to capture TypeScript errors.

### Manual Verification
- Summarize findings in the final audit report.
- Provide screenshots of any UI inconsistencies if needed (using `generate_image`).

*All steps are read‑only; no files will be modified.*
