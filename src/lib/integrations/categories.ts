import { IntegrationCategory } from '@/types/integration';

export interface CategoryMeta {
  label: string;
  icon: string;
  color: string;
}

export const CATEGORIES: Record<IntegrationCategory, CategoryMeta> = {
  notifications: { label: 'Notifications', icon: '🔔', color: '#f59e0b' },
  telephony: { label: 'Telephony', icon: '📞', color: '#8b5cf6' },
  'crm-support': { label: 'CRM & Support', icon: '🎯', color: '#3b82f6' },
  communication: { label: 'Communication', icon: '💬', color: '#06b6d4' },
  analytics: { label: 'Analytics', icon: '📊', color: '#10b981' },
  'cloud-infra': { label: 'Cloud & Infra', icon: '☁️', color: '#6366f1' },
  databases: { label: 'Databases', icon: '🗄️', color: '#ec4899' },
  'ai-ml': { label: 'AI & ML', icon: '🤖', color: '#a855f7' },
  logistics: { label: 'Logistics', icon: '🚛', color: '#f97316' },
  payments: { label: 'Payments', icon: '💳', color: '#14b8a6' },
  webhook: { label: 'Webhook & HTTP', icon: '🔗', color: '#64748b' },
};

export const CATEGORY_LIST = Object.entries(CATEGORIES).map(([id, meta]) => ({
  id: id as IntegrationCategory,
  ...meta,
}));
