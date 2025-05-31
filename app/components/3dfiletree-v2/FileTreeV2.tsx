"use client"

import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

// Types for file tree structure
interface FileNode {
  name: string
  type: 'file' | 'folder'
  size?: number
  children?: FileNode[]
}

// Example file tree structure with sizes
const exampleFileTree: FileNode = {
  name: 'my-nextjs-app',
  type: 'folder',
  children: [
    {
      name: 'app',
      type: 'folder',
      children: [
        { name: 'page.tsx', type: 'file', size: 120 },
        { name: 'layout.tsx', type: 'file', size: 80 },
        { name: 'globals.css', type: 'file', size: 50 },
        {
          name: 'api',
          type: 'folder',
          children: [
            { name: 'auth.ts', type: 'file', size: 200 },
            { name: 'users.ts', type: 'file', size: 150 },
          ]
        }
      ]
    },
    {
      name: 'components',
      type: 'folder',
      children: [
        { name: 'Header.tsx', type: 'file', size: 90 },
        { name: 'Footer.tsx', type: 'file', size: 70 },
        {
          name: 'ui',
          type: 'folder',
          children: [
            { name: 'Button.tsx', type: 'file', size: 60 },
            { name: 'Card.tsx', type: 'file', size: 80 },
            { name: 'Modal.tsx', type: 'file', size: 120 },
          ]
        }
      ]
    },
    {
      name: 'lib',
      type: 'folder',
      children: [
        { name: 'utils.ts', type: 'file', size: 100 },
        { name: 'api.ts', type: 'file', size: 180 },
        { name: 'constants.ts', type: 'file', size: 40 },
      ]
    },
    { name: 'package.json', type: 'file', size: 30 },
    { name: 'tsconfig.json', type: 'file', size: 25 },
    { name: 'README.md', type: 'file', size: 45 },
  ]
}

// Building component for files
interface BuildingProps {
  node: FileNode
  position: [number, number, number]
  onSelect: (node: FileNode) => void
  selected: boolean
}

function Building({ node, position, onSelect, selected }: BuildingProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  
  // Animate building on hover
  useFrame(() => {
    if (meshRef.current) {
      if (hovered || selected) {
        meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, 1.1, 0.1)
      } else {
        meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, 1.0, 0.1)
      }
    }
  })
  
  // Building height based on file size with minimum height to prevent flickering
  const height = Math.max(0.5, (node.size || 50) / 50)
  
  // Building color based on file type
  const getBuildingColor = (filename: string) => {
    if (filename.endsWith('.tsx') || filename.endsWith('.ts')) return '#3178c6'
    if (filename.endsWith('.css')) return '#ff6b6b'
    if (filename.endsWith('.json')) return '#4ecdc4'
    if (filename.endsWith('.md')) return '#95e1d3'
    if (filename.includes('api')) return '#f38181'
    return '#74b9ff'
  }
  
  const color = getBuildingColor(node.name)
  
  // Adjust position so buildings sit on the square platform (platform top is at y=-1.0)
  const adjustedPosition: [number, number, number] = [position[0], position[1] - 1.0, position[2]]
  
  return (
    <group position={adjustedPosition}>
      {/* Building */}
      <mesh
        ref={meshRef}
        position={[0, height / 2, 0]}
        castShadow
        receiveShadow
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          setHovered(false)
        }}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(node)
        }}
      >
        <boxGeometry args={[0.8, height, 0.8]} />
        <meshStandardMaterial 
          color={selected ? '#e056fd' : color}
          emissive={hovered || selected ? color : '#000000'}
          emissiveIntensity={hovered || selected ? 0.3 : 0}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>
      
      {/* Windows (decorative) */}
      {Array.from({ length: Math.max(1, Math.floor(height)) }).map((_, i) => (
        <mesh key={i} position={[0.41, 0.3 + i * 0.5, 0]} castShadow>
          <planeGeometry args={[0.15, 0.2]} />
          <meshStandardMaterial 
            color="#ffe66d" 
            emissive="#ffe66d"
            emissiveIntensity={selected || hovered ? 0.8 : 0.3}
          />
        </mesh>
      ))}
      
      {/* Building label */}
      <Text
        position={[0, height + 0.3, 0]}
        fontSize={0.2}
        color={hovered || selected ? '#ffffff' : '#e0e0e0'}
        anchorX="center"
        anchorY="bottom"
      >
        {node.name}
      </Text>
    </group>
  )
}

// District component for folders
interface DistrictProps {
  name: string
  position: [number, number, number]
  size: [number, number]
  color: string
}

function District({ name, position, size, color }: DistrictProps) {
  return (
    <group position={position}>
      {/* District base */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[size[0], 0.1, size[1]]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* District sign */}
      <group position={[size[0] / 2 - 0.5, 0.5, size[1] / 2 - 0.5]}>
        <mesh castShadow>
          <boxGeometry args={[0.05, 1, 0.05]} />
          <meshStandardMaterial color="#4a4a4a" />
        </mesh>
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.8, 0.3, 0.1]} />
          <meshStandardMaterial color="#2c2c2c" />
        </mesh>
        <Text
          position={[0, 0.5, 0.06]}
          fontSize={0.15}
          color="#ffffff"
          anchorX="center"
        >
          {name}
        </Text>
      </group>
    </group>
  )
}

// Road component
interface RoadProps {
  start: [number, number, number]
  end: [number, number, number]
}

