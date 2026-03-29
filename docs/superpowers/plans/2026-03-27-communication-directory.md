# Communication Directory — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Supabase-backed Communication Directory accessible from the playground toolbar, with CRUD for notification recipients and workflow step integration.

**Architecture:** Supabase PostgreSQL stores `notification_recipients`. Next.js API routes provide CRUD. A right-side drawer (matching existing drawer pattern) provides the UI. The Node Config Panel gets a "Recipient Group" dropdown for call/notification/escalation steps.

**Tech Stack:** Next.js 14, Supabase (PostgreSQL + `@supabase/supabase-js`), React, Zustand

**Spec:** `docs/superpowers/specs/2026-03-27-communication-directory-design.md`

**Task Dependencies:** Task 1 (deps) → Task 2 (types + supabase client) → Task 3 (API routes) → Task 4 (store + toolbar) → Task 5 (drawer UI) → Task 6 (node config integration) → Task 7 (docs + deploy)

**Prerequisites:** User must have a Supabase project set up with the `notification_recipients` table created and env vars configured in `.env.local`.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `package.json` | Modify | Add `@supabase/supabase-js` |
| `.env.local.example` | Create | Document required env vars |
| `src/types/recipient.ts` | Create | `NotificationRecipient` interface + `GROUP_TYPES` constant |
| `src/lib/supabase.ts` | Create | Supabase client (browser + server) |
| `src/app/api/recipients/route.ts` | Create | GET (list) + POST (create) |
| `src/app/api/recipients/[id]/route.ts` | Create | PUT (update) + DELETE (soft delete) |
| `src/components/modals/CommunicationDirectoryDrawer.tsx` | Create | Full CRUD drawer UI |
| `src/store/workflow-store.ts` | Modify | Add `showDirectoryDrawer` + `setShowDirectoryDrawer` |
| `src/components/toolbar/Toolbar.tsx` | Modify | Add menu item |
| `src/app/playground/page.tsx` | Modify | Mount drawer |
| `src/components/panels/NodeConfigPanel.tsx` | Modify | Add recipient group dropdown |
| `docs/PRODUCT-CONTEXT.md` | Modify | Add Feature #11 |

---

### Task 1: Install Dependencies + Environment Setup

**Files:**
- Modify: `package.json`
- Create: `.env.local.example`
- Create: `supabase/migrations/001_notification_recipients.sql`

- [ ] **Step 1: Install @supabase/supabase-js**

```bash
npm install @supabase/supabase-js
```

- [ ] **Step 2: Create `.env.local.example`**

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

- [ ] **Step 3: Create `supabase/migrations/001_notification_recipients.sql`**

```sql
CREATE TABLE notification_recipients (
    id              SERIAL PRIMARY KEY,
    tenant_id       VARCHAR(40) NOT NULL,
    group_type      VARCHAR(40) NOT NULL,
    name            VARCHAR(255) NOT NULL,
    email_cc        TEXT,
    email_to        TEXT,
    sms             TEXT,
    whatsapp        TEXT,
    voice           TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by      VARCHAR(40),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by      VARCHAR(40),
    is_active       BOOLEAN DEFAULT TRUE
);
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .env.local.example supabase/
git commit -m "chore: add supabase dependency, env example, and SQL migration"
```

---

### Task 2: Types + Supabase Client

**Files:**
- Create: `src/types/recipient.ts`
- Create: `src/lib/supabase.ts`

- [ ] **Step 1: Create `src/types/recipient.ts`**

```typescript
export interface NotificationRecipient {
  id: number;
  tenant_id: string;
  group_type: string;
  name: string;
  email_cc: string | null;
  email_to: string | null;
  sms: string | null;
  whatsapp: string | null;
  voice: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
  is_active: boolean;
}

export const GROUP_TYPES = [
  { value: 'ESCALATION_L1', label: 'Escalation L1', category: 'escalation' },
  { value: 'ESCALATION_L2', label: 'Escalation L2', category: 'escalation' },
  { value: 'ESCALATION_L3', label: 'Escalation L3', category: 'escalation' },
  { value: 'MHD', label: 'MHD', category: 'department' },
  { value: 'DEPOT_TEAM', label: 'Depot Team', category: 'department' },
  { value: 'ICARE', label: 'iCare', category: 'department' },
  { value: 'HOD', label: 'HOD', category: 'department' },
  { value: 'SUPPLY_CHAIN', label: 'Supply Chain', category: 'department' },
] as const;

export type GroupCategory = 'escalation' | 'department' | 'custom';

export function getGroupCategory(groupType: string): GroupCategory {
  const found = GROUP_TYPES.find(g => g.value === groupType);
  return found ? found.category as GroupCategory : 'custom';
}
```

- [ ] **Step 2: Create `src/lib/supabase.ts`**

```typescript
import { createClient } from '@supabase/supabase-js';

// Browser-safe client
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Server-only client (used by API routes — bypasses RLS)
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/types/recipient.ts src/lib/supabase.ts
git commit -m "feat: add recipient types, group constants, and supabase client"
```

---

