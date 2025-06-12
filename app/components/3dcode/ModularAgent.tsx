"use client"

import { forwardRef, useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Trail } from '@react-three/drei'
import { Group, Vector3, CatmullRomCurve3, Mesh } from 'three'
import { ComponentMetadata } from '../../lib/types'

interface ModularAgentProps {
  files: ComponentMetadata[]
  filePositions: Record<string, Vector3>
  speed: number
  hoveredFile: string | null
  selectedFile: string | null
  viewMode?: 'orbital' | 'firstPerson' | 'follow' | 'cinematic'
}

// Agent behavior modes that can be extended later
type AgentBehavior = 'explorer' | 'analyzer' | 'helper' | 'navigating' | 'investigating'

const ModularAgent = forwardRef<Group, ModularAgentProps>(({ 
  files, 
  filePositions, 
  speed = 1,
  hoveredFile,
  selectedFile,
  viewMode = 'orbital'
}, ref) => {
  const meshRef = useRef<Mesh>(null)
  const [path, setPath] = useState<CatmullRomCurve3 | null>(null)
  const [pathProgress, setPathProgress] = useState(0)
  const [status, setStatus] = useState<string>('Initializing...')
  const [currentMode, setCurrentMode] = useState<AgentBehavior>('explorer')
  const [investigationTimer, setInvestigationTimer] = useState(0)
  
  // Agent configuration
  const config = {
    color: '#60a5fa',
    emissiveColor: '#3b82f6',
    size: 0.5,
    trailLength: 10, // Reduced from 20
    icon: '🤖',
  }

  // Generate intelligent path based on mode and files
  useEffect(() => {
    const positions = Object.values(filePositions)
    if (positions.length === 0) return
    
    let points: Vector3[] = []
    let isPathLooping = true
    
    switch (currentMode) {
      case 'navigating':
        if (selectedFile && filePositions[selectedFile]) {
          const agent = (ref as React.RefObject<Group>)?.current
          if (agent) {
            const startPos = agent.position.clone()
            // Stop in front of the card, not inside it
            const targetPos = filePositions[selectedFile].clone().add(new Vector3(0, 0, 3))
            points = [startPos, targetPos]
            setStatus(`Navigating to ${selectedFile.split('/').pop()}`)
            isPathLooping = false
          }
        }
        break
      
      case 'explorer':
        // Explore all areas systematically - reduced points
        points = positions
          .sort((a, b) => a.distanceTo(new Vector3(0, 0, 0)) - b.distanceTo(new Vector3(0, 0, 0)))
          .slice(0, 8) // Reduced from all positions
          .map(p => p.clone())
        setStatus('Exploring...')
        break
        
      case 'analyzer':
        // Focus on complex files with many connections
        const complexFiles = files
          .filter(f => (f.uses?.length || 0) + (f.usedBy?.length || 0) > 2)
          .slice(0, 5) // Reduced from 8
        points = complexFiles.map(f => filePositions[f.file]?.clone() || new Vector3())
        setStatus('Analyzing...')
        break
        
      case 'helper':
        // Move to hovered or selected files - but only if not in follow mode
        if (hoveredFile && filePositions[hoveredFile] && viewMode !== 'follow') {
          points = [filePositions[hoveredFile].clone()]
          setStatus(`Helping...`)
        } else {
          points = positions.slice(0, 3)
          setStatus('Ready...')
        }
        break
    }
    
    // Create smooth path through points
    if (points.length > 1) {
      const curve = new CatmullRomCurve3(points, isPathLooping, 'catmullrom', 0.5)
      setPath(curve)
      setPathProgress(0) // Reset progress for new path
    } else {
      setPath(null)
    }
  }, [currentMode, files, filePositions, hoveredFile, selectedFile, ref, viewMode])

  // React to selected file
  useEffect(() => {
    if (selectedFile && filePositions[selectedFile]) {
      setCurrentMode('navigating')
    }
  }, [selectedFile, filePositions])

  // Switch modes periodically or based on conditions
  useEffect(() => {
    const modeInterval = setInterval(() => {
      // Don't switch modes if currently navigating or investigating
      if (currentMode === 'navigating' || currentMode === 'investigating') {
        return
      }

      // Only switch to helper mode if not in follow mode
      if (hoveredFile && viewMode !== 'follow') {
        setCurrentMode('helper')
      } else {
                  // Cycle through modes
          setCurrentMode(prev => {
            switch (prev) {
              case 'explorer': return 'analyzer'
              case 'analyzer': return 'helper'
              case 'helper': return 'explorer'
              default: return 'explorer'
            }
          })
      }
    }, 20000) // Increased from 15000

    return () => clearInterval(modeInterval)
  }, [hoveredFile, viewMode, currentMode])
  
  // Animate agent movement
  useFrame((state, delta) => {
    if (!ref || typeof ref !== 'object' || !('current' in ref) || !ref.current) return
    
    const group = ref.current as Group

    // Handle investigation mode
    if (currentMode === 'investigating') {
      if (investigationTimer > 0) {
        setInvestigationTimer(t => t - delta)
      } else {
        // Resume exploring when timer finishes
        setCurrentMode('explorer')
      }
      return // Halt movement
    }
    
    if (!path) return
    
    // Update path progress based on speed
    let newProgress = pathProgress

    if (currentMode === 'navigating') {
      // Move faster when navigating to a selection
      newProgress = pathProgress + delta * speed * 0.2
      if (newProgress >= 1) {
        newProgress = 1
        setCurrentMode('investigating')
        setInvestigationTimer(10) // Wait for 10 seconds
        setStatus(`Inspecting ${selectedFile?.split('/').pop()}`)
      }
    } else {
      newProgress = (pathProgress + delta * speed * 0.1) % 1
    }
    setPathProgress(newProgress)
    
    // Get position on path
    const point = path.getPoint(pathProgress)

    // --- Collision Avoidance Logic ---
    const avoidanceForce = new Vector3(0, 0, 0)
    const avoidanceRadius = 3 // How far to stay away from cards
    
    Object.values(filePositions).forEach(cardPosition => {
      const distance = group.position.distanceTo(cardPosition)
      if (distance < avoidanceRadius) {
        const repulsion = group.position.clone().sub(cardPosition).normalize()
        const strength = (avoidanceRadius - distance) / avoidanceRadius
        avoidanceForce.add(repulsion.multiplyScalar(strength * 0.5))
      }
    })
    
    const finalTargetPosition = point.clone().add(avoidanceForce)
    group.position.lerp(finalTargetPosition, 0.1)
    
    // Look ahead on path
    const lookAheadProgress = (pathProgress + 0.02) % 1
    const lookAtPoint = path.getPoint(lookAheadProgress)
    group.lookAt(lookAtPoint)
    
    // Add subtle floating motion
    group.position.y += Math.sin(state.clock.elapsedTime * 2) * 0.02
    
    // Pulse effect
    if (meshRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.05
      meshRef.current.scale.setScalar(scale)
    }
  })
  
  return (
    <group ref={ref}>
      {/* Simple trail using Trail component from drei */}
      <Trail
        width={1}
        length={config.trailLength}
        color={config.color}
        attenuation={(width) => width * 0.5}
      >
        {/* Agent body - glowing orb */}
        <mesh ref={meshRef}>
          <sphereGeometry args={[config.size, 16, 16]} />
          <meshStandardMaterial
            color={config.color}
            emissive={config.emissiveColor}
            emissiveIntensity={0.8}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      </Trail>
      
      {/* Inner core */}
      <mesh>
        <sphereGeometry args={[config.size * 0.6, 8, 8]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.8}
        />
      </mesh>
      
      {/* Agent icon */}
      <Text
        position={[0, config.size + 0.5, 0]}
        fontSize={0.5}
        anchorX="center"
        anchorY="bottom"
      >
        {config.icon}
      </Text>
      
      {/* Status text - only when close to camera */}
      <Text
        position={[0, -config.size - 0.3, 0]}
        fontSize={0.2}
        color={config.color}
        anchorX="center"
        anchorY="top"
        renderOrder={1}
      >
        {status}
      </Text>
      
      {/* Simple scanning ring effect */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[config.size * 2, config.size * 2.2, 16]} />
        <meshBasicMaterial
          color={config.color}
          transparent
          opacity={0.15}
        />
      </mesh>
    </group>
  )
})

ModularAgent.displayName = 'ModularAgent'

export default ModularAgent 