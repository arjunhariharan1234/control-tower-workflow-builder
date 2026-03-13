'use client';

import React, { useState, useEffect } from 'react';
import { useWorkflowStore } from '@/store/workflow-store';
import { StepType } from '@/types/workflow';

const STEP_TYPES: StepType[] = ['START_EVENT','END_EVENT','SERVICE_TASK','USER_TASK','EXCLUSIVE_GATEWAY','SUB_PROCESS','BOUNDARY_EVENT_TIMER'];
const G = '#FFBE07';

export default function NodeConfigPanel() {
  const { nodes, edges, selectedNodeId, selectedEdgeId, updateNodeData, deleteNode } = useWorkflowStore();
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId);

  if (selectedEdge) return <EdgeConfigPanel />;

  if (!selectedNode) {
    return (
      <div className="w-72 flex flex-col h-full" style={{ background: '#13151d', borderLeft: '1px solid #2a2d3a' }}>
        <div className="px-4 py-3" style={{ borderBottom: '1px solid #2a2d3a' }}>
          <h2 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: G }}>Properties</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-sm text-center" style={{ color: '#6b7280' }}>Select a node or edge to view its properties</p>
        </div>
      </div>
    );
  }

  const data = selectedNode.data;

  return (
    <div className="w-72 flex flex-col h-full overflow-hidden" style={{ background: '#13151d', borderLeft: '1px solid #2a2d3a' }}>
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #2a2d3a' }}>
        <h2 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: G }}>Properties</h2>
        <button onClick={() => deleteNode(selectedNode.id)} className="text-[10px] px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">Delete</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <Field label="Step Key">
          <input type="text" value={selectedNode.id} disabled className="w-full inp text-[#6b7280] font-mono" />
        </Field>
        <Field label="Display Name">
          <input type="text" value={data.label || ''} onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })} className="w-full inp text-white focus:border-[#FFBE07]" />
        </Field>
        <Field label="Step Type">
          <select value={data.stepType || ''} onChange={(e) => updateNodeData(selectedNode.id, { stepType: e.target.value })} className="w-full inp text-white focus:border-[#FFBE07]">
            {STEP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        {(data.stepType === 'SERVICE_TASK' || data.stepType === 'USER_TASK') && (
          <Field label="Task Type">
            <input type="text" value={data.taskType || ''} onChange={(e) => updateNodeData(selectedNode.id, { taskType: e.target.value })} placeholder="e.g., CALL_TASK" className="w-full inp text-white focus:border-[#FFBE07] placeholder:text-[#363944]" />
          </Field>
        )}
        <ConfigEditor nodeId={selectedNode.id} config={data.config || {}} />
        {(data.stepType === 'SERVICE_TASK' || data.stepType === 'USER_TASK') && (
          <MandatoryInputEditor nodeId={selectedNode.id} inputs={data.mandatoryInput || {}} />
        )}
        {data.stepType === 'BOUNDARY_EVENT_TIMER' && (
          <>
            <Field label="Timer Value"><input type="text" value={data.timerValue || ''} onChange={(e) => updateNodeData(selectedNode.id, { timerValue: e.target.value })} placeholder="e.g., PT20M" className="w-full inp text-white focus:border-[#FFBE07] placeholder:text-[#363944]" /></Field>
            <Field label="Interrupting">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={data.interrupting ?? true} onChange={(e) => updateNodeData(selectedNode.id, { interrupting: e.target.checked })} className="rounded accent-[#FFBE07]" />
                <span className="text-sm text-[#d1d5db]">Interrupting</span>
              </label>
            </Field>
            <Field label="Timeout Transition To"><input type="text" value={data.onTimeoutTransitionTo || ''} onChange={(e) => updateNodeData(selectedNode.id, { onTimeoutTransitionTo: e.target.value })} placeholder="Step key" className="w-full inp text-white focus:border-[#FFBE07] placeholder:text-[#363944]" /></Field>
          </>
        )}
        <div className="pt-2" style={{ borderTop: '1px solid #2a2d3a' }}>
          <h3 className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#6b7280' }}>Position</h3>
          <div className="grid grid-cols-2 gap-2">
            <Field label="X" compact><input type="number" value={Math.round(selectedNode.position.x)} readOnly className="w-full inp text-[#6b7280] font-mono text-xs" /></Field>
            <Field label="Y" compact><input type="number" value={Math.round(selectedNode.position.y)} readOnly className="w-full inp text-[#6b7280] font-mono text-xs" /></Field>
          </div>
        </div>
      </div>
      <style jsx>{`
        .inp { padding: 6px 10px; font-size: 13px; border-radius: 6px; background: #1a1d27; border: 1px solid #2a2d3a; outline: none; transition: border-color 0.15s; }
        .inp:focus { border-color: #FFBE07; }
      `}</style>
    </div>
  );
}