### Task 3: API Routes

**Files:**
- Create: `src/app/api/recipients/route.ts`
- Create: `src/app/api/recipients/[id]/route.ts`

- [ ] **Step 1: Create `src/app/api/recipients/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const groupType = request.nextUrl.searchParams.get('group_type');

  let query = supabase
    .from('notification_recipients')
    .select('*')
    .eq('is_active', true)
    .order('group_type')
    .order('name');

  if (groupType) {
    query = query.eq('group_type', groupType);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient();

  try {
    const body = await request.json();
    const { group_type, name, email_cc, email_to, sms, whatsapp, voice } = body;

    if (!group_type || !name) {
      return NextResponse.json({ error: 'group_type and name are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('notification_recipients')
      .insert({
        tenant_id: 'default',
        group_type,
        name,
        email_cc: email_cc || null,
        email_to: email_to || null,
        sms: sms || null,
        whatsapp: whatsapp || null,
        voice: voice || null,
        created_by: 'system',
        updated_by: 'system',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
```

- [ ] **Step 2: Create `src/app/api/recipients/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createServerClient();
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);

  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { group_type, name, email_cc, email_to, sms, whatsapp, voice, is_active } = body;

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString(), updated_by: 'system' };
    if (group_type !== undefined) updates.group_type = group_type;
    if (name !== undefined) updates.name = name;
    if (email_cc !== undefined) updates.email_cc = email_cc || null;
    if (email_to !== undefined) updates.email_to = email_to || null;
    if (sms !== undefined) updates.sms = sms || null;
    if (whatsapp !== undefined) updates.whatsapp = whatsapp || null;
    if (voice !== undefined) updates.voice = voice || null;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data, error } = await supabase
      .from('notification_recipients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createServerClient();
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);

  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  const { error } = await supabase
    .from('notification_recipients')
    .update({ is_active: false, updated_at: new Date().toISOString(), updated_by: 'system' })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/app/api/recipients/route.ts src/app/api/recipients/\[id\]/route.ts
git commit -m "feat: add CRUD API routes for notification recipients"
```

---

### Task 4: Store + Toolbar Integration

**Files:**
- Modify: `src/store/workflow-store.ts`
- Modify: `src/components/toolbar/Toolbar.tsx`

- [ ] **Step 1: Add `showDirectoryDrawer` to the workflow store**

In `src/store/workflow-store.ts`:

Add to the state interface (after line 58, the `showVersionHistory` line):
```typescript
// Communication directory
showDirectoryDrawer: boolean;
```

Add to the actions interface (find the `setShowVersionHistory` setter and add after it):
```typescript
setShowDirectoryDrawer: (show: boolean) => void;
```

Add to the default state (after the `showVersionHistory: false` line):
```typescript
showDirectoryDrawer: false,
```

Add to the actions implementation (after the `setShowVersionHistory` action):
```typescript
setShowDirectoryDrawer: (show) => set({ showDirectoryDrawer: show }),
```

- [ ] **Step 2: Add menu item to Toolbar**

In `src/components/toolbar/Toolbar.tsx`:

Add a new icon function at the bottom (after `IconVersions`):
```typescript
function IconContacts() { return <svg className={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>; }
```

Destructure `setShowDirectoryDrawer` from the store (add to the destructuring at line 10-32):
```typescript
setShowDirectoryDrawer,
```

Add a new menu item at the end of the `menuItems` array (after the "Triggers & Schedules" item, line 124):
```typescript
{ label: 'Communication Directory', icon: <IconContacts />, onClick: () => { setShowDirectoryDrawer(true); setMenuOpen(false); } },
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/store/workflow-store.ts src/components/toolbar/Toolbar.tsx
git commit -m "feat: add communication directory state and toolbar menu item"
```

---

### Task 5: Communication Directory Drawer

**Files:**
- Create: `src/components/modals/CommunicationDirectoryDrawer.tsx`
- Modify: `src/app/playground/page.tsx`

This is the largest task — the full CRUD drawer UI.

- [ ] **Step 1: Create `src/components/modals/CommunicationDirectoryDrawer.tsx`**

The implementer should create this file following these patterns from the existing codebase:

- Same slide-over pattern as `VersionHistoryDrawer.tsx` and `ExecutionHistoryDrawer.tsx`
- 480px wide, right-side, with backdrop blur overlay
- Gold accent `#FFBE07`, dark theme `#13151d` / `#1a1d27` / `#2a2d3a`

The drawer should:

1. **Fetch recipients** on open via `GET /api/recipients`
2. **Display a filter bar** with group type dropdown and search input
3. **Show recipient cards** with:
   - Name (bold), group_type badge (gold for escalation, blue for department, gray for custom)
   - Channel icons row (email, SMS, WhatsApp, voice, CC) — `#10b981` if populated, `#3a3d4a` if empty
   - Expand on click to show all channel values
   - Edit/Delete buttons on hover
