"use client"

import { Suspense, useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber'
import { Environment, Html, Text, Billboard, ScrollControls, useScroll } from '@react-three/drei'
import { useRef as useThreeRef } from 'react'
import { easing } from 'maath'
import * as THREE from 'three'

// Types
interface ComponentData {
  name: string;
  type: string;
  description: string;
  color: string;
}

interface ComponentCardProps {
  component: ComponentData;
  position: [number, number, number];
  rotation: [number, number, number];
  active: boolean;
  hovered: boolean;
  onPointerOver: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOut: (e: ThreeEvent<PointerEvent>) => void;
}

interface CardsProps {
  category: string;
  components: ComponentData[];
  startAngle: number;
  angleSpread: number;
  radius?: number;
  elevation?: number;
  onPointerOver: (index: number) => void;
  onPointerOut: () => void;
}

interface ActiveCardProps {
  hovered: number | null;
  hoveredComponent: ComponentData | null;
}

// Sample component data for the demo
const sampleComponents: ComponentData[] = [
  // Pages
  { name: 'HomePage', type: 'page', description: 'Main landing page component with hero section and features', color: '#3b82f6' },
  { name: 'Dashboard', type: 'page', description: 'User dashboard with analytics and overview', color: '#3b82f6' },
  { name: 'Settings', type: 'page', description: 'Application settings and preferences', color: '#3b82f6' },
  { name: 'Profile', type: 'page', description: 'User profile management page', color: '#3b82f6' },
  
  // Components
  { name: 'Button', type: 'component', description: 'Reusable button with variants and states', color: '#10b981' },
  { name: 'Modal', type: 'component', description: 'Overlay modal dialog component', color: '#10b981' },
  { name: 'Navigation', type: 'component', description: 'Main navigation bar with responsive design', color: '#10b981' },
  { name: 'Card', type: 'component', description: 'Content card with flexible layout options', color: '#10b981' },
  { name: 'Form', type: 'component', description: 'Form wrapper with validation support', color: '#10b981' },
  
  // Hooks
  { name: 'useAuth', type: 'hook', description: 'Authentication state management hook', color: '#f97316' },
  { name: 'useApi', type: 'hook', description: 'API data fetching and caching hook', color: '#f97316' },
  { name: 'useLocalStorage', type: 'hook', description: 'Local storage persistence hook', color: '#f97316' },
  { name: 'useTheme', type: 'hook', description: 'Theme switching and management hook', color: '#f97316' },
  
  // Utilities
  { name: 'ApiService', type: 'utility', description: 'HTTP client and API communication utilities', color: '#6b7280' },
  { name: 'FormValidator', type: 'utility', description: 'Input validation and error handling', color: '#6b7280' },
  { name: 'DateUtils', type: 'utility', description: 'Date formatting and manipulation helpers', color: '#6b7280' },
  { name: 'Constants', type: 'utility', description: 'Application-wide constant definitions', color: '#6b7280' },
];

// 3D Component Card
function ComponentCard({ 
  component, 
  position, 
  rotation, 
  active, 
  hovered, 
  onPointerOver, 
  onPointerOut 
}: ComponentCardProps) {
  const meshRef = useThreeRef<THREE.Mesh>(null)
  const frameRef = useThreeRef<THREE.Mesh>(null)
  
  useFrame((state, delta) => {
    if (meshRef.current && frameRef.current) {
      const f = hovered ? 1.4 : active ? 1.25 : 1
      easing.damp3(meshRef.current.position, [0, hovered ? 0.3 : 0, hovered ? 0.2 : 0], 0.2, delta)
      easing.damp3(meshRef.current.scale, [f, f, f], 0.2, delta)
      easing.damp3(frameRef.current.scale, [f * 1.05, f * 1.05, f], 0.2, delta)
    }
  })

  return (
    <group position={position} rotation={rotation}>
      {/* Card frame */}
      <mesh ref={frameRef}>
        <boxGeometry args={[1.3, 1.6, 0.08]} />
        <meshStandardMaterial 
          color="#1f2937"
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>
      
      {/* Card */}
      <mesh
        ref={meshRef}
        position={[0, 0, 0.05]}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
      >
        <boxGeometry args={[1.2, 1.5, 0.05]} />
        <meshStandardMaterial 
          color={component.color} 
          metalness={0.3}
          roughness={0.2}
          transparent
          opacity={0.9}
        />
        
        {/* Card content */}
        <Html
          transform
          occlude
          position={[0, 0, 0.03]}
          style={{
            width: '180px',
            height: '220px',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: hovered ? '0 15px 35px rgba(0, 0, 0, 0.2)' : '0 8px 25px rgba(0, 0, 0, 0.15)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            cursor: 'pointer',
            pointerEvents: hovered ? 'auto' : 'none',
            transform: hovered ? 'scale(1.02)' : 'scale(1)',
            transition: 'all 0.3s ease'
          }}
        >
          <div>
            <div style={{ 
              fontSize: '10px', 
              color: component.color,
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '6px'
            }}>
              {component.type}
            </div>
            
            <h3 style={{ 
              fontSize: '14px', 
              fontWeight: 'bold', 
              color: '#1f2937',
              margin: '0 0 6px 0',
              lineHeight: '1.2'
            }}>
              {component.name}
            </h3>
            
            <p style={{ 
              fontSize: '10px', 
              color: '#6b7280',
              margin: '0',
              lineHeight: '1.4',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical'
            }}>
              {component.description}
            </p>
          </div>
          
          <div style={{ 
            padding: '4px 8px',
            background: `linear-gradient(45deg, ${component.color}, ${component.color}dd)`,
            color: 'white',
            borderRadius: '4px',
            fontSize: '9px',
            fontWeight: '500',
            textAlign: 'center',
            transform: hovered ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform 0.2s'
          }}>
            {component.type.toUpperCase()}
          </div>
        </Html>
      </mesh>
    </group>
  )
}

// Cards group for a specific category
function Cards({ 
  category, 
  components, 
  startAngle,
  angleSpread,
  radius = 6,
  elevation = 0,
  onPointerOver, 
  onPointerOut,
  ...props 
}: CardsProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const amount = components.length
  
  // Calculate label position at the center of the fan
  const centerAngle = startAngle + angleSpread / 2
  const labelRadius = radius * 1.4

  return (
    <group {...props}>
      {/* Category label */}
      <Billboard position={[
        Math.sin(centerAngle) * labelRadius, 
        elevation + 1.5, 
        Math.cos(centerAngle) * labelRadius
      ]}>
        <Text 
          fontSize={0.4} 
          anchorX="center" 
          color="#ffffff"
          fontWeight="bold"
        >
          {category}
        </Text>
      </Billboard>
      
      {components.map((component, i) => {
        const angle = startAngle + (i / (amount - 1)) * angleSpread
        const x = Math.sin(angle) * radius
        const z = Math.cos(angle) * radius
        const y = elevation + Math.sin(i * 0.5) * 0.3 // Slight wave elevation
        
        // Calculate rotation to face inward
        const rotationY = angle + Math.PI
        
        return (
          <ComponentCard
            key={`${category}-${i}`}
            component={component}
            onPointerOver={(e) => {
              e.stopPropagation()
              setHovered(i)
              onPointerOver(i)
            }}
            onPointerOut={(e) => {
              e.stopPropagation()
              setHovered(null)
              onPointerOut()
            }}
            position={[x, y, z]}
            rotation={[0, rotationY, 0]}
            active={hovered !== null}
            hovered={hovered === i}
          />
        )
      })}
    </group>
  )
}

// Active card display
function ActiveCard({ hovered, hoveredComponent }: ActiveCardProps) {
  const ref = useThreeRef<THREE.Mesh>(null)
  
  useFrame((state, delta) => {
    if (ref.current && ref.current.material) {
      const material = ref.current.material as THREE.MeshBasicMaterial
      easing.damp(material, 'opacity', hovered !== null ? 0.9 : 0, 0.3, delta)
    }
  })

  if (!hoveredComponent) return null

  return (
    <Billboard position={[0, 4, 0]}>
      <mesh ref={ref}>
        <planeGeometry args={[5, 2.5]} />
        <meshBasicMaterial 
          color={hoveredComponent.color} 
          transparent 
          opacity={0}
        />
      </mesh>
      
      <Text 
        fontSize={0.5} 
        position={[0, 0.4, 0.01]} 
        anchorX="center" 
        color="white"
        fontWeight="bold"
      >
        {hoveredComponent.name}
      </Text>
      
      <Text 
        fontSize={0.25} 
        position={[0, 0, 0.01]} 
        anchorX="center" 
        color="white"
        maxWidth={4}
      >
        {hoveredComponent.description}
      </Text>
      
      <Text 
        fontSize={0.2} 
        position={[0, -0.4, 0.01]} 
        anchorX="center" 
        color="rgba(255, 255, 255, 0.8)"
      >
        Type: {hoveredComponent.type.toUpperCase()}
      </Text>
    </Billboard>
  )
}

// Main 3D Scene
function Scene() {
  const ref = useThreeRef<THREE.Group>(null)
  const scroll = useScroll()
  const [hovered, setHovered] = useState<number | null>(null)
  const [hoveredComponent, setHoveredComponent] = useState<ComponentData | null>(null)
  
  // Group components by category
  const componentsByCategory = useMemo(() => {
    const groups = {
      pages: sampleComponents.filter(c => c.type === 'page'),
      components: sampleComponents.filter(c => c.type === 'component'),
      hooks: sampleComponents.filter(c => c.type === 'hook'),
      utilities: sampleComponents.filter(c => c.type === 'utility')
    }
    return groups
  }, [])

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y = scroll.offset * (Math.PI * 2) * 0.5
    }
    state.events.update?.()
    easing.damp3(
      state.camera.position, 
      [-state.pointer.x * 3, state.pointer.y * 3 + 8, 15], 
      0.3, 
      delta
    )
    state.camera.lookAt(0, 0, 0)
  })

  const handlePointerOver = (index: number, category: keyof typeof componentsByCategory) => {
    setHovered(index)
    const component = componentsByCategory[category]?.[index]
    setHoveredComponent(component || null)
  }

  const handlePointerOut = () => {
    setHovered(null)
    setHoveredComponent(null)
  }

  return (
    <group ref={ref} position={[0, 0, 0]}>
      {/* Components - Main display */}
      <Cards 
        category="components" 
        components={componentsByCategory.components}
        startAngle={-Math.PI * 0.6}
        angleSpread={Math.PI * 1.2}
        radius={6}
        elevation={0}
        onPointerOver={(i) => handlePointerOver(i, 'components')} 
        onPointerOut={handlePointerOut} 
      />
      
      <ActiveCard hovered={hovered} hoveredComponent={hoveredComponent} />
    </group>
  )
}

