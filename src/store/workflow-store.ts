import { create } from 'zustand';
import {
  Node,
  Edge,
  Connection,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  MarkerType,
} from 'reactflow';
import { WorkflowDSL, WorkflowMetadata, ValidationError, StepExecution, ExecutionStatus, ExecutionRun, StepExecutionResult } from '@/types/workflow';
import { parseDSLToGraph } from '@/lib/dsl-parser';
import { generateDSL } from '@/lib/dsl-generator';
import { validateDSL, validateGraph } from '@/lib/dsl-validator';
import { saveExecutionRun, getExecutionHistory } from '@/lib/execution-history';
import { saveVersion as persistVersion } from '@/lib/version-history';
import { VersionChangeType } from '@/types/version';
import { v4 as uuidv4 } from 'uuid';

interface WorkflowState {
  // Graph state
  nodes: Node[];
  edges: Edge[];

  // Workflow metadata
  workflowName: string;
  workflowCode: string;
  workflowDescription: string;
  workflowMetadata: WorkflowMetadata;

  // UI state
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  jsonPreview: string;
  validationErrors: ValidationError[];
  showImportModal: boolean;
  showDeployModal: boolean;
  showWorkflowsDrawer: boolean;
  workflowsDrawerTab: 'saved' | 'templates';
  bottomPanel: 'json' | 'errors' | 'logs';
  bottomPanelOpen: boolean;

  // Execution state
  executionStatus: ExecutionStatus | null;
  stepExecutions: StepExecution[];
  executionLogs: string[];

  // Simulation state
  simulationRunning: boolean;
  simulationSpeed: number;
  replayingRunId: string | null;
  executionHistory: ExecutionRun[];
  showHistoryDrawer: boolean;

  // Version history
  showVersionHistory: boolean;

  // Deployment state
  deploymentStatus: 'idle' | 'deploying' | 'success' | 'error';
  deploymentMessage: string;

  // Actions
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;

  addNode: (node: Node) => void;
  deleteNode: (nodeId: string) => void;
  updateNodeData: (nodeId: string, data: Partial<Record<string, unknown>>) => void;
  selectNode: (nodeId: string | null) => void;
  selectEdge: (edgeId: string | null) => void;
  updateEdgeData: (edgeId: string, data: Record<string, unknown>) => void;

  loadDSL: (dsl: WorkflowDSL) => void;
  importJSON: (json: string) => { success: boolean; errors: ValidationError[] };
  generateJSON: () => string;
  validateWorkflow: () => ValidationError[];

  setWorkflowName: (name: string) => void;
  setWorkflowCode: (code: string) => void;
  setWorkflowDescription: (desc: string) => void;
  setWorkflowMetadata: (meta: WorkflowMetadata) => void;

  setShowImportModal: (show: boolean) => void;
  setShowDeployModal: (show: boolean) => void;
  setShowWorkflowsDrawer: (show: boolean, tab?: 'saved' | 'templates') => void;
  setBottomPanel: (panel: 'json' | 'errors' | 'logs') => void;
  setBottomPanelOpen: (open: boolean) => void;

  deployWorkflow: () => Promise<void>;

  setExecutionData: (status: ExecutionStatus, steps: StepExecution[]) => void;
  addExecutionLog: (log: string) => void;
  clearExecution: () => void;

  runSimulation: () => Promise<void>;
  stopSimulation: () => void;
  replayExecution: (run: ExecutionRun) => Promise<void>;
  setSimulationSpeed: (speed: number) => void;
  loadExecutionHistory: () => void;
  setShowHistoryDrawer: (show: boolean) => void;

  setShowVersionHistory: (show: boolean) => void;
  saveVersionSnapshot: (changeType: VersionChangeType) => void;

  newWorkflow: () => void;
}

