"use client"

import { useRef, useState, Suspense, useMemo, useLayoutEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Text, ScrollControls, useScroll, Billboard, Html } from '@react-three/drei'
import { Group, Mesh, Material } from 'three'
import { ComponentMetadata } from '../../lib/types'
import { easing } from 'maath'
import dynamic from 'next/dynamic'

interface CodeCarousel3DProps {
  components: ComponentMetadata[]
  onSelectComponent: (nodeId: string | null) => void
}

// Main Scene Component
function Scene({ components, onSelectComponent, ...props }: { 
  components: ComponentMetadata[]
  onSelectComponent: (nodeId: string | null) => void
} & Record<string, unknown>) {
  const ref = useRef<Group>(null!)
  const scroll = useScroll()
  const [hovered, setHovered] = useState<number | null>(null)
  const [hoveredComponent, setHoveredComponent] = useState<ComponentMetadata | null>(null)
  
  // Group components by type
  const componentsByType = useMemo(() => {
    const groups = {
      pages: components.filter((c: ComponentMetadata) => c.type === 'page'),
      components: components.filter((c: ComponentMetadata) => c.type === 'component'),
      hooks: components.filter((c: ComponentMetadata) => c.type === 'hook'),
      utilities: components.filter((c: ComponentMetadata) => c.type === 'utility' || c.type === 'context' || c.type === 'layout')
    }
    return groups
  }, [components])

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y = -scroll.offset * (Math.PI * 2) // Rotate contents
    }
    state.events.update?.() // Raycasts every frame rather than on pointer-move
    easing.damp3(
      state.camera.position, 
      [-state.pointer.x * 2, state.pointer.y * 2 + 4.5, 9], 
      0.3, 
      delta
    )
    state.camera.lookAt(0, 0, 0)
  })

  const handlePointerOver = (index: number, category: keyof typeof componentsByType) => {
    setHovered(index)
    const component = componentsByType[category]?.[index]
    setHoveredComponent(component || null)
  }

  const handlePointerOut = () => {
    setHovered(null)
    setHoveredComponent(null)
  }

  return (
    <group ref={ref} {...props}>
      <Cards 
        category="Pages" 
        components={componentsByType.pages}
        from={0} 
        len={Math.PI / 4} 
        onPointerOver={(i: number) => handlePointerOver(i, 'pages')} 
        onPointerOut={handlePointerOut}
        onSelectComponent={onSelectComponent}
      />
      <Cards 
        category="Components" 
        components={componentsByType.components}
        from={Math.PI / 4} 
        len={Math.PI / 2} 
        position={[0, 0.4, 0]}
        onPointerOver={(i: number) => handlePointerOver(i, 'components')} 
        onPointerOut={handlePointerOut}
        onSelectComponent={onSelectComponent}
      />
      <Cards 
        category="Hooks" 
        components={componentsByType.hooks}
        from={Math.PI / 4 + Math.PI / 2} 
        len={Math.PI / 2} 
        onPointerOver={(i: number) => handlePointerOver(i, 'hooks')} 
        onPointerOut={handlePointerOut}
        onSelectComponent={onSelectComponent}
      />
      <Cards 
        category="Utilities" 
        components={componentsByType.utilities}
        from={Math.PI * 1.25} 
        len={Math.PI * 2 - Math.PI * 1.25} 
        position={[0, -0.4, 0]}
        onPointerOver={(i: number) => handlePointerOver(i, 'utilities')} 
        onPointerOut={handlePointerOut}
        onSelectComponent={onSelectComponent}
      />
      <ActiveCard hovered={hovered} hoveredComponent={hoveredComponent} />
    </group>
  )
}

