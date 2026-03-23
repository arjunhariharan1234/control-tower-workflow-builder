'use client';

import React from 'react';
import { CATEGORY_LIST } from '@/lib/integrations/categories';
import { useIntegrationStore } from '@/store/integration-store';

const G = '#FFBE07';

export default function IntegrationSearch() {
  const { searchQuery, selectedCategory, setSearchQuery, setSelectedCategory } = useIntegrationStore();

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#6b7280' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search integrations..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
          style={{ background: '#1a1d27', border: '1px solid #2a2d3a', color: '#fff' }}
          onFocus={(e) => { e.currentTarget.style.borderColor = G; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#2a2d3a'; }}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#6b7280' }}>
            Clear
          </button>
        )}
      </div>

      {/* Category chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <Chip active={selectedCategory === 'all'} onClick={() => setSelectedCategory('all')} color="#FFBE07">
          All
        </Chip>
        {CATEGORY_LIST.map((cat) => (
          <Chip key={cat.id} active={selectedCategory === cat.id} onClick={() => setSelectedCategory(cat.id)} color={cat.color}>
            {cat.icon} {cat.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function Chip({ children, active, onClick, color }: { children: React.ReactNode; active: boolean; onClick: () => void; color: string }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all whitespace-nowrap"
      style={{
        background: active ? `${color}20` : 'transparent',
        color: active ? color : '#6b7280',
        border: `1px solid ${active ? `${color}40` : '#2a2d3a'}`,
      }}
    >
      {children}
    </button>
  );
}
