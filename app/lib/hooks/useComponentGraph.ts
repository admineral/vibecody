"use client";

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNodesState, useEdgesState, MarkerType, XYPosition } from 'reactflow';
import { 
  ComponentMetadata, 
  ComponentNode, 
  ComponentEdge, 
  ComponentType,
  CanvasState
} from '../types';

// Color scheme for different component types
const typeColors = {
  [ComponentType.PAGE]: '#3b82f6', // blue-500
  [ComponentType.LAYOUT]: '#8b5cf6', // violet-500
  [ComponentType.COMPONENT]: '#10b981', // emerald-500
  [ComponentType.HOOK]: '#f97316', // orange-500
  [ComponentType.UTILITY]: '#6b7280', // gray-500
  [ComponentType.CONTEXT]: '#ec4899', // pink-500
};

// Find connected component clusters
function findComponentClusters(components: ComponentMetadata[]): ComponentMetadata[][] {
  const visited = new Set<string>();
  const clusters: ComponentMetadata[][] = [];
  
  const componentMap = new Map<string, ComponentMetadata>();
  components.forEach(comp => componentMap.set(comp.name, comp));
  
  // Build adjacency list for undirected graph
  const adjacency = new Map<string, Set<string>>();
  components.forEach(comp => {
    adjacency.set(comp.name, new Set());
  });
  
  components.forEach(comp => {
    // Add connections for both 'uses' and 'usedBy'
    (comp.uses || []).forEach(target => {
      if (adjacency.has(target)) {
        adjacency.get(comp.name)?.add(target);
        adjacency.get(target)?.add(comp.name);
      }
    });
  });
  
  // DFS to find connected components
  function dfs(componentName: string, cluster: ComponentMetadata[]) {
    if (visited.has(componentName)) return;
    visited.add(componentName);
    
    const component = componentMap.get(componentName);
    if (component) {
      cluster.push(component);
      
      // Visit all connected components
      adjacency.get(componentName)?.forEach(neighbor => {
        if (!visited.has(neighbor)) {
          dfs(neighbor, cluster);
        }
      });
    }
  }
  
  // Find all clusters
  components.forEach(comp => {
    if (!visited.has(comp.name)) {
      const cluster: ComponentMetadata[] = [];
      dfs(comp.name, cluster);
      if (cluster.length > 0) {
        clusters.push(cluster);
      }
    }
  });
  
  // Sort clusters by size (largest first) and then by type priority
  return clusters.sort((a, b) => {
    // Prioritize clusters with pages
    const aHasPage = a.some(c => c.type === ComponentType.PAGE);
    const bHasPage = b.some(c => c.type === ComponentType.PAGE);
    if (aHasPage && !bHasPage) return -1;
    if (!aHasPage && bHasPage) return 1;
    
    // Then by size
    return b.length - a.length;
  });
}

// Layout components within a cluster using force-directed algorithm
function layoutCluster(
  cluster: ComponentMetadata[], 
  clusterCenter: XYPosition,
  clusterRadius: number
): Record<string, XYPosition> {
  const positions: Record<string, XYPosition> = {};
  
  if (cluster.length === 1) {
    positions[cluster[0].name] = clusterCenter;
    return positions;
  }
  
  // Group by type for better organization
  const typeGroups = {
    [ComponentType.PAGE]: [] as ComponentMetadata[],
    [ComponentType.LAYOUT]: [] as ComponentMetadata[],
    [ComponentType.COMPONENT]: [] as ComponentMetadata[],
    [ComponentType.HOOK]: [] as ComponentMetadata[],
    [ComponentType.UTILITY]: [] as ComponentMetadata[],
    [ComponentType.CONTEXT]: [] as ComponentMetadata[],
  };
  
  cluster.forEach(comp => typeGroups[comp.type].push(comp));
  
  // Position types in concentric circles
  const typeOrder = [
    ComponentType.PAGE,
    ComponentType.LAYOUT, 
    ComponentType.COMPONENT,
    ComponentType.HOOK,
    ComponentType.UTILITY,
    ComponentType.CONTEXT
  ];
  
  let currentRadius = 0;
  
  typeOrder.forEach((type, typeIndex) => {
    const components = typeGroups[type];
    if (components.length === 0) return;
    
    if (typeIndex === 0 && components.length === 1) {
      // Place single page at center
      positions[components[0].name] = clusterCenter;
      currentRadius = Math.max(100, clusterRadius * 0.3);
      return;
    }
    
    // Calculate positions in a circle around the center
    const angleStep = (2 * Math.PI) / Math.max(components.length, 3);
    const radius = currentRadius + (typeIndex * 80);
    
    components.forEach((comp, i) => {
      const angle = i * angleStep;
      positions[comp.name] = {
        x: clusterCenter.x + radius * Math.cos(angle),
        y: clusterCenter.y + radius * Math.sin(angle)
      };
    });
    
    currentRadius = radius + 120;
  });
  
  return positions;
}