function EdgeConfigPanel() {
  const { edges, selectedEdgeId, updateEdgeData } = useWorkflowStore();
  const edge = edges.find((e) => e.id === selectedEdgeId);
  if (!edge) return null;
  const transition = edge.data?.transition || {};

  return (
    <div className="w-72 flex flex-col h-full overflow-hidden" style={{ background: '#13151d', borderLeft: '1px solid #2a2d3a' }}>
      <div className="px-4 py-3" style={{ borderBottom: '1px solid #2a2d3a' }}>
        <h2 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#FFBE07' }}>Edge Properties</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <Field label="From"><input type="text" value={edge.source} disabled className="w-full px-2.5 py-1.5 text-xs rounded-md font-mono" style={{ background: '#1a1d27', border: '1px solid #2a2d3a', color: '#6b7280' }} /></Field>
        <Field label="To"><input type="text" value={edge.target} disabled className="w-full px-2.5 py-1.5 text-xs rounded-md font-mono" style={{ background: '#1a1d27', border: '1px solid #2a2d3a', color: '#6b7280' }} /></Field>
        <Field label="Default Path">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={transition.default || false} onChange={(e) => updateEdgeData(edge.id, { transition: { ...transition, default: e.target.checked } })} className="rounded accent-[#FFBE07]" />
            <span className="text-sm" style={{ color: '#d1d5db' }}>Is Default</span>
          </label>
        </Field>
        <Field label="Condition Expression">
          <textarea value={transition.condition_expression || ''} onChange={(e) => updateEdgeData(edge.id, { transition: { ...transition, condition_expression: e.target.value } })} placeholder="e.g., duration_minutes < 60" rows={3} className="w-full px-2.5 py-1.5 text-xs rounded-md font-mono resize-none focus:outline-none" style={{ background: '#1a1d27', border: '1px solid #2a2d3a', color: 'white' }} />
        </Field>
        <ConditionBuilder edgeId={edge.id} transition={transition} />
      </div>
    </div>
  );
}

function ConditionBuilder({ edgeId, transition }: { edgeId: string; transition: Record<string, unknown> }) {
  const { updateEdgeData } = useWorkflowStore();
  const condition = (transition.condition as { variable?: string; operator?: string; value?: unknown }) || {};
  const update = (field: string, value: unknown) => updateEdgeData(edgeId, { transition: { ...transition, condition: { ...condition, [field]: value } } });
  const inp = "w-full px-2.5 py-1.5 text-xs rounded-md focus:outline-none";
  const s = { background: '#1a1d27', border: '1px solid #2a2d3a', color: 'white' };

  return (
    <div className="pt-2" style={{ borderTop: '1px solid #2a2d3a' }}>
      <h3 className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#6b7280' }}>Condition</h3>
      <div className="space-y-2">
        <input type="text" value={(condition.variable as string) || ''} onChange={(e) => update('variable', e.target.value)} placeholder="Variable" className={inp} style={s} />
        <select value={(condition.operator as string) || ''} onChange={(e) => update('operator', e.target.value)} className={inp} style={s}>
          <option value="">Select operator</option>
          <option value="==">== (equals)</option>
          <option value="!=">!= (not equals)</option>
          <option value="<">&lt;</option>
          <option value="<=">&lt;=</option>
          <option value=">">&gt;</option>
          <option value=">=">&gt;=</option>
        </select>
        <input type="text" value={condition.value !== undefined ? String(condition.value) : ''} onChange={(e) => { const v = e.target.value; update('value', isNaN(Number(v)) ? v : Number(v)); }} placeholder="Value" className={inp} style={s} />
      </div>
    </div>
  );
}

