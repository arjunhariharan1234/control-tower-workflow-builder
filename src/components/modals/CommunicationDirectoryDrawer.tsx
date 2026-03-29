'use client';

import React, { useState, useEffect } from 'react';
import { useWorkflowStore } from '@/store/workflow-store';
import { NotificationRecipient, GROUP_TYPES, getGroupCategory } from '@/types/recipient';

const G = '#FFBE07';

// ── Channel icon helpers ──────────────────────────────────────────────────────
function ChannelIcon({ active, title, children }: { active: boolean; title: string; children: React.ReactNode }) {
  return (
    <span title={title} style={{ color: active ? '#10b981' : '#3a3d4a', display: 'inline-flex', alignItems: 'center' }}>
      {children}
    </span>
  );
}

function IconEmail({ active }: { active: boolean }) {
  return (
    <ChannelIcon active={active} title="Email To">
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    </ChannelIcon>
  );
}

function IconCC({ active }: { active: boolean }) {
  return (
    <ChannelIcon active={active} title="Email CC">
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
        <line x1="8" y1="20" x2="16" y2="20" strokeDasharray="2 2" />
      </svg>
    </ChannelIcon>
  );
}

function IconSms({ active }: { active: boolean }) {
  return (
    <ChannelIcon active={active} title="SMS">
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    </ChannelIcon>
  );
}

function IconWhatsapp({ active }: { active: boolean }) {
  return (
    <ChannelIcon active={active} title="WhatsApp">
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
      </svg>
    </ChannelIcon>
  );
}

function IconVoice({ active }: { active: boolean }) {
  return (
    <ChannelIcon active={active} title="Voice">
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.64 19.79 19.79 0 01.22 1.04 2 2 0 012.22 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
      </svg>
    </ChannelIcon>
  );
}

// ── Badge ────────────────────────────────────────────────────────────────────
function GroupBadge({ groupType }: { groupType: string }) {
  const category = getGroupCategory(groupType);
  const label = GROUP_TYPES.find(g => g.value === groupType)?.label ?? groupType;

  const styles: Record<string, { bg: string; color: string }> = {
    escalation: { bg: 'rgba(255,190,7,0.15)', color: '#FFBE07' },
    department: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
    custom: { bg: 'rgba(107,114,128,0.15)', color: '#6b7280' },
  };
  const { bg, color } = styles[category] ?? styles.custom;

  return (
    <span
      className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
      style={{ background: bg, color }}
    >
      {label}
    </span>
  );
}

// ── Input helper ──────────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, required }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium mb-1" style={{ color: '#9ca3af' }}>
        {label}{required && <span style={{ color: G }}> *</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-1.5 text-sm rounded-lg focus:outline-none"
        style={{ background: '#13151d', border: '1px solid #2a2d3a', color: '#d1d5db' }}
        onFocus={e => (e.target.style.borderColor = G)}
        onBlur={e => (e.target.style.borderColor = '#2a2d3a')}
      />
    </div>
  );
}

