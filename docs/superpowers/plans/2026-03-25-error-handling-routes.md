# Error Handling Routes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add error boundaries, a custom 404 page, and page-specific loading skeletons to all routes in the Control Tower workflow builder.

**Architecture:** Next.js App Router error handling files at root and per-route level. Error pages are `'use client'` components (Next.js requirement). Loading skeletons and 404 are Server Components. All styling uses inline `style={{}}` with hardcoded hex values, consistent with the rest of the app.

**Tech Stack:** Next.js 14 App Router, React 18, Tailwind CSS (layout utilities only)

**Spec:** `docs/superpowers/specs/2026-03-25-error-handling-routes-design.md`

**Task Independence:** Tasks 1–8 are fully independent — they each create a single file in a different directory. They can be executed in any order or in parallel. Task 9 depends on all prior tasks being complete.

**Build Strategy:** Use `npx tsc --noEmit` for intermediate type-checks (fast). Run `npx next build` only once at Task 9 for final verification.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/app/error.tsx` | Create | Client error boundary for all routes |
| `src/app/global-error.tsx` | Create | Root layout error fallback with own `<html>/<body>` |
| `src/app/not-found.tsx` | Create | Custom 404 page |
| `src/app/loading.tsx` | Create | Landing page skeleton |
| `src/app/chat/loading.tsx` | Create | AI Builder skeleton |
| `src/app/playground/loading.tsx` | Create | Visual Editor skeleton |
| `src/app/integrations/loading.tsx` | Create | Integrations Marketplace skeleton |
| `src/app/triggers/loading.tsx` | Create | Triggers page skeleton |
| `docs/PRODUCT-CONTEXT.md` | Modify | Update Feature #8 status to Shipped |

---

### Task 1: Root Error Boundary (`error.tsx`)

**Files:**
- Create: `src/app/error.tsx`

- [ ] **Step 1: Create `src/app/error.tsx`**

```tsx
'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error boundary caught:', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f1117',
        padding: '24px',
      }}
    >
      <div style={{ maxWidth: '420px', textAlign: 'center' }}>
        {/* Warning icon */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'rgba(255, 190, 7, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFBE07"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <h1
          style={{
            fontSize: '20px',
            fontWeight: 600,
            color: '#f0f0f5',
            margin: '0 0 8px',
          }}
        >
          Something went wrong
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: '0 0 32px',
            lineHeight: '1.5',
          }}
        >
          {process.env.NODE_ENV === 'development'
            ? error.message
            : 'An unexpected error occurred. Please try again.'}
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={reset}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 500,
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              background: '#FFBE07',
              color: '#000',
            }}
          >
            Try Again
          </button>
          <a
            href="/"
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 500,
              borderRadius: '8px',
              border: '1px solid #2a2d3a',
              background: 'transparent',
              color: '#9ca3af',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add src/app/error.tsx