function ConfigEditor({ nodeId, config }: { nodeId: string; config: Record<string, unknown> }) {
  const { updateNodeData } = useWorkflowStore();
  const [entries, setEntries] = useState<[string, string][]>([]);
  useEffect(() => { setEntries(Object.entries(config).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)])); }, [nodeId]); // eslint-disable-line react-hooks/exhaustive-deps
  const sync = (u: [string, string][]) => { const o: Record<string, unknown> = {}; for (const [k, v] of u) { if (k.trim()) { try { o[k] = JSON.parse(v); } catch { o[k] = v; } } } updateNodeData(nodeId, { config: o }); };

  return (
    <div className="pt-2" style={{ borderTop: '1px solid #2a2d3a' }}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#6b7280' }}>Config</h3>
        <button onClick={() => { const u: [string, string][] = [...entries, ['', '']]; setEntries(u); }} className="text-[10px] font-medium" style={{ color: '#FFBE07' }}>+ Add</button>
      </div>
      <div className="space-y-2">
        {entries.map(([key, value], i) => (
          <div key={i} className="flex gap-1">
            <input type="text" value={key} onChange={(e) => { const u: [string, string][] = [...entries]; u[i] = [e.target.value, value]; setEntries(u); sync(u); }} placeholder="key" className="w-1/3 px-2 py-1 text-[11px] rounded" style={{ background: '#1a1d27', border: '1px solid #2a2d3a', color: 'white' }} />
            <input type="text" value={value} onChange={(e) => { const u: [string, string][] = [...entries]; u[i] = [key, e.target.value]; setEntries(u); sync(u); }} placeholder="value" className="flex-1 px-2 py-1 text-[11px] rounded" style={{ background: '#1a1d27', border: '1px solid #2a2d3a', color: 'white' }} />
            <button onClick={() => { const u = entries.filter((_, j) => j !== i); setEntries(u); sync(u); }} className="text-red-400 hover:text-red-300 px-1">x</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function MandatoryInputEditor({ nodeId, inputs }: { nodeId: string; inputs: Record<string, unknown> }) {
  const { updateNodeData } = useWorkflowStore();
  const [entries, setEntries] = useState<[string, { type: string; required: boolean; description: string }][]>([]);
  useEffect(() => { setEntries(Object.entries(inputs).map(([k, v]) => { const val = v as { type?: string; required?: boolean; description?: string }; return [k, { type: val?.type || 'string', required: val?.required ?? true, description: val?.description || '' }] as [string, { type: string; required: boolean; description: string }]; })); }, [nodeId]); // eslint-disable-line react-hooks/exhaustive-deps
  const sync = (u: typeof entries) => { const o: Record<string, unknown> = {}; for (const [k, v] of u) { if (k.trim()) o[k] = v; } updateNodeData(nodeId, { mandatoryInput: o }); };

  return (
    <div className="pt-2" style={{ borderTop: '1px solid #2a2d3a' }}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#6b7280' }}>Mandatory Input</h3>
        <button onClick={() => setEntries([...entries, ['', { type: 'string', required: true, description: '' }]] as typeof entries)} className="text-[10px] font-medium" style={{ color: '#FFBE07' }}>+ Add</button>
      </div>
      <div className="space-y-2">
        {entries.map(([key, val], i) => (
          <div key={i} className="p-2 rounded" style={{ background: '#1a1d27', border: '1px solid #2a2d3a' }}>
            <div className="flex gap-1 items-center">
              <input type="text" value={key} onChange={(e) => { const u = [...entries] as typeof entries; u[i] = [e.target.value, val]; setEntries(u); sync(u); }} placeholder="Field name" className="flex-1 px-2 py-1 text-[11px] rounded" style={{ background: '#22252f', border: '1px solid #2a2d3a', color: 'white' }} />
              <button onClick={() => { const u = entries.filter((_, j) => j !== i); setEntries(u); sync(u); }} className="text-red-400 px-1 text-xs">x</button>
            </div>
            <select value={val.type} onChange={(e) => { const u = [...entries] as typeof entries; u[i] = [key, { ...val, type: e.target.value }]; setEntries(u); sync(u); }} className="w-full mt-1 px-2 py-1 text-[11px] rounded" style={{ background: '#22252f', border: '1px solid #2a2d3a', color: 'white' }}>
              <option value="string">string</option><option value="number">number</option><option value="boolean">boolean</option><option value="object">object</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children, compact }: { label: string; children: React.ReactNode; compact?: boolean }) {
  return <div><label className={`block ${compact ? 'text-[9px]' : 'text-[11px]'} font-medium mb-1`} style={{ color: '#9ca3af' }}>{label}</label>{children}</div>;
}
