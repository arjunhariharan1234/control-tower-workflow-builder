export interface NotificationRecipient {
  id: number;
  tenant_id: string;
  group_type: string;
  name: string;
  email_cc: string | null;
  email_to: string | null;
  sms: string | null;
  whatsapp: string | null;
  voice: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
  is_active: boolean;
}

export const GROUP_TYPES = [
  { value: 'ESCALATION_L1', label: 'Escalation L1', category: 'escalation' },
  { value: 'ESCALATION_L2', label: 'Escalation L2', category: 'escalation' },
  { value: 'ESCALATION_L3', label: 'Escalation L3', category: 'escalation' },
  { value: 'MHD', label: 'MHD', category: 'department' },
  { value: 'DEPOT_TEAM', label: 'Depot Team', category: 'department' },
  { value: 'ICARE', label: 'iCare', category: 'department' },
  { value: 'HOD', label: 'HOD', category: 'department' },
  { value: 'SUPPLY_CHAIN', label: 'Supply Chain', category: 'department' },
] as const;

export type GroupCategory = 'escalation' | 'department' | 'custom';

export function getGroupCategory(groupType: string): GroupCategory {
  const found = GROUP_TYPES.find(g => g.value === groupType);
  return found ? found.category as GroupCategory : 'custom';
}
