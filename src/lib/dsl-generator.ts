import { Node, Edge } from 'reactflow';
import { WorkflowDSL, WorkflowStep, WorkflowTransition, StepType } from '@/types/workflow';

export function nodeToStep(node: Node): WorkflowStep {
  const data = node.data;
  const step: WorkflowStep = {
    step_key: node.id,
    display_name: data.label || node.id,
    step_type: (data.stepType || 'SERVICE_TASK') as StepType,
    layout: {
      x: Math.round(node.position.x),
      y: Math.round(node.position.y),
      width: data.width || 200,
      height: data.height || 80,
    },
  };

  if (data.taskType) step.task_type = data.taskType;
  if (data.mandatoryInput && Object.keys(data.mandatoryInput).length > 0) {
    step.mandatory_input = data.mandatoryInput;
  }
  if (data.config && Object.keys(data.config).length > 0) {
    step.config = data.config;
  }

  // Preserve boundary events from original step data
  if (data.step?.boundary_events) {
    step.boundary_events = data.step.boundary_events;
  }

  // Copy any extra fields from the original step data
  if (data.step) {
    const preserved = { ...data.step };
    delete preserved.step_key;
    delete preserved.display_name;
    delete preserved.step_type;
    delete preserved.task_type;
    delete preserved.layout;
    delete preserved.mandatory_input;
    delete preserved.boundary_events;
    delete preserved.steps;
    delete preserved.transitions;
    delete preserved.config;
    for (const [key, value] of Object.entries(preserved)) {
      if (value !== undefined && !(key in step)) {
        step[key] = value;
      }
    }
  }

  return step;
}

export function edgeToTransition(edge: Edge): WorkflowTransition {
  const transition: WorkflowTransition = {
    from: edge.source,
    to: edge.target,
  };

  if (edge.data?.transition) {
    const orig = edge.data.transition;
    if (orig.condition) transition.condition = orig.condition;
    if (orig.condition_expression) transition.condition_expression = orig.condition_expression;
    if (orig.default) transition.default = orig.default;
    if (orig.label) transition.label = orig.label;
  }

  return transition;
}

export function generateDSL(
  nodes: Node[],
  edges: Edge[],
  workflowMeta: { name: string; code: string; description?: string; metadata?: Record<string, unknown> }
): WorkflowDSL {
  // Identify which nodes were originally subprocess children
  // by checking the original step data stored in data.step
  const subProcessParents = new Map<string, string>(); // childId -> parentId
  for (const node of nodes) {
    if (node.data.stepType === 'SUB_PROCESS' && node.data.step?.steps) {
      for (const childStep of node.data.step.steps) {
        subProcessParents.set(childStep.step_key, node.id);
      }
    }
  }

  // Top-level nodes = not children of a subprocess
  const topLevelNodes = nodes.filter((n) => !subProcessParents.has(n.id));

  // Build subprocess structures
  const subProcessChildren = new Map<string, Node[]>(); // parentId -> child nodes
  for (const node of nodes) {
    const parentId = subProcessParents.get(node.id);
    if (parentId) {
      const children = subProcessChildren.get(parentId) || [];
      children.push(node);
      subProcessChildren.set(parentId, children);
    }
  }

  // Separate edges into top-level and subprocess-internal
  const topLevelEdges: Edge[] = [];
  const subProcessEdges = new Map<string, Edge[]>();

  for (const edge of edges) {
    const srcParent = subProcessParents.get(edge.source);
    const tgtParent = subProcessParents.get(edge.target);

    if (srcParent && tgtParent && srcParent === tgtParent) {
      const existing = subProcessEdges.get(srcParent) || [];
      existing.push(edge);
      subProcessEdges.set(srcParent, existing);
    } else {
      topLevelEdges.push(edge);
    }
  }

  const steps: WorkflowStep[] = topLevelNodes.map((node) => {
    const step = nodeToStep(node);

    // Re-attach subprocess children and transitions
    if (step.step_type === 'SUB_PROCESS') {
      const children = subProcessChildren.get(node.id);
      if (children && children.length > 0) {
        step.steps = children.map((child) => nodeToStep(child));
      }
      const spEdges = subProcessEdges.get(node.id);
      if (spEdges && spEdges.length > 0) {
        step.transitions = spEdges.map(edgeToTransition);
      }
    }

    return step;
  });

  const transitions: WorkflowTransition[] = topLevelEdges.map(edgeToTransition);

  return {
    name: workflowMeta.name || 'Untitled Workflow',
    code: workflowMeta.code || 'UNTITLED',
    description: workflowMeta.description || '',
    metadata: workflowMeta.metadata as WorkflowDSL['metadata'],
    steps,
    transitions,
  };
}
