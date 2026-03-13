import { ValidationError, StepType, WorkflowDSL, WorkflowStep, WorkflowTransition } from '@/types/workflow';

const VALID_STEP_TYPES: StepType[] = [
  'START_EVENT',
  'END_EVENT',
  'SERVICE_TASK',
  'USER_TASK',
  'EXCLUSIVE_GATEWAY',
  'SUB_PROCESS',
  'BOUNDARY_EVENT_TIMER',
];

export function validateDSL(input: unknown): { valid: boolean; errors: ValidationError[]; dsl?: WorkflowDSL } {
  const errors: ValidationError[] = [];

  // Check if it's a valid object
  if (!input || typeof input !== 'object') {
    errors.push({ field: 'root', message: 'Input must be a JSON object', severity: 'error' });
    return { valid: false, errors };
  }

  const obj = input as Record<string, unknown>;

  // Required top-level fields
  if (!obj.name || typeof obj.name !== 'string') {
    errors.push({ field: 'name', message: 'Missing or invalid required field: name', severity: 'error' });
  }
  if (!obj.code || typeof obj.code !== 'string') {
    errors.push({ field: 'code', message: 'Missing or invalid required field: code', severity: 'error' });
  }
  if (!Array.isArray(obj.steps)) {
    errors.push({ field: 'steps', message: 'Missing required field: steps (must be an array)', severity: 'error' });
    return { valid: false, errors };
  }
  if (!Array.isArray(obj.transitions)) {
    errors.push({ field: 'transitions', message: 'Missing required field: transitions (must be an array)', severity: 'error' });
    return { valid: false, errors };
  }

  const steps = obj.steps as WorkflowStep[];
  const transitions = obj.transitions as WorkflowTransition[];

  // Collect all step keys
  const allStepKeys = new Set<string>();

  function collectStepKeys(stepsArr: WorkflowStep[], prefix: string) {
    for (let i = 0; i < stepsArr.length; i++) {
      const step = stepsArr[i];
      const path = `${prefix}[${i}]`;

      if (!step.step_key) {
        errors.push({ field: `${path}.step_key`, message: `Step at ${path} missing step_key`, severity: 'error' });
        continue;
      }

      if (allStepKeys.has(step.step_key)) {
        errors.push({ field: `${path}.step_key`, message: `Duplicate step_key: ${step.step_key}`, severity: 'error' });
      }
      allStepKeys.add(step.step_key);

      if (!step.display_name) {
        errors.push({ field: `${path}.display_name`, message: `Step ${step.step_key} missing display_name`, severity: 'warning' });
      }

      if (!step.step_type) {
        errors.push({ field: `${path}.step_type`, message: `Step ${step.step_key} missing step_type`, severity: 'error' });
      } else if (!VALID_STEP_TYPES.includes(step.step_type as StepType)) {
        errors.push({ field: `${path}.step_type`, message: `Unsupported step_type: ${step.step_type}`, severity: 'error' });
      }

      // Validate subprocess children
      if (step.step_type === 'SUB_PROCESS' && step.steps) {
        collectStepKeys(step.steps, `${path}.steps`);
      }

      // Validate boundary events
      if (step.boundary_events) {
        for (const event of step.boundary_events) {
          if (event.event_key) {
            allStepKeys.add(event.event_key);
          }
        }
      }
    }
  }

  collectStepKeys(steps, 'steps');

  // Validate transitions
  function validateTransitions(transArr: WorkflowTransition[], prefix: string) {
    for (let i = 0; i < transArr.length; i++) {
      const t = transArr[i];
      const path = `${prefix}[${i}]`;

      if (!t.from) {
        errors.push({ field: `${path}.from`, message: `Transition at ${path} missing 'from'`, severity: 'error' });
      } else if (!allStepKeys.has(t.from)) {
        errors.push({ field: `${path}.from`, message: `Transition source not found: ${t.from}`, severity: 'error' });
      }

      if (!t.to) {
        errors.push({ field: `${path}.to`, message: `Transition at ${path} missing 'to'`, severity: 'error' });
      } else if (!allStepKeys.has(t.to)) {
        errors.push({ field: `${path}.to`, message: `Transition target not found: ${t.to}`, severity: 'error' });
      }
    }
  }

  validateTransitions(transitions, 'transitions');

  // Validate subprocess transitions
  for (const step of steps) {
    if (step.step_type === 'SUB_PROCESS' && step.transitions) {
      validateTransitions(step.transitions, `steps[${step.step_key}].transitions`);
    }
  }

  const valid = errors.filter((e) => e.severity === 'error').length === 0;
  return {
    valid,
    errors,
    dsl: valid ? (obj as unknown as WorkflowDSL) : undefined,
  };
}

export function validateGraph(nodes: { id: string; data: Record<string, unknown> }[], edges: { source: string; target: string }[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const nodeIds = new Set(nodes.map((n) => n.id));

  // Check for orphan nodes (no connections)
  for (const node of nodes) {
    if (node.data.stepType === 'BOUNDARY_EVENT_TIMER') continue;
    const hasConnection = edges.some((e) => e.source === node.id || e.target === node.id);
    if (!hasConnection && nodes.length > 1) {
      errors.push({ field: node.id, message: `Node "${node.data.label || node.id}" has no connections`, severity: 'warning' });
    }
  }

  // Check for edges referencing non-existent nodes
  for (const edge of edges) {
    if (!nodeIds.has(edge.source)) {
      errors.push({ field: 'edge', message: `Edge source not found: ${edge.source}`, severity: 'error' });
    }
    if (!nodeIds.has(edge.target)) {
      errors.push({ field: 'edge', message: `Edge target not found: ${edge.target}`, severity: 'error' });
    }
  }

  return errors;
}
