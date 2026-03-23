// ── Workflow DSL Types ──────────────────────────────────────────────

export interface WorkflowLayout {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface BoundaryEvent {
  event_type: string;
  event_key: string;
  display_name?: string;
  timer_value?: string;
  interrupting?: boolean;
  on_timeout_transition_to?: string;
}

export interface MandatoryInput {
  [key: string]: {
    type: string;
    required?: boolean;
    description?: string;
    default?: unknown;
  };
}

export interface WorkflowStep {
  step_key: string;
  display_name: string;
  step_type: StepType;
  task_type?: string;
  layout?: WorkflowLayout;
  mandatory_input?: MandatoryInput;
  boundary_events?: BoundaryEvent[];
  steps?: WorkflowStep[];
  transitions?: WorkflowTransition[];
  config?: Record<string, unknown>;
  [key: string]: unknown;
}

export type StepType =
  | 'START_EVENT'
  | 'END_EVENT'
  | 'SERVICE_TASK'
  | 'USER_TASK'
  | 'EXCLUSIVE_GATEWAY'
  | 'SUB_PROCESS'
  | 'BOUNDARY_EVENT_TIMER';

export interface TransitionCondition {
  variable: string;
  operator: string;
  value: unknown;
  logic?: 'AND' | 'OR';
  conditions?: TransitionCondition[];
}

export interface WorkflowTransition {
  from: string;
  to: string;
  condition?: TransitionCondition;
  condition_expression?: string;
  default?: boolean;
  label?: string;
}

export interface EscalationLevel {
  level: number;
  level_key?: string;
  condition: TransitionCondition;
  priority: string;
  description?: string;
}

export interface EscalationPolicy {
  type?: string;
  levels: EscalationLevel[];
}

export interface WorkflowMetadata {
  category?: string;
  trigger_type?: string;
  priority?: string;
  tags?: string[];
  force_close_supported?: boolean;
  escalation_policy?: EscalationPolicy;
  [key: string]: unknown;
}

export interface WorkflowDSL {
  name: string;
  code: string;
  description?: string;
  metadata?: WorkflowMetadata;
  steps: WorkflowStep[];
  transitions: WorkflowTransition[];
}

// ── Execution Types ────────────────────────────────────────────────

export type ExecutionStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';

export interface StepExecution {
  step_key: string;
  status: ExecutionStatus;
  started_at?: string;
  completed_at?: string;
  error?: string;
}

export interface WorkflowExecution {
  workflow_id: string;
  status: ExecutionStatus;
  steps: StepExecution[];
}

// ── Validation Types ───────────────────────────────────────────────

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

// ── Execution History Types ──────────────────────────────────────

export interface ExecutionRun {
  id: string;
  workflowName: string;
  workflowCode: string;
  status: ExecutionStatus;
  startedAt: string;
  completedAt?: string;
  duration?: number; // ms
  stepResults: StepExecutionResult[];
  logs: string[];
  nodeCount: number;
  failedStepKey?: string;
}

export interface StepExecutionResult {
  step_key: string;
  display_name: string;
  step_type: StepType;
  status: ExecutionStatus;
  started_at: string;
  completed_at?: string;
  duration?: number;
  error?: string;
}

// ── Saved Workflow & Template Types ───────────────────────────────

export interface SavedWorkflow {
  id: string;
  name: string;
  code: string;
  description: string;
  dsl: WorkflowDSL;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  dsl: WorkflowDSL;
}
