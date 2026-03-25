# Error Handling Routes — Design Spec

**Date:** 2026-03-25
**Feature:** #8 — Error Handling Routes
**Status:** Approved

## Overview

Add Next.js error boundaries, a custom 404 page, and page-specific loading skeletons across all routes. The app currently has zero error handling files — any crash or bad URL shows the default unstyled Next.js error page.

## Scope

- Root-level error boundary (`error.tsx`)
- Root-level layout error fallback (`global-error.tsx`)
- Custom 404 page (`not-found.tsx`)
- Per-route loading skeletons (5 files)
- **Not in scope:** API route error changes, Suspense boundary refactoring

## Files

| File | Purpose |
|------|---------|
| `app/error.tsx` | Client error boundary — catches unhandled errors in any route |
| `app/global-error.tsx` | Root layout error fallback — catches errors in layout.tsx itself |
| `app/not-found.tsx` | Custom 404 page |
| `app/loading.tsx` | Landing page (`/`) loading skeleton |
| `app/chat/loading.tsx` | AI Builder loading skeleton |
| `app/playground/loading.tsx` | Visual Editor loading skeleton |
| `app/integrations/loading.tsx` | Integrations Marketplace loading skeleton |
| `app/triggers/loading.tsx` | Triggers page loading skeleton |

**Total: 8 new files**

## Styling Convention

All error pages and loading skeletons use **inline `style={{ }}` with hardcoded hex values**, consistent with the rest of the app (e.g., `style={{ background: '#0f1117' }}`). Tailwind utility classes are used only for layout (`flex`, `animate-pulse`, `rounded-lg`, etc.), not for colors.

## Error Pages

### `app/error.tsx`

- `'use client'` directive (required by Next.js)
- Receives `error` and `reset` props from Next.js
- Dark themed: `#0f1117` background
- Warning icon with gold accent (`#FFBE07`)
- Shows error message in development, generic "Something went wrong" in production
- Two actions: **"Try Again"** (calls `reset()`) and **"Go Home"** (navigates to `/`)
- Centered layout with max-width container
- Note: `reset()` re-renders the component tree but does not clear Zustand store state. If the error originated from corrupt store data, the error may re-throw. This is an acceptable limitation for v1.

### `app/global-error.tsx`

- `'use client'` directive
- Must include own `<html>` and `<body>` tags (layout is broken when this renders)
- **All styles must use hardcoded hex values** (e.g., `#0f1117`, `#FFBE07`) — CSS custom properties (`var(--bg-primary)`) will NOT be available since `globals.css` is not loaded when this component renders
- Same visual treatment as `error.tsx`
- Rare but critical safety net

### `app/not-found.tsx`

- Server Component (no `'use client'` needed)
- Large "404" text with gold accent (`#FFBE07`)
- Message: "This page doesn't exist"
- Single CTA: `<Link href="/">Back to Control Tower</Link>` (uses `next/link`, not `useRouter`)
- Dark theme, matches app aesthetic

## Loading Skeletons

All skeletons are Server Components. They use `animate-pulse` for the pulsing effect with inline `style={{ background: '#1a1d27' }}` for skeleton blocks on a `#0f1117` background.

**Note on existing `dynamic()` loaders:** The `/chat` and `/playground` pages already use `dynamic(() => import(...), { loading: ... })` for their canvas components. The route-level `loading.tsx` skeletons show during initial page navigation (before JS loads). The inline `dynamic()` loaders activate after hydration when the heavy canvas component is code-split. These are complementary, not conflicting — the skeleton appears first, then the page renders with the inline loader for the canvas portion.

### `app/loading.tsx` (Landing `/`)

- Nav bar: logo placeholder (left) + 3 nav link placeholders (right)
- Hero section: large heading block + subtitle block + 2 CTA button placeholders
- Feature cards: 3-column grid of card-shaped rectangles

### `app/chat/loading.tsx` (AI Builder)

- Split pane layout
- Left panel (~40%): 3 suggestion card placeholders + chat input skeleton at bottom
- Right panel (~60%): canvas placeholder with subtle grid-dot pattern background (matching the React Flow canvas aesthetic)

### `app/playground/loading.tsx` (Visual Editor)

- Top toolbar bar (fixed height ~48px, with placeholder icon circles)
- Left sidebar (~240px width, with 4-5 pill-shaped row placeholders)
- Center canvas area (large block with grid-dot pattern)
- Bottom panel bar (collapsed, ~36px height)

### `app/integrations/loading.tsx` (Marketplace)

- Nav bar + search bar skeleton
- Stats row: 4 small stat boxes in a row
- Content: 3x3 grid of integration card placeholders (rounded rectangles)

### `app/triggers/loading.tsx` (Triggers)

- Nav bar skeleton
- Stats row: 3 stat boxes
- Filter tabs: row of pill placeholders
- List: 4-5 trigger row placeholders (full-width rounded rectangles)

## Design Tokens (Reference)

Hex values used across all files:

| Color | Hex | Usage |
|-------|-----|-------|
| Background | #0f1117 | Page background |
| Card | #1a1d27 | Skeleton block fill |
| Elevated | #22252f | Skeleton block variant |
| Border | #2a2d3a | Subtle borders |
| Brand/Gold | #FFBE07 | Accent on error pages |
| Text primary | #f0f0f5 | Headings, body text |
| Text secondary | #9ca3af | Subtext |
| Text muted | #6b7280 | Placeholder text |

## Testing

- Navigate to `/nonexistent-path` — should show custom 404 with dark theme and gold accent
- Throw an error in any page component — should show error boundary with "Try Again" and "Go Home"
- Temporarily throw inside `layout.tsx` — should show `global-error.tsx` with its own `<html>/<body>` wrapper (restore after testing)
- Verify each route shows its skeleton during initial load (throttle network to "Slow 3G" in DevTools)
- Verify `reset()` on error boundary re-renders the page (works for transient errors; store corruption may re-throw)
