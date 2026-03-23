# Landing Page

## Overview

The landing page is the entry point to Control Tower. It features an animated rotating globe visualization, hero CTA, feature showcase sections, workflow templates preview, integrations showcase, and clear navigation to all major platform areas.

**Route:** `/`

---

## Sections

### 1. Navigation Bar
Sticky top nav with blur backdrop:
- **Logo:** Gold "Control Tower" branding
- **Links:** Integrations, Triggers, Templates, AI Builder (gold CTA)

### 2. Hero Section
Layered over the animated globe:
- **Badge:** "Workflow Automation for Logistics Operations" with pulsing dot
- **Headline:** "Tune Out the Noise. Automate What Matters."
- **Subtitle:** From alerts to clean workflows in minutes
- **Primary CTA:** "Describe Your Workflow in Plain English" → `/chat`
- **Secondary CTAs:** Start from Template → `/playground`, Visual Builder → `/playground`, Explore Integrations → `/integrations`

### 3. Rotating Globe Animation
Canvas-based visualization:
- Globe with latitude/longitude grid lines
- Workflow nodes spawn and connect on the globe surface
- Edges animate with flowing dots
- Noise particles orbit the globe
- Continuous rotation with auto-spawning workflow patterns

### 4. How It Works
3-step breakdown:
1. **Describe in Plain English** — type your SOP naturally
2. **Preview & Simulate** — see workflow rendered, run simulation
3. **Deploy & Automate** — validate and deploy with one click

### 5. Capabilities Grid
4 cards: Event Triggers, Smart Conditions, Automated Actions, One-Click Deploy

### 6. Templates Section
Preview cards for all 4 built-in templates:
- Long Stoppage, Transit Delay, Route Deviation, Overspeeding Alert
- Each card links to `/playground?mode=templates`

### 7. Integrations Showcase
- **Popular integrations grid:** 12 featured integrations as icon cards
- **Category pills:** All 11 categories with counts (Notifications, Telephony, CRM, etc.)
- "View All Integrations" link → `/integrations`

### 8. Footer
Minimal branding: logo + tagline

---

## Files

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Full landing page (~750 lines) |
| `src/app/globals.css` | Animations (fadeIn, etc.) |
| `src/lib/templates/index.ts` | Template data for preview cards |
| `src/lib/integrations/registry.ts` | Integration data for showcase |