function Road({ start, end }: RoadProps) {
  const distance = Math.sqrt(
    Math.pow(end[0] - start[0], 2) + 
    Math.pow(end[2] - start[2], 2)
  )
  
  const angle = Math.atan2(end[2] - start[2], end[0] - start[0])
  const midpoint: [number, number, number] = [
    (start[0] + end[0]) / 2,
    -0.99,
    (start[2] + end[2]) / 2
  ]
  
  return (
    <mesh position={midpoint} rotation={[0, -angle, 0]} receiveShadow>
      <boxGeometry args={[distance, 0.02, 0.5]} />
      <meshStandardMaterial color="#9ca3af" />
    </mesh>
  )
}

export default function FileTreeV2() {
  const [selectedNode, setSelectedNode] = useState<FileNode | null>(null)
  const groupRef = useRef<THREE.Group>(null)
  
  // Slowly rotate the entire city
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.2
    }
  })
  
  // Calculate city layout
  const cityLayout = useMemo(() => {
    const districts: Array<{ name: string; position: [number, number, number]; size: [number, number]; color: string }> = []
    const buildings: Array<{ node: FileNode; position: [number, number, number] }> = []
    const roads: Array<{ start: [number, number, number]; end: [number, number, number] }> = []
    
    // District layout configuration - adjusted for square platform
    const districtConfig = {
      'app': { position: [-6, -1.0, -4] as [number, number, number], size: [4, 4] as [number, number], color: '#e2e8f0' },
      'components': { position: [2, -1.0, -4] as [number, number, number], size: [4, 4] as [number, number], color: '#cbd5e1' },
      'lib': { position: [-2, -1.0, 2] as [number, number, number], size: [3, 3] as [number, number], color: '#94a3b8' },
      'root': { position: [-6, -1.0, 2] as [number, number, number], size: [3, 3] as [number, number], color: '#64748b' }
    }
    
    // Process file tree
    const processNode = (node: FileNode, districtName: string, x: number, z: number) => {
      if (node.type === 'folder' && districtConfig[node.name as keyof typeof districtConfig]) {
        const config = districtConfig[node.name as keyof typeof districtConfig]
        districts.push({ name: node.name, ...config })
        
        // Add road from parent district
        if (districtName !== 'root') {
          const parentConfig = districtConfig[districtName as keyof typeof districtConfig] || districtConfig.root
          roads.push({
            start: [parentConfig.position[0], 0, parentConfig.position[2]],
            end: [config.position[0], 0, config.position[2]]
          })
        }
        
        // Process children in this district
        if (node.children) {
          const gridSize = Math.ceil(Math.sqrt(node.children.length))
          node.children.forEach((child: FileNode, index: number) => {
            const row = Math.floor(index / gridSize)
            const col = index % gridSize
            const childX = config.position[0] + col * 1.2 - config.size[0] / 2 + 1
            const childZ = config.position[2] + row * 1.2 - config.size[1] / 2 + 1
            
            if (child.type === 'file') {
              buildings.push({
                node: child,
                position: [childX, 0, childZ] as [number, number, number]
              })
            } else {
              processNode(child, node.name, childX, childZ)
            }
          })
        }
      } else if (node.type === 'file') {
        buildings.push({
          node,
          position: [x, 0, z] as [number, number, number]
        })
      }
    }
    
    // Process root files
    const rootFiles = exampleFileTree.children?.filter((child: FileNode) => child.type === 'file') || []
    rootFiles.forEach((file: FileNode, index: number) => {
      buildings.push({
        node: file,
        position: [-5 + index * 1.2, 0, 3] as [number, number, number]
      })
    })
    
    // Process folders
    exampleFileTree.children?.forEach((child: FileNode) => {
      if (child.type === 'folder') {
        processNode(child, 'root', 0, 0)
      }
    })
    
    return { districts, buildings, roads }
  }, [])
  
  return (
    <group ref={groupRef}>
      {/* Districts */}
      {cityLayout.districts.map((district, index) => (
        <District key={index} {...district} />
      ))}
      
      {/* Roads */}
      {cityLayout.roads.map((road, index) => (
        <Road key={index} {...road} />
      ))}
      
      {/* Buildings */}
      {cityLayout.buildings.map((building, index) => (
        <Building
          key={index}
          node={building.node}
          position={building.position}
          onSelect={setSelectedNode}
          selected={selectedNode === building.node}
        />
      ))}
      
      {/* Street lights */}
      {[[-8, 0, 0], [8, 0, 0], [0, 0, -6], [0, 0, 6]].map((pos, index) => (
        <group key={index} position={pos as [number, number, number]}>
          <mesh position={[0, 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 1]} />
            <meshStandardMaterial color="#888888" />
          </mesh>
          <pointLight
            position={[0, 1, 0]}
            intensity={0.8}
            distance={5}
            color="#ffe4b5"
          />
        </group>
      ))}
      
      {/* Selected building info */}
      {selectedNode && (
        <group position={[0, 5, 8]}>
          <mesh>
            <boxGeometry args={[6, 2, 0.1]} />
            <meshStandardMaterial color="#2c3e50" opacity={0.9} transparent />
          </mesh>
          <Text
            position={[0, 0.5, 0.1]}
            fontSize={0.3}
            color="#ffffff"
            anchorX="center"
          >
            {selectedNode.name}
          </Text>
          <Text
            position={[0, -0.2, 0.1]}
            fontSize={0.2}
            color="#bdc3c7"
            anchorX="center"
          >
            Size: {selectedNode.size || 'N/A'} lines
          </Text>
        </group>
      )}
    </group>
  )
} 