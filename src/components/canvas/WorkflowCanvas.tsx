'use client';

import React, { useCallback, useRef, useState } from 'react';
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
  const [isDragOver, setIsDragOver] = useState(false);

  const onInit = useCallback((instance: ReactFlowInstance) => { rfInstance.current = instance; }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const data = event.dataTransfer.getData('application/workflow-node');
    if (!data) return;
    const { type, label, defaults: nodeDefaults } = JSON.parse(data) as { type: StepType; label: string; defaults?: Record<string, unknown> };
    const bounds = wrapperRef.current?.getBoundingClientRect();
    if (!bounds || !rfInstance.current) return;
    const position = rfInstance.current.project({ x: event.clientX - bounds.left, y: event.clientY - bounds.top });
    const sizeDefaults = NODE_SIZES[type] || { width: 260, height: 80 };
    const stepKey = `${type}_${uuidv4().slice(0, 6).toUpperCase()}`;

    addNode({
      id: stepKey,
      type: `custom_${type.toLowerCase()}`,
      position,
      data: {
        label,
        stepType: type,
        taskType: (nodeDefaults?.taskType as string) || '',
        config: (nodeDefaults?.config as Record<string, unknown>) || {},
        mandatoryInput: {},
        width: sizeDefaults.width,
        height: sizeDefaults.height,
        step: { step_key: stepKey, display_name: label, step_type: type },
        ...nodeDefaults,
      },
    });
    setIsDragOver(false);
  }, [addNode]);

  const isEmpty = nodes.length === 0;

  return (
    <div ref={wrapperRef} className="flex-1 h-full relative playground-drop-zone">
      {/* Enhanced grid point overlay */}
      <div
        className="playground-grid-overlay"
        style={{
          opacity: isDragOver ? 0.6 : 0.25,
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Drag-over highlight border */}
      {isDragOver && (
        <div
          className="absolute inset-0 z-10 pointer-events-none rounded-sm"
          style={{
            border: '2px dashed rgba(255, 190, 7, 0.3)',
            background: 'rgba(255, 190, 7, 0.02)',
          }}
        />
      )}

      {/* Empty state hint */}
      {isEmpty && !isDragOver && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="text-center animate-fadeIn" style={{ opacity: 0.5 }}>
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ border: '2px dashed rgba(255,190,7,0.2)' }}>
              <svg className="w-7 h-7" style={{ color: 'rgba(255,190,7,0.4)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <p className="text-sm font-medium" style={{ color: '#4a4d5a' }}>Drag nodes from the left panel</p>
            <p className="text-xs mt-1" style={{ color: '#363944' }}>or load a template to get started</p>
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={onInit}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
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
        <Background variant={BackgroundVariant.Dots} gap={15} size={1.2} color={isDragOver ? 'rgba(255,190,7,0.15)' : '#1e212d'} />
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
