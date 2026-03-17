'use client';

import React, { useState } from 'react';
import { StepType } from '@/types/workflow';

// ── Types ────────────────────────────────────────────────────────────

interface NodeTemplate {
  type: StepType;
  label: string;
  section: string;
  subsection?: string;
  color: string;
  icon: React.ReactNode;
  description: string;
  defaults?: Record<string, unknown>;
}

// ── Icons ────────────────────────────────────────────────────────────

const ic = 'w-4 h-4';

const EventIcon = <svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>;
const StopIcon = <svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg>;
const TruckIcon = <svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16,8 20,8 23,11 23,16 16,16"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
const ClockIcon = <svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>;
const DocIcon = <svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="9" y1="15" x2="15" y2="15"/></svg>;
const MapIcon = <svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>;
const SpeedIcon = <svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 12l6-6"/><circle cx="12" cy="12" r="2"/></svg>;
const MoonIcon = <svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
const WifiOffIcon = <svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>;
const NavigationIcon = <svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="3,11 22,2 13,21 11,13"/></svg>;
const AnchorIcon = <svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="3"/><line x1="12" y1="22" x2="12" y2="8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/></svg>;
const EndIcon = <svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><rect x="9" y="9" width="6" height="6" fill="currentColor" rx="1"/></svg>;
const StartIcon = <svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="10,8 16,12 10,16" fill="currentColor"/></svg>;
const TimerIcon = <svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeDasharray="4 2"/><polyline points="12,6 12,12 16,14"/></svg>;
const GatewayIcon = <svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l10 10-10 10L2 12z"/><path d="M9 9l6 6M15 9l-6 6"/></svg>;
const SubProcessIcon = <svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 2"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg>;

const PhoneIcon = <svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
const SendIcon = <svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>;
const CheckCircleIcon = <svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>;
const ArrowUpIcon = <svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>;

// ── Node Templates ───────────────────────────────────────────────────

