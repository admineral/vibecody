"use client"

import { useRef, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars, Environment } from '@react-three/drei'
import { Group } from 'three'
import { ComponentMetadata } from '../../lib/types'
import FileTree3D from './FileTree3D'
import SandpackCard3D from './SandpackCard3D'

interface GitHubFile {
  path: string;
  type: 'blob' | 'tree';
  url: string;
}

interface FileTree3DSceneProps {
  components: ComponentMetadata[];
  allFiles: GitHubFile[];
  selectedComponent: ComponentMetadata | null;
  onSelectComponent: (componentName: string) => void;
  repoUrl: string;
}

export default function FileTree3DScene({ 
  components, 
  selectedComponent, 
  onSelectComponent
}: Pick<FileTree3DSceneProps, 'components' | 'selectedComponent' | 'onSelectComponent'>) {
  const sceneRef = useRef<Group>(null)

  return (
    <Canvas
      camera={{ position: [10, 5, 15], fov: 60 }}
      gl={{ 
        antialias: true, 
        alpha: true,
        powerPreference: "high-performance"
      }}
    >
      {/* Lighting setup */}
      <ambientLight intensity={0.4} color="#f8fafc" />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={0.8} 
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-10, 0, 5]} intensity={0.3} color="#8b5cf6" />
      <pointLight position={[10, -5, 5]} intensity={0.3} color="#3b82f6" />
      
      {/* Environment for better reflections */}
      <Environment preset="city" />
      
      {/* Stars background */}
      <Stars 
        radius={200} 
        depth={50} 
        count={3000} 
        factor={4} 
        saturation={0} 
        fade 
        speed={0.5}
      />
      
      {/* Camera controls */}
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        maxDistance={40}
        minDistance={8}
        autoRotate={false}
        target={[0, 0, 0]}
        dampingFactor={0.1}
        enableDamping={true}
      />
      
      {/* Main content */}
      <Suspense fallback={null}>
        <group ref={sceneRef}>
          {/* File Tree positioned on the left */}
          <group position={[-8, 0, 0]}>
            <FileTree3D 
              components={components}
              selectedComponent={selectedComponent}
              onSelectComponent={onSelectComponent}
            />
          </group>
          
          {/* Sandpack Card positioned on the right */}
          <group position={[8, 0, 0]}>
            <SandpackCard3D 
              component={selectedComponent}
              allComponents={components}
            />
          </group>
        </group>
      </Suspense>
      
      {/* Subtle fog for depth */}
      <fog attach="fog" args={['#0f172a', 30, 80]} />
    </Canvas>
  )
} 