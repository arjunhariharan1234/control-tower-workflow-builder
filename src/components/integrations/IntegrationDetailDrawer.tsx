'use client';

import React, { useState } from 'react';
import { useIntegrationStore } from '@/store/integration-store';
import { getIntegrationById } from '@/lib/integrations/registry';
import { CATEGORIES } from '@/lib/integrations/categories';
import ConnectionForm from './ConnectionForm';

const G = '#FFBE07';

export default function IntegrationDetailDrawer() {
  const { drawerOpen, selectedIntegrationId, drawerTab, closeDrawer, setDrawerTab, connections, removeConnection } = useIntegrationStore();
  const [showAddForm, setShowAddForm] = useState(false);

  if (!drawerOpen || !selectedIntegrationId) return null;

  const integration = getIntegrationById(selectedIntegrationId);
  if (!integration) return null;

  const cat = CATEGORIES[integration.category];
  const integrationConnections = connections.filter((c) => c.integrationId === integration.id);

  const authLabels: Record<string, string> = {
    api_key: 'API Key',
    oauth2: 'OAuth 2.0',
    basic_auth: 'Basic Auth',
    bearer_token: 'Bearer Token',
    none: 'No Auth',
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 transition-opacity" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={closeDrawer} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 flex flex-col overflow-hidden" style={{ width: 540, background: '#13151d', borderLeft: '1px solid #2a2d3a' }}>
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-5 shrink-0" style={{ borderBottom: '1px solid #2a2d3a' }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold" style={{ background: `${integration.color}20`, color: integration.color }}>
            {integration.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white truncate">{integration.name}</h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium" style={{ color: cat.color }}>
              {cat.icon} {cat.label}
            </span>
          </div>
          <button onClick={closeDrawer} className="p-2 rounded-lg transition-colors hover:bg-white/5" style={{ color: '#6b7280' }}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 shrink-0" style={{ borderBottom: '1px solid #2a2d3a' }}>
          {(['overview', 'triggers-actions', 'connections'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setDrawerTab(tab)}
              className="px-4 py-3 text-[12px] font-medium transition-colors"
              style={{ color: drawerTab === tab ? G : '#6b7280', borderBottom: drawerTab === tab ? `2px solid ${G}` : '2px solid transparent' }}
            >
              {tab === 'overview' ? 'Overview' : tab === 'triggers-actions' ? 'Triggers & Actions' : `Connections (${integrationConnections.length})`}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* ── Overview ── */}
          {drawerTab === 'overview' && (
            <div className="space-y-5">
              <p className="text-sm leading-relaxed" style={{ color: '#d1d5db' }}>{integration.description}</p>

              <div className="grid grid-cols-2 gap-3">
                <InfoCard label="Auth Type" value={authLabels[integration.authType]} />
                <InfoCard label="Triggers" value={String(integration.triggers.length)} />
                <InfoCard label="Actions" value={String(integration.actions.length)} />
                <InfoCard label="Status" value={integrationConnections.length > 0 ? 'Connected' : 'Not connected'} valueColor={integrationConnections.length > 0 ? '#10b981' : '#6b7280'} />
              </div>

              {integration.website && (
                <a
                  href={integration.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors hover:underline"
                  style={{ color: G }}
                >
                  Visit {integration.name} docs
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" /></svg>
                </a>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {integration.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded-full text-[10px]" style={{ background: '#1a1d27', color: '#6b7280', border: '1px solid #2a2d3a' }}>
                    {tag}
                  </span>
                ))}
              </div>

              {/* Quick connect CTA */}
              {integrationConnections.length === 0 && (
                <button
                  onClick={() => { setDrawerTab('connections'); setShowAddForm(true); }}
                  className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:brightness-110"
                  style={{ background: G, color: '#000' }}
                >
                  Connect {integration.name}
                </button>
              )}
            </div>
          )}

          {/* ── Triggers & Actions ── */}
          {drawerTab === 'triggers-actions' && (
            <div className="space-y-6">
              {/* Triggers */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#6b7280' }}>
                  Triggers ({integration.triggers.length})
                </h3>
                {integration.triggers.length === 0 ? (
                  <p className="text-xs" style={{ color: '#4b5563' }}>No triggers available — this integration is action-only.</p>
                ) : (
                  <div className="space-y-2">
                    {integration.triggers.map((trigger) => (
                      <div key={trigger.id} className="p-3 rounded-lg" style={{ background: '#1a1d27', border: '1px solid #2a2d3a' }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-2 h-2 rounded-full" style={{ background: '#f59e0b' }} />
                          <span className="text-xs font-semibold text-white">{trigger.label}</span>
                        </div>
                        <p className="text-[11px] ml-4" style={{ color: '#9ca3af' }}>{trigger.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#6b7280' }}>
                  Actions ({integration.actions.length})
                </h3>
                <div className="space-y-2">
                  {integration.actions.map((action) => (
                    <div key={action.id} className="p-3 rounded-lg" style={{ background: '#1a1d27', border: '1px solid #2a2d3a' }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full" style={{ background: '#3b82f6' }} />
                        <span className="text-xs font-semibold text-white">{action.label}</span>
                      </div>
                      <p className="text-[11px] ml-4 mb-2" style={{ color: '#9ca3af' }}>{action.description}</p>
                      {/* Input fields */}
                      <div className="ml-4 flex flex-wrap gap-1.5">
                        {action.inputFields.map((field) => (
                          <span
                            key={field.key}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono"
                            style={{ background: '#0f1117', color: field.required ? '#d1d5db' : '#4b5563' }}
                          >
                            {field.key}
                            {field.required && <span style={{ color: G }}>*</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Connections ── */}
          {drawerTab === 'connections' && (
            <div className="space-y-4">
              {/* Existing connections */}
              {integrationConnections.map((conn) => (
                <div key={conn.label} className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#1a1d27', border: '1px solid #2a2d3a' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ background: conn.status === 'connected' ? '#10b981' : conn.status === 'error' ? '#ef4444' : '#6b7280' }} />
                    <div>
                      <p className="text-xs font-semibold text-white">{conn.label}</p>
                      <p className="text-[10px]" style={{ color: '#6b7280' }}>
                        {conn.status === 'connected' ? 'Connected' : conn.status === 'error' ? 'Error' : 'Unchecked'}
                        {' · '}
                        {new Date(conn.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeConnection(integration.id, conn.label)}
                    className="text-[10px] px-2 py-1 rounded transition-colors hover:bg-red-500/10"
                    style={{ color: '#ef4444' }}
                  >
                    Remove
                  </button>
                </div>
              ))}

              {/* Add new connection */}
              {showAddForm ? (
                <div className="p-4 rounded-xl" style={{ background: '#1a1d27', border: '1px solid #2a2d3a' }}>
                  <h4 className="text-xs font-semibold text-white mb-4">New Connection</h4>
                  <ConnectionForm
                    integration={integration}
                    onSaved={() => setShowAddForm(false)}
                  />
                </div>
              ) : (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all"
                  style={{ border: '1px dashed #2a2d3a', color: '#9ca3af' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = G; e.currentTarget.style.color = G; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2a2d3a'; e.currentTarget.style.color = '#9ca3af'; }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                  Add Connection
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function InfoCard({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="p-3 rounded-lg" style={{ background: '#1a1d27', border: '1px solid #2a2d3a' }}>
      <p className="text-[10px] font-medium mb-0.5" style={{ color: '#6b7280' }}>{label}</p>
      <p className="text-xs font-semibold" style={{ color: valueColor || '#d1d5db' }}>{value}</p>
    </div>
  );
}