// Improved layout algorithm with clustering
function calculateLayout(components: ComponentMetadata[]): Record<string, XYPosition> {
  if (components.length === 0) return {};
  
  const positions: Record<string, XYPosition> = {};
  
  // Find component clusters
  const clusters = findComponentClusters(components);
  
  // Calculate cluster layout
  const CLUSTER_SPACING = 600;
  const clustersPerRow = Math.ceil(Math.sqrt(clusters.length));
  
  clusters.forEach((cluster, clusterIndex) => {
    // Position clusters in a grid
    const row = Math.floor(clusterIndex / clustersPerRow);
    const col = clusterIndex % clustersPerRow;
    
    const clusterCenter: XYPosition = {
      x: col * CLUSTER_SPACING + 300,
      y: row * CLUSTER_SPACING + 300
    };
    
    // Calculate cluster radius based on number of components
    const clusterRadius = Math.min(250, Math.max(150, cluster.length * 30));
    
    // Layout components within the cluster
    const clusterPositions = layoutCluster(cluster, clusterCenter, clusterRadius);
    Object.assign(positions, clusterPositions);
  });
  
  return positions;
}

// Create nodes from component metadata
function createNodesFromComponents(
  components: ComponentMetadata[],
  positions: Record<string, XYPosition>
): ComponentNode[] {
  return components.map((component): ComponentNode => {
    const position = positions[component.name] || { x: 0, y: 0 };
    
    return {
      id: component.name,
      type: 'component',
      position,
      data: {
        metadata: component,
      },
      style: {
        borderColor: typeColors[component.type],
        borderWidth: 2,
      },
    };
  });
}

// Create edges (connections) between components
function createEdgesFromComponents(components: ComponentMetadata[]): ComponentEdge[] {
  const edges: ComponentEdge[] = [];
  
  components.forEach(component => {
    // Create edges for components this component uses
    (component.uses || []).forEach(target => {
      edges.push({
        id: `${component.name}-uses-${target}`,
        source: component.name,
        target,
        type: 'smoothstep',
        animated: true,
        markerEnd: {
          type: MarkerType.Arrow,
        },
        style: { stroke: '#94a3b8' }, // slate-400
        data: {
          relationship: 'uses'
        }
      });
    });
  });
  
  return edges;
}

export function useComponentGraph(initialComponents: ComponentMetadata[] = []) {
  const [components, setComponents] = useState<ComponentMetadata[]>(initialComponents);

  // Sync internal state when initialComponents changes
  useEffect(() => {
    setComponents(initialComponents);
  }, [initialComponents]);

  // Calculate positions for the components
  const positions = useMemo(() => calculateLayout(components), [components]);
  
  // Generate initial nodes and edges
  const initialNodes = useMemo(
    () => createNodesFromComponents(components, positions),
    [components, positions]
  );
  
  const initialEdges = useMemo(
    () => createEdgesFromComponents(components),
    [components]
  );
  
  // Use ReactFlow state hooks
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync nodes and edges when initialNodes or initialEdges change
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // Update selected node
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  
  // Set components and regenerate graph
  const setComponentsAndRegenerateGraph = useCallback((newComponents: ComponentMetadata[]) => {
    setComponents(newComponents);
    
    const newPositions = calculateLayout(newComponents);
    const newNodes = createNodesFromComponents(newComponents, newPositions);
    const newEdges = createEdgesFromComponents(newComponents);
    
    setNodes(newNodes);
    setEdges(newEdges);
  }, [setNodes, setEdges]);
  
  // Add a new component
  const addComponent = useCallback((component: ComponentMetadata) => {
    setComponentsAndRegenerateGraph([...components, component]);
  }, [components, setComponentsAndRegenerateGraph]);
  
  // Remove a component
  const removeComponent = useCallback((componentName: string) => {
    const newComponents = components.filter(c => c.name !== componentName);
    setComponentsAndRegenerateGraph(newComponents);
  }, [components, setComponentsAndRegenerateGraph]);
  
  // Update a component
  const updateComponent = useCallback((updatedComponent: ComponentMetadata) => {
    const newComponents = components.map(c => 
      c.name === updatedComponent.name ? updatedComponent : c
    );
    setComponentsAndRegenerateGraph(newComponents);
  }, [components, setComponentsAndRegenerateGraph]);
  
  // Reset the graph layout
  const resetLayout = useCallback(() => {
    const newPositions = calculateLayout(components);
    const newNodes = createNodesFromComponents(components, newPositions);
    setNodes(newNodes);
  }, [components, setNodes]);

  // Handle node selection
  const selectNode = useCallback((nodeId: string | null) => {
    setSelectedNode(nodeId);
    
    // Update node styles to reflect selection
    setNodes(nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        selected: node.id === nodeId
      },
      style: {
        ...node.style,
        borderWidth: node.id === nodeId ? 3 : 2,
        boxShadow: node.id === nodeId ? '0 0 8px 2px rgba(59, 130, 246, 0.6)' : undefined
      }
    })));
  }, [nodes, setNodes]);

  // Current state of the canvas
  const canvasState: CanvasState = useMemo(() => ({
    nodes,
    edges,
    selectedNode
  }), [nodes, edges, selectedNode]);
  
  return {
    // State
    components,
    nodes,
    edges,
    selectedNode,
    canvasState,
    
    // Actions
    setComponents: setComponentsAndRegenerateGraph,
    addComponent,
    removeComponent,
    updateComponent,
    resetLayout,
    selectNode,
    
    // ReactFlow handlers
    onNodesChange,
    onEdgesChange,
  };
} 