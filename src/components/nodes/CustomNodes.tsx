'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ExecutionStatus } from '@/types/workflow';

// ── Shared Types ─────────────────────────────────────────────────────

interface NodeData {
  label: string;
  stepType?: string;
  taskType?: string;
  executionStatus?: ExecutionStatus;
  [key: string]: unknown;
}

// ── Constants ────────────────────────────────────────────────────────

const GOLD = '#FFBE07';
const CANVAS_BG = '#0f1117';
const CARD_BG = '#1a1d27';
const PURPLE = '#9b59b6';

const handleStyle = {
  width: 10,
  height: 10,
  background: GOLD,
  border: `2px solid ${CANVAS_BG}`,
};

// ── Execution Status Helpers ─────────────────────────────────────────

function getStatusRing(status?: ExecutionStatus): string {
  switch (status) {
    case 'PENDING':
      return 'ring-2 ring-gray-500';
    case 'RUNNING':
      return 'ring-2 ring-blue-500 animate-pulse';
    case 'COMPLETED':
      return 'ring-2 ring-emerald-500';
    case 'FAILED':
      return 'ring-2 ring-red-500';
    case 'SKIPPED':
      return 'ring-2 ring-gray-500 ring-dashed';
    default:
      return '';
  }
}

function StatusBadge({ status }: { status?: ExecutionStatus }) {
  if (status === 'COMPLETED') {
    return (
      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg z-10">
        <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
    );
  }
  if (status === 'FAILED') {
    return (
      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg z-10">
        <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <line x1="6" y1="6" x2="18" y2="18" />
          <line x1="18" y1="6" x2="6" y2="18" />
        </svg>
      </span>
    );
  }
  return null;
}

// ── Selected ring helper ─────────────────────────────────────────────

function selectedRing(selected: boolean | undefined): string {
  return selected
    ? 'ring-2 ring-[#FFBE07] ring-offset-2 ring-offset-[#0f1117]'
    : '';
}

// ── START EVENT ──────────────────────────────────────────────────────

const StartEventNode = memo(({ data, selected }: NodeProps<NodeData>) => (
  <div className="flex flex-col items-center gap-2">
    <div
      className={[
        'relative w-16 h-16 rounded-full flex items-center justify-center',
        'shadow-lg shadow-yellow-900/30',
        'hover:scale-105 transition-transform duration-150',
        selectedRing(selected),
        getStatusRing(data.executionStatus),
      ].join(' ')}
      style={{ backgroundColor: GOLD }}
    >
      {/* Play icon */}
      <svg className="w-7 h-7 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11.24-7.36a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14z" />
      </svg>
      <StatusBadge status={data.executionStatus} />
    </div>
    <span className="text-xs font-semibold text-white whitespace-normal break-words max-w-[220px] text-center leading-tight">
      {data.label}
    </span>
    <Handle type="source" position={Position.Bottom} style={handleStyle} />
  </div>
));
StartEventNode.displayName = 'StartEventNode';

// ── END EVENT ────────────────────────────────────────────────────────

const EndEventNode = memo(({ data, selected }: NodeProps<NodeData>) => (
  <div className="flex flex-col items-center gap-2">
    <Handle type="target" position={Position.Top} style={handleStyle} />
    <div
      className={[
        'relative w-16 h-16 rounded-full flex items-center justify-center',
        'shadow-lg shadow-yellow-900/20',
        'hover:scale-105 transition-transform duration-150',
        selectedRing(selected),
        getStatusRing(data.executionStatus),
      ].join(' ')}
      style={{
        backgroundColor: CANVAS_BG,
        border: `3px solid ${GOLD}`,
      }}
    >
      {/* Stop icon */}
      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
        <rect x="7" y="7" width="10" height="10" rx="1.5" />
      </svg>
      <StatusBadge status={data.executionStatus} />
    </div>
    <span className="text-xs font-semibold text-white whitespace-normal break-words max-w-[220px] text-center leading-tight">
      {data.label}
    </span>
  </div>
));
EndEventNode.displayName = 'EndEventNode';

// ── SERVICE TASK ─────────────────────────────────────────────────────

const ServiceTaskNode = memo(({ data, selected }: NodeProps<NodeData>) => (
  <div className="relative">
    <Handle type="target" position={Position.Top} style={handleStyle} />
    <div
      className={[
        'relative flex min-w-[200px] max-w-[280px] rounded-xl overflow-hidden',
        'shadow-lg shadow-black/30',
        'hover:-translate-y-0.5 transition-all duration-150',
        selectedRing(selected),
        getStatusRing(data.executionStatus),
      ].join(' ')}
      style={{ backgroundColor: CARD_BG }}
    >
      {/* Gold left accent stripe */}
      <div className="w-1 flex-shrink-0" style={{ backgroundColor: GOLD }} />
      <div className="flex items-start gap-3 px-4 py-3 flex-1 min-w-0">
        {/* Gear icon */}
        <div className="flex-shrink-0 mt-0.5">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </div>
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: GOLD }}>
            Service Task
          </span>
          <span className="text-[13px] font-semibold text-white leading-tight whitespace-normal break-words max-w-[220px]">
            {data.label}
          </span>
          {data.taskType && (
            <span className="text-[10px] text-slate-500 font-mono mt-0.5">
              {data.taskType as string}
            </span>
          )}
        </div>
      </div>
      <StatusBadge status={data.executionStatus} />
    </div>
    <Handle type="source" position={Position.Bottom} style={handleStyle} />
  </div>
));
ServiceTaskNode.displayName = 'ServiceTaskNode';

// ── USER TASK ────────────────────────────────────────────────────────

