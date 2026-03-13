'use client';

import React, { useState } from 'react';
import { useWorkflowStore } from '@/store/workflow-store';
import { ValidationError } from '@/types/workflow';

const G = '#FFBE07';

export default function ImportModal() {
  const { showImportModal, setShowImportModal, importJSON } = useWorkflowStore();
  const [jsonInput, setJsonInput] = useState('');
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [loading, setLoading] = useState(false);

  if (!showImportModal) return null;

  const handleImport = () => {
    setLoading(true); setErrors([]);
    const result = importJSON(jsonInput);
    setLoading(false);
    if (result.success) { setJsonInput(''); setErrors([]); setShowImportModal(false); }
    else setErrors(result.errors);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setJsonInput(ev.target?.result as string); setErrors([]); };
    reader.readAsText(file);
  };

  const handleClose = () => { setJsonInput(''); setErrors([]); setShowImportModal(false); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="w-[700px] max-h-[85vh] flex flex-col rounded-2xl shadow-2xl" style={{ background: '#13151d', border: '1px solid #2a2d3a' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #2a2d3a' }}>
          <h2 className="text-lg font-bold text-white">Import Workflow JSON</h2>
          <button onClick={handleClose} style={{ color: '#6b7280' }} className="hover:text-white transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <p className="text-sm" style={{ color: '#9ca3af' }}>Paste your workflow DSL JSON below or upload a JSON file.</p>
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors" style={{ background: '#1a1d27', border: '1px solid #2a2d3a' }}>
            <svg className="w-4 h-4" style={{ color: G }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
            <span className="text-sm" style={{ color: '#d1d5db' }}>Upload JSON File</span>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>
          <textarea
            value={jsonInput} onChange={(e) => { setJsonInput(e.target.value); setErrors([]); }}
            placeholder={`{\n  "name": "My Workflow",\n  "code": "MY_WORKFLOW",\n  "steps": [...],\n  "transitions": [...]\n}`}
            rows={16} spellCheck={false}
            className="w-full px-4 py-3 text-sm font-mono rounded-xl resize-none focus:outline-none leading-relaxed"
            style={{ background: '#0f1117', border: '1px solid #2a2d3a', color: '#d1d5db' }}
            onFocus={(e) => (e.target.style.borderColor = G)}
            onBlur={(e) => (e.target.style.borderColor = '#2a2d3a')}
          />
          {errors.length > 0 && (
            <div className="space-y-1 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <h3 className="text-[10px] font-bold uppercase text-red-400 mb-1">Validation Errors</h3>
              {errors.map((err, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span className={err.severity === 'error' ? 'text-red-400' : 'text-yellow-400'}>{err.severity === 'error' ? '✕' : '⚠'}</span>
                  <span className="font-mono" style={{ color: '#6b7280' }}>{err.field}:</span>
                  <span style={{ color: '#d1d5db' }}>{err.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid #2a2d3a' }}>
          <button onClick={handleClose} className="px-4 py-2 text-sm rounded-lg transition-colors" style={{ color: '#d1d5db', background: '#1a1d27', border: '1px solid #2a2d3a' }}>Cancel</button>
          <button onClick={handleImport} disabled={!jsonInput.trim() || loading} className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed" style={{ background: G, color: 'black' }}>
            {loading ? 'Validating...' : 'Import & Render'}
          </button>
        </div>
      </div>
    </div>
  );
}
