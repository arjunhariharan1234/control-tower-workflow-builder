'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WorkflowTrigger, TriggerType, CRON_PRESETS, cronToHuman } from '@/types/trigger';
import { getTriggers, saveTrigger, deleteTrigger, toggleTrigger, generateWebhookUrl, getTriggerStats, addTriggerLog } from '@/lib/triggers';
import { getSavedWorkflows } from '@/lib/saved-workflows';
import { SavedWorkflow } from '@/types/workflow';
import { v4 as uuidv4 } from 'uuid';

const G = '#FFBE07';

export default function TriggersPage() {
  const router = useRouter();
  const [triggers, setTriggers] = useState<WorkflowTrigger[]>([]);
  const [workflows, setWorkflows] = useState<SavedWorkflow[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTrigger, setSelectedTrigger] = useState<WorkflowTrigger | null>(null);
  const [filter, setFilter] = useState<'all' | TriggerType>('all');
  const [copied, setCopied] = useState<string | null>(null);

  const reload = () => {
    setTriggers(getTriggers());
    setWorkflows(getSavedWorkflows());
  };

  useEffect(() => { reload(); }, []);

  const stats = getTriggerStats();
  const filtered = filter === 'all' ? triggers : triggers.filter((t) => t.type === filter);

  const handleToggle = (id: string) => {
    toggleTrigger(id);
    reload();
  };

  const handleDelete = (id: string) => {
    deleteTrigger(id);
    reload();
    if (selectedTrigger?.id === id) setSelectedTrigger(null);
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleTestWebhook = async (trigger: WorkflowTrigger) => {
    if (!trigger.webhook?.url) return;
    try {
      const res = await fetch(trigger.webhook.url, {
        method: trigger.webhook.method || 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true, triggered_by: 'manual_test', timestamp: new Date().toISOString() }),
      });
      const data = await res.json();
      addTriggerLog({
        triggerId: trigger.id,
        workflowId: trigger.workflowId,
        type: 'webhook',
        payload: { test: true },
        status: res.ok ? 'triggered' : 'failed',
        message: res.ok ? `Test webhook OK — run_id: ${data.run_id}` : `Test failed: ${res.status}`,
      });
      reload();
      alert(res.ok ? `Webhook test successful! Run ID: ${data.run_id}` : `Webhook test failed: ${res.status}`);
    } catch (err) {
      addTriggerLog({
        triggerId: trigger.id,
        workflowId: trigger.workflowId,
        type: 'webhook',
        status: 'failed',
        message: `Network error: ${(err as Error).message}`,
      });
      reload();
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0f1117' }}>
      {/* Nav */}
      <nav className="sticky top-0 z-30 flex items-center justify-between px-8 py-4" style={{ background: 'rgba(15,17,23,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #1a1d27' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: G }}>
              <svg className="w-4.5 h-4.5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-bold text-base tracking-tight" style={{ color: G }}>Control Tower</span>
          </button>
          <span className="text-sm" style={{ color: '#2a2d3a' }}>/</span>
          <span className="text-sm font-medium text-white">Triggers</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/integrations')} className="px-4 py-2 text-sm font-medium rounded-lg transition-all" style={{ color: '#d1d5db', border: '1px solid #2a2d3a' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = G; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2a2d3a'; }}>
            Integrations
          </button>
          <button onClick={() => router.push('/playground')} className="px-4 py-2 text-sm font-medium rounded-lg transition-all" style={{ color: '#d1d5db', border: '1px solid #2a2d3a' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = G; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2a2d3a'; }}>
            Playground
          </button>
        </div>
      </nav>

      {/* Header */}
      <div className="px-8 pt-8 pb-2">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Triggers & Schedules</h1>
              <p className="text-sm" style={{ color: '#9ca3af' }}>Configure webhooks, cron schedules, and event triggers to automate workflow execution.</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all hover:brightness-110"
              style={{ background: G, color: '#000' }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
              New Trigger
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-5 gap-3 mb-6">
            <StatCard label="Total Triggers" value={stats.totalTriggers} icon="⚡" />
            <StatCard label="Active" value={stats.activeTriggers} icon="✓" color="#10b981" />
            <StatCard label="Webhooks" value={stats.webhooks} icon="🔗" color="#3b82f6" />
            <StatCard label="Schedules" value={stats.schedules} icon="🕐" color="#a855f7" />
            <StatCard label="Total Runs" value={stats.totalExecutions} icon="▶" color="#f59e0b" />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 mb-6">
            {(['all', 'webhook', 'schedule', 'event'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-full text-[11px] font-medium transition-all"
                style={{
                  background: filter === f ? `${G}20` : 'transparent',
                  color: filter === f ? G : '#6b7280',
                  border: `1px solid ${filter === f ? `${G}40` : '#2a2d3a'}`,
                }}
              >
                {f === 'all' ? `All (${triggers.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)}s`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Triggers List */}
      <div className="flex-1 px-8 pb-8">
        <div className="max-w-6xl mx-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(255,190,7,0.08)', border: '1px solid rgba(255,190,7,0.15)' }}>
                <svg className="w-7 h-7" style={{ color: 'rgba(255,190,7,0.4)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <p className="text-sm font-medium" style={{ color: '#6b7280' }}>No triggers configured</p>
              <p className="text-xs mt-1" style={{ color: '#4b5563' }}>Create a webhook or schedule to automate your workflows</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((trigger) => (
                <TriggerCard
                  key={trigger.id}
                  trigger={trigger}
                  onToggle={() => handleToggle(trigger.id)}
                  onDelete={() => handleDelete(trigger.id)}
                  onTest={() => handleTestWebhook(trigger)}
                  onCopy={(text) => handleCopy(text, trigger.id)}
                  copied={copied === trigger.id}
                  onSelect={() => setSelectedTrigger(selectedTrigger?.id === trigger.id ? null : trigger)}
                  expanded={selectedTrigger?.id === trigger.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Trigger Modal */}
      {showCreateModal && (
        <CreateTriggerModal
          workflows={workflows}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { reload(); setShowCreateModal(false); }}
        />
      )}
    </div>
  );
}

// ── Trigger Card ─────────────────────────────────────────────────────

function TriggerCard({ trigger, onToggle, onDelete, onTest, onCopy, copied, onSelect, expanded }: {
  trigger: WorkflowTrigger; onToggle: () => void; onDelete: () => void; onTest: () => void;
  onCopy: (text: string) => void; copied: boolean; onSelect: () => void; expanded: boolean;
}) {
  const typeStyles: Record<TriggerType, { bg: string; color: string; icon: string }> = {
    webhook: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', icon: '🔗' },
    schedule: { bg: 'rgba(168,85,247,0.15)', color: '#a855f7', icon: '🕐' },
    event: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', icon: '⚡' },
    manual: { bg: 'rgba(107,114,128,0.15)', color: '#6b7280', icon: '▶' },
  };
  const st = typeStyles[trigger.type];

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#1a1d27', border: '1px solid #2a2d3a' }}>
      <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={onSelect}>
        {/* Active toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className="w-10 h-5 rounded-full relative transition-all shrink-0"
          style={{ background: trigger.active ? '#10b981' : '#2a2d3a' }}
        >
          <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all" style={{ left: trigger.active ? 22 : 2 }} />
        </button>

        {/* Type badge */}
        <span className="text-lg shrink-0">{st.icon}</span>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white truncate">{trigger.workflowName}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: st.bg, color: st.color }}>
              {trigger.type}
            </span>
            {!trigger.active && <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(107,114,128,0.15)', color: '#6b7280' }}>Paused</span>}
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: '#6b7280' }}>
            {trigger.type === 'webhook' && trigger.webhook?.url && (
              <span className="font-mono">{trigger.webhook.method} {trigger.webhook.url.replace(/^https?:\/\/[^/]+/, '')}</span>
            )}
            {trigger.type === 'schedule' && trigger.schedule && (
              <span>{cronToHuman(trigger.schedule.expression)} ({trigger.schedule.timezone})</span>
            )}
            {trigger.type === 'event' && trigger.event && (
              <span>On {trigger.event.eventType} from {trigger.event.source}</span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="text-right shrink-0">
          <p className="text-xs font-medium text-white">{trigger.triggerCount} runs</p>
          <p className="text-[10px]" style={{ color: '#6b7280' }}>
            {trigger.lastTriggeredAt ? `Last: ${new Date(trigger.lastTriggeredAt).toLocaleDateString()}` : 'Never triggered'}
          </p>
        </div>

        <svg className={`w-4 h-4 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} style={{ color: '#6b7280' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6,9 12,15 18,9" />
        </svg>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="px-4 pb-4" style={{ borderTop: '1px solid #2a2d3a' }}>
          <div className="pt-3 space-y-3">
            {/* Webhook URL display */}
            {trigger.type === 'webhook' && trigger.webhook?.url && (
              <div>
                <label className="block text-[10px] font-medium mb-1" style={{ color: '#6b7280' }}>Webhook URL</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 rounded-lg text-xs font-mono truncate" style={{ background: '#0f1117', color: '#d1d5db', border: '1px solid #2a2d3a' }}>
                    {trigger.webhook.url}
                  </code>
                  <button
                    onClick={(e) => { e.stopPropagation(); onCopy(trigger.webhook!.url); }}
                    className="px-3 py-2 rounded-lg text-[11px] font-medium transition-all shrink-0"
                    style={{ background: copied ? 'rgba(16,185,129,0.15)' : '#0f1117', color: copied ? '#10b981' : '#6b7280', border: '1px solid #2a2d3a' }}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            )}

            {/* Cron display */}
            {trigger.type === 'schedule' && trigger.schedule && (
              <div>
                <label className="block text-[10px] font-medium mb-1" style={{ color: '#6b7280' }}>Cron Expression</label>
                <code className="block px-3 py-2 rounded-lg text-xs font-mono" style={{ background: '#0f1117', color: '#d1d5db', border: '1px solid #2a2d3a' }}>
                  {trigger.schedule.expression}
                </code>
              </div>
            )}

            {/* cURL example for webhooks */}
            {trigger.type === 'webhook' && trigger.webhook?.url && (
              <div>
                <label className="block text-[10px] font-medium mb-1" style={{ color: '#6b7280' }}>Test with cURL</label>
                <div className="flex items-start gap-2">
                  <code className="flex-1 px-3 py-2 rounded-lg text-[10px] font-mono leading-relaxed" style={{ background: '#0f1117', color: '#9ca3af', border: '1px solid #2a2d3a' }}>
                    {`curl -X POST ${trigger.webhook.url} \\\n  -H "Content-Type: application/json" \\\n  -d '{"event": "test"}'`}
                  </code>
                  <button
                    onClick={(e) => { e.stopPropagation(); onCopy(`curl -X POST ${trigger.webhook!.url} -H "Content-Type: application/json" -d '{"event": "test"}'`); }}
                    className="px-2 py-1 rounded text-[10px] shrink-0"
                    style={{ color: '#6b7280' }}
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              {trigger.type === 'webhook' && (
                <button
                  onClick={(e) => { e.stopPropagation(); onTest(); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                  style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                  Test Webhook
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors hover:bg-red-500/10"
                style={{ color: '#6b7280' }}
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3,6 5,6 21,6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Create Trigger Modal ─────────────────────────────────────────────

function CreateTriggerModal({ workflows, onClose, onCreated }: {
  workflows: SavedWorkflow[]; onClose: () => void; onCreated: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [type, setType] = useState<TriggerType>('webhook');
  const [workflowId, setWorkflowId] = useState('');
  const [cronExpression, setCronExpression] = useState('0 9 * * *');
  const [cronTimezone, setCronTimezone] = useState('Asia/Kolkata');
  const [eventType, setEventType] = useState('LONG_STOPPAGE');
  const [eventSource, setEventSource] = useState('internal');
  const [webhookMethod, setWebhookMethod] = useState<'POST' | 'GET'>('POST');

  const selectedWorkflow = workflows.find((w) => w.id === workflowId);

  const handleCreate = () => {
    if (!workflowId || !selectedWorkflow) return;

    const trigger: WorkflowTrigger = {
      id: uuidv4(),
      workflowId,
      workflowName: selectedWorkflow.name,
      type,
      active: true,
      triggerCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (type === 'webhook') {
      trigger.webhook = {
        enabled: true,
        url: generateWebhookUrl(workflowId),
        method: webhookMethod,
      };
    } else if (type === 'schedule') {
      trigger.schedule = {
        enabled: true,
        expression: cronExpression,
        timezone: cronTimezone,
        label: cronToHuman(cronExpression),
      };
    } else if (type === 'event') {
      trigger.event = {
        enabled: true,
        eventType,
        source: eventSource,
      };
    }

    saveTrigger(trigger);
    onCreated();
  };

  const triggerTypes: { type: TriggerType; label: string; desc: string; icon: string; color: string }[] = [
    { type: 'webhook', label: 'Webhook', desc: 'Trigger via HTTP POST/GET to a unique URL', icon: '🔗', color: '#3b82f6' },
    { type: 'schedule', label: 'Schedule (Cron)', desc: 'Run on a recurring time-based schedule', icon: '🕐', color: '#a855f7' },
    { type: 'event', label: 'Event', desc: 'Trigger when a specific event occurs', icon: '⚡', color: '#f59e0b' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="w-[520px] max-h-[80vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden" style={{ background: '#13151d', border: '1px solid #2a2d3a' }}>
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid #2a2d3a' }}>
          <div>
            <h2 className="text-lg font-bold text-white">Create Trigger</h2>
            <p className="text-[11px] mt-0.5" style={{ color: '#6b7280' }}>Step {step} of 2</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5" style={{ color: '#6b7280' }}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {step === 1 ? (
            <>
              {/* Select workflow */}
              <div>
                <label className="block text-[11px] font-medium mb-2" style={{ color: '#9ca3af' }}>Workflow</label>
                {workflows.length === 0 ? (
                  <p className="text-xs p-3 rounded-lg" style={{ background: '#1a1d27', color: '#6b7280' }}>No saved workflows. Save a workflow in the Playground first.</p>
                ) : (
                  <select
                    value={workflowId}
                    onChange={(e) => setWorkflowId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ background: '#1a1d27', border: '1px solid #2a2d3a', color: '#fff' }}
                  >
                    <option value="">Select a workflow...</option>
                    {workflows.map((wf) => (
                      <option key={wf.id} value={wf.id}>{wf.name} ({wf.code})</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Select type */}
              <div>
                <label className="block text-[11px] font-medium mb-2" style={{ color: '#9ca3af' }}>Trigger Type</label>
                <div className="space-y-2">
                  {triggerTypes.map((tt) => (
                    <button
                      key={tt.type}
                      onClick={() => setType(tt.type)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                      style={{
                        background: type === tt.type ? `${tt.color}10` : '#1a1d27',
                        border: `1px solid ${type === tt.type ? `${tt.color}40` : '#2a2d3a'}`,
                      }}
                    >
                      <span className="text-xl">{tt.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-white">{tt.label}</p>
                        <p className="text-[11px]" style={{ color: '#6b7280' }}>{tt.desc}</p>
                      </div>
                      {type === tt.type && (
                        <svg className="w-5 h-5 ml-auto" style={{ color: tt.color }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Webhook config */}
              {type === 'webhook' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: '#9ca3af' }}>HTTP Method</label>
                    <div className="flex gap-2">
                      {(['POST', 'GET'] as const).map((m) => (
                        <button
                          key={m}
                          onClick={() => setWebhookMethod(m)}
                          className="px-4 py-2 rounded-lg text-xs font-medium transition-all"
                          style={{
                            background: webhookMethod === m ? 'rgba(59,130,246,0.15)' : '#1a1d27',
                            color: webhookMethod === m ? '#3b82f6' : '#6b7280',
                            border: `1px solid ${webhookMethod === m ? 'rgba(59,130,246,0.3)' : '#2a2d3a'}`,
                          }}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: '#9ca3af' }}>Webhook URL (auto-generated)</label>
                    <code className="block px-3 py-2.5 rounded-lg text-xs font-mono" style={{ background: '#1a1d27', color: '#d1d5db', border: '1px solid #2a2d3a' }}>
                      {workflowId ? generateWebhookUrl(workflowId) : 'Select a workflow first'}
                    </code>
                  </div>
                  <div className="p-3 rounded-lg text-[11px]" style={{ background: 'rgba(59,130,246,0.08)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.15)' }}>
                    This URL will accept {webhookMethod} requests and trigger the workflow. The request body will be passed as workflow input.
                  </div>
                </div>
              )}

              {/* Schedule config */}
              {type === 'schedule' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: '#9ca3af' }}>Preset Schedules</label>
                    <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                      {CRON_PRESETS.map((preset) => (
                        <button
                          key={preset.expression}
                          onClick={() => setCronExpression(preset.expression)}
                          className="px-3 py-2 rounded-lg text-[11px] text-left transition-all"
                          style={{
                            background: cronExpression === preset.expression ? 'rgba(168,85,247,0.15)' : '#1a1d27',
                            color: cronExpression === preset.expression ? '#a855f7' : '#9ca3af',
                            border: `1px solid ${cronExpression === preset.expression ? 'rgba(168,85,247,0.3)' : '#2a2d3a'}`,
                          }}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: '#9ca3af' }}>Custom Cron Expression</label>
                    <input
                      value={cronExpression}
                      onChange={(e) => setCronExpression(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm font-mono outline-none"
                      style={{ background: '#1a1d27', border: '1px solid #2a2d3a', color: '#fff' }}
                      placeholder="* * * * *"
                    />
                    <p className="text-[10px] mt-1.5" style={{ color: '#6b7280' }}>
                      Format: minute hour day-of-month month day-of-week — <span style={{ color: '#a855f7' }}>{cronToHuman(cronExpression)}</span>
                    </p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: '#9ca3af' }}>Timezone</label>
                    <select
                      value={cronTimezone}
                      onChange={(e) => setCronTimezone(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: '#1a1d27', border: '1px solid #2a2d3a', color: '#fff' }}
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                      <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                      <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Event config */}
              {type === 'event' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: '#9ca3af' }}>Event Type</label>
                    <select
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: '#1a1d27', border: '1px solid #2a2d3a', color: '#fff' }}
                    >
                      <option value="LONG_STOPPAGE">Long Stoppage</option>
                      <option value="TRANSIT_DELAY">Transit Delay</option>
                      <option value="ROUTE_DEVIATION">Route Deviation</option>
                      <option value="OVERSPEEDING">Overspeeding</option>
                      <option value="STA_BREACH">STA Breach</option>
                      <option value="NIGHT_DRIVING">Night Driving</option>
                      <option value="EWAY_BILL_EXPIRY">E-Way Bill Expiry</option>
                      <option value="TRACKING_INTERRUPTED">Tracking Interrupted</option>
                      <option value="DIVERSION">Diversion</option>
                      <option value="ORIGIN_DETENTION">Origin Detention</option>
                      <option value="DESTINATION_DETENTION">Destination Detention</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: '#9ca3af' }}>Event Source</label>
                    <select
                      value={eventSource}
                      onChange={(e) => setEventSource(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: '#1a1d27', border: '1px solid #2a2d3a', color: '#fff' }}
                    >
                      <option value="internal">Internal (Control Tower)</option>
                      <option value="ozonetel">Ozonetel</option>
                      <option value="kapture">Kapture CX</option>
                      <option value="webhook">External Webhook</option>
                    </select>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderTop: '1px solid #2a2d3a' }}>
          {step === 2 ? (
            <button onClick={() => setStep(1)} className="px-4 py-2 text-sm rounded-lg" style={{ color: '#d1d5db' }}>Back</button>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg" style={{ color: '#d1d5db', background: '#1a1d27', border: '1px solid #2a2d3a' }}>Cancel</button>
            {step === 1 ? (
              <button
                onClick={() => setStep(2)}
                disabled={!workflowId}
                className="px-5 py-2 text-sm font-semibold rounded-lg transition-all disabled:opacity-40"
                style={{ background: G, color: '#000' }}
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleCreate}
                className="px-5 py-2 text-sm font-semibold rounded-lg transition-all hover:brightness-110"
                style={{ background: G, color: '#000' }}
              >
                Create Trigger
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color?: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: '#1a1d27', border: '1px solid #2a2d3a' }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base" style={{ background: `${color || G}15`, color: color || G }}>{icon}</div>
      <div>
        <p className="text-lg font-bold text-white">{value}</p>
        <p className="text-[10px] font-medium" style={{ color: '#6b7280' }}>{label}</p>
      </div>
    </div>
  );
}
