# AI Builder — Natural Language to Workflow Engine

## Overview

The AI Builder is a conversational interface that lets users describe operational workflows in plain English and automatically converts them into structured workflow DSL (Domain Specific Language) JSON. The generated workflow is rendered live on a React Flow canvas, supports step-by-step simulation, and can be seamlessly handed off to the visual playground editor for fine-tuning.

**Route:** `/chat`

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         /chat (Chat Page)                          │
│                                                                     │
│  ┌──────────────────────┐    ┌────────────────────────────────────┐ │
│  │    Chat Panel (45%)   │    │     Preview Panel (55%)            │ │
│  │                       │    │                                    │ │
│  │  User Input           │    │  MiniWorkflowCanvas (React Flow)  │ │
│  │       │               │    │       ▲                            │ │
│  │       ▼               │    │       │                            │ │
│  │  generateThinking     │    │  parseDSLToGraph(dsl)             │ │
│  │  Steps() → animated   │    │       ▲                            │ │
│  │  thinking UI          │    │       │                            │ │
│  │       │               │    │  ┌────┴─────┐                     │ │
│  │       ▼               │    │  │ DSL JSON │                     │ │
│  │  parseNaturalLanguage │    │  └────┬─────┘                     │ │
│  │  (input) → ParseResult│────┤       │                            │ │
│  │       │               │    │  Simulation Engine                 │ │
│  │       ▼               │    │  (step-by-step execution)         │ │
│  │  Assistant Response    │    │                                    │ │
│  │  with metadata badges │    │  ┌──────────────────────────────┐ │ │
│  │                       │    │  │ Simulation Logs              │ │ │
│  └──────────────────────┘    └──┴──────────────────────────────┴─┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ "Edit in Playground" → saveWorkflow() → /playground?load=id │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Files Created / Modified

### New Files

| File | Purpose |
|------|---------|
| `src/lib/nl-to-workflow.ts` | Core NL parser engine — converts plain English to `WorkflowDSL` |
| `src/app/chat/page.tsx` | Chat page with split-pane layout, message thread, and preview |
| `src/components/canvas/MiniWorkflowCanvas.tsx` | Read-only React Flow canvas for the preview panel |

### Modified Files

| File | Change |
|------|--------|
| `src/app/page.tsx` | Added "AI Builder" nav button, updated hero CTA, updated "How It Works" |
| `src/app/playground/page.tsx` | Added `?load=<id>` query param support for chat → playground handoff |
| `src/app/globals.css` | Added `slideInRight`, `shimmer`, and `line-clamp-2` CSS utilities |

---

## NL Parser Engine (`nl-to-workflow.ts`)

### How It Works

The parser operates in 5 phases:

#### Phase 1 — Trigger Detection
Scans the input against `TRIGGER_PATTERNS` to identify the workflow type:

```
"long stoppage" → LONG_STOPPAGE (operations)
"transit delay"  → TRANSIT_DELAY (operations)
"route deviation" → ROUTE_DEVIATION (compliance)
"overspeeding"   → OVERSPEEDING (safety)
... (10 trigger types total)
```

Sets the workflow name, code, category, and metadata `trigger_type`.

#### Phase 2 — Text Segmentation
Splits the input into actionable segments using:
- Sentence boundaries (`.`)
- Dashes (`-`, `—`)
- Conjunctions with "then" (`and then`, `after that`, `next`)

Example:
```
"analyse location, do checks for petrol pump - call the driver - then escalate"
→ ["analyse location", "do checks for petrol pump", "call the driver", "escalate"]
```

#### Phase 3 — Action Extraction
Each segment is matched against action patterns:

| Pattern | Step Type | Task Type |
|---------|-----------|-----------|
| `analyse`, `assess`, `evaluate` | `SERVICE_TASK` | `ANALYSIS` |
| `call the driver` | `SERVICE_TASK` / `SUB_PROCESS` | `DRIVER_CALL` |
| `escalate to <person>` | `USER_TASK` | `ESCALATION` |
| `monitor`, `watch` | `SERVICE_TASK` | `MONITORING` |
| `notify`, `send alert` | `SERVICE_TASK` | `NOTIFICATION` |
| `after N hours` | `SERVICE_TASK` + `EXCLUSIVE_GATEWAY` | `TIMER` |

Special extractions:
- **Person names**: Regex detects capitalized words after "escalate to" → becomes escalation target
- **Location checks**: Detects "petrol pump", "toll", "plaza" → config payload
- **Retry logic**: `extractRetry()` parses "retry 3 times within 60 mins" → SUB_PROCESS with boundary timer
- **Wait times**: `extractWaitTime()` parses "after 2 hours" → timer ISO duration (`PT2H`)

