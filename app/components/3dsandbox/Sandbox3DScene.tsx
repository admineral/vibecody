"use client"

import { useRef, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars, RoundedBox, Html } from '@react-three/drei'
import { Group } from 'three'
import SandpackCard from './SandpackCard'

// 3D Card component that contains the Sandpack editor
function CodeCard3D() {
  const groupRef = useRef<Group>(null)

  return (
    <group ref={groupRef}>
      {/* Card backing */}
      <RoundedBox
        args={[12, 8, 0.5]}
        radius={0.2}
        smoothness={4}
      >
        <meshStandardMaterial
          color="#1e293b"
          metalness={0.3}
          roughness={0.4}
        />
      </RoundedBox>

      {/* Glass effect border */}
      <RoundedBox
        args={[12.1, 8.1, 0.51]}
        radius={0.2}
        smoothness={4}
      >
        <meshBasicMaterial
          color="#3b82f6"
          transparent
          opacity={0.2}
        />
      </RoundedBox>

      {/* Sandpack content using Html from drei */}
      <Html
        transform
        occlude
        position={[0, 0, 0.26]}
        style={{
          width: '800px',
          height: '500px',
        }}
      >
        <SandpackCard />
      </Html>

      {/* Glow effect */}
      <pointLight
        position={[0, 0, 2]}
        intensity={0.5}
        color="#3b82f6"
      />
    </group>
  )
}

export default function Sandbox3DScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 20], fov: 50 }}
      gl={{ 
        antialias: true, 
        alpha: true,
        powerPreference: "high-performance"
      }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={0.5} />
      <pointLight position={[-10, -10, -5]} intensity={0.3} color="#3b82f6" />
      
      {/* Stars background */}
      <Stars 
        radius={100} 
        depth={50} 
        count={3000} 
        factor={4} 
        saturation={0} 
        fade 
        speed={1}
      />
      
      {/* Camera controls */}
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        maxDistance={50}
        minDistance={10}
        autoRotate={false}
      />
      
      {/* Main content */}
      <Suspense fallback={null}>
        <CodeCard3D />
      </Suspense>
      
      {/* Fog for depth */}
      <fog attach="fog" args={['#0a0a0a', 20, 100]} />
    </Canvas>
  )
} 