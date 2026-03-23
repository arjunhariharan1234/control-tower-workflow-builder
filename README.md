# Control Tower — Workflow Automation Platform

A visual workflow builder for logistics operations. Design, test, and deploy automated SOPs using natural language or drag-and-drop — with 40+ integrations, webhook triggers, cron schedules, and execution history.

**Stack:** Next.js 14 · TypeScript · React Flow · Zustand · Tailwind CSS

---

## Quick Start

```bash
npm install
npm run dev
# → http://localhost:3000
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page with globe animation and feature showcase |
| `/chat` | AI Builder — describe workflows in plain English |
| `/playground` | Visual drag-and-drop workflow editor |
| `/integrations` | Browse and connect 40+ third-party integrations |
| `/triggers` | Configure webhooks, cron schedules, and event triggers |
| `/api/webhook/[id]` | Webhook endpoint (POST/GET) to trigger workflows |
| `/api/deploy` | Deploy workflow DSL to backend |

## Features

- **AI Builder** — Natural language → workflow DSL via rule-based parser
- **Visual Playground** — React Flow canvas with 30+ node templates, live JSON preview, validation
- **Simulation Engine** — Run workflows step-by-step with visual node status feedback
- **Execution History** — Persistent run log with replay, filtering, per-step timeline
- **Integrations Marketplace** — 40 integrations across 11 categories (Fyno, Ozonetel, Kapture, Slack, AWS, etc.)
- **Webhook Triggers** — Auto-generated URLs, test-from-UI, cURL examples
- **Cron Schedules** — 12 presets + custom expressions with timezone support
- **Event Triggers** — 11 operational event types with source configuration
- **4 Built-in Templates** — Long Stoppage, Transit Delay, Route Deviation, Overspeeding

## Documentation

| Document | Description |
|----------|-------------|
| [Product Context](docs/PRODUCT-CONTEXT.md) | Vision, architecture, tech stack, API-first philosophy |
| [AI Builder](AI-BUILDER.md) | NL parser engine, 5-phase conversion, thinking animation |
| [Visual Playground](docs/VISUAL-PLAYGROUND.md) | Canvas editor, node types, toolbar, state management |
| [Integrations Marketplace](docs/INTEGRATIONS-MARKETPLACE.md) | 40 integrations, connection management, registry design |
| [Execution History](docs/EXECUTION-HISTORY.md) | Simulation engine, replay, persistent run storage |
| [Triggers & Schedules](docs/TRIGGERS-AND-SCHEDULES.md) | Webhooks, cron, events, API endpoint |
| [Landing Page](docs/LANDING-PAGE.md) | Globe animation, hero, sections, navigation |

## Project Structure

```
src/
├── app/
│   ├── page.tsx                     # Landing page
│   ├── chat/page.tsx               # AI Builder
│   ├── playground/page.tsx         # Visual editor
│   ├── integrations/page.tsx       # Marketplace
│   ├── triggers/page.tsx           # Trigger management
│   └── api/
│       ├── deploy/route.ts         # Deploy endpoint
│       └── webhook/[workflowId]/   # Webhook trigger endpoint
├── components/
│   ├── canvas/                     # React Flow canvas
│   ├── nodes/                      # Custom node components
│   ├── panels/                     # NodeLibrary, NodeConfig, BottomPanel
│   ├── toolbar/                    # Toolbar with menu
│   ├── modals/                     # Import, Deploy, Workflows, ExecutionHistory
│   └── integrations/               # Marketplace components
├── lib/
│   ├── integrations/               # Registry (40 integrations), connections, categories
│   ├── templates/                  # 4 built-in workflow templates
│   ├── triggers.ts                 # Trigger CRUD + logs
│   ├── execution-history.ts        # Execution run persistence
│   ├── nl-to-workflow.ts           # NL parser engine
│   ├── dsl-parser.ts               # DSL → React Flow
│   ├── dsl-generator.ts            # React Flow → DSL
│   └── dsl-validator.ts            # Validation rules
├── store/
│   ├── workflow-store.ts           # Playground state (Zustand)
│   └── integration-store.ts        # Marketplace state (Zustand)
└── types/
    ├── workflow.ts                  # DSL, execution, validation types
    ├── integration.ts               # Integration, connection types
    └── trigger.ts                   # Trigger, schedule, webhook types
```

## Deploy

Deploys automatically to Vercel on push to `main`.
