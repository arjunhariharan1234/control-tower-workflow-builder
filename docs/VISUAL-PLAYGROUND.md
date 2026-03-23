# Visual Playground Editor

## Overview

The Visual Playground is a full-featured drag-and-drop workflow editor built on React Flow. It allows users to design workflows by dragging nodes from a library, connecting them with edges, configuring properties, and running simulations — all within a single-page canvas experience.

**Route:** `/playground`

---

## Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Toolbar: [☰ Menu] [Workflow Name] ... [Run ▶] [🕐] [Deploy]   │
├──────────┬─────────────────────────────────────┬─────────────────┤
│          │                                     │                 │
│  Node    │         React Flow Canvas           │   Node Config   │
│  Library │                                     │   Panel (272px) │
│  (256px) │    [Nodes + Edges + MiniMap]        │                 │
│          │                                     │  - Step Key     │
│  Events  │                                     │  - Display Name │
│  Conds   │                                     │  - Step Type    │
│  Actions │                                     │  - Task Type    │
│  Flow    │                                     │  - Config K/V   │
│  Control │                                     │  - Inputs       │
│          │                                     │  - Position     │
├──────────┴─────────────────────────────────────┴─────────────────┤
│  Bottom Panel: [JSON Preview] [Validation] [Logs]    [Copy] [▲▼]│
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ { "name": "...", "steps": [...], "transitions": [...] }    │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

## Node Library (Left Panel)

4 sections with 30+ draggable node templates:

### Events (11 nodes)
Route Deviation, Long Stoppage, EWay Bill Expiry, Transit Delay, STA Breach, Origin Detention, Destination Detention, Overspeeding, Night Driving, Tracking Interrupted, Diversion

### Conditions (10 nodes)
- **Arithmetic:** Equals, Not Equals, Less Than, Greater Than, Less/Greater or Equal
- **String:** Contains, Starts With, Ends With, Matches, Is Empty

### Actions (4 nodes)
Call, Send Communication, Auto-Resolve, Escalate

### Flow Control (5 nodes)
Start Event, End Event, Timer Event, Decision Gateway, Sub-Process

---

## Node Types & Visual Design

| Node | Shape | Color | Handles |
|------|-------|-------|---------|
| START_EVENT | Circle (gold fill) | `#FFBE07` | Bottom source |
| END_EVENT | Circle (gold border) | `#FFBE07` border | Top target |
| SERVICE_TASK | Rounded card + gold stripe | `#FFBE07` accent | Top target + Bottom source |
| USER_TASK | Rounded card + purple stripe | `#9b59b6` accent | Top target + Bottom source |
| EXCLUSIVE_GATEWAY | Rotated diamond | `#FFBE07` | 4 handles (top, bottom, left, right) |
| SUB_PROCESS | Dashed border container | `#22d3ee` dashed | Top target + Bottom source |
| BOUNDARY_EVENT_TIMER | Dashed circle | `#FFBE07` dashed | Bottom source |

All nodes support execution status rings:
- `PENDING` — gray ring
- `RUNNING` — blue pulsing ring
- `COMPLETED` — green ring + checkmark badge
- `FAILED` — red ring + X badge
- `SKIPPED` — gray dashed ring

---

## Toolbar Features

| Feature | Description |
|---------|-------------|
| Hamburger Menu | New, My Workflows, Import/Export JSON, Load File, Save to Library, Validate, Execution History, Integrations, Triggers |
| Workflow Name | Inline-editable, auto-generates code slug |
| Run / Stop | Simulation engine controls |
| History Icon | Opens Execution History drawer |
| Deploy | Opens deployment confirmation modal |

---

## Bottom Panel

3 tabs:

| Tab | Content |
|-----|---------|
| **JSON Preview** | Real-time DSL output with Copy button |
| **Validation** | Error/warning counts with detailed messages |
| **Logs** | Color-coded execution logs with running indicator |

---

## State Management

Single Zustand store (`workflow-store.ts`) manages:
- Graph state (nodes, edges)
- Workflow metadata (name, code, description)
- UI state (selected node/edge, panel visibility)
- Execution state (status, step executions, logs)
- Simulation state (running, speed, replay ID)
- Deployment state

---

## Query Params

| Param | Effect |
|-------|--------|
| `?template=long-stoppage` | Load a built-in template |
| `?load=<uuid>` | Load a saved workflow from localStorage |
| `?mode=templates` | Open the Workflows drawer on Templates tab |

---

## Files

| File | Purpose |
|------|---------|
| `src/app/playground/page.tsx` | Page layout, query param handling |
| `src/components/canvas/WorkflowCanvas.tsx` | React Flow canvas with drag-drop |
| `src/components/nodes/CustomNodes.tsx` | 7 custom node components |
| `src/components/panels/NodeLibrary.tsx` | Draggable node catalog |
| `src/components/panels/NodeConfigPanel.tsx` | Selected node/edge properties |
| `src/components/panels/BottomPanel.tsx` | JSON preview, validation, logs |
| `src/components/toolbar/Toolbar.tsx` | Menu, name input, action buttons |
| `src/store/workflow-store.ts` | All playground state and actions |
| `src/lib/dsl-generator.ts` | Graph → DSL conversion |
| `src/lib/dsl-parser.ts` | DSL → Graph conversion |
| `src/lib/dsl-validator.ts` | Validation rules |