#### Phase 4 — Workflow Assembly
Builds the `WorkflowDSL` object:
1. Always starts with `START_EVENT`
2. Links steps sequentially via transitions
3. Inserts `EXCLUSIVE_GATEWAY` nodes for decision points
4. Creates `SUB_PROCESS` for retry patterns (with nested call → response → analyse steps)
5. Adds `BOUNDARY_EVENT_TIMER` on call steps with retry config
6. Generates escalation policy from detected escalation levels
7. Always ends with `END_EVENT`

#### Phase 5 — Confidence Scoring
```
confidence = min(0.95, max(0.3, (parsedSteps / totalSegments) * 0.8 + 0.2))
```

### Retry Logic — Deep Dive

When the parser detects "retry 3 times within 60 mins", it creates:

```json
{
  "step_key": "CALL_DRIVER",
  "step_type": "SUB_PROCESS",
  "steps": [
    {
      "step_key": "INITIATE_DRIVER_CALL",
      "step_type": "SERVICE_TASK",
      "task_type": "DRIVER_CALL",
      "boundary_events": [{
        "event_type": "TIMER",
        "event_key": "CALL_TIMEOUT",
        "timer_value": "PT20M",
        "interrupting": true,
        "on_timeout_transition_to": "ESCALATE_TO_ARJUN"
      }],
      "config": { "retry_count": 3, "retry_window_minutes": 60 }
    },
    { "step_key": "CAPTURE_RESPONSE", ... },
    { "step_key": "ANALYSE_RESPONSE", ... }
  ]
}
```

Timer interval = `60 min / 3 retries = 20 min` → `PT20M`

### Thinking Steps Animation

`generateThinkingSteps()` creates a sequence of typed steps shown progressively in the chat:

```
🔍 Understanding your workflow description...     (0ms)
⚡ Detected trigger type: LONG STOPPAGE            (800ms)
⚡ Found: Location analysis step                   (1400ms)
⚡ Found: Driver call action                       (1900ms)
⚡ Found: Retry logic: 3 attempts in 60 min        (2400ms)
⚡ Found: Escalation to Arjun                      (2900ms)
🔧 Assembling workflow structure...                (3400ms)
🔧 Adding transitions and conditions...            (4100ms)
🔧 Setting up escalation policy...                 (4600ms)
✅ Workflow ready!                                  (5000ms)
```

### Exported Types

```typescript
interface ParseResult {
  dsl: WorkflowDSL;       // The complete workflow JSON
  summary: string;         // Human-readable step chain
  steps: string[];         // Array of detected step descriptions
  confidence: number;      // 0.0 – 1.0
}

interface ThinkingStep {
  type: 'understanding' | 'extracting' | 'building' | 'complete';
  message: string;
  detail?: string;
  delay: number;           // ms before showing this step
}
```

---

## Chat Page (`/chat`)

### State Management

The chat page uses local React state (not Zustand) since it operates independently from the playground:

| State | Type | Purpose |
|-------|------|---------|
| `messages` | `ChatMessage[]` | Full conversation thread |
| `input` | `string` | Current textarea value |
| `isProcessing` | `boolean` | Locks input during parsing |
| `currentDSL` | `WorkflowDSL \| null` | Latest generated workflow |
| `previewNodes` | `Node[]` | React Flow nodes for preview |
| `previewEdges` | `Edge[]` | React Flow edges for preview |
| `showPreview` | `boolean` | Toggles split-pane view |
| `thinkingSteps` | `ThinkingStep[]` | Current thinking animation |
| `visibleThinkingIndex` | `number` | Progress through thinking steps |
| `simulation` | `SimulationState` | Simulation execution state |

### Message Flow

```
User types → handleSubmit()
  → Creates user ChatMessage
  → generateThinkingSteps(text) → animates step by step
  → parseNaturalLanguage(text) → ParseResult
  → parseDSLToGraph(dsl) → { nodes, edges }
  → Updates preview panel
  → Creates assistant ChatMessage with metadata
```

### Simulation Engine

The simulation walks through every step in the DSL (including SUB_PROCESS children):

```
for each step:
  1. Mark as RUNNING → update preview node with executionStatus
  2. Wait simulation.speed ms (default 1200ms)
  3. Mark as COMPLETED → update preview node
  4. Append to simulation logs
```

The `executionStatus` data prop on nodes is rendered by the existing `CustomNodes.tsx` components which already support PENDING/RUNNING/COMPLETED/FAILED status badges.