// Cards group for a specific category
function Cards({ 
  category, 
  components, 
  from = 0, 
  len = Math.PI * 2, 
  radius = 5.25, 
  onPointerOver, 
  onPointerOut,
  onSelectComponent,
  ...props 
}: {
  category: string
  components: ComponentMetadata[]
  from?: number
  len?: number
  radius?: number
  onPointerOver: (index: number) => void
  onPointerOut: () => void
  onSelectComponent: (nodeId: string | null) => void
} & Record<string, unknown>) {
  const [hovered, setHovered] = useState<number | null>(null)
  const amount = Math.max(components.length, 3) // Minimum 3 cards
  const textPosition = from + (amount / 2 / amount) * len

  return (
    <group {...props}>
      <Billboard position={[Math.sin(textPosition) * radius * 1.4, 0.5, Math.cos(textPosition) * radius * 1.4]}>
        <Text 
          fontSize={0.25} 
          anchorX="center" 
          color="#ffffff"
          fontWeight="bold"
        >
          {category}
        </Text>
      </Billboard>
      
      {components.map((component: ComponentMetadata, i: number) => {
        const angle = from + (i / amount) * len
        return (
          <ComponentCard
            key={`${category}-${component.name}-${i}`}
            component={component}
            onPointerOver={(e: Event) => {
              e.stopPropagation()
              setHovered(i)
              onPointerOver(i)
            }}
            onPointerOut={() => {
              setHovered(null)
              onPointerOut()
            }}
            onClick={() => onSelectComponent(component.name)}
            position={[Math.sin(angle) * radius, 0, Math.cos(angle) * radius]}
            rotation={[0, Math.PI / 2 + angle, 0]}
            active={hovered !== null}
            hovered={hovered === i}
          />
        )
      })}
    </group>
  )
}

