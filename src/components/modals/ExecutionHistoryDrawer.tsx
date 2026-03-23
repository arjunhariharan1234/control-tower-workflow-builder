'use client';

import React, { useState } from 'react';
import { useWorkflowStore } from '@/store/workflow-store';
import { deleteExecutionRun, clearExecutionHistory } from '@/lib/execution-history';
import { ExecutionRun, ExecutionStatus } from '@/types/workflow';

const G = '#FFBE07';

const STATUS_STYLES: Record<ExecutionStatus, { bg: string; color: string; label: string }> = {
  COMPLETED: { bg: 'rgba(16,185,129,0.15)', color: '#10b981', label: 'Completed' },
  FAILED: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', label: 'Failed' },
  RUNNING: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', label: 'Running' },
  PENDING: { bg: 'rgba(107,114,128,0.15)', color: '#6b7280', label: 'Pending' },
  SKIPPED: { bg: 'rgba(107,114,128,0.15)', color: '#6b7280', label: 'Skipped' },
};

export default function ExecutionHistoryDrawer() {
  const { showHistoryDrawer, setShowHistoryDrawer, executionHistory, loadExecutionHistory, replayExecution, simulationRunning } = useWorkflowStore();
  const [filter, setFilter] = useState<'all' | 'COMPLETED' | 'FAILED'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!showHistoryDrawer) return null;

  const filtered = filter === 'all' ? executionHistory : executionHistory.filter((r) => r.status === filter);

  const stats = {
    total: executionHistory.length,
    completed: executionHistory.filter((r) => r.status === 'COMPLETED').length,
    failed: executionHistory.filter((r) => r.status === 'FAILED').length,
  };

  const handleDelete = (id: string) => {
    deleteExecutionRun(id);
    loadExecutionHistory();
    if (expandedId === id) setExpandedId(null);
  };

  const handleClearAll = () => {
    clearExecutionHistory();
    loadExecutionHistory();
    setExpandedId(null);
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '—';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setShowHistoryDrawer(false)} />
      <div className="fixed right-0 top-0 bottom-0 z-50 flex flex-col overflow-hidden" style={{ width: 520, background: '#13151d', borderLeft: '1px solid #2a2d3a' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid #2a2d3a' }}>
          <div>
            <h2 className="text-lg font-bold text-white">Execution History</h2>
            <p className="text-[11px] mt-0.5" style={{ color: '#6b7280' }}>{stats.total} runs · {stats.completed} passed · {stats.failed} failed</p>
          </div>
          <button onClick={() => setShowHistoryDrawer(false)} className="p-2 rounded-lg transition-colors hover:bg-white/5" style={{ color: '#6b7280' }}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-3 px-6 py-3 shrink-0" style={{ borderBottom: '1px solid #2a2d3a' }}>
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} color={G}>
            All ({stats.total})
          </FilterChip>
          <FilterChip active={filter === 'COMPLETED'} onClick={() => setFilter('COMPLETED')} color="#10b981">
            Passed ({stats.completed})
          </FilterChip>
          <FilterChip active={filter === 'FAILED'} onClick={() => setFilter('FAILED')} color="#ef4444">
            Failed ({stats.failed})
          </FilterChip>
          <div className="flex-1" />
          {stats.total > 0 && (
            <button onClick={handleClearAll} className="text-[10px] font-medium px-2 py-1 rounded transition-colors hover:bg-red-500/10" style={{ color: '#ef4444' }}>
              Clear All
            </button>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(255,190,7,0.08)', border: '1px solid rgba(255,190,7,0.15)' }}>
                <svg className="w-6 h-6" style={{ color: 'rgba(255,190,7,0.4)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" />
                </svg>
              </div>
              <p className="text-sm font-medium" style={{ color: '#6b7280' }}>No executions yet</p>
              <p className="text-xs mt-1" style={{ color: '#4b5563' }}>Run a simulation to see history here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((run) => (
                <RunCard
                  key={run.id}
                  run={run}
                  expanded={expandedId === run.id}
                  onToggle={() => setExpandedId(expandedId === run.id ? null : run.id)}
                  onReplay={() => replayExecution(run)}
                  onDelete={() => handleDelete(run.id)}
                  canReplay={!simulationRunning}
                  formatDuration={formatDuration}
                  formatTime={formatTime}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function RunCard({
  run, expanded, onToggle, onReplay, onDelete, canReplay, formatDuration, formatTime, formatDate,
}: {
  run: ExecutionRun; expanded: boolean; onToggle: () => void; onReplay: () => void; onDelete: () => void;
  canReplay: boolean; formatDuration: (ms?: number) => string; formatTime: (iso: string) => string; formatDate: (iso: string) => string;
}) {
  const st = STATUS_STYLES[run.status];

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#1a1d27', border: '1px solid #2a2d3a' }}>
      {/* Summary row */}
      <button onClick={onToggle} className="w-full flex items-center gap-3 p-3.5 text-left transition-colors hover:bg-white/[0.02]">
        {/* Status dot */}
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: st.color }} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white truncate">{run.workflowName}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: st.bg, color: st.color }}>{st.label}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-[10px]" style={{ color: '#6b7280' }}>
            <span>{formatDate(run.startedAt)} {formatTime(run.startedAt)}</span>
            <span>·</span>
            <span>{formatDuration(run.duration)}</span>
            <span>·</span>
            <span>{run.nodeCount} steps</span>
          </div>
        </div>

        <svg className={`w-4 h-4 transition-transform shrink-0 ${expanded ? 'rotate-180' : ''}`} style={{ color: '#6b7280' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6,9 12,15 18,9" />
        </svg>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-3.5 pb-3.5" style={{ borderTop: '1px solid #2a2d3a' }}>
          {/* Step timeline */}
          <div className="mt-3 space-y-1">
            {run.stepResults.map((step, i) => {
              const sst = STATUS_STYLES[step.status];
              return (
                <div key={i} className="flex items-center gap-2 py-1">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: sst.color }} />
                  <span className="text-[11px] flex-1 truncate" style={{ color: step.status === 'FAILED' ? '#ef4444' : '#d1d5db' }}>
                    {step.display_name}
                  </span>
                  <span className="text-[10px] font-mono shrink-0" style={{ color: '#4b5563' }}>
                    {formatDuration(step.duration)}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0" style={{ background: sst.bg, color: sst.color }}>
                    {sst.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Failed step highlight */}
          {run.failedStepKey && (
            <div className="mt-3 p-2.5 rounded-lg text-[11px]" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444' }}>
              Failed at: <span className="font-semibold">{run.stepResults.find((s) => s.step_key === run.failedStepKey)?.display_name || run.failedStepKey}</span>
              {run.stepResults.find((s) => s.step_key === run.failedStepKey)?.error && (
                <span className="block mt-0.5 text-[10px] opacity-70">
                  {run.stepResults.find((s) => s.step_key === run.failedStepKey)?.error}
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={onReplay}
              disabled={!canReplay}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all disabled:opacity-40"
              style={{ background: `${G}15`, color: G, border: `1px solid ${G}30` }}
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4v6h6M23 20v-6h-6" /><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" /></svg>
              Replay
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors hover:bg-red-500/10"
              style={{ color: '#6b7280' }}
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3,6 5,6 21,6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterChip({ children, active, onClick, color }: { children: React.ReactNode; active: boolean; onClick: () => void; color: string }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1 rounded-full text-[11px] font-medium transition-all"
      style={{
        background: active ? `${color}20` : 'transparent',
        color: active ? color : '#6b7280',
        border: `1px solid ${active ? `${color}40` : '#2a2d3a'}`,
      }}
    >
      {children}
    </button>
  );
}