### Suggested Prompts

Three pre-built prompts are shown on the empty state:

1. **Long Stoppage SOP** — The full example from the requirements
2. **Transit Delay Handling** — Delay assessment with severity branching
3. **Route Deviation Alert** — Deviation flagging with risk-based routing

### Playground Handoff

```typescript
const openInPlayground = () => {
  const saved = saveWorkflow(name, code, description, dsl);  // → localStorage
  router.push(`/playground?load=${saved.id}`);                // → playground reads it
};
```

The playground page was updated to read `?load=<id>` and call `getSavedWorkflowById(id)` → `loadDSL(saved.dsl)`.

---

## MiniWorkflowCanvas Component

A lightweight wrapper around React Flow for the preview panel:

- **Read-only**: `nodesDraggable={false}`, `nodesConnectable={false}`, `elementsSelectable={false}`
- **Auto-fit**: Calls `fitView({ padding: 0.2 })` whenever nodes/edges update
- **Interactive**: Pan and zoom enabled for exploration
- **Reuses** the same `nodeTypes` (CustomNodes) as the main playground canvas

---

## Landing Page Changes

### Navigation Bar
- Added "AI Builder" button with chat icon, styled as the primary gold CTA

### Hero Section
- Primary CTA: "Describe Your Workflow in Plain English" → `/chat`
- Secondary row: "Start from Template" | "Visual Builder" (previously the primary CTAs)

### How It Works Section
Updated the 3-step flow:
1. ~~Pick or Build~~ → **Describe in Plain English**
2. ~~Configure Logic~~ → **Preview & Simulate**
3. Deploy & Automate (unchanged)

---

## Example Input → Output

### Input
```
Long stoppage SOP - step 1 - analyse location, do checks for petrol pump,
toll, plaza etc. Call the driver. If the driver does not pick up the call,
retry 3 times within 60 mins. Then escalate it to Arjun and monitor after
2 hours. If it still remains same - then escalate it to manager.
```

### Generated DSL Structure
```
START (Start Event)
  → ANALYSE_LOCATION (Service Task: ANALYSIS)
    config: { checks: ["Petrol Pump", "Toll", "Plaza"] }
  → CALL_DRIVER (Sub Process)
    ├── INITIATE_DRIVER_CALL (Service Task: DRIVER_CALL)
    │   boundary: TIMER PT20M → ESCALATE_TO_ARJUN
    │   config: { retry_count: 3, retry_window_minutes: 60 }
    ├── CAPTURE_RESPONSE (Service Task: AGENTIC_CALL_RESPONSE)
    └── ANALYSE_RESPONSE (Service Task: ANALYSIS)
  → ESCALATE_TO_ARJUN (User Task: ESCALATION)
  → WAIT_AND_CHECK (Service Task: TIMER, PT2H)
  → CHECK_STATUS_AFTER_WAIT (Exclusive Gateway)
    ├── [Resolved] → CLOSE (End Event)
    └── [default] → ESCALATE_TO_MANAGER (User Task: ESCALATION)
      → CLOSE (End Event)
```

### Metadata Generated
```json
{
  "category": "operations",
  "trigger_type": "LONG_STOPPAGE",
  "priority": "HIGH",
  "tags": ["long_stoppage_sop", "operations", "auto-generated"],
  "force_close_supported": true,
  "escalation_policy": {
    "type": "TIME_BASED",
    "levels": [
      { "level": 1, "level_key": "L1", "priority": "MEDIUM", "description": "Level 1 - Escalation to Arjun" },
      { "level": 2, "level_key": "L2", "priority": "HIGH", "description": "Level 2 - Escalation to Manager" }
    ]
  }
}
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14.2 (App Router) |
| Language | TypeScript |
| UI | React 18 + Tailwind CSS |
| Workflow Canvas | React Flow v11 |
| State (chat) | React useState/useCallback |
| State (playground) | Zustand |
| Persistence | localStorage |
| NL Parsing | Custom rule-based engine (no external AI API) |
| IDs | uuid v13 |

---

## Extending the Parser

To add new action recognition:

1. Add a regex pattern match in the segment loop inside `parseNaturalLanguage()`
2. Create the appropriate `WorkflowStep` with `step_type` and `task_type`
3. Add transitions from `lastStepKey` to the new step
4. Update `lastStepKey` to maintain the chain
5. Add a summary part for the assistant response

To add new trigger types, append to the `TRIGGER_PATTERNS` array:
```typescript
{ pattern: /\b(your_pattern)\b/i, type: 'YOUR_TYPE', category: 'your_category' }
```
