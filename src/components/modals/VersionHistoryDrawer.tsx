'use client';

import React, { useState, useEffect } from 'react';
import { useWorkflowStore } from '@/store/workflow-store';
import { WorkflowVersion, VersionDiff } from '@/types/version';
import {
  getVersionsForWorkflow,
  computeDiff,
  publishVersion,
  deleteVersion,
  getVersionStats,
} from '@/lib/version-history';

const G = '#FFBE07';

export default function VersionHistoryDrawer() {
  const { showVersionHistory, setShowVersionHistory, workflowCode, loadDSL } = useWorkflowStore();
  const [versions, setVersions] = useState<WorkflowVersion[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [diffData, setDiffData] = useState<Map<string, VersionDiff>>(new Map());

  const reload = () => {
    const v = getVersionsForWorkflow(workflowCode);
    setVersions(v);

    // Compute diffs between consecutive versions
    const diffs = new Map<string, VersionDiff>();
    for (let i = 0; i < v.length - 1; i++) {
      diffs.set(v[i].id, computeDiff(v[i + 1].dsl, v[i].dsl));
    }
    setDiffData(diffs);
  };

  useEffect(() => {
    if (showVersionHistory) {
      reload();
      setExpandedId(null);
    }
  }, [showVersionHistory, workflowCode]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!showVersionHistory) return null;

  const stats = getVersionStats(workflowCode);

  const handleRestore = (version: WorkflowVersion) => {
    loadDSL(version.dsl);
    setShowVersionHistory(false);
  };

  const handlePublish = (id: string) => {
    publishVersion(id);
    reload();
  };

  const handleDelete = (id: string) => {
    deleteVersion(id);
    reload();
    if (expandedId === id) setExpandedId(null);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
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

  const changeTypeStyles: Record<string, { bg: string; color: string; label: string }> = {
    initial: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', label: 'Initial' },
    edit: { bg: 'rgba(255,190,7,0.15)', color: G, label: 'Edit' },
    rollback: { bg: 'rgba(168,85,247,0.15)', color: '#a855f7', label: 'Rollback' },
    import: { bg: 'rgba(16,185,129,0.15)', color: '#10b981', label: 'Import' },
  };

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setShowVersionHistory(false)} />
      <div className="fixed right-0 top-0 bottom-0 z-50 flex flex-col overflow-hidden" style={{ width: 500, background: '#13151d', borderLeft: '1px solid #2a2d3a' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid #2a2d3a' }}>
          <div>
            <h2 className="text-lg font-bold text-white">Version History</h2>
            <p className="text-[11px] mt-0.5" style={{ color: '#6b7280' }}>
              {stats.totalVersions} version{stats.totalVersions !== 1 ? 's' : ''}
              {stats.publishedVersion ? ` · Published: v${stats.publishedVersion}` : ''}
            </p>
          </div>
          <button onClick={() => setShowVersionHistory(false)} className="p-2 rounded-lg hover:bg-white/5" style={{ color: '#6b7280' }}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Version list */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(255,190,7,0.08)', border: '1px solid rgba(255,190,7,0.15)' }}>
                <svg className="w-6 h-6" style={{ color: 'rgba(255,190,7,0.4)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="10" />
                </svg>
              </div>
              <p className="text-sm font-medium" style={{ color: '#6b7280' }}>No versions yet</p>
              <p className="text-xs mt-1" style={{ color: '#4b5563' }}>Save your workflow to create the first version</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[17px] top-4 bottom-4 w-px" style={{ background: '#2a2d3a' }} />

              <div className="space-y-1">
                {versions.map((version, idx) => {
                  const isLatest = idx === 0;
                  const isExpanded = expandedId === version.id;
                  const diff = diffData.get(version.id);
                  const ct = changeTypeStyles[version.changeType] || changeTypeStyles.edit;

                  return (
                    <div key={version.id} className="relative pl-10">
                      {/* Timeline dot */}
                      <div
                        className="absolute left-[11px] top-4 w-3 h-3 rounded-full border-2 z-10"
                        style={{
                          background: version.published ? '#10b981' : isLatest ? G : '#1a1d27',
                          borderColor: version.published ? '#10b981' : isLatest ? G : '#2a2d3a',
                        }}
                      />

                      {/* Card */}
                      <div
                        className="rounded-xl overflow-hidden transition-all"
                        style={{ background: '#1a1d27', border: `1px solid ${isExpanded ? '#363944' : '#2a2d3a'}` }}
                      >
                        {/* Summary */}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : version.id)}
                          className="w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-white/[0.02]"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{version.label}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: ct.bg, color: ct.color }}>
                                {ct.label}
                              </span>
                              {version.published && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                                  Published
                                </span>
                              )}
                              {isLatest && !version.published && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'rgba(255,190,7,0.15)', color: G }}>
                                  Latest
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] mt-0.5 truncate" style={{ color: '#6b7280' }}>
                              {version.changeSummary}
                            </p>
                            <p className="text-[10px] mt-0.5" style={{ color: '#4b5563' }}>
                              {formatDate(version.createdAt)} {formatTime(version.createdAt)} · {version.stepCount} steps · {version.transitionCount} edges
                            </p>
                          </div>
                          <svg className={`w-4 h-4 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} style={{ color: '#6b7280' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="6,9 12,15 18,9" />
                          </svg>
                        </button>

                        {/* Expanded */}
                        {isExpanded && (
                          <div className="px-3 pb-3" style={{ borderTop: '1px solid #2a2d3a' }}>
                            {/* Diff visualization */}
                            {diff && (
                              <div className="mt-3 space-y-1.5">
                                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#6b7280' }}>Changes from previous</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {diff.addedSteps.length > 0 && (
                                    <DiffBadge color="#10b981" label={`+${diff.addedSteps.length} step${diff.addedSteps.length > 1 ? 's' : ''}`} />
                                  )}
                                  {diff.removedSteps.length > 0 && (
                                    <DiffBadge color="#ef4444" label={`-${diff.removedSteps.length} step${diff.removedSteps.length > 1 ? 's' : ''}`} />
                                  )}
                                  {diff.modifiedSteps.length > 0 && (
                                    <DiffBadge color="#f59e0b" label={`~${diff.modifiedSteps.length} modified`} />
                                  )}
                                  {diff.addedTransitions > 0 && (
                                    <DiffBadge color="#3b82f6" label={`+${diff.addedTransitions} edge${diff.addedTransitions > 1 ? 's' : ''}`} />
                                  )}
                                  {diff.removedTransitions > 0 && (
                                    <DiffBadge color="#ef4444" label={`-${diff.removedTransitions} edge${diff.removedTransitions > 1 ? 's' : ''}`} />
                                  )}
                                  {diff.nameChanged && <DiffBadge color="#a855f7" label="name changed" />}
                                  {diff.metadataChanged && <DiffBadge color="#6b7280" label="metadata" />}
                                </div>

                                {/* Step-level details */}
                                {(diff.addedSteps.length > 0 || diff.removedSteps.length > 0 || diff.modifiedSteps.length > 0) && (
                                  <div className="mt-2 space-y-0.5">
                                    {diff.addedSteps.map((k) => {
                                      const step = version.dsl.steps.find((s) => s.step_key === k);
                                      return <StepDiffLine key={k} color="#10b981" prefix="+" name={step?.display_name || k} />;
                                    })}
                                    {diff.removedSteps.map((k) => (
                                      <StepDiffLine key={k} color="#ef4444" prefix="-" name={k} />
                                    ))}
                                    {diff.modifiedSteps.map((k) => {
                                      const step = version.dsl.steps.find((s) => s.step_key === k);
                                      return <StepDiffLine key={k} color="#f59e0b" prefix="~" name={step?.display_name || k} />;
                                    })}
                                  </div>
                                )}
                              </div>
                            )}

                            {!diff && version.changeType === 'initial' && (
                              <p className="mt-3 text-[11px]" style={{ color: '#6b7280' }}>Initial version — no previous version to compare</p>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid #2a2d3a' }}>
                              <button
                                onClick={() => handleRestore(version)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                                style={{ background: `${G}15`, color: G, border: `1px solid ${G}30` }}
                              >
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4v6h6M23 20v-6h-6" /><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" /></svg>
                                Restore
                              </button>
                              {!version.published && (
                                <button
                                  onClick={() => handlePublish(version.id)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                                  style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}
                                >
                                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                                  Publish
                                </button>
                              )}
                              {!version.published && versions.length > 1 && (
                                <button
                                  onClick={() => handleDelete(version.id)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors hover:bg-red-500/10"
                                  style={{ color: '#6b7280' }}
                                >
                                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3,6 5,6 21,6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function DiffBadge({ color, label }: { color: string; label: string }) {
  return (
    <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: `${color}15`, color }}>{label}</span>
  );
}

function StepDiffLine({ color, prefix, name }: { color: string; prefix: string; name: string }) {
  return (
    <div className="flex items-center gap-2 text-[11px] font-mono" style={{ color }}>
      <span className="w-3 text-center font-bold">{prefix}</span>
      <span className="truncate">{name}</span>
    </div>
  );
}
