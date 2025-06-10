"use client"

import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, RoundedBox, Html, Line } from '@react-three/drei'
import { Group, Vector3 } from 'three'
import { ComponentMetadata } from '../../lib/types'

interface GitHubFile {
  path: string;
  type: 'blob' | 'tree';
  url: string;
}

interface FileTree3DProps {
  components: ComponentMetadata[];
  allFiles: GitHubFile[];
  selectedComponent: ComponentMetadata | null;
  onSelectComponent: (componentName: string) => void;
}

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children: TreeNode[];
  depth: number;
  component?: ComponentMetadata;
}

// File icon with proper colors and hover effects
function FileIcon({ 
  type, 
  isSelected, 
  fileName 
}: { 
  type: 'file' | 'folder', 
  isSelected: boolean,
  fileName: string 
}) {
  const getFileColor = () => {
    if (isSelected) return '#fbbf24';
    if (type === 'folder') return '#3b82f6';
    
    // Color code files by extension
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'tsx': case 'ts': return '#3178c6';
      case 'jsx': case 'js': return '#f7df1e';
      case 'css': return '#1572b6';
      case 'json': return '#02d64a';
      case 'md': return '#8b949e';
      default: return '#64748b';
    }
  };

  return (
    <RoundedBox args={type === 'folder' ? [0.8, 0.6, 0.4] : [0.6, 0.8, 0.2]} radius={0.1}>
      <meshStandardMaterial 
        color={getFileColor()}
        emissive={getFileColor()}
        emissiveIntensity={isSelected ? 0.3 : 0.1}
        metalness={0.2}
        roughness={0.8}
      />
    </RoundedBox>
  );
}

