<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# SansOS Workspace Development Guidelines

This document provides strict instructions and constraints for any future bug fixes, feature additions, or codebase refactoring.

## 1. Routing & Security
*   **No `src/middleware.ts`:** Do NOT create a `src/middleware.ts` file. In this workspace architecture, Next.js routing and authentication guards must reside exclusively in [proxy.ts](file:///home/ahmadsanny02/Workspace/02_coding/web/fullstack/projects/sans-os/src/proxy.ts) to prevent compilation crash loops.

## 2. UI & Design System Consistency (Pixel-Perfect)
*   **Glassmorphic Design Tokens:** Card wrappers and widgets must use standard responsive design classes:
    *   Container: `bg-card/45 dark:bg-card/15 border border-border shadow-sm rounded-2xl backdrop-blur-md`
    *   Borders: `border border-border/60`
    *   Border-Radius: `rounded-2xl` for containers, `rounded-xl` for interactive elements (inputs, select menus, badges, buttons).
*   **Color Tokens Over Hardcoding:** Never hardcode color utility classes like `focus:border-violet-500` or `bg-violet-600`. Use theme variables like `focus:border-primary focus:ring-2 focus:ring-primary/10`, `bg-primary`, and `text-primary-foreground` to respect dark/light mode configurations.
*   **SweetAlert Unification:** All alert popups (confirmation dialogs, warning alerts, toast notifications) must inherit from the global classes in [globals.css](file:///home/ahmadsanny02/Workspace/02_coding/web/fullstack/projects/sans-os/src/app/globals.css). Do not use `!important` display layout modifiers (e.g. `!inline-flex`, `!hidden`) in SweetAlert CSS classes, as this breaks the library's JavaScript-driven button toggling.

## 3. Architecture & Data Flow
*   **State & Cache Isolation:** Never use `useEffect` for data fetching. Data queries, invalidations, and optimistic state updates must route exclusively through custom React Query hooks (residing in `src/hooks/`).
*   **Time & Date Synchronization:** Ensure all local date calculations, active views, and timezone boundary rules are managed globally through the Zustand workspace store, supporting a periodic 10-second check for midnight rollover.

## 4. Feature & Language Logic Guards
*   **Habit Casing:** When filtering or comparing habit completion status, always perform case-insensitive matching (`status.toLowerCase() === "completed"`) to align the frontend state with PostgreSQL defaults.
*   **Grammar Verb Conjugation Doubling Rule:** Verb conjugation in [verbs.ts](file:///home/ahmadsanny02/Workspace/02_coding/web/fullstack/projects/sans-os/src/lib/verbs.ts) must check syllable stress boundaries via the `shouldDoubleConsonant` helper to bypass unstressed syllable doubling (e.g., `visit` -> `visited`/`visiting`, `listen` -> `listened`/`listening`).

