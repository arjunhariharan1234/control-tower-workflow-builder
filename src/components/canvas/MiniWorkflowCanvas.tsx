'use client';

import React, { useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  BackgroundVariant,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { nodeTypes } from '@/components/nodes';

interface MiniWorkflowCanvasProps {
  nodes: Node[];
  edges: Edge[];
}

function MiniWorkflowCanvasInner({ nodes: propNodes, edges: propEdges }: MiniWorkflowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();

  useEffect(() => {
    setNodes(propNodes);
    setEdges(propEdges);
    // Fit view after a brief delay to ensure nodes are rendered
    setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 100);
  }, [propNodes, propEdges, setNodes, setEdges, fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.1}
      maxZoom={1.5}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      panOnDrag
      zoomOnScroll
      style={{ background: '#0a0c12' }}
      proOptions={{ hideAttribution: true }}
    >
      <Controls
        className="!rounded-lg !overflow-hidden !shadow-xl"
        style={{ background: '#1a1d27', border: '1px solid #2a2d3a' }}
        position="bottom-left"
        showInteractive={false}
      />
      <Background variant={BackgroundVariant.Dots} gap={15} size={1} color="#1a1d27" />
    </ReactFlow>
  );
}

export default function MiniWorkflowCanvas(props: MiniWorkflowCanvasProps) {
  return <MiniWorkflowCanvasInner {...props} />;
}
