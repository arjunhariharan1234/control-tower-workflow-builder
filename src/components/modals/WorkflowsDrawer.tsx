'use client';

import React, { useState, useEffect } from 'react';
import { useWorkflowStore } from '@/store/workflow-store';
import { SavedWorkflow } from '@/types/workflow';
import { getSavedWorkflows, deleteSavedWorkflow } from '@/lib/saved-workflows';
import { WORKFLOW_TEMPLATES } from '@/lib/templates';

const G = '#FFBE07';

export default function WorkflowsDrawer() {
  const { showWorkflowsDrawer, setShowWorkflowsDrawer, workflowsDrawerTab, loadDSL } = useWorkflowStore();
  const [savedWorkflows, setSavedWorkflows] = useState<SavedWorkflow[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [tab, setTab] = useState<'saved' | 'templates'>(workflowsDrawerTab || 'saved');

  useEffect(() => {
    if (showWorkflowsDrawer) {
      setSavedWorkflows(getSavedWorkflows());
      setDeleteConfirm(null);
      if (workflowsDrawerTab) setTab(workflowsDrawerTab);
    }
  }, [showWorkflowsDrawer, workflowsDrawerTab]);

  if (!showWorkflowsDrawer) return null;

  const handleDelete = (id: string) => {
    deleteSavedWorkflow(id);
    setSavedWorkflows(getSavedWorkflows());
    setDeleteConfirm(null);
  };

  const handleLoadSaved = (wf: SavedWorkflow) => {
    loadDSL(wf.dsl);
    setShowWorkflowsDrawer(false);
  };

  const handleLoadTemplate = (templateId: string) => {
    const template = WORKFLOW_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      loadDSL(template.dsl);
      setShowWorkflowsDrawer(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 transition-opacity"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
        onClick={() => setShowWorkflowsDrawer(false)}
      />

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 z-50 h-full w-[480px] flex flex-col shadow-2xl"
        style={{ background: '#13151d', borderLeft: '1px solid #2a2d3a' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid #2a2d3a' }}>
          <h2 className="text-lg font-bold text-white">My Workflows</h2>
          <button onClick={() => setShowWorkflowsDrawer(false)} style={{ color: '#6b7280' }} className="hover:text-white transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 shrink-0" style={{ borderBottom: '1px solid #2a2d3a' }}>
          <button
            onClick={() => setTab('saved')}
            className="px-4 py-2.5 text-xs font-medium transition-colors"
            style={{ color: tab === 'saved' ? G : '#6b7280', borderBottom: tab === 'saved' ? `2px solid ${G}` : '2px solid transparent' }}
          >
            Saved ({savedWorkflows.length})
          </button>
          <button
            onClick={() => setTab('templates')}
            className="px-4 py-2.5 text-xs font-medium transition-colors"
            style={{ color: tab === 'templates' ? G : '#6b7280', borderBottom: tab === 'templates' ? `2px solid ${G}` : '2px solid transparent' }}
          >
            Templates ({WORKFLOW_TEMPLATES.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {tab === 'saved' && (
            <>
              {savedWorkflows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <svg className="w-12 h-12 mb-4" style={{ color: '#2a2d3a' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" />
                  </svg>
                  <p className="text-sm mb-1" style={{ color: '#6b7280' }}>No saved workflows yet</p>
                  <p className="text-xs" style={{ color: '#4a4d5a' }}>Use &quot;Save to Library&quot; to save your work</p>
                </div>
              ) : (
                savedWorkflows.map((wf) => (
                  <div
                    key={wf.id}
                    className="p-4 rounded-xl transition-all duration-200 group"
                    style={{ background: '#1a1d27', border: '1px solid #2a2d3a' }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-white truncate">{wf.name}</h3>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0" style={{ background: '#13151d', color: '#6b7280' }}>{wf.code}</span>
                        </div>
                        <p className="text-xs mt-1 line-clamp-2" style={{ color: '#6b7280' }}>{wf.description || 'No description'}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[10px]" style={{ color: '#4a4d5a' }}>
                        {new Date(wf.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <div className="flex items-center gap-2">
                        {deleteConfirm === wf.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleDelete(wf.id)} className="px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">Delete</button>
                            <button onClick={() => setDeleteConfirm(null)} className="px-2.5 py-1 text-[10px] rounded-lg" style={{ color: '#6b7280' }}>Cancel</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(wf.id)}
                            className="p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100 hover:bg-red-500/10"
                            style={{ color: '#6b7280' }}
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3,6 5,6 21,6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleLoadSaved(wf)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                          style={{ background: G, color: 'black' }}
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {tab === 'templates' && (
            <>
              {WORKFLOW_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleLoadTemplate(template.id)}
                  className="w-full text-left p-4 rounded-xl transition-all duration-200 group hover:-translate-y-0.5"
                  style={{ background: '#1a1d27', border: '1px solid #2a2d3a' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = G; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2d3a'; }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(255,190,7,0.1)' }}>
                      <svg className="w-4.5 h-4.5" style={{ color: G }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                      </svg>
                    </div>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded" style={{ background: 'rgba(255,190,7,0.08)', color: G }}>{template.category}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1">{template.name}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: '#6b7280' }}>{template.description}</p>
                  <div className="flex items-center gap-1.5 mt-2.5 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: G }}>
                    <span>Load into builder</span>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </>
  );
}
