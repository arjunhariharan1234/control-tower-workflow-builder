'use client';

import React from 'react';
import { Integration } from '@/types/integration';
import { CATEGORIES } from '@/lib/integrations/categories';

const G = '#FFBE07';

interface Props {
  integration: Integration;
  connected: boolean;
  onClick: () => void;
}

export default function IntegrationCard({ integration, connected, onClick }: Props) {
  const cat = CATEGORIES[integration.category];

  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col text-left p-5 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: '#1a1d27',
        border: '1px solid #2a2d3a',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = integration.color; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2a2d3a'; }}
    >
      {/* Connected badge */}
      {connected && (
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#10b981' }} />
          Connected
        </div>
      )}

      {/* Icon */}
      <div
        className="w-11 h-11 rounded-lg flex items-center justify-center text-sm font-bold mb-3 shrink-0"
        style={{ background: `${integration.color}20`, color: integration.color }}
      >
        {integration.icon}
      </div>

      {/* Name + Description */}
      <h3 className="text-sm font-semibold text-white mb-1 truncate w-full">{integration.name}</h3>
      <p className="text-[11px] leading-relaxed line-clamp-2 mb-3" style={{ color: '#9ca3af' }}>
        {integration.description}
      </p>

      {/* Footer: category + counts */}
      <div className="mt-auto flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: `${cat.color}15`, color: cat.color }}>
          {cat.icon} {cat.label}
        </span>
        {integration.triggers.length > 0 && (
          <span className="text-[10px] font-medium" style={{ color: '#6b7280' }}>
            {integration.triggers.length} trigger{integration.triggers.length > 1 ? 's' : ''}
          </span>
        )}
        {integration.actions.length > 0 && (
          <span className="text-[10px] font-medium" style={{ color: '#6b7280' }}>
            {integration.actions.length} action{integration.actions.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Popular badge */}
      {integration.popular && (
        <div className="absolute -top-1 -left-1 px-2 py-0.5 rounded-br-lg rounded-tl-lg text-[9px] font-bold" style={{ background: G, color: '#000' }}>
          POPULAR
        </div>
      )}
    </button>
  );
}
