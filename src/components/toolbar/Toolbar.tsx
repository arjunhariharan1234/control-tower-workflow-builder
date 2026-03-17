'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useWorkflowStore } from '@/store/workflow-store';
import { saveWorkflow } from '@/lib/saved-workflows';
import { generateDSL } from '@/lib/dsl-generator';

export default function Toolbar() {
  const {
    workflowName,
    workflowCode,
    workflowMetadata,
    nodes,
    edges,
    setWorkflowName,
    setWorkflowCode,
    newWorkflow,
    setShowImportModal,
    setShowDeployModal,
    setShowWorkflowsDrawer,
    validateWorkflow,
    generateJSON,
  } = useWorkflowStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [showDescModal, setShowDescModal] = useState(false);
  const [descInput, setDescInput] = useState('');

  const handleLoadFile = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { importJSON, setBottomPanel, setBottomPanelOpen } = useWorkflowStore.getState();
      const result = importJSON(text);
      if (!result.success) { setBottomPanel('errors'); setBottomPanelOpen(true); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveFile = () => {
    const json = generateJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflowCode || 'workflow'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveToLibrary = () => {
    setDescInput(useWorkflowStore.getState().workflowDescription || '');
    setShowDescModal(true);
  };

  const confirmSaveToLibrary = () => {
    const state = useWorkflowStore.getState();
    const dsl = generateDSL(nodes, edges, {
      name: state.workflowName,
      code: state.workflowCode,
      description: descInput,
      metadata: workflowMetadata,
    });
    saveWorkflow(state.workflowName, state.workflowCode, descInput, dsl);
    state.setWorkflowDescription(descInput);
    setShowDescModal(false);
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 2000);
  };

  const handleValidate = () => {
    const errors = validateWorkflow();
    if (errors.filter((e) => e.severity === 'error').length === 0) {
      alert('Workflow is valid!');
    }
  };

  return (
    <>
      <div className="h-12 flex items-center px-4 gap-3 shrink-0" style={{ background: '#13151d', borderBottom: '1px solid #2a2d3a' }}>
        {/* Logo — links back to landing */}
        <Link href="/" className="flex items-center gap-2.5 mr-3 hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#FFBE07' }}>
            <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="font-bold text-sm tracking-tight" style={{ color: '#FFBE07' }}>Control Tower</span>
        </Link>

        <div className="w-px h-6" style={{ background: '#2a2d3a' }} />

        {/* Workflow name/code */}
        <input
          type="text"
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          className="px-2 py-1 bg-transparent border border-transparent hover:border-[#2a2d3a] focus:border-[#FFBE07] rounded text-sm text-white font-medium focus:outline-none transition-colors w-52"
          placeholder="Workflow Name"
        />
        <input
          type="text"
          value={workflowCode}
          onChange={(e) => setWorkflowCode(e.target.value.toUpperCase())}
          className="px-2 py-1 bg-transparent border border-transparent hover:border-[#2a2d3a] focus:border-[#FFBE07] rounded text-xs font-mono focus:outline-none transition-colors w-36"
          style={{ color: '#9ca3af' }}
          placeholder="CODE"
        />

        <div className="flex-1" />

        <Btn onClick={() => setShowWorkflowsDrawer(true)} icon={<IconGrid />}>My Workflows</Btn>
        <div className="w-px h-5" style={{ background: '#2a2d3a' }} />
        <Btn onClick={newWorkflow} icon={<IconFile />}>New</Btn>
        <Btn onClick={() => setShowImportModal(true)} icon={<IconUpload />}>Import JSON</Btn>
        <Btn onClick={handleLoadFile} icon={<IconFolder />}>Load</Btn>
        <Btn onClick={handleSaveFile} icon={<IconSave />}>Save</Btn>
        <Btn onClick={handleSaveToLibrary} icon={<IconLibrary />}>Save to Library</Btn>
        <Btn onClick={handleValidate} variant="secondary" icon={<IconCheck />}>Validate</Btn>
        <Btn onClick={() => setShowDeployModal(true)} variant="primary" icon={<IconDeploy />}>Deploy</Btn>

        <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />
      </div>

      {/* Save toast */}
      {showSaveToast && (
        <div className="fixed top-16 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-xl" style={{ background: '#13151d', border: '1px solid rgba(16,185,129,0.3)' }}>
          <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
          <span className="text-sm text-emerald-300">Saved to library</span>
        </div>
      )}

      {/* Description modal */}
      {showDescModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="w-[420px] rounded-2xl shadow-2xl" style={{ background: '#13151d', border: '1px solid #2a2d3a' }}>
            <div className="px-6 py-4" style={{ borderBottom: '1px solid #2a2d3a' }}>
              <h2 className="text-lg font-bold text-white">Save to Library</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-medium mb-1.5" style={{ color: '#9ca3af' }}>Description</label>
                <textarea
                  value={descInput}
                  onChange={(e) => setDescInput(e.target.value)}
                  placeholder="Brief description of this workflow..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-lg resize-none focus:outline-none"
                  style={{ background: '#1a1d27', border: '1px solid #2a2d3a', color: '#d1d5db' }}
                  onFocus={(e) => (e.target.style.borderColor = '#FFBE07')}
                  onBlur={(e) => (e.target.style.borderColor = '#2a2d3a')}
                  autoFocus
                />
              </div>
              <div className="text-xs" style={{ color: '#6b7280' }}>
                Saving as <span className="font-mono font-semibold text-white">{workflowName}</span> ({workflowCode})
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid #2a2d3a' }}>
              <button onClick={() => setShowDescModal(false)} className="px-4 py-2 text-sm rounded-lg" style={{ color: '#d1d5db', background: '#1a1d27', border: '1px solid #2a2d3a' }}>Cancel</button>
              <button onClick={confirmSaveToLibrary} className="px-4 py-2 text-sm font-semibold rounded-lg" style={{ background: '#FFBE07', color: 'black' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Btn({ children, onClick, icon, variant = 'default' }: {
  children: React.ReactNode; onClick: () => void; icon?: React.ReactNode; variant?: 'default' | 'primary' | 'secondary';
}) {
  const styles = {
    default: 'text-[#9ca3af] hover:text-white hover:bg-[#22252f] border border-transparent hover:border-[#2a2d3a]',
    secondary: 'text-white bg-[#1a1d27] hover:bg-[#22252f] border border-[#2a2d3a] hover:border-[#363944]',
    primary: 'text-black font-semibold hover:brightness-110 border-0',
  };
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 ${styles[variant]}`}
      style={variant === 'primary' ? { background: '#FFBE07' } : undefined}
    >
      {icon}{children}
    </button>
  );
}

// Tiny SVG icons
const s = "w-3.5 h-3.5";
function IconGrid() { return <svg className={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>; }
function IconFile() { return <svg className={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>; }
function IconUpload() { return <svg className={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>; }
function IconFolder() { return <svg className={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>; }
function IconSave() { return <svg className={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17,21 17,13 7,13 7,21"/><polyline points="7,3 7,8 15,8"/></svg>; }
function IconLibrary() { return <svg className={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>; }
function IconCheck() { return <svg className={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>; }
function IconDeploy() { return <svg className={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>; }
