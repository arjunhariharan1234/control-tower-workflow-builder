'use client';

import React, { useCallback, useRef } from 'react';
import ReactFlow, {
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  ReactFlowProvider,
  ReactFlowInstance,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useWorkflowStore } from '@/store/workflow-store';
import { nodeTypes } from '@/components/nodes';
import { v4 as uuidv4 } from 'uuid';
import { StepType } from '@/types/workflow';

const NODE_SIZES: Record<string, { width: number; height: number }> = {
  START_EVENT: { width: 80, height: 100 },
  END_EVENT: { width: 80, height: 100 },
  SERVICE_TASK: { width: 260, height: 80 },
  USER_TASK: { width: 260, height: 80 },
  EXCLUSIVE_GATEWAY: { width: 100, height: 110 },
  SUB_PROCESS: { width: 300, height: 100 },
  BOUNDARY_EVENT_TIMER: { width: 60, height: 60 },
};

function WorkflowCanvasInner() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode, selectNode, selectEdge } = useWorkflowStore();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rfInstance = useRef<ReactFlowInstance | null>(null);

  const onInit = useCallback((instance: ReactFlowInstance) => { rfInstance.current = instance; }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const data = event.dataTransfer.getData('application/workflow-node');
    if (!data) return;
    const { type, label } = JSON.parse(data) as { type: StepType; label: string };
    const bounds = wrapperRef.current?.getBoundingClientRect();
    if (!bounds || !rfInstance.current) return;
    const position = rfInstance.current.project({ x: event.clientX - bounds.left, y: event.clientY - bounds.top });
    const defaults = NODE_SIZES[type] || { width: 260, height: 80 };
    const stepKey = `${type}_${uuidv4().slice(0, 6).toUpperCase()}`;

    addNode({
      id: stepKey,
      type: `custom_${type.toLowerCase()}`,
      position,
      data: {
        label,
        stepType: type,
        taskType: '',
        config: {},
        mandatoryInput: {},
        width: defaults.width,
        height: defaults.height,
        step: { step_key: stepKey, display_name: label, step_type: type },
      },
    });
  }, [addNode]);

  return (
    <div ref={wrapperRef} className="flex-1 h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={onInit}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onNodeClick={(_, node) => selectNode(node.id)}
        onEdgeClick={(_, edge) => selectEdge(edge.id)}
        onPaneClick={() => selectNode(null)}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        deleteKeyCode={['Backspace', 'Delete']}
        minZoom={0.1}
        maxZoom={2}
        style={{ background: '#0f1117' }}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
          markerEnd: { type: MarkerType.ArrowClosed, color: '#4a4d5a' },
          style: { stroke: '#4a4d5a', strokeWidth: 2 },
        }}
      >
        <Controls
          className="!rounded-lg !overflow-hidden !shadow-xl"
          style={{ background: '#1a1d27', border: '1px solid #2a2d3a' }}
          position="bottom-left"
        />
        <MiniMap
          style={{ background: '#13151d', border: '1px solid #2a2d3a', borderRadius: 8 }}
          nodeColor={(node) => {
            switch (node.data?.stepType) {
              case 'START_EVENT': return '#FFBE07';
              case 'END_EVENT': return '#FFBE07';
              case 'SERVICE_TASK': return '#FFBE07';
              case 'USER_TASK': return '#9b59b6';
              case 'EXCLUSIVE_GATEWAY': return '#FFBE07';
              case 'SUB_PROCESS': return '#22d3ee';
              default: return '#4a4d5a';
            }
          }}
          maskColor="rgba(0,0,0,0.7)"
          position="bottom-right"
        />
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#1a1d27" />
      </ReactFlow>
    </div>
  );
}

export default function WorkflowCanvas() {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner />
    </ReactFlowProvider>
  );
}
