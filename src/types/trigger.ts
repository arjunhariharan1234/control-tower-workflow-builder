export type TriggerType = 'manual' | 'webhook' | 'schedule' | 'event';

export interface WebhookConfig {
  enabled: boolean;
  url: string;
  secret?: string;
  method: 'POST' | 'GET';
  headers?: Record<string, string>;
}

export interface ScheduleConfig {
  enabled: boolean;
  expression: string; // cron expression
  timezone: string;
  label: string; // human readable description
}

export interface EventTriggerConfig {
  enabled: boolean;
  eventType: string; // e.g., 'LONG_STOPPAGE', 'TRANSIT_DELAY'
  source: string; // integration id or 'internal'
  filters?: Record<string, string>;
}

export interface WorkflowTrigger {
  id: string;
  workflowId: string;
  workflowName: string;
  type: TriggerType;
  webhook?: WebhookConfig;
  schedule?: ScheduleConfig;
  event?: EventTriggerConfig;
  createdAt: string;
  updatedAt: string;
  lastTriggeredAt?: string;
  triggerCount: number;
  active: boolean;
}

export interface TriggerLog {
  id: string;
  triggerId: string;
  workflowId: string;
  type: TriggerType;
  timestamp: string;
  payload?: Record<string, unknown>;
  status: 'triggered' | 'failed' | 'skipped';
  message?: string;
}

// Common cron presets
export const CRON_PRESETS = [
  { label: 'Every minute', expression: '* * * * *' },
  { label: 'Every 5 minutes', expression: '*/5 * * * *' },
  { label: 'Every 15 minutes', expression: '*/15 * * * *' },
  { label: 'Every 30 minutes', expression: '*/30 * * * *' },
  { label: 'Every hour', expression: '0 * * * *' },
  { label: 'Every 6 hours', expression: '0 */6 * * *' },
  { label: 'Daily at midnight', expression: '0 0 * * *' },
  { label: 'Daily at 9 AM', expression: '0 9 * * *' },
  { label: 'Daily at 6 PM', expression: '0 18 * * *' },
  { label: 'Every Monday at 9 AM', expression: '0 9 * * 1' },
  { label: 'Weekdays at 9 AM', expression: '0 9 * * 1-5' },
  { label: 'First of month at midnight', expression: '0 0 1 * *' },
] as const;

// Parse cron expression to human-readable string
export function cronToHuman(expression: string): string {
  const preset = CRON_PRESETS.find((p) => p.expression === expression);
  if (preset) return preset.label;

  const parts = expression.split(' ');
  if (parts.length !== 5) return expression;

  const [min, hour, dom, month, dow] = parts;

  if (min === '*' && hour === '*') return 'Every minute';
  if (min.startsWith('*/')) return `Every ${min.slice(2)} minutes`;
  if (hour === '*' && min !== '*') return `At minute ${min} of every hour`;
  if (hour !== '*' && min !== '*' && dom === '*' && month === '*' && dow === '*') return `Daily at ${hour}:${min.padStart(2, '0')}`;
  if (dow !== '*' && dom === '*') return `At ${hour}:${min.padStart(2, '0')} on day ${dow} of week`;

  return expression;
}
