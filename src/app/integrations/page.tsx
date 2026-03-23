'use client';

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useIntegrationStore } from '@/store/integration-store';
import { INTEGRATIONS, getIntegrationsByCategory, searchIntegrations } from '@/lib/integrations/registry';
import IntegrationSearch from '@/components/integrations/IntegrationSearch';
import IntegrationCard from '@/components/integrations/IntegrationCard';
import IntegrationDetailDrawer from '@/components/integrations/IntegrationDetailDrawer';

const G = '#FFBE07';

export default function IntegrationsPage() {
  const router = useRouter();
  const { searchQuery, selectedCategory, connections, openDrawer, loadConnections } = useIntegrationStore();

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const filtered = useMemo(() => {
    let results = selectedCategory === 'all' ? INTEGRATIONS : getIntegrationsByCategory(selectedCategory);
    if (searchQuery.trim()) {
      const searched = searchIntegrations(searchQuery);
      results = results.filter((i) => searched.some((s) => s.id === i.id));
    }
    return results;
  }, [searchQuery, selectedCategory]);

  const connectedIds = new Set(connections.filter((c) => c.status === 'connected').map((c) => c.integrationId));

  // Stats
  const totalIntegrations = INTEGRATIONS.length;
  const totalConnected = connectedIds.size;
  const totalTriggers = INTEGRATIONS.reduce((s, i) => s + i.triggers.length, 0);
  const totalActions = INTEGRATIONS.reduce((s, i) => s + i.actions.length, 0);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0f1117' }}>
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-30 flex items-center justify-between px-8 py-4" style={{ background: 'rgba(15,17,23,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #1a1d27' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: G }}>
              <svg className="w-4.5 h-4.5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-bold text-base tracking-tight" style={{ color: G }}>Control Tower</span>
          </button>
          <span className="text-sm" style={{ color: '#2a2d3a' }}>/</span>
          <span className="text-sm font-medium text-white">Integrations</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/playground')}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-all"
            style={{ color: '#d1d5db', border: '1px solid #2a2d3a' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = G; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2a2d3a'; e.currentTarget.style.color = '#d1d5db'; }}
          >
            Playground
          </button>
          <button
            onClick={() => router.push('/chat')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all hover:brightness-110"
            style={{ background: G, color: '#000' }}
          >
            AI Builder
          </button>
        </div>
      </nav>

      {/* ── Header ── */}
      <div className="px-8 pt-8 pb-2">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Integrations</h1>
              <p className="text-sm" style={{ color: '#9ca3af' }}>
                Connect your workflow to {totalIntegrations} services across notifications, telephony, CRM, payments, and more.
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mb-8">
            <StatCard label="Total Integrations" value={totalIntegrations} icon="🔌" />
            <StatCard label="Connected" value={totalConnected} icon="✓" color="#10b981" />
            <StatCard label="Available Triggers" value={totalTriggers} icon="⚡" color="#f59e0b" />
            <StatCard label="Available Actions" value={totalActions} icon="▶" color="#3b82f6" />
          </div>

          {/* Search + Filters */}
          <IntegrationSearch />
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="flex-1 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-sm font-medium" style={{ color: '#6b7280' }}>No integrations found</p>
              <p className="text-xs mt-1" style={{ color: '#4b5563' }}>Try a different search term or category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  connected={connectedIds.has(integration.id)}
                  onClick={() => openDrawer(integration.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Detail Drawer ── */}
      <IntegrationDetailDrawer />
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color?: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: '#1a1d27', border: '1px solid #2a2d3a' }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base" style={{ background: `${color || G}15`, color: color || G }}>
        {icon}
      </div>
      <div>
        <p className="text-lg font-bold text-white">{value}</p>
        <p className="text-[10px] font-medium" style={{ color: '#6b7280' }}>{label}</p>
      </div>
    </div>
  );
}
