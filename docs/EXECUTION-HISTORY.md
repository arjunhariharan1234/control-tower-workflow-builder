# Execution History & Replay

## Overview

The Execution History system provides a complete simulation engine for the Playground, persistent storage of past execution runs, and the ability to replay any historical execution visually on the canvas. It transforms the Playground from a static design tool into an interactive testing environment.

**Location:** Playground toolbar (Run/Stop buttons + History icon)

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     Playground Toolbar                        │
│  [Run ▶] [Stop ■] [🕐 History]                [Deploy]      │
└──────┬──────────────────────────────┬────────────────────────┘
       │                              │
       ▼                              ▼
┌──────────────┐           ┌─────────────────────────┐
│  Simulation  │           │  ExecutionHistoryDrawer  │
│  Engine      │           │  (right slide-over)      │
│              │           │                          │
│  BFS from    │           │  ┌────────────────────┐ │
│  START_EVENT │           │  │ Filter: All|Pass|Fail│ │
│       │      │           │  ├────────────────────┤ │
│       ▼      │           │  │ RunCard (expanded)  │ │
│  For each    │           │  │  Step timeline      │ │
│  node:       │           │  │  Failed step detail │ │
│  PENDING →   │           │  │  [Replay] [Delete]  │ │
│  RUNNING →   │           │  └────────────────────┘ │
│  COMPLETED/  │           │        │                 │
│  FAILED      │           │        ▼ Replay          │
│       │      │           │  replayExecution()       │
│       ▼      │           └─────────────────────────┘
│  saveRun()   │
│  to localStorage
└──────────────┘

Bottom Panel (Logs Tab):
  Color-coded execution logs in real-time
  ✓ green (completed) | ✕ red (failed) | ⟳ blue (running) | ▶ gold (info)
```

---

## Simulation Engine

### How It Works

1. **User clicks "Run"** → `runSimulation()` in workflow store
2. **Node ordering** — BFS traversal from `START_EVENT` node via edges, ensures correct execution order
3. **Step execution** — Each node transitions through states:
   - All nodes set to `PENDING`
   - Current node → `RUNNING` (blue pulse ring on canvas)
   - After delay → `COMPLETED` (green ring) or `FAILED` (red ring, ~5% chance)
   - On failure → remaining nodes marked `SKIPPED`
4. **Persistence** — Run saved to `ct-execution-history` in localStorage
5. **Logs** — Real-time color-coded log entries appear in Bottom Panel

### Execution Speed
- Base speed: `1000ms` per node
- Random jitter: `±40%` for realistic variation
- Configurable via `setSimulationSpeed(ms)`

### Failure Simulation
- Non-start/end nodes have a ~5% random failure chance
- Failed node is highlighted red, remaining nodes skipped
- `failedStepKey` is recorded for quick identification

---

## Execution Run Data Model

```typescript
interface ExecutionRun {
  id: string;                    // UUID
  workflowName: string;
  workflowCode: string;
  status: ExecutionStatus;       // COMPLETED | FAILED
  startedAt: string;             // ISO timestamp
  completedAt?: string;
  duration?: number;             // milliseconds
  stepResults: StepExecutionResult[];
  logs: string[];
  nodeCount: number;
  failedStepKey?: string;        // Which node failed
}

interface StepExecutionResult {
  step_key: string;
  display_name: string;
  step_type: StepType;
  status: ExecutionStatus;
  started_at: string;
  completed_at?: string;
  duration?: number;
  error?: string;
}
```

---

## Execution History Drawer

### Features
- **Filter by status:** All / Passed / Failed
- **Run cards:** workflow name, status badge, timestamp, duration, step count
- **Expanded view:** per-step timeline with status, duration, and error details
- **Replay button:** re-animates the execution on the current canvas
- **Delete:** remove individual runs or "Clear All"

### Replay Mode
When replaying a past execution:
1. All canvas nodes reset to `PENDING`
2. Each step animates through `RUNNING → final status` at 600ms intervals
3. Logs show original timestamps and results
4. Canvas visually shows exactly what happened during that run

---

## Bottom Panel Enhancement

The Logs tab was enhanced with:
- **Color-coded entries:** `✓` green, `✕` red, `⟳` blue, `▶` gold, `⊘` gray
- **Running indicator:** pulsing green dot on Logs tab during simulation
- **Status badge:** "OK" (green) or "FAIL" (red) after completion
- **Prompt text:** "Click Run to simulate your workflow" when empty

---

## Files

| File | Purpose |
|------|---------|
| `src/types/workflow.ts` | `ExecutionRun` and `StepExecutionResult` types |
| `src/lib/execution-history.ts` | localStorage CRUD (max 50 runs) |
| `src/store/workflow-store.ts` | `runSimulation()`, `replayExecution()`, `stopSimulation()` |
| `src/components/modals/ExecutionHistoryDrawer.tsx` | History drawer with filter, expand, replay |
| `src/components/toolbar/Toolbar.tsx` | Run/Stop buttons, History icon |
| `src/components/panels/BottomPanel.tsx` | Enhanced logs tab with colors and status |
| `src/app/playground/page.tsx` | Mounts ExecutionHistoryDrawer |

---

## Storage

- **Key:** `ct-execution-history`
- **Max entries:** 50 (oldest pruned on overflow)
- **Persists across:** page refreshes, browser sessions
