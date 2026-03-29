# Communication Directory — Design Spec

**Date:** 2026-03-27
**Feature:** #11 — Communication Directory
**Status:** Approved

## Overview

A CRUD-managed recipient directory stored in Supabase PostgreSQL, accessible from the playground hamburger menu as a slide-over drawer. Recipients are organized by group type (escalation levels, departments, custom) and can be referenced by workflow steps (DRIVER_CALL, NOTIFICATION, ESCALATION) via a dropdown in the node config panel.

## Scope

- Supabase PostgreSQL `notification_recipients` table (user-provided schema)
- Next.js API routes for CRUD (`/api/recipients`)
- Communication Directory drawer (right slide-over from toolbar)
- Hamburger menu item in Toolbar
- Recipient group dropdown in Node Config Panel for call/notification/escalation steps
- Pre-seeded group types
- **Not in scope:** Authentication/tenant isolation (single-tenant for now), bulk import, real-time sync

## Dependencies

- `@supabase/supabase-js` — Supabase client SDK
- Supabase project (user to provision and provide connection URL + anon key)

## Database Schema

Uses the user-provided schema exactly:

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

`tenant_id` defaults to `'default'` for single-tenant mode. `group_type` is a free-text field with pre-seeded values.

## Pre-Seeded Group Types

| Group Type | Category |
|-----------|----------|
| `ESCALATION_L1` | Escalation |
| `ESCALATION_L2` | Escalation |
| `ESCALATION_L3` | Escalation |
| `MHD` | Department |
| `DEPOT_TEAM` | Department |
| `ICARE` | Department |
| `HOD` | Department |
| `SUPPLY_CHAIN` | Department |

Users can also enter custom group types when adding/editing recipients.

## Architecture

```
Supabase PostgreSQL (notification_recipients)
    ↕ @supabase/supabase-js
Next.js API routes (/api/recipients)
    GET    /api/recipients          → list all (with optional ?group_type= filter)
    POST   /api/recipients          → create
    PUT    /api/recipients/[id]     → update
    DELETE /api/recipients/[id]     → soft delete (set is_active = false)
    ↕ fetch()
CommunicationDirectoryDrawer (UI component)
    ↕ referenced by
Node Config Panel (recipientGroup dropdown on workflow steps)
```