const NODE_TEMPLATES: NodeTemplate[] = [
  // ── Flow Control ───────────────────────────────────────────────
  { type: 'START_EVENT', label: 'Start Event', section: 'Flow Control', color: '#FFBE07', icon: StartIcon, description: 'Entry point of a workflow' },
  { type: 'END_EVENT', label: 'End Event', section: 'Flow Control', color: '#ef4444', icon: EndIcon, description: 'Terminal point of a workflow' },
  { type: 'BOUNDARY_EVENT_TIMER', label: 'Timer Event', section: 'Flow Control', color: '#FFBE07', icon: TimerIcon, description: 'Time-based boundary trigger' },
  { type: 'EXCLUSIVE_GATEWAY', label: 'Decision Gateway', section: 'Flow Control', color: '#FFBE07', icon: GatewayIcon, description: 'Branch based on conditions' },
  { type: 'SUB_PROCESS', label: 'Sub-Process', section: 'Flow Control', color: '#22d3ee', icon: SubProcessIcon, description: 'Group steps into a subprocess' },

  // ── Events ─────────────────────────────────────────────────────
  { type: 'START_EVENT', label: 'Route Deviation', section: 'Events', color: '#FFBE07', icon: MapIcon, description: 'Vehicle deviates from planned route', defaults: { config: { trigger_type: 'ROUTE_DEVIATION' } } },
  { type: 'START_EVENT', label: 'Long Stoppage', section: 'Events', color: '#FFBE07', icon: StopIcon, description: 'Vehicle stopped longer than threshold', defaults: { config: { trigger_type: 'LONG_STOPPAGE' } } },
  { type: 'START_EVENT', label: 'EWay Bill Expiry', section: 'Events', color: '#FFBE07', icon: DocIcon, description: 'E-way bill approaching or past expiry', defaults: { config: { trigger_type: 'EWAY_BILL_EXPIRY' } } },
  { type: 'START_EVENT', label: 'Transit Delay', section: 'Events', color: '#FFBE07', icon: TruckIcon, description: 'Shipment delayed beyond expected transit', defaults: { config: { trigger_type: 'TRANSIT_DELAY' } } },
  { type: 'START_EVENT', label: 'STA Breach', section: 'Events', color: '#FFBE07', icon: ClockIcon, description: 'Scheduled time of arrival breached', defaults: { config: { trigger_type: 'STA_BREACH' } } },
  { type: 'START_EVENT', label: 'Origin Detention', section: 'Events', color: '#FFBE07', icon: AnchorIcon, description: 'Vehicle held at origin beyond limit', defaults: { config: { trigger_type: 'ORIGIN_DETENTION' } } },
  { type: 'START_EVENT', label: 'Destination Detention', section: 'Events', color: '#FFBE07', icon: AnchorIcon, description: 'Vehicle held at destination beyond limit', defaults: { config: { trigger_type: 'DESTINATION_DETENTION' } } },
  { type: 'START_EVENT', label: 'Overspeeding', section: 'Events', color: '#FFBE07', icon: SpeedIcon, description: 'Vehicle exceeds speed threshold', defaults: { config: { trigger_type: 'OVERSPEEDING' } } },
  { type: 'START_EVENT', label: 'Night Driving', section: 'Events', color: '#FFBE07', icon: MoonIcon, description: 'Driving detected during restricted hours', defaults: { config: { trigger_type: 'NIGHT_DRIVING' } } },
  { type: 'START_EVENT', label: 'Tracking Interrupted', section: 'Events', color: '#FFBE07', icon: WifiOffIcon, description: 'GPS or tracking signal lost', defaults: { config: { trigger_type: 'TRACKING_INTERRUPTED' } } },
  { type: 'START_EVENT', label: 'Diversion', section: 'Events', color: '#FFBE07', icon: NavigationIcon, description: 'Vehicle diverted to unplanned location', defaults: { config: { trigger_type: 'DIVERSION' } } },

  // ── Conditions — Arithmetic ────────────────────────────────────
  { type: 'EXCLUSIVE_GATEWAY', label: 'Equals (==)', section: 'Conditions', subsection: 'Arithmetic', color: '#3b82f6', icon: GatewayIcon, description: 'Check if value equals target', defaults: { config: { operator: '==' } } },
  { type: 'EXCLUSIVE_GATEWAY', label: 'Not Equals (!=)', section: 'Conditions', subsection: 'Arithmetic', color: '#3b82f6', icon: GatewayIcon, description: 'Check if value does not equal target', defaults: { config: { operator: '!=' } } },
  { type: 'EXCLUSIVE_GATEWAY', label: 'Less Than (<)', section: 'Conditions', subsection: 'Arithmetic', color: '#3b82f6', icon: GatewayIcon, description: 'Check if value is less than threshold', defaults: { config: { operator: '<' } } },
  { type: 'EXCLUSIVE_GATEWAY', label: 'Greater Than (>)', section: 'Conditions', subsection: 'Arithmetic', color: '#3b82f6', icon: GatewayIcon, description: 'Check if value is greater than threshold', defaults: { config: { operator: '>' } } },
  { type: 'EXCLUSIVE_GATEWAY', label: 'Less or Equal (<=)', section: 'Conditions', subsection: 'Arithmetic', color: '#3b82f6', icon: GatewayIcon, description: 'Check if value is at most threshold', defaults: { config: { operator: '<=' } } },
  { type: 'EXCLUSIVE_GATEWAY', label: 'Greater or Equal (>=)', section: 'Conditions', subsection: 'Arithmetic', color: '#3b82f6', icon: GatewayIcon, description: 'Check if value is at least threshold', defaults: { config: { operator: '>=' } } },

  // ── Conditions — String ────────────────────────────────────────
  { type: 'EXCLUSIVE_GATEWAY', label: 'Contains', section: 'Conditions', subsection: 'String', color: '#3b82f6', icon: GatewayIcon, description: 'Check if text contains a substring', defaults: { config: { operator: 'contains' } } },
  { type: 'EXCLUSIVE_GATEWAY', label: 'Starts With', section: 'Conditions', subsection: 'String', color: '#3b82f6', icon: GatewayIcon, description: 'Check if text starts with value', defaults: { config: { operator: 'starts_with' } } },
  { type: 'EXCLUSIVE_GATEWAY', label: 'Ends With', section: 'Conditions', subsection: 'String', color: '#3b82f6', icon: GatewayIcon, description: 'Check if text ends with value', defaults: { config: { operator: 'ends_with' } } },
  { type: 'EXCLUSIVE_GATEWAY', label: 'Matches', section: 'Conditions', subsection: 'String', color: '#3b82f6', icon: GatewayIcon, description: 'Check if text matches regex pattern', defaults: { config: { operator: 'matches' } } },
  { type: 'EXCLUSIVE_GATEWAY', label: 'Is Empty', section: 'Conditions', subsection: 'String', color: '#3b82f6', icon: GatewayIcon, description: 'Check if value is empty or null', defaults: { config: { operator: 'is_empty' } } },

  // ── Actions / Tasks ────────────────────────────────────────────
  { type: 'SERVICE_TASK', label: 'Call', section: 'Actions', color: '#10b981', icon: PhoneIcon, description: 'Place an automated call to driver or contact', defaults: { taskType: 'CALL_TASK' } },
  { type: 'SERVICE_TASK', label: 'Send Communication', section: 'Actions', color: '#10b981', icon: SendIcon, description: 'Send SMS, email, or push notification', defaults: { taskType: 'SEND_COMMUNICATION' } },
  { type: 'SERVICE_TASK', label: 'Auto-Resolve', section: 'Actions', color: '#10b981', icon: CheckCircleIcon, description: 'Automatically resolve and close the incident', defaults: { taskType: 'AUTO_RESOLVE' } },
  { type: 'USER_TASK', label: 'Escalate', section: 'Actions', color: '#10b981', icon: ArrowUpIcon, description: 'Escalate to manager or ops desk for intervention', defaults: { taskType: 'ESCALATE' } },
];

