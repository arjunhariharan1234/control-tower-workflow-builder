'use client';

import React from 'react';
import { useWorkflowStore } from '@/store/workflow-store';

const G = '#FFBE07';

export default function BottomPanel() {
  const { jsonPreview, validationErrors, executionLogs, bottomPanel, bottomPanelOpen, setBottomPanel, setBottomPanelOpen } = useWorkflowStore();
  const errorCount = validationErrors.filter((e) => e.severity === 'error').length;
  const warningCount = validationErrors.filter((e) => e.severity === 'warning').length;

  return (
    <div className={`flex flex-col transition-all duration-200 ${bottomPanelOpen ? 'h-60' : 'h-9'}`} style={{ background: '#13151d', borderTop: '1px solid #2a2d3a' }}>
      <div className="flex items-center px-2 shrink-0" style={{ borderBottom: '1px solid #2a2d3a' }}>
        <Tab active={bottomPanel === 'json'} onClick={() => { setBottomPanel('json'); setBottomPanelOpen(true); }}>JSON Preview</Tab>
        <Tab active={bottomPanel === 'errors'} onClick={() => { setBottomPanel('errors'); setBottomPanelOpen(true); }}>
          Validation
          {errorCount > 0 && <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[9px] font-bold">{errorCount}</span>}
          {warningCount > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-[9px] font-bold">{warningCount}</span>}
        </Tab>
        <Tab active={bottomPanel === 'logs'} onClick={() => { setBottomPanel('logs'); setBottomPanelOpen(true); }}>Logs</Tab>
        <div className="flex-1" />
        <button onClick={() => setBottomPanelOpen(!bottomPanelOpen)} className="p-1" style={{ color: '#6b7280' }}>
          <svg className={`w-4 h-4 transition-transform ${bottomPanelOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18,15 12,9 6,15"/></svg>
        </button>
      </div>
      {bottomPanelOpen && (
        <div className="flex-1 overflow-auto">
          {bottomPanel === 'json' && (
            <pre className="p-3 text-xs font-mono leading-relaxed whitespace-pre" style={{ color: '#d1d5db' }}>
              {jsonPreview || '// Build a workflow to see the DSL JSON here'}
            </pre>
          )}
          {bottomPanel === 'errors' && (
            <div className="p-3 space-y-1">
              {validationErrors.length === 0
                ? <p className="text-xs" style={{ color: '#6b7280' }}>No validation issues. Click &quot;Validate&quot; to check.</p>
                : validationErrors.map((err, i) => (
                  <div key={i} className={`flex items-start gap-2 px-3 py-1.5 rounded text-xs ${err.severity === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                    <span className="font-bold shrink-0">{err.severity === 'error' ? '✕' : '⚠'}</span>
                    <span className="font-mono" style={{ color: '#6b7280' }}>{err.field}</span>
                    <span>{err.message}</span>
                  </div>
                ))
              }
            </div>
          )}
          {bottomPanel === 'logs' && (
            <div className="p-3 space-y-1">
              {executionLogs.length === 0
                ? <p className="text-xs" style={{ color: '#6b7280' }}>No execution logs yet.</p>
                : executionLogs.map((log, i) => <div key={i} className="text-xs font-mono" style={{ color: '#d1d5db' }}>{log}</div>)
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Tab({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="px-3 py-2 text-[11px] font-medium transition-colors flex items-center" style={{ color: active ? G : '#6b7280', borderBottom: active ? `2px solid ${G}` : '2px solid transparent' }}>
      {children}
    </button>
  );
}