const DEFAULT_STATE = {
  nodes: [],
  edges: [],
  workflowName: 'Untitled Workflow',
  workflowCode: 'UNTITLED',
  workflowDescription: '',
  workflowMetadata: {} as WorkflowMetadata,
  selectedNodeId: null,
  selectedEdgeId: null,
  jsonPreview: '',
  validationErrors: [],
  showImportModal: false,
  showDeployModal: false,
  showWorkflowsDrawer: false,
  workflowsDrawerTab: 'saved' as const,
  bottomPanel: 'json' as const,
  bottomPanelOpen: true,
  executionStatus: null,
  stepExecutions: [],
  executionLogs: [],
  simulationRunning: false,
  simulationSpeed: 1000,
  replayingRunId: null,
  executionHistory: [],
  showHistoryDrawer: false,
  showVersionHistory: false,
  deploymentStatus: 'idle' as const,
  deploymentMessage: '',
};

function syncJsonPreview(nodes: Node[], edges: Edge[], meta: { name: string; code: string; description?: string; metadata?: Record<string, unknown> }): string {
  try {
    const dsl = generateDSL(nodes, edges, meta);
    return JSON.stringify(dsl, null, 2);
  } catch {
    return '{}';
  }
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  ...DEFAULT_STATE,

  setNodes: (nodes) => {
    const state = get();
    const json = syncJsonPreview(nodes, state.edges, {
      name: state.workflowName,
      code: state.workflowCode,
      description: state.workflowDescription,
      metadata: state.workflowMetadata,
    });
    set({ nodes, jsonPreview: json });
  },

  setEdges: (edges) => {
    const state = get();
    const json = syncJsonPreview(state.nodes, edges, {
      name: state.workflowName,
      code: state.workflowCode,
      description: state.workflowDescription,
      metadata: state.workflowMetadata,
    });
    set({ edges, jsonPreview: json });
  },

  onNodesChange: (changes) => {
    const state = get();
    const nodes = applyNodeChanges(changes, state.nodes);
    const json = syncJsonPreview(nodes, state.edges, {
      name: state.workflowName,
      code: state.workflowCode,
      description: state.workflowDescription,
      metadata: state.workflowMetadata,
    });
    set({ nodes, jsonPreview: json });
  },

  onEdgesChange: (changes) => {
    const state = get();
    const edges = applyEdgeChanges(changes, state.edges);
    const json = syncJsonPreview(state.nodes, edges, {
      name: state.workflowName,
      code: state.workflowCode,
      description: state.workflowDescription,
      metadata: state.workflowMetadata,
    });
    set({ edges, jsonPreview: json });
  },

  onConnect: (connection) => {
    const state = get();
    const newEdge = {
      ...connection,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: '#64748b', strokeWidth: 2 },
      data: { transition: { from: connection.source, to: connection.target } },
    };
    const edges = addEdge(newEdge, state.edges);
    const json = syncJsonPreview(state.nodes, edges, {
      name: state.workflowName,
      code: state.workflowCode,
      description: state.workflowDescription,
      metadata: state.workflowMetadata,
    });
    set({ edges, jsonPreview: json });
  },

  addNode: (node) => {
    const state = get();
    const nodes = [...state.nodes, node];
    const json = syncJsonPreview(nodes, state.edges, {
      name: state.workflowName,
      code: state.workflowCode,
      description: state.workflowDescription,
      metadata: state.workflowMetadata,
    });
    set({ nodes, jsonPreview: json });
  },

  deleteNode: (nodeId) => {
    const state = get();
    const nodes = state.nodes.filter((n) => n.id !== nodeId && n.parentNode !== nodeId);
    const edges = state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
    const json = syncJsonPreview(nodes, edges, {
      name: state.workflowName,
      code: state.workflowCode,
      description: state.workflowDescription,
      metadata: state.workflowMetadata,
    });
    set({
      nodes,
      edges,
      jsonPreview: json,
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
    });
  },

  updateNodeData: (nodeId, data) => {
    const state = get();
    const nodes = state.nodes.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n));
    const json = syncJsonPreview(nodes, state.edges, {
      name: state.workflowName,
      code: state.workflowCode,
      description: state.workflowDescription,
      metadata: state.workflowMetadata,
    });
    set({ nodes, jsonPreview: json });
  },

  selectNode: (nodeId) => set({ selectedNodeId: nodeId, selectedEdgeId: null }),
  selectEdge: (edgeId) => set({ selectedEdgeId: edgeId, selectedNodeId: null }),

  updateEdgeData: (edgeId, data) => {
    const state = get();
    const edges = state.edges.map((e) => (e.id === edgeId ? { ...e, data: { ...e.data, ...data } } : e));
    const json = syncJsonPreview(state.nodes, edges, {
      name: state.workflowName,
      code: state.workflowCode,
      description: state.workflowDescription,
      metadata: state.workflowMetadata,
    });
    set({ edges, jsonPreview: json });
  },

  loadDSL: (dsl) => {
    const { nodes, edges } = parseDSLToGraph(dsl);
    const json = JSON.stringify(dsl, null, 2);
    set({
      nodes,
      edges,
      workflowName: dsl.name,
      workflowCode: dsl.code,
      workflowDescription: dsl.description || '',
      workflowMetadata: dsl.metadata || {},
      jsonPreview: json,
      selectedNodeId: null,
      selectedEdgeId: null,
      validationErrors: [],
      executionStatus: null,
      stepExecutions: [],
    });
  },

  importJSON: (json) => {
    try {
      const parsed = JSON.parse(json);
      const result = validateDSL(parsed);
      if (result.valid && result.dsl) {
        get().loadDSL(result.dsl);
        return { success: true, errors: result.errors };
      }
      return { success: false, errors: result.errors };
    } catch (e) {
      return {
        success: false,
        errors: [{ field: 'json', message: `Invalid JSON: ${(e as Error).message}`, severity: 'error' as const }],
      };
    }
  },

  generateJSON: () => {
    const state = get();
    const dsl = generateDSL(state.nodes, state.edges, {
      name: state.workflowName,
      code: state.workflowCode,
      description: state.workflowDescription,
      metadata: state.workflowMetadata,
    });
    const json = JSON.stringify(dsl, null, 2);
    set({ jsonPreview: json });
    return json;
  },

  validateWorkflow: () => {
    const state = get();
    const graphErrors = validateGraph(
      state.nodes.map((n) => ({ id: n.id, data: n.data })),
      state.edges.map((e) => ({ source: e.source, target: e.target }))
    );

    // Also validate the generated DSL
    const dsl = generateDSL(state.nodes, state.edges, {
      name: state.workflowName,
      code: state.workflowCode,
      description: state.workflowDescription,
      metadata: state.workflowMetadata,
    });
    const dslResult = validateDSL(dsl);
    const allErrors = [...graphErrors, ...dslResult.errors];
    set({ validationErrors: allErrors, bottomPanel: 'errors', bottomPanelOpen: true });
    return allErrors;
  },

  setWorkflowName: (name) => {
    const state = get();
    const json = syncJsonPreview(state.nodes, state.edges, {
      name,
      code: state.workflowCode,
      description: state.workflowDescription,
      metadata: state.workflowMetadata,
    });
    set({ workflowName: name, jsonPreview: json });
  },
  setWorkflowCode: (code) => {
    const state = get();
    const json = syncJsonPreview(state.nodes, state.edges, {
      name: state.workflowName,
      code,
      description: state.workflowDescription,
      metadata: state.workflowMetadata,
    });
    set({ workflowCode: code, jsonPreview: json });
  },
  setWorkflowDescription: (description) => {
    const state = get();
    const json = syncJsonPreview(state.nodes, state.edges, {
      name: state.workflowName,
      code: state.workflowCode,
      description,
      metadata: state.workflowMetadata,
    });
    set({ workflowDescription: description, jsonPreview: json });
  },
  setWorkflowMetadata: (metadata) => {
    const state = get();
    const json = syncJsonPreview(state.nodes, state.edges, {
      name: state.workflowName,
      code: state.workflowCode,
      description: state.workflowDescription,
      metadata,
    });
    set({ workflowMetadata: metadata, jsonPreview: json });
  },

  setShowImportModal: (show) => set({ showImportModal: show }),
  setShowDeployModal: (show) => set({ showDeployModal: show }),
  setShowWorkflowsDrawer: (show, tab) => set({ showWorkflowsDrawer: show, ...(tab ? { workflowsDrawerTab: tab } : {}) }),
  setBottomPanel: (panel) => set({ bottomPanel: panel }),
  setBottomPanelOpen: (open) => set({ bottomPanelOpen: open }),

  deployWorkflow: async () => {
    const state = get();
    set({ deploymentStatus: 'deploying', deploymentMessage: 'Deploying workflow...' });

    try {
      const dsl = generateDSL(state.nodes, state.edges, {
        name: state.workflowName,
        code: state.workflowCode,
        description: state.workflowDescription,
        metadata: state.workflowMetadata,
      });

      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dsl),
      });

      const data = await response.json();

      if (response.ok) {
        set({
          deploymentStatus: 'success',
          deploymentMessage: `Workflow deployed successfully! ID: ${data.workflow_id}`,
        });
        get().addExecutionLog(`[${new Date().toISOString()}] Deployed: ${data.workflow_id} - Status: ${data.status}`);
      } else {
        set({
          deploymentStatus: 'error',
          deploymentMessage: data.error || 'Deployment failed',
        });
        get().addExecutionLog(`[${new Date().toISOString()}] Deploy failed: ${data.error}`);
      }
    } catch (err) {
      set({
        deploymentStatus: 'error',
        deploymentMessage: `Network error: ${(err as Error).message}`,
      });
      get().addExecutionLog(`[${new Date().toISOString()}] Deploy error: ${(err as Error).message}`);
    }
  },

  setExecutionData: (status, steps) => {
    set({ executionStatus: status, stepExecutions: steps });
  },

  addExecutionLog: (log) => {
    set((state) => ({ executionLogs: [...state.executionLogs, log] }));
  },

  clearExecution: () => {
    set({ executionStatus: null, stepExecutions: [], executionLogs: [] });
  },

  runSimulation: async () => {
    const state = get();
    if (state.simulationRunning || state.nodes.length === 0) return;

    const runId = uuidv4();
    const startedAt = new Date().toISOString();
    const stepResults: StepExecutionResult[] = [];
    const logs: string[] = [];

    // Collect steps in topological order via edges
    const orderedNodeIds: string[] = [];
    const visited = new Set<string>();
    const startNode = state.nodes.find((n) => n.data?.stepType === 'START_EVENT');

    if (startNode) {
      const queue = [startNode.id];
      while (queue.length > 0) {
        const nodeId = queue.shift()!;
        if (visited.has(nodeId)) continue;
        visited.add(nodeId);
        orderedNodeIds.push(nodeId);
        const outgoing = state.edges.filter((e) => e.source === nodeId);
        for (const edge of outgoing) {
          if (!visited.has(edge.target)) queue.push(edge.target);
        }
      }
    }
    // Add any unvisited nodes
    for (const n of state.nodes) {
      if (!visited.has(n.id)) orderedNodeIds.push(n.id);
    }

    // Reset all nodes to PENDING
    const pendingNodes = state.nodes.map((n) => ({
      ...n,
      data: { ...n.data, executionStatus: 'PENDING' as ExecutionStatus },
    }));
    set({
      simulationRunning: true,
      replayingRunId: null,
      executionStatus: 'RUNNING',
      executionLogs: [],
      nodes: pendingNodes,
      bottomPanel: 'logs',
      bottomPanelOpen: true,
    });

    const ts = () => new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const addLog = (msg: string) => {
      const entry = `[${ts()}] ${msg}`;
      logs.push(entry);
      set((s) => ({ executionLogs: [...s.executionLogs, entry] }));
    };

    addLog(`▶ Simulation started — ${state.workflowName} (${orderedNodeIds.length} steps)`);

    let failed = false;
    let failedStepKey: string | undefined;

    for (const nodeId of orderedNodeIds) {
      if (!get().simulationRunning) {
        addLog('⏹ Simulation stopped by user');
        break;
      }

      const node = get().nodes.find((n) => n.id === nodeId);
      if (!node) continue;

      const stepStart = new Date().toISOString();

      // Mark RUNNING
      set((s) => ({
        nodes: s.nodes.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, executionStatus: 'RUNNING' as ExecutionStatus } } : n),
      }));
      addLog(`⟳ Running: ${node.data?.label || nodeId}`);

      // Simulate execution time
      const speed = get().simulationSpeed;
      const jitter = Math.random() * speed * 0.4;
      await new Promise((r) => setTimeout(r, speed + jitter));

      if (!get().simulationRunning) break;

      // Simulate ~5% random failure for non-start/end events
      const stepType = node.data?.stepType as string;
      const canFail = !['START_EVENT', 'END_EVENT'].includes(stepType);
      const didFail = canFail && Math.random() < 0.05;

      const stepEnd = new Date().toISOString();
      const status: ExecutionStatus = didFail ? 'FAILED' : 'COMPLETED';

      set((s) => ({
        nodes: s.nodes.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, executionStatus: status } } : n),
      }));

      const result: StepExecutionResult = {
        step_key: nodeId,
        display_name: node.data?.label || nodeId,
        step_type: stepType as StepExecutionResult['step_type'],
        status,
        started_at: stepStart,
        completed_at: stepEnd,
        duration: new Date(stepEnd).getTime() - new Date(stepStart).getTime(),
        error: didFail ? `Simulated failure at ${node.data?.label}` : undefined,
      };
      stepResults.push(result);

      if (didFail) {
        addLog(`✕ Failed: ${node.data?.label || nodeId} — Simulated failure`);
        failed = true;
        failedStepKey = nodeId;
        // Mark remaining nodes as SKIPPED
        const remaining = orderedNodeIds.slice(orderedNodeIds.indexOf(nodeId) + 1);
        set((s) => ({
          nodes: s.nodes.map((n) => remaining.includes(n.id) ? { ...n, data: { ...n.data, executionStatus: 'SKIPPED' as ExecutionStatus } } : n),
        }));
        for (const remId of remaining) {
          const remNode = get().nodes.find((n) => n.id === remId);
          stepResults.push({
            step_key: remId,
            display_name: remNode?.data?.label || remId,
            step_type: (remNode?.data?.stepType || 'SERVICE_TASK') as StepExecutionResult['step_type'],
            status: 'SKIPPED',
            started_at: stepEnd,
            completed_at: stepEnd,
            duration: 0,
          });
        }
        break;
      } else {
        addLog(`✓ Completed: ${node.data?.label || nodeId}`);
      }
    }

    const completedAt = new Date().toISOString();
    const finalStatus: ExecutionStatus = !get().simulationRunning ? 'FAILED' : failed ? 'FAILED' : 'COMPLETED';

    addLog(finalStatus === 'COMPLETED'
      ? `✓ Simulation completed successfully`
      : `✕ Simulation ended with status: ${finalStatus}`);

    const run: ExecutionRun = {
      id: runId,
      workflowName: state.workflowName,
      workflowCode: state.workflowCode,
      status: finalStatus,
      startedAt,
      completedAt,
      duration: new Date(completedAt).getTime() - new Date(startedAt).getTime(),
      stepResults,
      logs,
      nodeCount: orderedNodeIds.length,
      failedStepKey,
    };

    saveExecutionRun(run);

    set({
      simulationRunning: false,
      executionStatus: finalStatus,
      executionHistory: getExecutionHistory(),
    });
  },

  stopSimulation: () => {
    set({ simulationRunning: false });
  },

  replayExecution: async (run: ExecutionRun) => {
    const state = get();
    if (state.simulationRunning) return;

    set({
      replayingRunId: run.id,
      executionLogs: [],
      bottomPanel: 'logs',
      bottomPanelOpen: true,
      showHistoryDrawer: false,
    });

    // Reset all nodes to PENDING
    set((s) => ({
      nodes: s.nodes.map((n) => ({
        ...n,
        data: { ...n.data, executionStatus: 'PENDING' as ExecutionStatus },
      })),
      simulationRunning: true,
    }));

    const addLog = (msg: string) => {
      set((s) => ({ executionLogs: [...s.executionLogs, msg] }));
    };

    addLog(`▶ Replaying execution: ${run.id.slice(0, 8)}... (${run.workflowName})`);
    addLog(`  Originally ran at ${new Date(run.startedAt).toLocaleString()}`);

    for (const step of run.stepResults) {
      if (!get().simulationRunning) break;

      // Mark RUNNING
      set((s) => ({
        nodes: s.nodes.map((n) => n.id === step.step_key ? { ...n, data: { ...n.data, executionStatus: 'RUNNING' as ExecutionStatus } } : n),
      }));
      addLog(`[${new Date(step.started_at).toLocaleTimeString()}] ⟳ ${step.display_name}`);

      await new Promise((r) => setTimeout(r, 600));
      if (!get().simulationRunning) break;

      // Apply final status
      set((s) => ({
        nodes: s.nodes.map((n) => n.id === step.step_key ? { ...n, data: { ...n.data, executionStatus: step.status } } : n),
      }));

      if (step.status === 'COMPLETED') {
        addLog(`[${new Date(step.completed_at || step.started_at).toLocaleTimeString()}] ✓ ${step.display_name} (${step.duration}ms)`);
      } else if (step.status === 'FAILED') {
        addLog(`[${new Date(step.completed_at || step.started_at).toLocaleTimeString()}] ✕ ${step.display_name} — ${step.error}`);
      } else if (step.status === 'SKIPPED') {
        addLog(`  ⊘ ${step.display_name} — Skipped`);
        set((s) => ({
          nodes: s.nodes.map((n) => n.id === step.step_key ? { ...n, data: { ...n.data, executionStatus: 'SKIPPED' as ExecutionStatus } } : n),
        }));
      }
    }

    addLog(`▶ Replay complete — Status: ${run.status} | Duration: ${run.duration}ms`);
    set({ simulationRunning: false, replayingRunId: null, executionStatus: run.status });
  },

  setSimulationSpeed: (speed) => set({ simulationSpeed: speed }),
  loadExecutionHistory: () => set({ executionHistory: getExecutionHistory() }),
  setShowHistoryDrawer: (show) => {
    if (show) {
      set({ executionHistory: getExecutionHistory(), showHistoryDrawer: true });
    } else {
      set({ showHistoryDrawer: false });
    }
  },

  setShowVersionHistory: (show) => set({ showVersionHistory: show }),
  saveVersionSnapshot: (changeType) => {
    const state = get();
    const dsl = generateDSL(state.nodes, state.edges, {
      name: state.workflowName,
      code: state.workflowCode,
      description: state.workflowDescription,
      metadata: state.workflowMetadata,
    });
    persistVersion(
      state.workflowCode, // use code as workflow ID for matching
      state.workflowCode,
      dsl,
      changeType,
    );
  },

  newWorkflow: () => {
    set({
      ...DEFAULT_STATE,
      jsonPreview: '',
    });
  },
}));
