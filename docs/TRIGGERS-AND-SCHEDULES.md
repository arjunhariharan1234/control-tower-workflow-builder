# Webhook Triggers & Scheduled Runs

## Overview

The Triggers system allows workflows to be executed automatically via three mechanisms: **HTTP webhooks**, **cron-based schedules**, and **operational event triggers**. This transforms the platform from a design-time tool into a runtime automation engine.

**Route:** `/triggers`
**API:** `POST|GET /api/webhook/[workflowId]`

---

## Architecture

```
External Sources                    Control Tower
─────────────────                   ──────────────────────────────

HTTP Request  ──────────────────►  /api/webhook/[workflowId]
  (POST/GET)                         │
                                     ├── Validate trigger
                                     ├── Parse payload
                                     └── Return run_id

Cron Scheduler ─────────────────►  Schedule triggers (config only*)
  (configured in UI)                 │
                                     └── * Execution engine pending

Operational Events ─────────────►  Event triggers (config only*)
  (stoppage, delay, etc.)            │
                                     └── * Wire to internal event bus
```

*Note: Schedule and event trigger **configuration** is fully implemented. Actual cron execution and event bus integration require a backend runtime.*

---

## Trigger Types

### 1. Webhook Triggers
- **Auto-generated URL:** `{origin}/api/webhook/{workflowId}`
- **Methods:** POST or GET
- **Payload:** JSON body (POST) or query params (GET)
- **Response:**
  ```json
  {
    "success": true,
    "run_id": "uuid",
    "workflow_id": "...",
    "triggered_at": "2026-03-23T...",
    "trigger_type": "webhook"
  }
  ```
- **Test button:** Fires a real HTTP request and logs the result
- **cURL example:** Auto-generated and copyable from the UI

### 2. Schedule Triggers (Cron)
- **12 presets:**
  - Every minute / 5 / 15 / 30 minutes
  - Every hour / 6 hours
  - Daily at midnight / 9 AM / 6 PM
  - Every Monday at 9 AM
  - Weekdays at 9 AM
  - First of month
- **Custom cron expressions:** Full 5-field format (min hour dom month dow)
- **Timezone support:** IST, UTC, EST, PST, GMT, SGT, GST
- **Human-readable labels:** Auto-generated from cron expression

### 3. Event Triggers
- **11 operational event types:**
  - Long Stoppage, Transit Delay, Route Deviation, Overspeeding
  - STA Breach, Night Driving, E-Way Bill Expiry
  - Tracking Interrupted, Diversion
  - Origin Detention, Destination Detention
- **Event sources:** Internal (Control Tower), Ozonetel, Kapture CX, External Webhook

---

## Trigger Management Page

### Stats Bar
| Stat | Description |
|------|-------------|
| Total Triggers | Count of all configured triggers |
| Active | Currently enabled triggers |
| Webhooks | Webhook-type triggers |
| Schedules | Cron-type triggers |
| Total Runs | Sum of all trigger executions |

### Trigger Cards
Each trigger displays:
- **Active toggle** — on/off switch (green/gray)
- **Type badge** — webhook (blue), schedule (purple), event (amber)
- **Workflow name** — which workflow this trigger starts
- **Detail line** — webhook URL path, cron schedule, or event type
- **Run count** — total executions
- **Last triggered** — timestamp

### Expanded View
- **Webhook:** Full URL, copy button, cURL example, Test Webhook button
- **Schedule:** Cron expression display
- **Actions:** Delete button

---

## Create Trigger Flow

**2-step modal:**

### Step 1: Select Workflow + Type
1. Choose from saved workflows (dropdown)
2. Pick trigger type:
   - 🔗 Webhook — HTTP POST/GET
   - 🕐 Schedule — Cron expression
   - ⚡ Event — Operational event

### Step 2: Configure
- **Webhook:** Select POST/GET method, see auto-generated URL
- **Schedule:** Pick preset or enter custom cron, select timezone
- **Event:** Choose event type and source

---

## Data Model

```typescript
interface WorkflowTrigger {
  id: string;
  workflowId: string;
  workflowName: string;
  type: TriggerType;           // 'manual' | 'webhook' | 'schedule' | 'event'
  webhook?: WebhookConfig;
  schedule?: ScheduleConfig;
  event?: EventTriggerConfig;
  createdAt: string;
  updatedAt: string;
  lastTriggeredAt?: string;
  triggerCount: number;
  active: boolean;
}

interface TriggerLog {
  id: string;
  triggerId: string;
  workflowId: string;
  type: TriggerType;
  timestamp: string;
  payload?: Record<string, unknown>;
  status: 'triggered' | 'failed' | 'skipped';
  message?: string;
}
```

---

## API Endpoint

### `POST /api/webhook/[workflowId]`

**Request:**
```bash
curl -X POST https://your-app.vercel.app/api/webhook/abc123 \
  -H "Content-Type: application/json" \
  -d '{"event": "LONG_STOPPAGE", "vehicle_id": "TN01AB1234"}'
```

**Response:**
```json
{
  "success": true,
  "run_id": "d4f7a1b2-...",
  "workflow_id": "abc123",
  "triggered_at": "2026-03-23T14:30:00.000Z",
  "trigger_type": "webhook",
  "payload_received": true,
  "message": "Workflow abc123 triggered via webhook"
}
```

### `GET /api/webhook/[workflowId]`
Same response format, reads params from query string.

---

## Files

| File | Purpose |
|------|---------|
| `src/types/trigger.ts` | Trigger types, cron presets, `cronToHuman()` |
| `src/lib/triggers.ts` | localStorage CRUD for triggers and logs |
| `src/app/triggers/page.tsx` | Triggers management page + create modal |
| `src/app/api/webhook/[workflowId]/route.ts` | Webhook POST/GET endpoint |

---

## Storage

- **Triggers:** `ct-workflow-triggers` in localStorage
- **Trigger logs:** `ct-trigger-logs` (max 100 entries)
