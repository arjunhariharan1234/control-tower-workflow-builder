import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { NotificationRecipient } from '@/types/recipient';

const DATA_DIR = join(process.cwd(), 'data');
const FILE_PATH = join(DATA_DIR, 'recipients.json');

function ensureFile(): NotificationRecipient[] {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!existsSync(FILE_PATH)) {
    writeFileSync(FILE_PATH, '[]', 'utf-8');
    return [];
  }
  try {
    const raw = readFileSync(FILE_PATH, 'utf-8');
    return JSON.parse(raw) as NotificationRecipient[];
  } catch {
    return [];
  }
}

function save(recipients: NotificationRecipient[]): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  writeFileSync(FILE_PATH, JSON.stringify(recipients, null, 2), 'utf-8');
}

function nextId(recipients: NotificationRecipient[]): number {
  if (recipients.length === 0) return 1;
  return Math.max(...recipients.map(r => r.id)) + 1;
}

export function listRecipients(groupType?: string): NotificationRecipient[] {
  const all = ensureFile();
  let filtered = all.filter(r => r.is_active);
  if (groupType) {
    filtered = filtered.filter(r => r.group_type === groupType);
  }
  return filtered.sort((a, b) => a.group_type.localeCompare(b.group_type) || a.name.localeCompare(b.name));
}

export function createRecipient(data: {
  group_type: string;
  name: string;
  email_cc?: string;
  email_to?: string;
  sms?: string;
  whatsapp?: string;
  voice?: string;
}): NotificationRecipient {
  const all = ensureFile();
  const now = new Date().toISOString();
  const recipient: NotificationRecipient = {
    id: nextId(all),
    tenant_id: 'default',
    group_type: data.group_type,
    name: data.name,
    email_cc: data.email_cc || null,
    email_to: data.email_to || null,
    sms: data.sms || null,
    whatsapp: data.whatsapp || null,
    voice: data.voice || null,
    created_at: now,
    created_by: 'system',
    updated_at: now,
    updated_by: 'system',
    is_active: true,
  };
  all.push(recipient);
  save(all);
  return recipient;
}

export function updateRecipient(id: number, updates: Partial<Pick<NotificationRecipient, 'group_type' | 'name' | 'email_cc' | 'email_to' | 'sms' | 'whatsapp' | 'voice' | 'is_active'>>): NotificationRecipient | null {
  const all = ensureFile();
  const idx = all.findIndex(r => r.id === id);
  if (idx === -1) return null;

  const now = new Date().toISOString();
  all[idx] = {
    ...all[idx],
    ...updates,
    updated_at: now,
    updated_by: 'system',
  };
  save(all);
  return all[idx];
}

export function deleteRecipient(id: number): boolean {
  const all = ensureFile();
  const idx = all.findIndex(r => r.id === id);
  if (idx === -1) return false;

  all[idx].is_active = false;
  all[idx].updated_at = new Date().toISOString();
  all[idx].updated_by = 'system';
  save(all);
  return true;
}
