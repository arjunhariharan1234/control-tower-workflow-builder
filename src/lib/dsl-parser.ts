import { Node, Edge, MarkerType } from 'reactflow';
import { WorkflowDSL, WorkflowStep, WorkflowTransition, TransitionCondition } from '@/types/workflow';

// Rendered node sizes (matching what our custom components actually render)
const NODE_SIZES: Record<string, { width: number; height: number }> = {
  START_EVENT: { width: 80, height: 100 },
  END_EVENT: { width: 80, height: 100 },
  SERVICE_TASK: { width: 260, height: 80 },
  USER_TASK: { width: 260, height: 80 },
  EXCLUSIVE_GATEWAY: { width: 100, height: 110 },
  SUB_PROCESS: { width: 300, height: 100 },
  BOUNDARY_EVENT_TIMER: { width: 60, height: 60 },
};

function getNodeSize(stepType: string) {
  return NODE_SIZES[stepType] || { width: 260, height: 80 };
}

function formatCondition(condition: TransitionCondition): string {
  if (condition.conditions && condition.conditions.length > 0) {
    const parts = condition.conditions.map(formatCondition);
    return parts.join(` ${condition.logic || 'AND'} `);
  }
  return `${condition.variable} ${condition.operator} ${condition.value}`;
}

export function stepToNode(step: WorkflowStep): Node[] {
  const nodes: Node[] = [];
  const size = getNodeSize(step.step_type);

  const node: Node = {
    id: step.step_key,
    type: `custom_${step.step_type.toLowerCase()}`,
    position: { x: 0, y: 0 }, // Will be set by auto-layout
    data: {
      label: step.display_name,
      stepType: step.step_type,
      taskType: step.task_type,
      mandatoryInput: step.mandatory_input,
      boundaryEvents: step.boundary_events,
      config: step.config,
      width: size.width,
      height: size.height,
      step: step,
    },
  };

  nodes.push(node);

  // NOTE: Subprocess children are rendered as separate top-level nodes
  // (not nested inside parent) for cleaner layout
  if (step.step_type === 'SUB_PROCESS' && step.steps) {
    for (const childStep of step.steps) {
      nodes.push(...stepToNode(childStep));
    }
  }

  return nodes;
}

export function transitionToEdge(transition: WorkflowTransition): Edge {
  let label = transition.label || '';
  if (transition.condition) {
    label = formatCondition(transition.condition);
  }
  if (transition.condition_expression) {
    label = transition.condition_expression;
  }
  if (transition.default) {
    label = label ? `${label} (default)` : 'default';
  }

  return {
    id: `${transition.from}->${transition.to}`,
    source: transition.from,
    target: transition.to,
    label: label || undefined,
    type: 'smoothstep',
    animated: false,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
    data: { transition },
    style: { stroke: '#64748b', strokeWidth: 2 },
    labelStyle: { fill: '#cbd5e1', fontSize: 10, fontWeight: 500 },
    labelBgStyle: { fill: '#1e293b', fillOpacity: 0.95, rx: 4, ry: 4 },
    labelBgPadding: [8, 4] as [number, number],
  };
}

export function parseDSLToGraph(dsl: WorkflowDSL): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Flatten all steps (including subprocess children) into top-level nodes
  for (const step of dsl.steps) {
    nodes.push(...stepToNode(step));
  }

  // Collect all transitions (including subprocess internal ones)
  for (const transition of dsl.transitions) {
    edges.push(transitionToEdge(transition));
  }
  for (const step of dsl.steps) {
    if (step.step_type === 'SUB_PROCESS' && step.transitions) {
      for (const transition of step.transitions) {
        edges.push(transitionToEdge(transition));
      }
    }
  }

  // Always run auto-layout for clean rendering
  autoLayout(nodes, edges);

  return { nodes, edges };
}

// ── Auto-Layout: top-to-bottom BFS with proper spacing ──────────────

function autoLayout(nodes: Node[], edges: Edge[]) {
  if (nodes.length === 0) return;

  // Build adjacency
  const nodeIds = new Set(nodes.map((n) => n.id));
  const adj: Record<string, string[]> = {};
  const inDegree: Record<string, number> = {};

  for (const n of nodes) {
    adj[n.id] = [];
    inDegree[n.id] = 0;
  }

  for (const edge of edges) {
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
      adj[edge.source].push(edge.target);
      inDegree[edge.target] = (inDegree[edge.target] || 0) + 1;
    }
  }

  // BFS topological sort
  const queue: string[] = [];
  for (const n of nodes) {
    if ((inDegree[n.id] || 0) === 0) queue.push(n.id);
  }

  const rows: string[][] = [];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const next: string[] = [];
    const row: string[] = [];
    const size = queue.length;

    for (let i = 0; i < size; i++) {
      const id = queue[i];
      if (visited.has(id)) continue;
      visited.add(id);
      row.push(id);

      for (const nb of adj[id] || []) {
        inDegree[nb]--;
        if (inDegree[nb] === 0) next.push(nb);
      }
    }

    if (row.length > 0) rows.push(row);
    queue.length = 0;
    queue.push(...next);
  }

  // Add unvisited nodes (disconnected)
  for (const n of nodes) {
    if (!visited.has(n.id)) {
      rows.push([n.id]);
      visited.add(n.id);
    }
  }

  // Position nodes - top to bottom, centered horizontally
  const H_GAP = 60;   // horizontal gap between nodes in same row
  const V_GAP = 100;  // vertical gap between rows

  let currentY = 40;

  for (const row of rows) {
    // Calculate row dimensions
    const rowWidths: number[] = row.map((id) => {
      const node = nodes.find((n) => n.id === id);
      return getNodeSize(node?.data?.stepType || '').width;
    });
    const rowHeights: number[] = row.map((id) => {
      const node = nodes.find((n) => n.id === id);
      return getNodeSize(node?.data?.stepType || '').height;
    });

    const totalWidth = rowWidths.reduce((sum, w) => sum + w, 0) + (row.length - 1) * H_GAP;
    let startX = -totalWidth / 2;

    for (let i = 0; i < row.length; i++) {
      const node = nodes.find((n) => n.id === row[i]);
      if (node) {
        node.position = {
          x: startX + rowWidths[i] / 2 - rowWidths[i] / 2,
          y: currentY,
        };
        startX += rowWidths[i] + H_GAP;
      }
    }

    currentY += Math.max(...rowHeights) + V_GAP;
  }
}
