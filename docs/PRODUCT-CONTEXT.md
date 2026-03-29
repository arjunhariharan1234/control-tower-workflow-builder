# Control Tower — Workflow Automation Platform

## Product Context

Control Tower is a **workflow automation platform for logistics operations**. It enables operations teams to design, test, and deploy automated Standard Operating Procedures (SOPs) for handling real-time operational events — vehicle stoppages, transit delays, route deviations, overspeeding, and more.

---

## Vision

Transform thousands of unstructured operational alerts into clean, automated workflows. Replace manual escalation chains with visual, testable, and deployable process automation — accessible to both technical and non-technical operations teams.

## Target Users

| User | How They Use Control Tower |
|------|---------------------------|
| **Operations Managers** | Describe SOPs in plain English via AI Builder, configure triggers and escalation policies |
| **Ops Desk Agents** | Monitor execution history, review triggered workflows, handle manual escalation tasks |
| **Technical Leads** | Build workflows visually in the Playground, configure integrations, set up webhooks |
| **Platform Engineers** | Deploy workflows via API, configure cron triggers, integrate with external systems |

---

## Platform Architecture

```
Landing Page (/)
    ├── AI Builder (/chat)          → Natural language → workflow
    ├── Visual Playground (/playground) → Drag-and-drop workflow editor
    ├── Integrations (/integrations)    → 40+ third-party service connectors
    └── Triggers (/triggers)           → Webhooks, cron schedules, event triggers

Supporting Infrastructure:
    ├── Webhook API (/api/webhook/[id]) → HTTP trigger endpoint
    ├── Deploy API (/api/deploy)        → Workflow deployment endpoint
    └── localStorage persistence        → Workflows, connections, triggers, execution history
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 14 (App Router) | SSR, routing, API routes |
| Language | TypeScript | Type safety across all layers |
| UI | React 18 + Tailwind CSS | Component library + utility styling |
| Canvas | React Flow 11 | Visual node-based workflow editor |
| State | Zustand | Lightweight state management |
| Persistence | localStorage | Client-side storage (workflows, connections, history) |
| IDs | UUID | Unique identifiers |

## Design Language

- **Primary Color:** Gold `#FFBE07` — CTAs, node accents, highlights
- **Background:** Dark slate `#0f1117`
- **Cards/Panels:** Deep gray `#1a1d27`
- **Borders:** `#2a2d3a`
- **Font:** Geist (Vercel's open-source typeface)
- **Theme:** Dark-only, designed for control room / ops desk environments

---

## Core Concepts

### Workflow DSL
Every workflow is represented as a JSON DSL (Domain Specific Language):
```json
{
  "name": "Long Stoppage SOP",
  "code": "LONG_STOPPAGE_SOP",
  "metadata": { "trigger_type": "LONG_STOPPAGE", "category": "operations" },
  "steps": [...],
  "transitions": [...]
}
```

### Node Types
| Type | Purpose |
|------|---------|
| `START_EVENT` | Entry point — triggered by events (stoppage, delay, etc.) |
| `END_EVENT` | Terminal point |
| `SERVICE_TASK` | Automated action (call, SMS, analysis) |
| `USER_TASK` | Human intervention required (escalation, approval) |
| `EXCLUSIVE_GATEWAY` | Conditional branching (if/else) |
| `SUB_PROCESS` | Nested workflow group with retry logic |
| `BOUNDARY_EVENT_TIMER` | Timeout handler on a task |

### Execution Model
Workflows execute step-by-step:
`PENDING → RUNNING → COMPLETED / FAILED / SKIPPED`

Each run is persisted with per-step timing, status, and error details.

---

## Features Overview

| # | Feature | Route | Status |
|---|---------|-------|--------|
| 1 | Landing Page & Navigation | `/` | Shipped |
| 2 | AI Builder (NL → Workflow) | `/chat` | Shipped |
| 3 | Visual Playground Editor | `/playground` | Shipped |
| 4 | Integrations Marketplace | `/integrations` | Shipped |
| 5 | Execution History & Replay | `/playground` (toolbar) | Shipped |
| 6 | Webhook Triggers & Schedules | `/triggers` + `/api/webhook` | Shipped |
| 7 | Version History & Rollback | `/playground` (toolbar menu) | Shipped |
| 8 | Error Handling Routes | All routes (error, 404, loading) | Shipped |
| 9 | Document Upload (CSV/XLSX) | `/chat` (attachment) | Shipped |
| 10 | SOP Workflow Templates (7) | `/playground` (template picker) | Shipped |
| 11 | Communication Directory | `/playground` (toolbar menu) | Shipped |

---

## Key Integrations

### By Category (40 total)
- **Notifications:** Fyno, Twilio, SendGrid, Firebase FCM, MSG91
- **Telephony:** Ozonetel, Exotel, RingCentral/Ring AI, Knowlarity
- **CRM & Support:** Kapture CX, Freshdesk, Zendesk, Salesforce, HubSpot
- **Communication:** Slack, Microsoft Teams, WhatsApp Business, Email SMTP
- **Analytics:** Segment, Mixpanel, Google Analytics
- **Cloud & Infra:** AWS (SNS/SQS/Lambda/S3), Google Cloud
- **Databases:** PostgreSQL, MongoDB, Redis, Elasticsearch
- **AI & ML:** OpenAI, Anthropic Claude, Google Gemini
- **Logistics:** Google Maps, HERE Maps
- **Payments:** Razorpay, Stripe
- **Webhook & HTTP:** Generic Webhook, GraphQL

---

## API-First Philosophy

Control Tower is designed as an **API-first platform**:

1. **Webhook API** — Every workflow gets a unique URL (`/api/webhook/[workflowId]`) accepting POST/GET
2. **Deploy API** — Workflows deploy via `POST /api/deploy` to backend execution engines
3. **Integration Registry** — All 40 integrations define typed triggers, actions, and auth schemas
4. **DSL Standard** — Workflows are portable JSON documents, importable/exportable
5. **localStorage today, API tomorrow** — All persistence layers use a clean CRUD abstraction ready for backend migration

---

## Running Locally

```bash
npm install
npm run dev
# → http://localhost:3000
```

| Route | What It Does |
|-------|-------------|
| `localhost:3000/` | Landing page with globe animation |
| `localhost:3000/chat` | AI Builder — describe a workflow in English |
| `localhost:3000/playground` | Visual drag-and-drop workflow editor |
| `localhost:3000/integrations` | Browse and connect 40+ integrations |
| `localhost:3000/triggers` | Configure webhooks and cron schedules |