// Individual Component Card
function ComponentCard({ 
  component, 
  active, 
  hovered, 
  onClick,
  ...props 
}: { 
  component: ComponentMetadata
  active: boolean
  hovered: boolean
  onClick: () => void
} & Record<string, unknown>) {
  const meshRef = useRef<Mesh>(null!)
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      const f = hovered ? 1.4 : active ? 1.25 : 1
      easing.damp3(meshRef.current.position, [0, hovered ? 0.25 : 0, 0], 0.1, delta)
      easing.damp3(meshRef.current.scale, [1.618 * f, 1 * f, 0.1], 0.15, delta)
    }
  })

  const getComponentTypeColor = (type: string) => {
    switch (type) {
      case 'component': return '#10b981'
      case 'hook': return '#3b82f6'
      case 'utility': return '#f59e0b'
      case 'page': return '#8b5cf6'
      case 'context': return '#ec4899'
      case 'layout': return '#6366f1'
      default: return '#6b7280'
    }
  }

  return (
    <group {...props}>
      <mesh
        ref={meshRef}
        onClick={onClick}
        scale={[1.618, 1, 0.1]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
          color={getComponentTypeColor(component.type)} 
          metalness={0.3}
          roughness={0.2}
          transparent
          opacity={0.9}
        />
        
        {/* Card content */}
        <Html
          transform
          position={[0, 0, 0.6]}
          style={{
            width: '140px',
            height: '86px',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '6px',
            padding: '8px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            cursor: 'pointer',
            pointerEvents: hovered ? 'auto' : 'none'
          }}
        >
          <div>
            <div style={{ 
              fontSize: '8px', 
              color: getComponentTypeColor(component.type),
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '4px'
            }}>
              {component.type}
            </div>
            
            <h3 style={{ 
              fontSize: '11px', 
              fontWeight: 'bold', 
              color: '#1f2937',
              margin: '0 0 4px 0',
              lineHeight: '1.2',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {component.name}
            </h3>
            
            <p style={{ 
              fontSize: '8px', 
              color: '#6b7280',
              margin: '0',
              lineHeight: '1.3',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}>
              {component.description || 'No description available'}
            </p>
          </div>
          
          <div style={{ 
            padding: '2px 6px',
            background: `linear-gradient(45deg, ${getComponentTypeColor(component.type)}, ${getComponentTypeColor(component.type)}dd)`,
            color: 'white',
            borderRadius: '3px',
            fontSize: '7px',
            fontWeight: '500',
            textAlign: 'center',
            transform: hovered ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform 0.2s'
          }}>
            Click to Select
          </div>
        </Html>
      </mesh>
    </group>
  )
}

// Active card display
function ActiveCard({ 
  hovered, 
  hoveredComponent 
}: { 
  hovered: number | null
  hoveredComponent: ComponentMetadata | null 
}) {
  const ref = useRef<Mesh>(null!)
  
  useLayoutEffect(() => {
    if (ref.current?.material) {
      (ref.current.material as Material & { opacity: number }).opacity = 0
    }
  }, [hovered])
  
  useFrame((state, delta) => {
    if (ref.current?.material) {
      easing.damp(ref.current.material as Material & { opacity: number }, 'opacity', hovered !== null ? 0.8 : 0, 0.3, delta)
    }
  })

  if (!hoveredComponent) return null

  const getComponentTypeColor = (type: string) => {
    switch (type) {
      case 'component': return '#10b981'
      case 'hook': return '#3b82f6'
      case 'utility': return '#f59e0b'
      case 'page': return '#8b5cf6'
      case 'context': return '#ec4899'
      case 'layout': return '#6366f1'
      default: return '#6b7280'
    }
  }

  return (
    <Billboard position={[0, 3, 0]}>
      <mesh ref={ref}>
        <planeGeometry args={[4, 2]} />
        <meshBasicMaterial 
          color={getComponentTypeColor(hoveredComponent.type)} 
          transparent 
          opacity={0}
        />
      </mesh>
      
      <Text 
        fontSize={0.4} 
        position={[0, 0.3, 0.01]} 
        anchorX="center" 
        color="white"
        fontWeight="bold"
      >
        {hoveredComponent.name}
      </Text>
      
      <Text 
        fontSize={0.2} 
        position={[0, -0.1, 0.01]} 
        anchorX="center" 
        color="white"
        maxWidth={3.5}
      >
        {hoveredComponent.description || 'No description available'}
      </Text>
      
      <Text 
        fontSize={0.15} 
        position={[0, -0.4, 0.01]} 
        anchorX="center" 
        color="rgba(255, 255, 255, 0.8)"
      >
        Type: {hoveredComponent.type.toUpperCase()} • File: {hoveredComponent.file}
      </Text>
    </Billboard>
  )
}

// Loading component
function Loader() {
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
        <div>Loading 3D Components...</div>
      </div>
    </Html>
  )
}

// 3D Canvas Component
function ThreeDCanvas({ components, onSelectComponent }: CodeCarousel3DProps) {
  return (
    <Canvas
      camera={{ position: [0, 4.5, 9], fov: 75 }}
      style={{ width: '100%', height: '100%' }}
      dpr={[1, 1.5]}
    >
      <Suspense fallback={<Loader />}>
        <ScrollControls pages={4} infinite>
          <Scene 
            components={components} 
            onSelectComponent={onSelectComponent}
            position={[0, 1.5, 0]} 
          />
        </ScrollControls>
        
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
        <spotLight position={[0, 20, 0]} intensity={0.5} angle={0.3} penumbra={1} />
      </Suspense>
    </Canvas>
  )
}

// Dynamically import the 3D canvas to prevent SSR issues
const DynamicThreeDCanvas = dynamic(() => Promise.resolve(ThreeDCanvas), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <div>Loading 3D Components...</div>
      </div>
    </div>
  )
})

export default function CodeCarousel3D({ components, onSelectComponent }: CodeCarousel3DProps) {
  // Safety check for props
  if (!Array.isArray(components) || components.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-white text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">No Components</h3>
          <p className="text-gray-300">Analyze a repository to see components in 3D</p>
          <p className="text-sm text-gray-400 mt-2">Scroll to rotate • Hover to inspect</p>
        </div>
      </div>
    )
  }

  return <DynamicThreeDCanvas components={components} onSelectComponent={onSelectComponent} />
} 