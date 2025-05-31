"use client"

import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { Group, Vector3, CatmullRomCurve3 } from 'three'
import { ComponentMetadata } from '../../lib/types'

interface AIAgentProps {
  type: 'scout' | 'analyzer' | 'organizer'
  files: ComponentMetadata[]
  filePositions: Record<string, Vector3>
}

// Agent configurations
const agentConfigs = {
  scout: {
    color: '#60a5fa',
    speed: 0.8,
    trailLength: 20,
    icon: '🔍',
    size: 0.3,
    behavior: 'patrol',
  },
  analyzer: {
    color: '#a78bfa',
    speed: 0.4,
    trailLength: 15,
    icon: '🧠',
    size: 0.35,
    behavior: 'inspect',
  },
  organizer: {
    color: '#34d399',
    speed: 0.6,
    trailLength: 10,
    icon: '🗂️',
    size: 0.4,
    behavior: 'organize',
  },
}

export default function AIAgent({ type, files, filePositions }: AIAgentProps) {
  const groupRef = useRef<Group>(null)
  const [path, setPath] = useState<CatmullRomCurve3 | null>(null)
  const [pathProgress, setPathProgress] = useState(0)
  const [status, setStatus] = useState<string>('Initializing...')
  const [trailPositions, setTrailPositions] = useState<Vector3[]>([])
  
  const config = agentConfigs[type]
  
  // Generate patrol path based on agent type
  useEffect(() => {
    const positions = Object.values(filePositions)
    if (positions.length === 0) return
    
    let points: Vector3[] = []
    
    switch (type) {
      case 'scout':
        // Scout: Random patrol through all areas
        points = positions
          .sort(() => Math.random() - 0.5)
          .slice(0, 10)
          .map(p => p.clone().add(new Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
          )))
        setStatus('Scanning files...')
        break
        
      case 'analyzer':
        // Analyzer: Focus on complex files (with many connections)
        const complexFiles = files
          .filter(f => (f.uses?.length || 0) + (f.usedBy?.length || 0) > 3)
          .slice(0, 5)
        points = complexFiles.map(f => filePositions[f.file]?.clone() || new Vector3())
        setStatus('Analyzing dependencies...')
        break
        
      case 'organizer':
        // Organizer: Move between file clusters
        const pageFiles = files.filter(f => f.type === 'page')
        points = pageFiles.map(f => filePositions[f.file]?.clone() || new Vector3())
        if (points.length === 0) {
          points = positions.slice(0, 5)
        }
        setStatus('Organizing structure...')
        break
    }
    
    // Create smooth path through points
    if (points.length > 2) {
      const curve = new CatmullRomCurve3(points, true, 'catmullrom', 0.5)
      setPath(curve)
    }
  }, [type, files, filePositions])
  
  // Animate agent movement
  useFrame((state, delta) => {
    if (!groupRef.current || !path) return
    
    // Update path progress
    setPathProgress((prev) => (prev + delta * config.speed * 0.1) % 1)
    
    // Get position on path
    const point = path.getPoint(pathProgress)
    groupRef.current.position.lerp(point, 0.1)
    
    // Look ahead on path
    const lookAheadProgress = (pathProgress + 0.01) % 1
    const lookAtPoint = path.getPoint(lookAheadProgress)
    groupRef.current.lookAt(lookAtPoint)
    
    // Add floating motion
    groupRef.current.position.y += Math.sin(state.clock.elapsedTime * 2) * 0.05
    
    // Update trail positions
    setTrailPositions(prev => {
      const newPositions = [...prev, groupRef.current!.position.clone()]
      return newPositions.slice(-config.trailLength)
    })
    
    // Update status based on position
    if (type === 'analyzer' && pathProgress < 0.01) {
      const nearbyFile = files.find(f => {
        const filePos = filePositions[f.file]
        return filePos && point.distanceTo(filePos) < 2
      })
      if (nearbyFile) {
        setStatus(`Analyzing ${nearbyFile.name}...`)
      }
    }
  })
  
  return (
    <group ref={groupRef}>
      {/* Agent trail (simple spheres) */}
      {trailPositions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial
            color={config.color}
            transparent
            opacity={i / trailPositions.length * 0.5}
          />
        </mesh>
      ))}
      
      {/* Agent body */}
      <mesh>
        <sphereGeometry args={[config.size, 16, 16]} />
        <meshStandardMaterial
          color={config.color}
          emissive={config.color}
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      
      {/* Agent icon */}
      <Text
        position={[0, config.size + 0.2, 0]}
        fontSize={0.4}
        anchorX="center"
        anchorY="bottom"
      >
        {config.icon}
      </Text>
      
      {/* Status text */}
      <Text
        position={[0, -config.size - 0.2, 0]}
        fontSize={0.15}
        color={config.color}
        anchorX="center"
        anchorY="top"
      >
        {status}
      </Text>
      
      {/* Scanning effect for scout */}
      {type === 'scout' && (
        <mesh>
          <ringGeometry args={[0.5, 1, 32]} />
          <meshBasicMaterial
            color={config.color}
            transparent
            opacity={0.2 + Math.sin(pathProgress * Math.PI * 2) * 0.1}
          />
        </mesh>
      )}
      
      {/* Analysis beam for analyzer */}
      {type === 'analyzer' && (
        <mesh>
          <cylinderGeometry args={[0.05, 0.05, 5, 8]} />
          <meshBasicMaterial
            color={config.color}
            transparent
            opacity={0.5}
          />
        </mesh>
      )}
    </group>
  )
} 