'use client';

import React, { useRef } from 'react';
import { useWorkflowStore } from '@/store/workflow-store';

export default function Toolbar() {
  const {
    workflowName,
    workflowCode,
    setWorkflowName,
    setWorkflowCode,
    newWorkflow,
    setShowImportModal,
    setShowDeployModal,
    validateWorkflow,
    generateJSON,
  } = useWorkflowStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSave = () => {
    const json = generateJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflowCode || 'workflow'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleValidate = () => {
    const errors = validateWorkflow();
    if (errors.filter((e) => e.severity === 'error').length === 0) {
      alert('Workflow is valid!');
    }
  };

  return (
    <div className="h-12 flex items-center px-4 gap-3 shrink-0" style={{ background: '#13151d', borderBottom: '1px solid #2a2d3a' }}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 mr-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#FFBE07' }}>
          <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <span className="font-bold text-sm tracking-tight" style={{ color: '#FFBE07' }}>Control Tower</span>
      </div>

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

      <Btn onClick={newWorkflow} icon={<IconFile />}>New</Btn>
      <Btn onClick={() => setShowImportModal(true)} icon={<IconUpload />}>Import JSON</Btn>
      <Btn onClick={handleLoadFile} icon={<IconFolder />}>Load</Btn>
      <Btn onClick={handleSave} icon={<IconSave />}>Save</Btn>
      <Btn onClick={handleValidate} variant="secondary" icon={<IconCheck />}>Validate</Btn>
      <Btn onClick={() => setShowDeployModal(true)} variant="primary" icon={<IconDeploy />}>Deploy</Btn>

      <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />
    </div>
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
function IconFile() { return <svg className={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>; }
function IconUpload() { return <svg className={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>; }
function IconFolder() { return <svg className={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>; }
function IconSave() { return <svg className={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17,21 17,13 7,13 7,21"/><polyline points="7,3 7,8 15,8"/></svg>; }
function IconCheck() { return <svg className={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>; }
function IconDeploy() { return <svg className={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>; }
