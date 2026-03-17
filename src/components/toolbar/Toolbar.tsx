'use client';

import React, { useRef, useState, useEffect } from 'react';
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
  const menuRef = useRef<HTMLDivElement>(null);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [showDescModal, setShowDescModal] = useState(false);
  const [descInput, setDescInput] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleLoadFile = () => { fileInputRef.current?.click(); setMenuOpen(false); };

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

  const handleExportFile = () => {
    const json = generateJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflowCode || 'workflow'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMenuOpen(false);
  };

  const handleSaveToLibrary = () => {
    setDescInput(useWorkflowStore.getState().workflowDescription || '');
    setShowDescModal(true);
    setMenuOpen(false);
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
    setMenuOpen(false);
  };

  const menuItems: { label: string; icon: React.ReactNode; onClick: () => void; separator?: boolean }[] = [
    { label: 'New Workflow', icon: <IconFile />, onClick: () => { newWorkflow(); setMenuOpen(false); } },
    { label: 'My Workflows', icon: <IconGrid />, onClick: () => { setShowWorkflowsDrawer(true); setMenuOpen(false); }, separator: true },
    { label: 'Import JSON', icon: <IconUpload />, onClick: () => { setShowImportModal(true); setMenuOpen(false); } },
    { label: 'Load from File', icon: <IconFolder />, onClick: handleLoadFile },
    { label: 'Export as JSON', icon: <IconDownload />, onClick: handleExportFile, separator: true },
    { label: 'Save to Library', icon: <IconSave />, onClick: handleSaveToLibrary, separator: true },
    { label: 'Validate', icon: <IconCheck />, onClick: handleValidate },
  ];

  return (
    <>
      <div className="h-12 flex items-center px-4 gap-3 shrink-0" style={{ background: '#13151d', borderBottom: '1px solid #2a2d3a' }}>
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 mr-1 hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#FFBE07' }}>
            <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
        </Link>

        {/* Hamburger menu */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150"
            style={{
              background: menuOpen ? '#22252f' : 'transparent',
              border: `1px solid ${menuOpen ? '#363944' : 'transparent'}`,
              color: menuOpen ? '#fff' : '#9ca3af',
            }}
            onMouseEnter={(e) => { if (!menuOpen) { e.currentTarget.style.background = '#1a1d27'; e.currentTarget.style.color = '#fff'; }}}
            onMouseLeave={(e) => { if (!menuOpen) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div
              className="absolute top-full left-0 mt-1.5 w-52 rounded-xl shadow-2xl z-50 py-1.5 overflow-hidden"
              style={{ background: '#1a1d27', border: '1px solid #2a2d3a' }}
            >
              {menuItems.map((item, idx) => (
                <React.Fragment key={item.label}>
                  {item.separator && idx > 0 && (
                    <div className="my-1.5 mx-3" style={{ borderTop: '1px solid #2a2d3a' }} />
                  )}
                  <button
                    onClick={item.onClick}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium transition-colors text-left"
                    style={{ color: '#d1d5db' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#22252f'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#d1d5db'; }}
                  >
                    <span style={{ color: '#6b7280' }}>{item.icon}</span>
                    {item.label}
                  </button>
                </React.Fragment>
              ))}
            </div>
          )}
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

        {/* Deploy — always visible */}
        <button
          onClick={() => setShowDeployModal(true)}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 hover:brightness-110"
          style={{ background: '#FFBE07', color: '#000' }}
        >
          <IconDeploy />
          Deploy
        </button>

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

// Tiny SVG icons
const s = "w-3.5 h-3.5";
function IconGrid() { return <svg className={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>; }
function IconFile() { return <svg className={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>; }
function IconUpload() { return <svg className={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>; }
function IconFolder() { return <svg className={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>; }
function IconSave() { return <svg className={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17,21 17,13 7,13 7,21"/><polyline points="7,3 7,8 15,8"/></svg>; }
function IconDownload() { return <svg className={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>; }
function IconCheck() { return <svg className={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>; }
function IconDeploy() { return <svg className={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>; }
