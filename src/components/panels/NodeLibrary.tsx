'use client';

import React from 'react';
import { StepType } from '@/types/workflow';

interface NodeTemplate {
  type: StepType;
  label: string;
  category: string;
  color: string;
  icon: React.ReactNode;
}

const ic = "w-4.5 h-4.5";

const NODE_TEMPLATES: NodeTemplate[] = [
  {
    type: 'START_EVENT', label: 'Start Event', category: 'Events', color: '#FFBE07',
    icon: <svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="10,8 16,12 10,16" fill="currentColor"/></svg>,
  },
  {
    type: 'END_EVENT', label: 'End Event', category: 'Events', color: '#ef4444',
    icon: <svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><rect x="9" y="9" width="6" height="6" fill="currentColor" rx="1"/></svg>,
  },
  {
    type: 'BOUNDARY_EVENT_TIMER', label: 'Timer Event', category: 'Events', color: '#FFBE07',
    icon: <svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>,
  },
  {
    type: 'SERVICE_TASK', label: 'Service Task', category: 'Tasks', color: '#FFBE07',
    icon: <svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>,
  },
  {
    type: 'USER_TASK', label: 'User Task', category: 'Tasks', color: '#9b59b6',
    icon: <svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  },
  {
    type: 'EXCLUSIVE_GATEWAY', label: 'Exclusive Gateway', category: 'Gateways', color: '#FFBE07',
    icon: <svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l10 10-10 10L2 12z"/><path d="M9 9l6 6M15 9l-6 6"/></svg>,
  },
  {
    type: 'SUB_PROCESS', label: 'Sub Process', category: 'Subprocess', color: '#22d3ee',
    icon: <svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 2"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg>,
  },
];

const CATEGORIES = ['Events', 'Tasks', 'Gateways', 'Subprocess'];

export default function NodeLibrary() {
  const onDragStart = (event: React.DragEvent, template: NodeTemplate) => {
    event.dataTransfer.setData('application/workflow-node', JSON.stringify({ type: template.type, label: template.label }));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-56 flex flex-col h-full overflow-hidden" style={{ background: '#13151d', borderRight: '1px solid #2a2d3a' }}>
      <div className="px-4 py-3" style={{ borderBottom: '1px solid #2a2d3a' }}>
        <h2 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#FFBE07' }}>Node Library</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        {CATEGORIES.map((category) => {
          const nodes = NODE_TEMPLATES.filter((t) => t.category === category);
          if (nodes.length === 0) return null;
          return (
            <div key={category}>
              <h3 className="text-[10px] font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: '#6b7280' }}>
                {category}
              </h3>
              <div className="space-y-1.5">
                {nodes.map((template) => (
                  <div
                    key={template.type}
                    draggable
                    onDragStart={(e) => onDragStart(e, template)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-grab active:cursor-grabbing transition-all duration-150 group hover:-translate-y-0.5"
                    style={{ background: '#1a1d27', border: '1px solid #2a2d3a' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#363944'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2d3a'; }}
                  >
                    <span style={{ color: template.color }} className="transition-colors flex-shrink-0">
                      {template.icon}
                    </span>
                    <span className="text-[13px] font-medium transition-colors" style={{ color: '#d1d5db' }}>
                      {template.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