4. **Add/Edit modal** (inline within the drawer or overlay modal):
   - Fields: Name (required), Group Type (dropdown from `GROUP_TYPES` + "Custom..." option), Email To, Email CC, SMS, WhatsApp, Voice, Active toggle
   - **Custom group type:** When user selects "Custom..." from the dropdown, show a text input below it for entering a custom group type string. Use state: `const [customGroupType, setCustomGroupType] = useState(false)` — toggle when "Custom..." is selected, use the text input value as `group_type` in the API call.
   - Save → `POST /api/recipients` (new) or `PUT /api/recipients/[id]` (edit)
5. **Delete** → `DELETE /api/recipients/[id]` (soft delete)
6. **Empty state** when no recipients

Key imports to use:
```typescript
import { useWorkflowStore } from '@/store/workflow-store';
import { NotificationRecipient, GROUP_TYPES, getGroupCategory } from '@/types/recipient';
```

Read from store: `showDirectoryDrawer`, `setShowDirectoryDrawer`

The implementer should read `VersionHistoryDrawer.tsx` for the exact drawer shell pattern (overlay, close button, header, scrollable content area).

- [ ] **Step 2: Mount drawer in playground page**

In `src/app/playground/page.tsx`, add import:
```typescript
import CommunicationDirectoryDrawer from '@/components/modals/CommunicationDirectoryDrawer';
```

Add the component after `<VersionHistoryDrawer />` (line 80):
```tsx
<CommunicationDirectoryDrawer />
```

- [ ] **Step 3: Type-check and build**

Run: `npx tsc --noEmit && npx next build`

- [ ] **Step 4: Commit**

```bash
git add src/components/modals/CommunicationDirectoryDrawer.tsx src/app/playground/page.tsx
git commit -m "feat: add communication directory drawer with full CRUD UI"
```

---

### Task 6: Node Config Panel — Recipient Group Dropdown

**Files:**
- Modify: `src/components/panels/NodeConfigPanel.tsx`

- [ ] **Step 1: Add recipient group dropdown with count preview**

In `src/components/panels/NodeConfigPanel.tsx`:

Add imports at the top:
```typescript
import { GROUP_TYPES } from '@/types/recipient';
import { useState, useEffect } from 'react';
```

Note: `useState` and `useEffect` are already imported — just ensure `GROUP_TYPES` is added.

After the `ConfigEditor` component (line 55), add a new conditional section. This goes **outside** the Task Type conditional block, as its own standalone block:

```tsx
{(['DRIVER_CALL', 'AGENTIC_CALL_RESPONSE', 'NOTIFICATION', 'ESCALATION'].includes(data.taskType || '')) && (
  <RecipientGroupSelector nodeId={selectedNode.id} config={data.config || {}} updateNodeData={updateNodeData} />
)}
```

Then add a new component at the bottom of the file (before the existing `ConfigEditor` component or after it):

```tsx
function RecipientGroupSelector({ nodeId, config, updateNodeData }: { nodeId: string; config: Record<string, unknown>; updateNodeData: (id: string, data: Record<string, unknown>) => void }) {
  const [count, setCount] = useState<number | null>(null);
  const group = (config.recipientGroup as string) || '';

  useEffect(() => {
    if (!group) { setCount(null); return; }
    fetch(`/api/recipients?group_type=${group}`)
      .then(r => r.json())
      .then(d => setCount(d.data?.length ?? 0))
      .catch(() => setCount(null));
  }, [group]);

  return (
    <Field label="Recipient Group">
      <select
        value={group}
        onChange={(e) => updateNodeData(nodeId, {
          config: { ...config, recipientGroup: e.target.value || undefined }
        })}
        className="w-full inp text-white focus:border-[#FFBE07]"
      >
        <option value="">Select group...</option>
        <optgroup label="Escalation">
          {GROUP_TYPES.filter(g => g.category === 'escalation').map(g => (
            <option key={g.value} value={g.value}>{g.label}</option>
          ))}
        </optgroup>
        <optgroup label="Department">
          {GROUP_TYPES.filter(g => g.category === 'department').map(g => (
            <option key={g.value} value={g.value}>{g.label}</option>
          ))}
        </optgroup>
      </select>
      {group && count !== null && (
        <p className="text-[10px] mt-1" style={{ color: '#6b7280' }}>
          {count} recipient{count !== 1 ? 's' : ''} in this group
        </p>
      )}
    </Field>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/components/panels/NodeConfigPanel.tsx
git commit -m "feat: add recipient group dropdown to node config panel"
```

---

### Task 7: Update PRODUCT-CONTEXT.md + Final Build + Push

**Files:**
- Modify: `docs/PRODUCT-CONTEXT.md`

- [ ] **Step 1: Add Feature #11 row**

In `docs/PRODUCT-CONTEXT.md`, after the Feature #10 row, add:
```
| 11 | Communication Directory | `/playground` (toolbar menu) | Shipped |
```

- [ ] **Step 2: Run full build**

Run: `npx next build`
Expected: Build succeeds

- [ ] **Step 3: Commit and push**

```bash
git add docs/PRODUCT-CONTEXT.md
git commit -m "docs: add Feature #11 Communication Directory to product context"
git push origin main
```
