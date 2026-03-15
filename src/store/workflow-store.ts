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
import { WorkflowDSL, WorkflowMetadata, ValidationError, StepExecution, ExecutionStatus } from '@/types/workflow';
import { parseDSLToGraph } from '@/lib/dsl-parser';
import { generateDSL } from '@/lib/dsl-generator';
import { validateDSL, validateGraph } from '@/lib/dsl-validator';

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
  bottomPanel: 'json' | 'errors' | 'logs';
  bottomPanelOpen: boolean;

  // Execution state
  executionStatus: ExecutionStatus | null;
  stepExecutions: StepExecution[];
  executionLogs: string[];

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
  setShowWorkflowsDrawer: (show: boolean) => void;
  setBottomPanel: (panel: 'json' | 'errors' | 'logs') => void;
  setBottomPanelOpen: (open: boolean) => void;

  deployWorkflow: () => Promise<void>;

  setExecutionData: (status: ExecutionStatus, steps: StepExecution[]) => void;
  addExecutionLog: (log: string) => void;
  clearExecution: () => void;

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
  bottomPanel: 'json' as const,
  bottomPanelOpen: true,
  executionStatus: null,
  stepExecutions: [],
  executionLogs: [],
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
  setShowWorkflowsDrawer: (show) => set({ showWorkflowsDrawer: show }),
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

  newWorkflow: () => {
    set({
      ...DEFAULT_STATE,
      jsonPreview: '',
    });
  },
}));
