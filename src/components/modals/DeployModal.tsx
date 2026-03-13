'use client';

import React from 'react';
import { useWorkflowStore } from '@/store/workflow-store';

const G = '#FFBE07';

export default function DeployModal() {
  const { showDeployModal, setShowDeployModal, deployWorkflow, deploymentStatus, deploymentMessage, jsonPreview } = useWorkflowStore();
  if (!showDeployModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="w-[550px] flex flex-col rounded-2xl shadow-2xl" style={{ background: '#13151d', border: '1px solid #2a2d3a' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #2a2d3a' }}>
          <h2 className="text-lg font-bold text-white">Deploy Workflow</h2>
          <button onClick={() => setShowDeployModal(false)} style={{ color: '#6b7280' }} className="hover:text-white transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm" style={{ color: '#9ca3af' }}>Deploy this workflow to the Control Tower API.</p>
          <div className="px-3 py-2.5 rounded-lg" style={{ background: '#1a1d27', border: '1px solid #2a2d3a' }}>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold" style={{ color: G }}>POST</span>
              <span className="font-mono" style={{ color: '#6b7280' }}>/ft-workflow-agents/api/process-definitions/from-dsl</span>
            </div>
          </div>
          {deploymentStatus === 'deploying' && (
            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <svg className="w-5 h-5 text-blue-400 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              <span className="text-sm text-blue-300">Deploying...</span>
            </div>
          )}
          {deploymentStatus === 'success' && (
            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
              <span className="text-sm text-emerald-300">{deploymentMessage}</span>
            </div>
          )}
          {deploymentStatus === 'error' && (
            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <svg className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
              <span className="text-sm text-red-300">{deploymentMessage}</span>
            </div>
          )}
          <details className="group"><summary className="text-xs cursor-pointer hover:text-white transition-colors" style={{ color: '#6b7280' }}>View Payload</summary>
            <pre className="mt-2 p-3 rounded-lg text-xs font-mono max-h-48 overflow-auto" style={{ background: '#0f1117', border: '1px solid #2a2d3a', color: '#9ca3af' }}>{jsonPreview || '{}'}</pre>
          </details>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid #2a2d3a' }}>
          <button onClick={() => setShowDeployModal(false)} className="px-4 py-2 text-sm rounded-lg" style={{ color: '#d1d5db', background: '#1a1d27', border: '1px solid #2a2d3a' }}>Close</button>
          <button onClick={deployWorkflow} disabled={deploymentStatus === 'deploying'} className="px-4 py-2 text-sm font-semibold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed" style={{ background: G, color: 'black' }}>
            {deploymentStatus === 'deploying' ? 'Deploying...' : 'Deploy Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