git commit -m "feat: add root error boundary with branded error UI"
```

---

### Task 2: Global Error Fallback (`global-error.tsx`)

**Files:**
- Create: `src/app/global-error.tsx`

- [ ] **Step 1: Create `src/app/global-error.tsx`**

Important: This file MUST use hardcoded hex values everywhere — no CSS variables, no Tailwind classes for colors. CSS imports are not available when this renders.

```tsx
'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error boundary caught:', error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f1117',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '24px',
        }}
      >
        <div style={{ maxWidth: '420px', textAlign: 'center' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'rgba(255, 190, 7, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FFBE07"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#f0f0f5', margin: '0 0 8px' }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 32px', lineHeight: '1.5' }}>
            A critical error occurred. Please try refreshing the page.
          </p>

          <button
            onClick={reset}
            style={{
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: 500,
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              background: '#FFBE07',
              color: '#000',
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add src/app/global-error.tsx
git commit -m "feat: add global error fallback for root layout crashes"
```

---

### Task 3: Custom 404 Page (`not-found.tsx`)

**Files:**
- Create: `src/app/not-found.tsx`

- [ ] **Step 1: Create `src/app/not-found.tsx`**

```tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f1117',
        padding: '24px',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1
          style={{
            fontSize: '96px',
            fontWeight: 700,
            color: '#FFBE07',
            margin: '0 0 8px',
            lineHeight: 1,
          }}
        >
          404
        </h1>
        <p
          style={{
            fontSize: '18px',
            color: '#f0f0f5',
            margin: '0 0 8px',
            fontWeight: 500,
          }}
        >
          This page doesn&apos;t exist
        </p>
        <p
          style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: '0 0 32px',
          }}
        >
          The page you&apos;re looking for may have been moved or removed.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 24px',
            fontSize: '14px',
            fontWeight: 500,
            borderRadius: '8px',
            background: '#FFBE07',
            color: '#000',
            textDecoration: 'none',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Control Tower
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add src/app/not-found.tsx
git commit -m "feat: add custom 404 page with branded design"
```

---

### Task 4: Landing Page Loading Skeleton (`app/loading.tsx`)

**Files:**
- Create: `src/app/loading.tsx`

The landing page has: nav bar → hero with globe canvas → feature cards grid → stats → templates section.

- [ ] **Step 1: Create `src/app/loading.tsx`**

```tsx
export default function Loading() {
  return (
    <div style={{ minHeight: '100vh', background: '#0f1117' }}>
      {/* Nav bar */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 32px',
          borderBottom: '1px solid #1a1d27',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="animate-pulse" style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#1a1d27' }} />
          <div className="animate-pulse" style={{ width: '120px', height: '16px', borderRadius: '4px', background: '#1a1d27' }} />
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          {[100, 80, 90].map((w, i) => (
            <div key={i} className="animate-pulse" style={{ width: `${w}px`, height: '14px', borderRadius: '4px', background: '#1a1d27' }} />
          ))}
        </div>
      </nav>

      {/* Hero section */}
      <div style={{ padding: '80px 32px', textAlign: 'center' }}>
        <div className="animate-pulse" style={{ width: '480px', maxWidth: '100%', height: '36px', borderRadius: '8px', background: '#1a1d27', margin: '0 auto 16px' }} />
        <div className="animate-pulse" style={{ width: '320px', maxWidth: '100%', height: '16px', borderRadius: '4px', background: '#1a1d27', margin: '0 auto 40px' }} />
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <div className="animate-pulse" style={{ width: '140px', height: '44px', borderRadius: '8px', background: '#1a1d27' }} />
          <div className="animate-pulse" style={{ width: '140px', height: '44px', borderRadius: '8px', background: '#22252f' }} />
        </div>
      </div>

      {/* Feature cards grid */}
      <div style={{ padding: '0 32px 80px', maxWidth: '1024px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse"
              style={{
                height: '180px',
                borderRadius: '12px',
                background: '#1a1d27',
                border: '1px solid #2a2d3a',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add src/app/loading.tsx
git commit -m "feat: add landing page loading skeleton"
```

---

### Task 5: AI Builder Loading Skeleton (`chat/loading.tsx`)

**Files:**
- Create: `src/app/chat/loading.tsx`

The chat page has: split pane — left panel with suggestion cards + chat input, right panel with React Flow canvas.

- [ ] **Step 1: Create `src/app/chat/loading.tsx`**

```tsx
export default function ChatLoading() {
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0f1117' }}>
      {/* Left panel — chat */}
      <div
        style={{
          width: '40%',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #1a1d27',
          padding: '24px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <div className="animate-pulse" style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#1a1d27' }} />
          <div className="animate-pulse" style={{ width: '140px', height: '16px', borderRadius: '4px', background: '#1a1d27' }} />
        </div>

        {/* Suggestion cards */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse"
              style={{
                height: '72px',
                borderRadius: '12px',
                background: '#1a1d27',
                border: '1px solid #2a2d3a',
              }}
            />
          ))}
        </div>

        {/* Chat input */}
        <div
          className="animate-pulse"
          style={{
            height: '48px',
            borderRadius: '12px',
            background: '#1a1d27',
            border: '1px solid #2a2d3a',
            marginTop: '16px',
          }}
        />
      </div>

      {/* Right panel — canvas */}
      <div
        style={{
          flex: 1,
          background: '#0f1117',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage:
            'radial-gradient(circle, #2a2d3a 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div className="animate-pulse" style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#1a1d27', margin: '0 auto 12px' }} />
          <div className="animate-pulse" style={{ width: '120px', height: '12px', borderRadius: '4px', background: '#1a1d27', margin: '0 auto' }} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add src/app/chat/loading.tsx
git commit -m "feat: add AI Builder loading skeleton"
```

---

### Task 6: Visual Editor Loading Skeleton (`playground/loading.tsx`)

**Files:**
- Create: `src/app/playground/loading.tsx`

The playground has: toolbar (top) → node library (left sidebar) → canvas (center) → bottom panel (collapsed).

- [ ] **Step 1: Create `src/app/playground/loading.tsx`**

```tsx
export default function PlaygroundLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0f1117' }}>
      {/* Toolbar */}
      <div
        style={{
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '0 16px',
          borderBottom: '1px solid #1a1d27',
          background: '#13151d',
        }}
      >
        {[32, 32, 32, 1, 80, 80, 1, 32, 32].map((w, i) =>
          w === 1 ? (
            <div key={i} style={{ width: '1px', height: '24px', background: '#2a2d3a', margin: '0 4px' }} />
          ) : (
            <div
              key={i}
              className="animate-pulse"
              style={{
                width: `${w}px`,
                height: '28px',
                borderRadius: '6px',
                background: '#1a1d27',
              }}
            />
          )
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Node library sidebar */}
        <div
          style={{
            width: '240px',
            borderRight: '1px solid #1a1d27',
            padding: '16px',
            background: '#13151d',
          }}
        >
          <div className="animate-pulse" style={{ width: '100%', height: '36px', borderRadius: '8px', background: '#1a1d27', marginBottom: '16px' }} />
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="animate-pulse"
              style={{
                height: '32px',
                borderRadius: '8px',
                background: '#1a1d27',
                marginBottom: '8px',
              }}
            />
          ))}
        </div>

        {/* Canvas area */}
        <div
          style={{
            flex: 1,
            backgroundImage: 'radial-gradient(circle, #2a2d3a 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* Bottom panel bar */}
      <div
        style={{
          height: '36px',
          borderTop: '1px solid #1a1d27',
          background: '#13151d',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
        }}
      >
        <div className="animate-pulse" style={{ width: '80px', height: '14px', borderRadius: '4px', background: '#1a1d27' }} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add src/app/playground/loading.tsx
git commit -m "feat: add Visual Editor loading skeleton"
```

---

### Task 7: Integrations Marketplace Loading Skeleton (`integrations/loading.tsx`)

**Files:**
- Create: `src/app/integrations/loading.tsx`

The integrations page has: nav → search bar → stats row (4 boxes) → grid of integration cards.

- [ ] **Step 1: Create `src/app/integrations/loading.tsx`**

```tsx
export default function IntegrationsLoading() {
  return (
    <div style={{ minHeight: '100vh', background: '#0f1117' }}>
      {/* Nav */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 32px',
          borderBottom: '1px solid #1a1d27',
          background: 'rgba(15,17,23,0.85)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="animate-pulse" style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#1a1d27' }} />
          <div className="animate-pulse" style={{ width: '120px', height: '16px', borderRadius: '4px', background: '#1a1d27' }} />
          <div style={{ width: '1px', height: '16px', background: '#2a2d3a', margin: '0 4px' }} />
          <div className="animate-pulse" style={{ width: '90px', height: '14px', borderRadius: '4px', background: '#1a1d27' }} />
        </div>
        <div className="animate-pulse" style={{ width: '100px', height: '36px', borderRadius: '8px', background: '#1a1d27' }} />
      </nav>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px' }}>
        {/* Search bar */}
        <div className="animate-pulse" style={{ width: '100%', height: '48px', borderRadius: '12px', background: '#1a1d27', marginBottom: '24px' }} />

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="animate-pulse"
              style={{
                height: '80px',
                borderRadius: '12px',
                background: '#1a1d27',
                border: '1px solid #2a2d3a',
              }}
            />
          ))}
        </div>

        {/* Integration cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <div
              key={i}
              className="animate-pulse"
              style={{
                height: '140px',
                borderRadius: '12px',
                background: '#1a1d27',
                border: '1px solid #2a2d3a',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add src/app/integrations/loading.tsx
git commit -m "feat: add Integrations Marketplace loading skeleton"
```

---

### Task 8: Triggers Page Loading Skeleton (`triggers/loading.tsx`)

**Files:**
- Create: `src/app/triggers/loading.tsx`

The triggers page has: nav → stats row (3 boxes) → filter tabs → list of trigger rows.

- [ ] **Step 1: Create `src/app/triggers/loading.tsx`**

```tsx
export default function TriggersLoading() {
  return (
    <div style={{ minHeight: '100vh', background: '#0f1117' }}>
      {/* Nav */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 32px',
          borderBottom: '1px solid #1a1d27',
          background: 'rgba(15,17,23,0.85)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="animate-pulse" style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#1a1d27' }} />
          <div className="animate-pulse" style={{ width: '120px', height: '16px', borderRadius: '4px', background: '#1a1d27' }} />
          <div style={{ width: '1px', height: '16px', background: '#2a2d3a', margin: '0 4px' }} />
          <div className="animate-pulse" style={{ width: '70px', height: '14px', borderRadius: '4px', background: '#1a1d27' }} />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div className="animate-pulse" style={{ width: '100px', height: '36px', borderRadius: '8px', background: '#1a1d27' }} />
          <div className="animate-pulse" style={{ width: '120px', height: '36px', borderRadius: '8px', background: '#1a1d27' }} />
        </div>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px' }}>
        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse"
              style={{
                height: '80px',
                borderRadius: '12px',
                background: '#1a1d27',
                border: '1px solid #2a2d3a',
              }}
            />
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {[80, 90, 100, 70].map((w, i) => (
            <div
              key={i}
              className="animate-pulse"
              style={{
                width: `${w}px`,
                height: '32px',
                borderRadius: '20px',
                background: '#1a1d27',
              }}
            />
          ))}
        </div>

        {/* Trigger rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="animate-pulse"
              style={{
                height: '72px',
                borderRadius: '12px',
                background: '#1a1d27',
                border: '1px solid #2a2d3a',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add src/app/triggers/loading.tsx
git commit -m "feat: add Triggers page loading skeleton"
```

---

### Task 9: Update PRODUCT-CONTEXT.md and Final Verification

**Files:**
- Modify: `docs/PRODUCT-CONTEXT.md` — change Feature #8 row

- [ ] **Step 1: Update Feature #8 status in `docs/PRODUCT-CONTEXT.md`**

Change:
```
| 8 | Error Handling Routes | — | Planned |
```
To:
```
| 8 | Error Handling Routes | All routes (error, 404, loading) | Shipped |
```

- [ ] **Step 2: Run full build**

Run: `npx next build`
Expected: Build succeeds with all 8 new files compiled

- [ ] **Step 3: Manual smoke test**

Run: `npx next dev`
Then verify:
- Visit `/nonexistent-path` → see custom 404 with gold "404" and dark theme
- Visit `/playground` → see skeleton flash before canvas loads (use DevTools network throttling to "Slow 3G")
- Visit `/integrations` → see skeleton with stats + grid placeholders
- Visit `/chat` → see split-pane skeleton
- Visit `/triggers` → see skeleton with stats + list rows

- [ ] **Step 4: Commit**

```bash
git add docs/PRODUCT-CONTEXT.md
git commit -m "docs: mark Feature #8 Error Handling Routes as Shipped"
```
