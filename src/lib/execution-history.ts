import { ExecutionRun, ExecutionStatus } from '@/types/workflow';

const STORAGE_KEY = 'ct-execution-history';
const MAX_HISTORY = 50;

export function getExecutionHistory(): ExecutionRun[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveExecutionRun(run: ExecutionRun): void {
  const all = getExecutionHistory();
  all.unshift(run);
  if (all.length > MAX_HISTORY) all.length = MAX_HISTORY;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function getExecutionById(id: string): ExecutionRun | undefined {
  return getExecutionHistory().find((r) => r.id === id);
}

export function deleteExecutionRun(id: string): void {
  const all = getExecutionHistory().filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function clearExecutionHistory(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
}

export function getExecutionsByStatus(status: ExecutionStatus): ExecutionRun[] {
  return getExecutionHistory().filter((r) => r.status === status);
}

export function getExecutionStats() {
  const all = getExecutionHistory();
  return {
    total: all.length,
    completed: all.filter((r) => r.status === 'COMPLETED').length,
    failed: all.filter((r) => r.status === 'FAILED').length,
    avgDuration: all.filter((r) => r.duration).reduce((s, r) => s + (r.duration || 0), 0) / (all.filter((r) => r.duration).length || 1),
  };
}