// Loading component
function SimpleLoader() {
  return (
    <Html center>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(255, 255, 255, 0.3)',
          borderTop: '3px solid white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px'
        }} />
        <div>Loading Component Carousel...</div>
      </div>
    </Html>
  )
}

// 3D Canvas Component
function ThreeDCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 8, 15], fov: 75 }}
      style={{ width: '100%', height: '100%' }}
      dpr={[1, 1.5]}
    >
      <Suspense fallback={<SimpleLoader />}>
        <ScrollControls pages={3} infinite>
          <Scene />
        </ScrollControls>
        
        {/* Enhanced Lighting */}
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1.2} />
        <pointLight position={[-10, -10, -10]} intensity={0.8} color="#8b5cf6" />
        <pointLight position={[0, -10, 10]} intensity={0.6} color="#3b82f6" />
        <spotLight position={[0, 25, 0]} intensity={0.8} angle={0.4} penumbra={1} />
        
        {/* Environment */}
        <Environment preset="studio" />
      </Suspense>
    </Canvas>
  )
}

export default function ThreeDCardPage() {
  const [isClient, setIsClient] = useState(false)

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <div>Initializing Component Carousel...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-6">
        <div className="flex items-center justify-between">
          <Link 
            href="/"
            className="flex items-center space-x-2 text-white hover:text-purple-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to DocAI</span>
          </Link>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">3D Component Carousel</h1>
            <p className="text-purple-200 text-sm mt-1">Scroll to explore • Hover to inspect</p>
          </div>
          
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* 3D Canvas */}
      <ThreeDCanvas />

      {/* Instructions */}
      <div className="absolute bottom-6 left-6 right-6 z-10">
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-white">
          <h3 className="font-semibold mb-2">Carousel Navigation:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Scroll:</strong> Rotate the carousel
            </div>
            <div>
              <strong>Mouse:</strong> Move camera perspective
            </div>
            <div>
              <strong>Hover:</strong> Inspect component details
            </div>
          </div>
        </div>
      </div>

      {/* Add CSS for animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
} 