# Integrations Marketplace

## Overview

The Integrations Marketplace is a searchable catalog of 40+ third-party services that can be connected to workflows. Each integration defines typed triggers (events that start workflows) and actions (tasks workflows can execute), along with authentication configuration.

**Route:** `/integrations`

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    /integrations Page                            │
│                                                                  │
│  ┌─────────────────┐  ┌──────────────────────────────────────┐  │
│  │ IntegrationSearch│  │        Stats Bar (4 cards)           │  │
│  │ + Category Chips │  │  Total | Connected | Triggers | Acts │  │
│  └─────────────────┘  └──────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              IntegrationCard Grid (1-4 cols)              │   │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                    │   │
│  │  │ Fyno │ │Twilio│ │Slack │ │ AWS  │  ...                │   │
│  │  └──┬───┘ └──────┘ └──────┘ └──────┘                    │   │
│  │     │ click                                               │   │
│  └─────┼────────────────────────────────────────────────────┘   │
│         ▼                                                        │
│  ┌──────────────────────────┐                                   │
│  │ IntegrationDetailDrawer  │  (right slide-over, 540px)        │
│  │  ┌─────────────────────┐ │                                   │
│  │  │ Tabs:               │ │                                   │
│  │  │  Overview            │ │  Description, auth type, tags    │
│  │  │  Triggers & Actions  │ │  Typed fields per action         │
│  │  │  Connections         │ │  ConnectionForm + saved list     │
│  │  └─────────────────────┘ │                                   │
│  └──────────────────────────┘                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Integration Registry

All integrations are defined in `src/lib/integrations/registry.ts` as a typed array:

```typescript
interface Integration {
  id: string;              // "twilio", "slack", etc.
  name: string;
  description: string;
  category: IntegrationCategory;  // 11 categories
  icon: string;            // 2-letter code
  color: string;           // Brand color hex
  website: string;
  authType: AuthType;      // api_key | oauth2 | basic_auth | bearer_token | none
  authFields: AuthField[]; // Dynamic credential form fields
  triggers: IntegrationTrigger[];
  actions: IntegrationAction[];
  tags: string[];          // For search
  popular?: boolean;
}
```

### 11 Categories

| Category | Count | Examples |
|----------|-------|---------|
| Notifications | 5 | Fyno, Twilio, SendGrid, Firebase FCM, MSG91 |
| Telephony | 4 | Ozonetel, Exotel, RingCentral, Knowlarity |
| CRM & Support | 5 | Kapture CX, Freshdesk, Zendesk, Salesforce, HubSpot |
| Communication | 4 | Slack, Teams, WhatsApp Business, Email SMTP |
| Analytics | 3 | Segment, Mixpanel, Google Analytics |
| Cloud & Infra | 2 | AWS, Google Cloud |
| Databases | 4 | PostgreSQL, MongoDB, Redis, Elasticsearch |
| AI & ML | 3 | OpenAI, Anthropic Claude, Google Gemini |
| Logistics | 2 | Google Maps, HERE Maps |
| Payments | 2 | Razorpay, Stripe |
| Webhook & HTTP | 2 | Generic Webhook, GraphQL |

---

## Connection Management

Connections are stored in localStorage under `ct-integration-connections`:

```typescript
interface IntegrationConnection {
  integrationId: string;
  label: string;           // User-chosen name, e.g., "Production Twilio"
  credentials: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  status: 'connected' | 'error' | 'unchecked';
}
```

### Connection Flow
1. User clicks an integration card → Detail drawer opens
2. Navigates to "Connections" tab → clicks "Add Connection"
3. Dynamic form renders based on `integration.authFields`
4. User fills credentials → clicks "Test Connection" (simulated)
5. On success → "Save Connection" → persisted to localStorage

---

## Files

| File | Purpose |
|------|---------|
| `src/types/integration.ts` | All integration type definitions |
| `src/lib/integrations/registry.ts` | 40 integration definitions with triggers/actions |
| `src/lib/integrations/categories.ts` | 11 category metadata (label, icon, color) |
| `src/lib/integrations/connections.ts` | localStorage CRUD for connections |
| `src/store/integration-store.ts` | Zustand store for marketplace UI state |
| `src/app/integrations/page.tsx` | Marketplace page |
| `src/components/integrations/IntegrationCard.tsx` | Grid card component |
| `src/components/integrations/IntegrationSearch.tsx` | Search + category filters |
| `src/components/integrations/IntegrationDetailDrawer.tsx` | 3-tab detail drawer |
| `src/components/integrations/ConnectionForm.tsx` | Dynamic credential form |

---

## Key Design Decisions

- **Static registry, not API-fetched** — matches the existing pattern where templates are hardcoded. No backend dependency.
- **Separate Zustand store** — marketplace UI state is independent of workflow canvas state, avoiding bloat.
- **localStorage for connections** — mirrors `saved-workflows.ts` pattern. Credentials stay client-side. In production, this moves to an encrypted backend.
- **Brand colors per integration** — each integration has a unique accent color for visual identity on cards, nodes, and detail views.
