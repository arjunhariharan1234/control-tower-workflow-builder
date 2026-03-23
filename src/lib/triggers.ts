import { WorkflowTrigger, TriggerLog } from '@/types/trigger';
import { v4 as uuidv4 } from 'uuid';

const TRIGGERS_KEY = 'ct-workflow-triggers';
const TRIGGER_LOGS_KEY = 'ct-trigger-logs';
const MAX_LOGS = 100;

// ── Triggers CRUD ────────────────────────────────────────────────────

export function getTriggers(): WorkflowTrigger[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(TRIGGERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function getTriggerById(id: string): WorkflowTrigger | undefined {
  return getTriggers().find((t) => t.id === id);
}

export function getTriggersForWorkflow(workflowId: string): WorkflowTrigger[] {
  return getTriggers().filter((t) => t.workflowId === workflowId);
}

export function saveTrigger(trigger: WorkflowTrigger): void {
  const all = getTriggers();
  const idx = all.findIndex((t) => t.id === trigger.id);
  if (idx >= 0) {
    all[idx] = { ...trigger, updatedAt: new Date().toISOString() };
  } else {
    all.push({ ...trigger, id: trigger.id || uuidv4(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  localStorage.setItem(TRIGGERS_KEY, JSON.stringify(all));
}

export function deleteTrigger(id: string): void {
  const all = getTriggers().filter((t) => t.id !== id);
  localStorage.setItem(TRIGGERS_KEY, JSON.stringify(all));
}

export function toggleTrigger(id: string): void {
  const all = getTriggers();
  const trigger = all.find((t) => t.id === id);
  if (trigger) {
    trigger.active = !trigger.active;
    trigger.updatedAt = new Date().toISOString();
    localStorage.setItem(TRIGGERS_KEY, JSON.stringify(all));
  }
}

export function incrementTriggerCount(id: string): void {
  const all = getTriggers();
  const trigger = all.find((t) => t.id === id);
  if (trigger) {
    trigger.triggerCount += 1;
    trigger.lastTriggeredAt = new Date().toISOString();
    trigger.updatedAt = new Date().toISOString();
    localStorage.setItem(TRIGGERS_KEY, JSON.stringify(all));
  }
}

// ── Generate Webhook URL ─────────────────────────────────────────────

export function generateWebhookUrl(workflowId: string): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/api/webhook/${workflowId}`;
}

// ── Trigger Logs ─────────────────────────────────────────────────────

export function getTriggerLogs(): TriggerLog[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(TRIGGER_LOGS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function addTriggerLog(log: Omit<TriggerLog, 'id' | 'timestamp'>): void {
  const all = getTriggerLogs();
  all.unshift({ ...log, id: uuidv4(), timestamp: new Date().toISOString() });
  if (all.length > MAX_LOGS) all.length = MAX_LOGS;
  localStorage.setItem(TRIGGER_LOGS_KEY, JSON.stringify(all));
}

export function getLogsForTrigger(triggerId: string): TriggerLog[] {
  return getTriggerLogs().filter((l) => l.triggerId === triggerId);
}

export function clearTriggerLogs(): void {
  localStorage.setItem(TRIGGER_LOGS_KEY, JSON.stringify([]));
}

// ── Stats ────────────────────────────────────────────────────────────

export function getTriggerStats() {
  const triggers = getTriggers();
  const logs = getTriggerLogs();
  return {
    totalTriggers: triggers.length,
    activeTriggers: triggers.filter((t) => t.active).length,
    webhooks: triggers.filter((t) => t.type === 'webhook').length,
    schedules: triggers.filter((t) => t.type === 'schedule').length,
    events: triggers.filter((t) => t.type === 'event').length,
    totalExecutions: logs.length,
    failedExecutions: logs.filter((l) => l.status === 'failed').length,
  };
}
