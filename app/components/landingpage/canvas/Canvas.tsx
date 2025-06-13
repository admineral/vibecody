"use client";

import { useCallback, useEffect } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  NodeTypes, 
  BackgroundVariant,
  MiniMap,
  Panel,
  ReactFlowProvider,
  useReactFlow,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';

import ComponentNode from './ComponentNode';

// Define nodeTypes at module level to prevent React Flow warnings
const nodeTypes: NodeTypes = {
  component: ComponentNode,
};

// Define edge options at module level
const defaultEdgeOptions = {
  type: 'smoothstep',
  animated: false,
  style: { 
    strokeWidth: 3, // Thicker lines as requested
    stroke: '#6b7280' // gray-500 for better visibility on dark background
  },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#475569',
    width: 15,
    height: 15,
  },
};

// Define default viewport at module level
const defaultViewport = { 
  x: 0, 
  y: 0, 
  zoom: 0.8 
};

interface CanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onNodeClick: (nodeId: string) => void;
  onResetLayout: () => void;
  selectedNodeId?: string | null;
}

function CanvasControls({ onReset }: { onReset: () => void }) {
  return (
    <Panel position="top-right" className="flex gap-2">
      <button 
        onClick={onReset}
        className="bg-gray-800 text-gray-200 text-sm py-1 px-3 rounded shadow hover:bg-gray-700 transition-colors border border-gray-600"
      >
        Reset Layout
      </button>
    </Panel>
  );
}

function CanvasContent({ 
  nodes, 
  edges, 
  onNodesChange, 
  onEdgesChange, 
  onNodeClick, 
  onResetLayout,
  selectedNodeId 
}: CanvasProps) {
  const { fitView, setCenter, getNode } = useReactFlow();
  
  // Auto-pan to selected node
  useEffect(() => {
    if (selectedNodeId && nodes.length > 0) {
      // Add a small delay to ensure nodes are properly rendered
      const timeoutId = setTimeout(() => {
        const node = getNode(selectedNodeId);
        if (node && node.position) {
          // Calculate the center position of the node
          const nodeWidth = node.width || 220; // Default node width from ComponentNode
          const nodeHeight = node.height || 120; // Default node height
          const centerX = node.position.x + nodeWidth / 2;
          const centerY = node.position.y + nodeHeight / 2;
          
          // Pan to the node with a smooth transition
          setCenter(centerX, centerY, { zoom: 1, duration: 800 });
        }
      }, 100); // Small delay to ensure rendering is complete
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedNodeId, nodes, getNode, setCenter]);
  
  // Initial fit view
  const onInit = useCallback(() => {
    setTimeout(() => {
      fitView({ padding: 0.2 });
    }, 0);
  }, [fitView]);
  
  // Node click handler
  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    onNodeClick(node.id);
  }, [onNodeClick]);
  
  // Background click handler to deselect
  const onPaneClick = useCallback(() => {
    onNodeClick('');
  }, [onNodeClick]);
  
  // Reset layout handler
  const handleResetLayout = useCallback(() => {
    onResetLayout();
    setTimeout(() => {
      fitView({ padding: 0.2 });
    }, 50);
  }, [onResetLayout, fitView]);
  
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      onPaneClick={onPaneClick}
      onInit={onInit}
      nodeTypes={nodeTypes}
      defaultEdgeOptions={defaultEdgeOptions}
      fitView
      minZoom={0.1}
      maxZoom={2}
      defaultViewport={defaultViewport}
      attributionPosition="bottom-right"
      className="bg-gray-900"
    >
      <Background 
        variant={BackgroundVariant.Dots} 
        gap={16} 
        size={1} 
        color="#4b5563" // gray-600 for better contrast on dark background
      />
      <Controls 
        position="bottom-right"
        showInteractive={false}
        className="!bg-gray-800 !shadow-md !border !border-gray-600 [&>button]:!bg-gray-800 [&>button]:!border-gray-600 [&>button]:!text-gray-200 [&>button:hover]:!bg-gray-700"
      />
      <MiniMap 
        nodeStrokeWidth={3}
        zoomable
        pannable
        maskColor="rgba(17, 24, 39, 0.6)" // Dark mask for dark theme
        className="!border !border-gray-600 !bg-gray-800"
      />
      <CanvasControls onReset={handleResetLayout} />
    </ReactFlow>
  );
}

export default function Canvas(props: CanvasProps) {
  return (
    <div className="h-full w-full">
      <ReactFlowProvider>
        <CanvasContent {...props} />
      </ReactFlowProvider>
    </div>
  );
} 