const UserTaskNode = memo(({ data, selected }: NodeProps<NodeData>) => (
  <div className="relative">
    <Handle type="target" position={Position.Top} style={handleStyle} />
    <div
      className={[
        'relative flex min-w-[200px] max-w-[280px] rounded-xl overflow-hidden',
        'shadow-lg shadow-black/30',
        'hover:-translate-y-0.5 transition-all duration-150',
        selectedRing(selected),
        getStatusRing(data.executionStatus),
      ].join(' ')}
      style={{ backgroundColor: CARD_BG }}
    >
      {/* Purple left accent stripe */}
      <div className="w-1 flex-shrink-0" style={{ backgroundColor: PURPLE }} />
      <div className="flex items-start gap-3 px-4 py-3 flex-1 min-w-0">
        {/* User icon */}
        <div className="flex-shrink-0 mt-0.5">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: PURPLE }}>
            User Task
          </span>
          <span className="text-[13px] font-semibold text-white leading-tight whitespace-normal break-words max-w-[220px]">
            {data.label}
          </span>
          {data.taskType && (
            <span className="text-[10px] text-slate-500 font-mono mt-0.5">
              {data.taskType as string}
            </span>
          )}
        </div>
      </div>
      <StatusBadge status={data.executionStatus} />
    </div>
    <Handle type="source" position={Position.Bottom} style={handleStyle} />
  </div>
));
UserTaskNode.displayName = 'UserTaskNode';

// ── EXCLUSIVE GATEWAY ────────────────────────────────────────────────

const ExclusiveGatewayNode = memo(({ data, selected }: NodeProps<NodeData>) => (
  <div className="flex flex-col items-center gap-2.5">
    <Handle type="target" position={Position.Top} id="top" style={handleStyle} />
    <Handle type="target" position={Position.Left} id="left" style={handleStyle} />
    <div
      className={[
        'relative w-14 h-14 rotate-45 rounded-sm flex items-center justify-center',
        'shadow-lg shadow-yellow-900/30',
        'hover:scale-105 transition-transform duration-150',
        selectedRing(selected),
        getStatusRing(data.executionStatus),
      ].join(' ')}
      style={{ backgroundColor: GOLD }}
    >
      {/* X icon — counter-rotated */}
      <svg className="w-6 h-6 text-white -rotate-45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="7" y1="7" x2="17" y2="17" />
        <line x1="17" y1="7" x2="7" y2="17" />
      </svg>
      <StatusBadge status={data.executionStatus} />
    </div>
    <span className="text-xs font-semibold text-white whitespace-normal break-words max-w-[220px] text-center leading-tight">
      {data.label}
    </span>
    <Handle type="source" position={Position.Bottom} id="bottom" style={handleStyle} />
    <Handle type="source" position={Position.Right} id="right" style={handleStyle} />
  </div>
));
ExclusiveGatewayNode.displayName = 'ExclusiveGatewayNode';

// ── SUB PROCESS ──────────────────────────────────────────────────────

const SubProcessNode = memo(({ data, selected }: NodeProps<NodeData>) => (
  <div className="relative">
    <Handle type="target" position={Position.Top} style={handleStyle} />
    <div
      className={[
        'relative flex flex-col px-5 py-4 rounded-xl min-w-[260px] min-h-[90px]',
        'shadow-lg shadow-black/30',
        'hover:-translate-y-0.5 transition-all duration-150',
        selectedRing(selected),
        getStatusRing(data.executionStatus),
      ].join(' ')}
      style={{
        backgroundColor: '#1e2333',
        border: `2px dashed ${GOLD}`,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: GOLD }}>
          Sub-Process
        </span>
      </div>
      <span className="text-[13px] font-semibold text-white leading-tight whitespace-normal break-words max-w-[220px]">
        {data.label}
      </span>
      <StatusBadge status={data.executionStatus} />
    </div>
    <Handle type="source" position={Position.Bottom} style={handleStyle} />
  </div>
));
SubProcessNode.displayName = 'SubProcessNode';

// ── BOUNDARY EVENT TIMER ─────────────────────────────────────────────

const BoundaryEventTimerNode = memo(({ data, selected }: NodeProps<NodeData>) => (
  <div className="flex flex-col items-center gap-1.5">
    <div
      className={[
        'relative w-11 h-11 rounded-full flex items-center justify-center',
        'shadow-md shadow-yellow-900/20',
        'hover:scale-105 transition-transform duration-150',
        selectedRing(selected),
        getStatusRing(data.executionStatus),
      ].join(' ')}
      style={{
        backgroundColor: CANVAS_BG,
        border: `2px dashed ${GOLD}`,
      }}
    >
      {/* Clock icon */}
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <StatusBadge status={data.executionStatus} />
    </div>
    <span className="text-[10px] font-semibold text-white whitespace-normal break-words max-w-[220px] text-center leading-tight">
      {data.label}
    </span>
    <Handle type="source" position={Position.Bottom} style={handleStyle} />
  </div>
));
BoundaryEventTimerNode.displayName = 'BoundaryEventTimerNode';

// ── Node Types Map ───────────────────────────────────────────────────

export const nodeTypes = {
  custom_start_event: StartEventNode,
  custom_end_event: EndEventNode,
  custom_service_task: ServiceTaskNode,
  custom_user_task: UserTaskNode,
  custom_exclusive_gateway: ExclusiveGatewayNode,
  custom_sub_process: SubProcessNode,
  custom_boundary_event_timer: BoundaryEventTimerNode,
} as const;

export {
  StartEventNode,
  EndEventNode,
  ServiceTaskNode,
  UserTaskNode,
  ExclusiveGatewayNode,
  SubProcessNode,
  BoundaryEventTimerNode,
};
