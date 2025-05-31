"use client"

import { useRef, useState, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, RoundedBox, Billboard } from '@react-three/drei'
import { Mesh, Vector3, Group } from 'three'
import { ComponentMetadata, ComponentType } from '../../lib/types'
import * as THREE from 'three'

interface FileCard3DProps {
  component: ComponentMetadata
  position: Vector3
  isSelected: boolean
  isHovered: boolean
  onClick: () => void
  onPointerOver: () => void
  onPointerOut: () => void
}

// Get material properties and icon based on component type
function getTypeConfig(type: ComponentType) {
  switch (type) {
    case ComponentType.PAGE:
      return {
        color: '#8b5cf6',
        emissive: '#8b5cf6',
        icon: '📄',
        gradient: ['#8b5cf6', '#a78bfa'],
      }
    case ComponentType.COMPONENT:
      return {
        color: '#10b981',
        emissive: '#10b981',
        icon: '🧩',
        gradient: ['#10b981', '#34d399'],
      }
    case ComponentType.HOOK:
      return {
        color: '#f97316',
        emissive: '#f97316',
        icon: '🪝',
        gradient: ['#f97316', '#fb923c'],
      }
    case ComponentType.UTILITY:
      return {
        color: '#6b7280',
        emissive: '#6b7280',
        icon: '🔧',
        gradient: ['#6b7280', '#9ca3af'],
      }
    case ComponentType.CONTEXT:
      return {
        color: '#ec4899',
        emissive: '#ec4899',
        icon: '🌐',
        gradient: ['#ec4899', '#f472b6'],
      }
    default:
      return {
        color: '#3b82f6',
        emissive: '#3b82f6',
        icon: '📦',
        gradient: ['#3b82f6', '#60a5fa'],
      }
  }
}

// Memoized card component to prevent unnecessary re-renders
const FileCard3D = memo(({
  component,
  position,
  isSelected,
  isHovered,
  onClick,
  onPointerOver,
  onPointerOut,
}: FileCard3DProps) => {
  const groupRef = useRef<Group>(null)
  const cardRef = useRef<Mesh>(null)
  const [localHover, setLocalHover] = useState(false)
  const config = getTypeConfig(component.type)
  
  // Card dimensions based on file importance
  const importance = (component.uses?.length || 0) + (component.usedBy?.length || 0)
  const cardWidth = 3 + Math.min(importance * 0.1, 1)
  const cardHeight = 4
  const cardDepth = 0.2

  // Animate only when necessary
  useFrame((state) => {
    if (!groupRef.current) return
    
    // Only animate if hovered or selected
    if (localHover || isHovered || isSelected) {
      // Gentle floating animation
      groupRef.current.position.y = position.y + Math.sin(state.clock.elapsedTime + position.x) * 0.2
      
      // Scale animation on hover
      const targetScale = localHover || isHovered ? 1.1 : 1
      groupRef.current.scale.lerp(
        new Vector3(targetScale, targetScale, targetScale),
        0.1
      )
    } else {
      // Return to original position when not interacted
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, position.y, 0.1)
      groupRef.current.scale.lerp(new Vector3(1, 1, 1), 0.1)
    }
    
    // Card pulsing when selected
    if (cardRef.current && isSelected) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.02
      cardRef.current.scale.setScalar(pulse)
    }
  })

  return (
    <group ref={groupRef} position={position}>
      {/* Main card - simplified geometry */}
      <RoundedBox
        ref={cardRef}
        args={[cardWidth, cardHeight, cardDepth]}
        radius={0.15}
        smoothness={2} // Reduced from 4
        onClick={onClick}
        onPointerOver={(e) => {
          e.stopPropagation()
          setLocalHover(true)
          onPointerOver()
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          setLocalHover(false)
          onPointerOut()
        }}
      >
        <meshStandardMaterial
          color={config.color}
          emissive={config.emissive}
          emissiveIntensity={localHover || isHovered ? 0.3 : 0.1}
          metalness={0.2}
          roughness={0.3}
        />
      </RoundedBox>
      
      {/* Only show details when hovered or selected */}
      {(localHover || isHovered || isSelected) && (
        <>
          {/* Glass border effect - only when interacted */}
          <RoundedBox
            args={[cardWidth + 0.05, cardHeight + 0.05, cardDepth + 0.05]}
            radius={0.15}
            smoothness={2}
          >
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.1}
            />
          </RoundedBox>
          
          {/* Selection indicator */}
          {isSelected && (
            <mesh rotation={[0, 0, 0]} position={[0, 0, cardDepth + 0.5]}>
              <ringGeometry args={[cardWidth * 0.6, cardWidth * 0.65, 16]} />
              <meshBasicMaterial color="#ffffff" opacity={0.8} transparent />
            </mesh>
          )}
        </>
      )}
      
      {/* Use Billboard for text to always face camera - more performant */}
      <Billboard>
        {/* File type icon */}
        <Text
          position={[0, cardHeight * 0.3, cardDepth + 0.01]}
          fontSize={0.8}
          anchorX="center"
          anchorY="middle"
        >
          {config.icon}
        </Text>
        
        {/* File name */}
        <Text
          position={[0, 0, cardDepth + 0.01]}
          fontSize={0.25}
          color={localHover || isHovered ? '#ffffff' : '#e0e0e0'}
          anchorX="center"
          anchorY="middle"
          maxWidth={cardWidth * 0.8}
          overflowWrap="break-word"
          textAlign="center"
        >
          {component.name}
        </Text>
        
        {/* File type label */}
        <Text
          position={[0, -cardHeight * 0.3, cardDepth + 0.01]}
          fontSize={0.18}
          color={config.color}
          anchorX="center"
          anchorY="middle"
        >
          {component.type.toUpperCase()}
        </Text>
        
        {/* Connection count badges - only show on hover */}
        {(localHover || isHovered) && (
          <>
            {/* Dependencies badge */}
            {component.uses && component.uses.length > 0 && (
              <group position={[cardWidth * 0.4, cardHeight * 0.4, cardDepth + 0.1]}>
                <Text
                  fontSize={0.2}
                  color="#60a5fa"
                  anchorX="center"
                  anchorY="middle"
                >
                  ↗{component.uses.length}
                </Text>
              </group>
            )}
            
            {/* References badge */}
            {component.usedBy && component.usedBy.length > 0 && (
              <group position={[-cardWidth * 0.4, cardHeight * 0.4, cardDepth + 0.1]}>
                <Text
                  fontSize={0.2}
                  color="#f472b6"
                  anchorX="center"
                  anchorY="middle"
                >
                  ↙{component.usedBy.length}
                </Text>
              </group>
            )}
          </>
        )}
      </Billboard>
    </group>
  )
})

FileCard3D.displayName = 'FileCard3D'

export default FileCard3D 