import { SavedWorkflow, WorkflowDSL } from '@/types/workflow';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'ct-saved-workflows';

export function getSavedWorkflows(): SavedWorkflow[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveWorkflow(name: string, code: string, description: string, dsl: WorkflowDSL): SavedWorkflow {
  const workflows = getSavedWorkflows();
  const existing = workflows.find((w) => w.code === code);
  const now = new Date().toISOString();

  if (existing) {
    existing.name = name;
    existing.description = description;
    existing.dsl = dsl;
    existing.updatedAt = now;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
    return existing;
  }

  const saved: SavedWorkflow = { id: uuidv4(), name, code, description, dsl, createdAt: now, updatedAt: now };
  workflows.unshift(saved);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
  return saved;
}

export function deleteSavedWorkflow(id: string): void {
  const workflows = getSavedWorkflows().filter((w) => w.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
}

export function getSavedWorkflowById(id: string): SavedWorkflow | undefined {
  return getSavedWorkflows().find((w) => w.id === id);
}