// Individual tree node component
function TreeNode3D({ 
  node, 
  position, 
  isSelected, 
  onSelect,
  parentPosition 
}: { 
  node: TreeNode, 
  position: [number, number, number], 
  isSelected: boolean,
  onSelect: () => void,
  parentPosition?: [number, number, number]
}) {
  const meshRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (meshRef.current) {
      const targetScale = hovered || isSelected ? 1.2 : 1.0;
      meshRef.current.scale.lerp({ x: targetScale, y: targetScale, z: targetScale } as Vector3, 0.1);
    }
  });

  const displayName = node.name.length > 15 ? `${node.name.slice(0, 12)}...` : node.name;

  return (
    <group>
      {/* Connection line to parent */}
      {parentPosition && (
        <Line
          points={[
            new Vector3(...parentPosition),
            new Vector3(...position)
          ]}
          color="#64748b"
          lineWidth={1}
          opacity={0.5}
        />
      )}
      
      {/* Node */}
      <group 
        ref={meshRef}
        position={position}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (node.component) {
            onSelect();
          }
        }}
      >
        {/* File/Folder Icon */}
        <FileIcon type={node.type} isSelected={isSelected} fileName={node.name} />

        {/* Label */}
        <Text
          position={[0, -1.2, 0]}
          fontSize={0.3}
          color={isSelected ? '#fbbf24' : (hovered ? '#ffffff' : '#94a3b8')}
          anchorX="center"
          anchorY="middle"
          maxWidth={3}
          textAlign="center"
        >
          {displayName}
        </Text>

        {/* Hover info */}
        {hovered && (
          <Html position={[2, 0, 0]} style={{ pointerEvents: 'none' }}>
            <div className="bg-black/90 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap">
              <div className="font-medium">{node.name}</div>
              <div className="text-xs text-gray-400">{node.path}</div>
              {node.component && (
                <div className="text-xs text-purple-300 mt-1">Click to view code</div>
              )}
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}

export default function FileTree3D({ 
  components, 
  selectedComponent, 
  onSelectComponent 
}: Omit<FileTree3DProps, 'allFiles'>) {
  const groupRef = useRef<Group>(null);

  // Build tree structure
  const treeData = useMemo(() => {
    const root: TreeNode = { 
      name: 'root', 
      path: '', 
      type: 'folder', 
      children: [], 
      depth: 0 
    };
    
    if (components.length === 0) {
      // Demo data when no repo is loaded
      return {
        name: 'demo-project',
        path: '',
        type: 'folder' as const,
        children: [
          {
            name: 'src',
            path: 'src',
            type: 'folder' as const,
            depth: 1,
            children: [
              {
                name: 'components',
                path: 'src/components',
                type: 'folder' as const,
                depth: 2,
                children: [
                  { name: 'App.tsx', path: 'src/components/App.tsx', type: 'file' as const, depth: 3, children: [] },
                  { name: 'Button.tsx', path: 'src/components/Button.tsx', type: 'file' as const, depth: 3, children: [] }
                ]
              },
              { name: 'index.ts', path: 'src/index.ts', type: 'file' as const, depth: 2, children: [] }
            ]
          },
          { name: 'package.json', path: 'package.json', type: 'file' as const, depth: 1, children: [] },
          { name: 'README.md', path: 'README.md', type: 'file' as const, depth: 1, children: [] }
        ],
        depth: 0
      };
    }
    
    // Build tree from components
    components.forEach(component => {
      const pathParts = component.file.split('/').filter(part => part);
      let current = root;
      
      pathParts.forEach((part, index) => {
        const isFile = index === pathParts.length - 1;
        let child = current.children.find(c => c.name === part);
        
        if (!child) {
          child = {
            name: part,
            path: pathParts.slice(0, index + 1).join('/'),
            type: isFile ? 'file' : 'folder',
            children: [],
            depth: index + 1,
            component: isFile ? component : undefined
          };
          current.children.push(child);
        }
        current = child;
      });
    });

    return root;
  }, [components]);

  // Calculate positions for tree layout
  const { nodePositions } = useMemo(() => {
    const positions: Array<{ 
      node: TreeNode, 
      position: [number, number, number],
      parentPosition?: [number, number, number]
    }> = [];
    
    let currentY = 0;
    const spacing = {
      x: 4,    // Horizontal spacing between levels
      y: 2.5,  // Vertical spacing between nodes
    };

    function layoutNode(
      node: TreeNode, 
      x: number, 
      depth: number,
      parentPos?: [number, number, number]
    ): number {
      if (node.name === 'root') {
        // Layout root children
        let childY = currentY;
        node.children.forEach(child => {
          childY = layoutNode(child, x, depth, undefined);
        });
        return childY;
      }

      const position: [number, number, number] = [x + depth * spacing.x, currentY, 0];
      
      positions.push({
        node,
        position,
        parentPosition: parentPos
      });

      const nodeY = currentY;
      currentY -= spacing.y;

      // Layout children
      if (node.children.length > 0) {
        node.children.forEach(child => {
          layoutNode(child, x, depth + 1, position);
        });
      }

      return nodeY;
    }

    layoutNode(treeData, -8, 0);
    
    return { 
      nodePositions: positions,
    };
  }, [treeData]);

  // Rotate the entire tree slowly
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Tree Title */}
      <Text
        position={[0, 4, 0]}
        fontSize={1}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        font="https://fonts.googleapis.com/css2?family=Inter:wght@600&display=swap"
      >
        📁 File Tree
      </Text>

      {/* Stats */}
      <Html position={[0, 2.5, 0]} style={{ textAlign: 'center' }}>
        <div className="text-white text-sm">
          <div className="text-purple-300">
            {components.length > 0 ? `${components.length} files loaded` : 'Demo project'}
          </div>
          <div className="text-gray-400 text-xs">
            {nodePositions.length} nodes • Click files to view
          </div>
        </div>
      </Html>

      {/* Tree Nodes */}
      {nodePositions.map(({ node, position, parentPosition }, index) => (
        <TreeNode3D
          key={`${node.path}-${index}`}
          node={node}
          position={position}
          parentPosition={parentPosition}
          isSelected={
            selectedComponent?.file === node.path || 
            selectedComponent?.name === node.component?.name
          }
          onSelect={() => {
            if (node.component) {
              onSelectComponent(node.component.name);
            }
          }}
        />
      ))}

      {/* Background panel */}
      <RoundedBox
        args={[20, 15, 0.2]}
        position={[0, -2, -3]}
        radius={0.5}
      >
        <meshStandardMaterial
          color="#0f172a"
          transparent
          opacity={0.2}
        />
      </RoundedBox>

      {/* Ambient lighting for the tree */}
      <pointLight
        position={[0, 0, 5]}
        intensity={0.5}
        color="#8b5cf6"
        distance={30}
      />
    </group>
  );
} 