## Files

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/supabase.ts` | Create | Supabase client initialization |
| `src/app/api/recipients/route.ts` | Create | GET (list) + POST (create) |
| `src/app/api/recipients/[id]/route.ts` | Create | PUT (update) + DELETE (soft delete) |
| `src/types/recipient.ts` | Create | `NotificationRecipient` TypeScript interface |
| `src/components/modals/CommunicationDirectoryDrawer.tsx` | Create | Drawer UI with CRUD |
| `src/components/toolbar/Toolbar.tsx` | Modify | Add menu item + drawer toggle state |
| `src/store/workflow-store.ts` | Modify | Add `showDirectoryDrawer: boolean` state + `setShowDirectoryDrawer` setter |
| `src/app/playground/page.tsx` | Modify | Mount `CommunicationDirectoryDrawer` at root level alongside other drawers (not inside the canvas flex layout) |
| `.env.local.example` | Create | Document required Supabase env vars |

## TypeScript Interface

```typescript
// src/types/recipient.ts
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
```

## Supabase Client

Two clients: a public client for browser-side operations and a server-only client for API routes.

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Browser-safe client (used by components if needed for real-time, etc.)
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

Environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key (browser-safe)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-only, NOT prefixed with NEXT_PUBLIC_)

**Note:** This is a single-tenant app with no RLS configured. The service role key is used in API routes for simplicity. The anon key is exposed to the browser but only used for potential future real-time features — all CRUD goes through the API routes.

## API Routes

### GET `/api/recipients`

Query params: `?group_type=ESCALATION_L1` (optional filter)

Returns: `{ data: NotificationRecipient[] }` — only active recipients (`is_active = true`), ordered by `group_type, name`.

### POST `/api/recipients`

Body: `{ group_type, name, email_cc?, email_to?, sms?, whatsapp?, voice? }`

Sets `tenant_id = 'default'`, `created_by = 'system'`.

Returns: `{ data: NotificationRecipient }`

### PUT `/api/recipients/[id]`

Body: `{ group_type?, name?, email_cc?, email_to?, sms?, whatsapp?, voice?, is_active? }`

Sets `updated_at = now()`, `updated_by = 'system'`.

Returns: `{ data: NotificationRecipient }`

### DELETE `/api/recipients/[id]`

Soft delete: sets `is_active = false`.

Returns: `{ success: true }`

## UI — Communication Directory Drawer

### Trigger
- New hamburger menu item: **"Communication Directory"** with an address-book icon
- Position: as the last item in the `menuItems` array (after "Triggers & Schedules")
- Opens `CommunicationDirectoryDrawer` via `showDirectoryDrawer` in the workflow store

### Drawer Layout (right slide-over, 480px wide)

**Header:**
- Title: "Communication Directory"
- Recipient count badge: "12 recipients"
- "Add Recipient" button (gold, small)
- Close X button

**Filter Bar:**
- Group type dropdown (All, Escalation L1/L2/L3, MHD, Depot Team, iCare, HOD, Supply Chain, Custom)
- Search input (filters by name, email)

**Recipient Cards (scrollable list):**
- Name (bold, white text)
- Group type badge (colored pill — gold for escalation, blue for departments, gray for custom)
- Channel icons row: 5 icons (email, SMS, WhatsApp, voice, CC) — colored if populated, muted (#3a3d4a) if empty
- On hover: Edit (pencil) and Deactivate (trash) icon buttons appear
- Click card to expand: shows all channel values as a detail list

**Empty State:**
- "No recipients yet" message with "Add your first contact" CTA

### Add/Edit Modal

Triggered by "Add Recipient" button or Edit icon on a card. Modal overlay matching existing app modals.

**Fields:**
- Name (text input, required)
- Group Type (dropdown with pre-seeded options + "Custom..." option that shows a text input)
- Email To (text input, placeholder: "recipient@company.com")
- Email CC (text input, placeholder: "cc1@company.com, cc2@company.com")
- SMS (text input, placeholder: "+91 9876543210")
- WhatsApp (text input, placeholder: "+91 9876543210")
- Voice (text input, placeholder: "+91 9876543210")
- Active toggle (switch, defaults to ON)

**Actions:** Save (gold button) / Cancel

## Workflow Step Integration

### Node Config Panel Changes

For steps where `data.taskType` (camelCase, matching the React node data convention) is in `['DRIVER_CALL', 'AGENTIC_CALL_RESPONSE', 'NOTIFICATION', 'ESCALATION']` or `data.stepType === 'USER_TASK'` with escalation context:

- Add a **"Recipient Group"** dropdown to the config panel
- Dropdown lists distinct `group_type` values from the directory (fetched on mount)
- Selecting a group stores `config.recipientGroup: string` on the workflow step node data (stores the `group_type` value, e.g., `"ESCALATION_L1"`)
- Shows a small preview: "3 recipients in this group" with channel icons

This is a lightweight integration — the directory provides the data, the step config references it.

## Design Tokens

Consistent with app:
- Drawer background: `#13151d`
- Card background: `#1a1d27`
- Borders: `#2a2d3a`
- Gold accent: `#FFBE07`
- Group badges: Escalation → `rgba(255,190,7,0.15)` / `#FFBE07`, Department → `rgba(59,130,246,0.15)` / `#3b82f6`, Custom → `rgba(107,114,128,0.15)` / `#6b7280`
- Channel icons active: `#10b981` (green), inactive: `#3a3d4a`

## Environment Setup

User must:
1. Create a Supabase project at supabase.com
2. Run the `CREATE TABLE` SQL in the Supabase SQL editor
3. Copy the project URL and anon key
4. Add to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```
5. Add all 3 env vars to Vercel project settings for production (mark `SUPABASE_SERVICE_ROLE_KEY` as sensitive)

## Testing

- Open hamburger menu → "Communication Directory" → drawer opens
- Add a recipient with all fields → appears in the list
- Filter by group type → list filters correctly
- Search by name → list filters correctly
- Edit a recipient → changes persist
- Delete a recipient → disappears from list (soft deleted)
- Open a DRIVER_CALL node config → "Recipient Group" dropdown shows available groups
- Select a group → stored in node config data
- Close and reopen drawer → data persists (from Supabase)
