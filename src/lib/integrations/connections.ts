import { IntegrationConnection } from '@/types/integration';

const STORAGE_KEY = 'ct-integration-connections';

export function getConnections(): IntegrationConnection[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function getConnectionsByIntegrationId(integrationId: string): IntegrationConnection[] {
  return getConnections().filter((c) => c.integrationId === integrationId);
}

export function saveConnection(conn: IntegrationConnection): void {
  const all = getConnections();
  const idx = all.findIndex((c) => c.integrationId === conn.integrationId && c.label === conn.label);
  if (idx >= 0) {
    all[idx] = { ...conn, updatedAt: new Date().toISOString() };
  } else {
    all.push({ ...conn, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function deleteConnection(integrationId: string, label: string): void {
  const all = getConnections().filter((c) => !(c.integrationId === integrationId && c.label === label));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function hasConnection(integrationId: string): boolean {
  return getConnections().some((c) => c.integrationId === integrationId && c.status === 'connected');
}
