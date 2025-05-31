"use client"

import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Stats, Sky } from '@react-three/drei'
import FileTreeV2 from './FileTreeV2'
import { Suspense } from 'react'

export default function FileTreeV2Scene() {
  return (
    <Canvas 
      shadows
      dpr={[1, 2]}
      performance={{ min: 0.5 }}
      gl={{ 
        antialias: true,
        powerPreference: "high-performance",
        alpha: false,
        stencil: false,
        depth: true
      }}
      style={{ 
        width: '100%', 
        height: '100%',
        display: 'block',
        touchAction: 'none'
      }}
      eventSource={typeof document !== 'undefined' ? document.getElementById('root') || undefined : undefined}
      eventPrefix="client"
    >
      <Suspense fallback={null}>
        {/* Performance monitor in development */}
        {process.env.NODE_ENV === 'development' && <Stats />}
        
        {/* Camera */}
        <PerspectiveCamera 
          makeDefault 
          position={[15, 10, 15]} 
          fov={45}
          near={0.1}
          far={200}
        />
        
        {/* Sky background */}
        <Sky
          distance={450000}
          sunPosition={[1, 1, 0]}
          inclination={0.49}
          azimuth={0.25}
        />
        
        {/* Bright daylight lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[20, 30, 10]} 
          intensity={1.2}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-far={100}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />
        
        {/* Additional soft lighting for that aerial feel */}
        <pointLight position={[0, 20, 0]} intensity={0.4} color="#87CEEB" />
        <pointLight position={[-20, 15, -20]} intensity={0.3} color="#B0E0E6" />
        <pointLight position={[20, 15, 20]} intensity={0.3} color="#ADD8E6" />
        
        {/* Controls */}
        <OrbitControls 
          makeDefault
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={false}
          maxPolarAngle={Math.PI / 2}
          minDistance={5}
          maxDistance={80}
          enableDamping={true}
          dampingFactor={0.05}
          rotateSpeed={0.5}
          panSpeed={0.5}
          zoomSpeed={0.5}
        />
        
        {/* File Tree on a bright floating platform */}
        <group>
          {/* Beautiful light platform - square and thicker */}
          <mesh position={[0, -1.15, 0]} receiveShadow castShadow>
            <boxGeometry args={[25, 0.3, 20]} />
            <meshStandardMaterial 
              color="#f8fafc"
              metalness={0.1}
              roughness={0.3}
              transparent
              opacity={0.9}
            />
          </mesh>
          
          {/* Platform edge glow */}
          <mesh position={[0, -1.0, 0]}>
            <boxGeometry args={[25.2, 0.05, 20.2]} />
            <meshStandardMaterial 
              color="#e0f2fe"
              emissive="#bae6fd"
              emissiveIntensity={0.2}
              transparent
              opacity={0.6}
            />
          </mesh>
          
          <FileTreeV2 />
        </group>
        
        {/* Distant ground far below to enhance the aerial feeling */}
        <mesh 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, -50, 0]}
          receiveShadow
        >
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial 
            color="#90EE90" 
            transparent 
            opacity={0.3}
          />
        </mesh>
        
        {/* Atmospheric fog for depth */}
        <fog attach="fog" args={['#87CEEB', 30, 120]} />
      </Suspense>
    </Canvas>
  )
}