// ── Main drawer ───────────────────────────────────────────────────────────────
export default function CommunicationDirectoryDrawer() {
  const { showDirectoryDrawer, setShowDirectoryDrawer } = useWorkflowStore();

  const [recipients, setRecipients] = useState<NotificationRecipient[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formGroupType, setFormGroupType] = useState('');
  const [formCustomGroup, setFormCustomGroup] = useState('');
  const [formEmailTo, setFormEmailTo] = useState('');
  const [formEmailCc, setFormEmailCc] = useState('');
  const [formSms, setFormSms] = useState('');
  const [formWhatsapp, setFormWhatsapp] = useState('');
  const [formVoice, setFormVoice] = useState('');

  const fetchRecipients = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/recipients');
      if (res.ok) {
        const data = await res.json();
        setRecipients(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showDirectoryDrawer) {
      fetchRecipients();
      setShowForm(false);
      setEditingId(null);
      setExpandedId(null);
      setFilter('');
      setSearch('');
    }
  }, [showDirectoryDrawer]);

  if (!showDirectoryDrawer) return null;

  // ── Derived list ──────────────────────────────────────────────────────────
  const filtered = recipients.filter(r => {
    if (filter && r.group_type !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      const nameMatch = r.name.toLowerCase().includes(q);
      const emailMatch = r.email_to?.toLowerCase().includes(q) || r.email_cc?.toLowerCase().includes(q);
      if (!nameMatch && !emailMatch) return false;
    }
    return true;
  });

  // ── Form helpers ──────────────────────────────────────────────────────────
  const openAddForm = () => {
    setEditingId(null);
    setFormName('');
    setFormGroupType('');
    setFormCustomGroup('');
    setFormEmailTo('');
    setFormEmailCc('');
    setFormSms('');
    setFormWhatsapp('');
    setFormVoice('');
    setShowForm(true);
  };

  const openEditForm = (r: NotificationRecipient) => {
    const isKnown = GROUP_TYPES.some(g => g.value === r.group_type);
    setEditingId(r.id);
    setFormName(r.name);
    setFormGroupType(isKnown ? r.group_type : '__custom__');
    setFormCustomGroup(isKnown ? '' : r.group_type);
    setFormEmailTo(r.email_to ?? '');
    setFormEmailCc(r.email_cc ?? '');
    setFormSms(r.sms ?? '');
    setFormWhatsapp(r.whatsapp ?? '');
    setFormVoice(r.voice ?? '');
    setShowForm(true);
  };

  const resolvedGroupType = formGroupType === '__custom__' ? formCustomGroup.trim() : formGroupType;

  const handleSave = async () => {
    if (!formName.trim() || !resolvedGroupType) return;
    const body = {
      name: formName.trim(),
      group_type: resolvedGroupType,
      email_to: formEmailTo.trim() || null,
      email_cc: formEmailCc.trim() || null,
      sms: formSms.trim() || null,
      whatsapp: formWhatsapp.trim() || null,
      voice: formVoice.trim() || null,
    };

    if (editingId !== null) {
      await fetch(`/api/recipients/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } else {
      await fetch('/api/recipients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }

    setShowForm(false);
    setEditingId(null);
    fetchRecipients();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/recipients/${id}`, { method: 'DELETE' });
    if (expandedId === id) setExpandedId(null);
    fetchRecipients();
  };

  // ── All known group_types present in current data for filter pill ─────────
  const allGroupTypes = Array.from(new Set(recipients.map(r => r.group_type)));

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        onClick={() => setShowDirectoryDrawer(false)}
      />

      {/* Slide-over panel */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col overflow-hidden"
        style={{ width: 480, background: '#13151d', borderLeft: '1px solid #2a2d3a' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid #2a2d3a' }}>
          <div>
            <h2 className="text-lg font-bold text-white">Communication Directory</h2>
            <p className="text-[11px] mt-0.5" style={{ color: '#6b7280' }}>
              {recipients.length} recipient{recipients.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!showForm && (
              <button
                onClick={openAddForm}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{ background: `${G}15`, color: G, border: `1px solid ${G}30` }}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add
              </button>
            )}
            <button
              onClick={() => setShowDirectoryDrawer(false)}
              className="p-2 rounded-lg hover:bg-white/5"
              style={{ color: '#6b7280' }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {showForm ? (
            /* ── Add / Edit form ─────────────────────────────────────────── */
            <div className="px-6 py-4 space-y-4">
              <h3 className="text-sm font-bold text-white">
                {editingId !== null ? 'Edit Recipient' : 'New Recipient'}
              </h3>

              <Field label="Name" value={formName} onChange={setFormName} placeholder="e.g. Ops Team L1" required />

              {/* Group Type */}
              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: '#9ca3af' }}>
                  Group Type<span style={{ color: G }}> *</span>
                </label>
                <select
                  value={formGroupType}
                  onChange={e => setFormGroupType(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded-lg focus:outline-none"
                  style={{ background: '#13151d', border: '1px solid #2a2d3a', color: formGroupType ? '#d1d5db' : '#6b7280' }}
                  onFocus={e => (e.target.style.borderColor = G)}
                  onBlur={e => (e.target.style.borderColor = '#2a2d3a')}
                >
                  <option value="" disabled>Select group type...</option>
                  {GROUP_TYPES.map(g => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                  <option value="__custom__">Custom...</option>
                </select>
              </div>

              {formGroupType === '__custom__' && (
                <Field
                  label="Custom Group Type"
                  value={formCustomGroup}
                  onChange={setFormCustomGroup}
                  placeholder="e.g. FINANCE_TEAM"
                  required
                />
              )}

              <Field label="Email To" value={formEmailTo} onChange={setFormEmailTo} placeholder="ops@company.com" />
              <Field label="Email CC" value={formEmailCc} onChange={setFormEmailCc} placeholder="manager@company.com" />
              <Field label="SMS" value={formSms} onChange={setFormSms} placeholder="+60123456789" />
              <Field label="WhatsApp" value={formWhatsapp} onChange={setFormWhatsapp} placeholder="+60123456789" />
              <Field label="Voice" value={formVoice} onChange={setFormVoice} placeholder="+60123456789" />

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => { setShowForm(false); setEditingId(null); }}
                  className="px-4 py-1.5 text-sm rounded-lg"
                  style={{ color: '#d1d5db', background: '#1a1d27', border: '1px solid #2a2d3a' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!formName.trim() || !resolvedGroupType}
                  className="px-4 py-1.5 text-sm font-semibold rounded-lg disabled:opacity-40"
                  style={{ background: G, color: '#000' }}
                >
                  {editingId !== null ? 'Save Changes' : 'Add Recipient'}
                </button>
              </div>
            </div>
          ) : (
            /* ── List view ────────────────────────────────────────────────── */
            <div className="px-4 py-3 space-y-3">
              {/* Search */}
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                  style={{ color: '#6b7280' }}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg focus:outline-none"
                  style={{ background: '#1a1d27', border: '1px solid #2a2d3a', color: '#d1d5db' }}
                  onFocus={e => (e.target.style.borderColor = '#363944')}
                  onBlur={e => (e.target.style.borderColor = '#2a2d3a')}
                />
              </div>

              {/* Filter pills */}
              {allGroupTypes.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setFilter('')}
                    className="text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors"
                    style={{
                      background: filter === '' ? `${G}20` : 'rgba(255,255,255,0.05)',
                      color: filter === '' ? G : '#6b7280',
                      border: `1px solid ${filter === '' ? `${G}40` : 'transparent'}`,
                    }}
                  >
                    All
                  </button>
                  {allGroupTypes.map(gt => {
                    const label = GROUP_TYPES.find(g => g.value === gt)?.label ?? gt;
                    const active = filter === gt;
                    return (
                      <button
                        key={gt}
                        onClick={() => setFilter(active ? '' : gt)}
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors"
                        style={{
                          background: active ? `${G}20` : 'rgba(255,255,255,0.05)',
                          color: active ? G : '#6b7280',
                          border: `1px solid ${active ? `${G}40` : 'transparent'}`,
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Cards */}
              {loading ? (
                <div className="flex items-center justify-center py-12" style={{ color: '#6b7280' }}>
                  <svg className="w-5 h-5 animate-spin mr-2" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-sm">Loading...</span>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: 'rgba(255,190,7,0.08)', border: '1px solid rgba(255,190,7,0.15)' }}
                  >
                    <svg className="w-6 h-6" style={{ color: 'rgba(255,190,7,0.4)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium" style={{ color: '#6b7280' }}>No recipients yet</p>
                  <p className="text-xs mt-1" style={{ color: '#4b5563' }}>
                    {search || filter ? 'Try adjusting your search or filter' : 'Click Add to create the first recipient'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map(r => {
                    const isExpanded = expandedId === r.id;
                    return (
                      <RecipientCard
                        key={r.id}
                        recipient={r}
                        isExpanded={isExpanded}
                        onToggle={() => setExpandedId(isExpanded ? null : r.id)}
                        onEdit={() => openEditForm(r)}
                        onDelete={() => handleDelete(r.id)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Recipient card ────────────────────────────────────────────────────────────
function RecipientCard({
  recipient: r,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
}: {
  recipient: NotificationRecipient;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{ background: '#1a1d27', border: `1px solid ${isExpanded ? '#363944' : '#2a2d3a'}` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Summary row */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        <button onClick={onToggle} className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-white truncate">{r.name}</span>
            <GroupBadge groupType={r.group_type} />
          </div>
          {/* Channel icons */}
          <div className="flex items-center gap-2 mt-1.5">
            <IconEmail active={!!r.email_to} />
            <IconCC active={!!r.email_cc} />
            <IconSms active={!!r.sms} />
            <IconWhatsapp active={!!r.whatsapp} />
            <IconVoice active={!!r.voice} />
          </div>
        </button>

        {/* Hover actions */}
        <div className="flex items-center gap-1 shrink-0" style={{ opacity: hovered ? 1 : 0, transition: 'opacity 0.15s' }}>
          <button
            onClick={e => { e.stopPropagation(); onEdit(); }}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: '#6b7280' }}
            title="Edit"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
            style={{ color: '#6b7280' }}
            title="Delete"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3,6 5,6 21,6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
        </div>

        {/* Expand chevron */}
        <button onClick={onToggle} style={{ color: '#6b7280' }}>
          <svg
            className={`w-4 h-4 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <polyline points="6,9 12,15 18,9" />
          </svg>
        </button>
      </div>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="px-3 pb-3" style={{ borderTop: '1px solid #2a2d3a' }}>
          <div className="mt-3 space-y-1.5">
            {[
              { label: 'Email To', value: r.email_to },
              { label: 'Email CC', value: r.email_cc },
              { label: 'SMS', value: r.sms },
              { label: 'WhatsApp', value: r.whatsapp },
              { label: 'Voice', value: r.voice },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start gap-3 text-xs">
                <span className="w-20 shrink-0 font-medium" style={{ color: '#6b7280' }}>{label}</span>
                <span style={{ color: value ? '#d1d5db' : '#3a3d4a' }}>{value || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
