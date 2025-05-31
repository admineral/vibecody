"use client"

import { useRef, useState, useMemo, useEffect, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stars, Preload, AdaptiveDpr, AdaptiveEvents, Text } from '@react-three/drei'
import { Group, Vector3 } from 'three'
import { ComponentMetadata } from '../../lib/types'
import FileCard3D from './FileCard3D'
import ModularAgent from './ModularAgent'
import FileExplorer3D from './FileExplorer3D'
import { calculateFilePositions } from './utils/spatialLayout'

interface CodeUniverse3DProps {
  components: ComponentMetadata[]
  selectedFile: string | null
  onSelectFile: (file: string | null) => void
  agentsEnabled: boolean
  agentSpeed: number
  viewMode: 'orbital' | 'firstPerson' | 'follow' | 'cinematic'
}

// Main scene component
function Scene({ 
  components, 
  selectedFile, 
  onSelectFile, 
  agentsEnabled,
  agentSpeed,
  viewMode 
}: CodeUniverse3DProps) {
  const groupRef = useRef<Group>(null)
  const agentRef = useRef<Group>(null)
  const { camera } = useThree()
  const [hoveredFile, setHoveredFile] = useState<string | null>(null)
  const [visibleComponents, setVisibleComponents] = useState<ComponentMetadata[]>([])
  
  // Calculate positions for all files based on relationships
  const filePositions = useMemo(() => 
    calculateFilePositions(components), 
    [components]
  )
  
  // Implement frustum culling - only render components in view
  useEffect(() => {
    const maxVisibleComponents = 50 // Limit visible components
    
    // Sort components by distance from camera
    const sortedComponents = [...components].sort((a, b) => {
      const posA = filePositions[a.file] || new Vector3(0, 0, 0)
      const posB = filePositions[b.file] || new Vector3(0, 0, 0)
      const distA = camera.position.distanceTo(posA)
      const distB = camera.position.distanceTo(posB)
      return distA - distB
    })
    
    // Only show closest components
    setVisibleComponents(sortedComponents.slice(0, maxVisibleComponents))
  }, [components, filePositions, camera.position, selectedFile])

  // Animate the universe slowly rotating
  useFrame((state, delta) => {
    if (groupRef.current && viewMode === 'orbital') {
      groupRef.current.rotation.y += delta * 0.02
    }
    
    // Follow mode camera
    if (viewMode === 'follow' && agentRef.current && agentsEnabled) {
      const agentPosition = agentRef.current.position
      const cameraOffset = new Vector3(0, 5, 10)
      const desiredPosition = agentPosition.clone().add(cameraOffset)
      
      camera.position.lerp(desiredPosition, 0.1)
      camera.lookAt(agentPosition)
    }
  })

  // Handle camera transitions when selecting a file
  useEffect(() => {
    if (selectedFile && filePositions[selectedFile] && viewMode !== 'follow') {
      // Ensure selected file is visible
      const selectedComponent = components.find(c => c.file === selectedFile)
      if (selectedComponent && !visibleComponents.includes(selectedComponent)) {
        setVisibleComponents(prev => [...prev.slice(0, -1), selectedComponent])
      }
    }
  }, [selectedFile, filePositions, viewMode, components, visibleComponents])

  return (
    <>
      {/* Optimized lighting */}
      <ambientLight intensity={0.15} />
      <directionalLight position={[10, 10, 5]} intensity={0.4} />
      <pointLight position={[-10, -10, -5]} intensity={0.2} color="#8b5cf6" />
      
      {/* Stars background with reduced count */}
      <Stars 
        radius={80} 
        depth={40} 
        count={2000} // Reduced from 5000
        factor={3} 
        saturation={0} 
        fade 
        speed={0.5}
      />
      
      {/* Main file universe */}
      <group ref={groupRef}>
        {visibleComponents.map((component) => {
          const position = filePositions[component.file] || new Vector3(0, 0, 0)
          
          return (
            <FileCard3D
              key={component.file}
              component={component}
              position={position}
              isSelected={selectedFile === component.file}
              isHovered={hoveredFile === component.file}
              onClick={() => onSelectFile(component.file)}
              onPointerOver={() => setHoveredFile(component.file)}
              onPointerOut={() => setHoveredFile(null)}
            />
          )
        })}
      </group>
      
      {/* Single Modular AI Agent */}
      {agentsEnabled && (
        <ModularAgent 
          ref={agentRef}
          files={components}
          filePositions={filePositions}
          speed={agentSpeed}
          hoveredFile={hoveredFile}
        />
      )}
      
      {/* Show count of visible vs total */}
      {visibleComponents.length < components.length && (
        <Text
          position={[0, -10, 0]}
          fontSize={0.5}
          color="#888"
          anchorX="center"
        >
          Showing {visibleComponents.length} of {components.length} files
        </Text>
      )}
    </>
  )
}

// Camera controller component
function CameraController({ viewMode, agentsEnabled }: { viewMode: string, agentsEnabled: boolean }) {
  const { camera } = useThree()
  
  useEffect(() => {
    // Set camera position based on view mode
    switch (viewMode) {
      case 'orbital':
        camera.position.set(0, 15, 30)
        camera.lookAt(0, 0, 0)
        break
      case 'firstPerson':
        camera.position.set(0, 2, 10)
        break
      case 'follow':
        // Follow mode is handled in the Scene component
        if (!agentsEnabled) {
          camera.position.set(0, 15, 30)
          camera.lookAt(0, 0, 0)
        }
        break
      case 'cinematic':
        // Will implement cinematic camera paths
        camera.position.set(20, 20, 20)
        camera.lookAt(0, 0, 0)
        break
    }
  }, [viewMode, camera, agentsEnabled])
  
  return null
}

export default function CodeUniverse3D(props: CodeUniverse3DProps) {
  return (
    <div className="relative w-full h-full">
      {/* File Explorer Overlay */}
      <FileExplorer3D 
        components={props.components}
        selectedFile={props.selectedFile}
        onSelectFile={props.onSelectFile}
      />
      
      {/* 3D Canvas with performance optimizations */}
      <Canvas
        camera={{ position: [0, 15, 30], fov: 60 }}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: "high-performance",
          stencil: false,
          depth: true
        }}
        dpr={[1, 2]} // Limit pixel ratio
        performance={{ min: 0.5 }} // Lower quality when performance drops
      >
        {/* Performance helpers */}
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
        
        {/* Fog for depth */}
        <fog attach="fog" args={['#0a0a0a', 30, 80]} />
        
        {/* Camera controls */}
        <CameraController viewMode={props.viewMode} agentsEnabled={props.agentsEnabled} />
        {props.viewMode === 'orbital' && (
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            maxDistance={80}
            minDistance={5}
            autoRotate={false}
            autoRotateSpeed={0.5}
            makeDefault
          />
        )}
        
        {/* Main scene wrapped in Suspense */}
        <Suspense fallback={null}>
          <Scene {...props} />
        </Suspense>
        
        {/* Preload assets */}
        <Preload all />
      </Canvas>
    </div>
  )
} 