// ── Section config ───────────────────────────────────────────────────

interface SectionConfig {
  key: string;
  label: string;
  color: string;
  icon: React.ReactNode;
}

const SECTIONS: SectionConfig[] = [
  { key: 'Events', label: 'Events', color: '#FFBE07', icon: EventIcon },
  { key: 'Conditions', label: 'Conditions', color: '#3b82f6', icon: GatewayIcon },
  { key: 'Actions', label: 'Actions / Tasks', color: '#10b981', icon: SendIcon },
  { key: 'Flow Control', label: 'Flow Control', color: '#9ca3af', icon: SubProcessIcon },
];

// ── Component ────────────────────────────────────────────────────────

export default function NodeLibrary() {
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  const filtered = search.trim()
    ? NODE_TEMPLATES.filter((t) => t.label.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase()))
    : NODE_TEMPLATES;

  const onDragStart = (event: React.DragEvent, template: NodeTemplate) => {
    event.dataTransfer.setData(
      'application/workflow-node',
      JSON.stringify({ type: template.type, label: template.label, defaults: template.defaults || {} }),
    );
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-64 flex flex-col h-full overflow-hidden" style={{ background: '#13151d', borderRight: '1px solid #2a2d3a' }}>
      {/* Header */}
      <div className="px-4 py-3 space-y-2.5" style={{ borderBottom: '1px solid #2a2d3a' }}>
        <h2 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#FFBE07' }}>Node Library</h2>
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#6b7280' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search nodes..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg focus:outline-none transition-colors"
            style={{ background: '#1a1d27', border: '1px solid #2a2d3a', color: '#d1d5db' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#FFBE07'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#2a2d3a'; }}
          />
        </div>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto py-2">
        {SECTIONS.map((section) => {
          const items = filtered.filter((t) => t.section === section.key);
          if (items.length === 0) return null;
          const isCollapsed = collapsed[section.key];

          // Group by subsection
          const subsections = new Map<string, NodeTemplate[]>();
          items.forEach((item) => {
            const sub = item.subsection || '_default';
            if (!subsections.has(sub)) subsections.set(sub, []);
            subsections.get(sub)!.push(item);
          });

          return (
            <div key={section.key} className="mb-1">
              {/* Section header */}
              <button
                onClick={() => toggle(section.key)}
                className="w-full flex items-center justify-between px-4 py-2 text-left hover:bg-[#1a1d27] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span style={{ color: section.color }}>{section.icon}</span>
                  <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: section.color }}>{section.label}</span>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: `${section.color}15`, color: section.color }}>{items.length}</span>
                </div>
                <svg
                  className="w-3.5 h-3.5 transition-transform duration-200"
                  style={{ color: '#6b7280', transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0)' }}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <polyline points="6,9 12,15 18,9" />
                </svg>
              </button>

              {/* Section content */}
              {!isCollapsed && (
                <div className="px-2 pb-2">
                  {Array.from(subsections.entries()).map(([sub, nodes]) => (
                    <div key={sub}>
                      {sub !== '_default' && (
                        <div className="px-2 pt-2 pb-1">
                          <span className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: '#4a4d5a' }}>{sub}</span>
                        </div>
                      )}
                      <div className="space-y-1">
                        {nodes.map((template, idx) => (
                          <div
                            key={`${template.label}-${idx}`}
                            draggable
                            onDragStart={(e) => onDragStart(e, template)}
                            className="group flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing transition-all duration-150 hover:-translate-y-0.5 active:opacity-70"
                            style={{ background: '#1a1d27', border: '1px solid transparent' }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${template.color}40`; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'transparent'; }}
                            title={template.description}
                          >
                            <span style={{ color: template.color }} className="flex-shrink-0">{template.icon}</span>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[12px] font-medium leading-tight truncate" style={{ color: '#d1d5db' }}>{template.label}</span>
                              <span className="text-[10px] leading-tight truncate" style={{ color: '#4a4d5a' }}>{template.description}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
