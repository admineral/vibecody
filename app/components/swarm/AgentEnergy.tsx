'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, Mesh } from 'three'
import type { AgentKind } from '@/app/lib/swarm/types'

interface AgentEnergyProps {
  color: string
  kind: AgentKind
  active: boolean
  hd?: boolean
}

export default function AgentEnergy({ color, kind, active, hd }: AgentEnergyProps) {
  const group = useRef<Group>(null)
  const ring = useRef<Mesh>(null)
  const beam = useRef<Mesh>(null)
  const sparks = useMemo(
    () => Array.from({ length: hd ? 12 : 7 }, (_, i) => ({ a: i * 0.52, r: 0.28 + (i % 4) * 0.08 })),
    [hd],
  )

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    if (ring.current) {
      ring.current.scale.setScalar(0.85 + Math.sin(t * 3.2) * 0.12)
      ring.current.rotation.z += delta * 1.4
    }
    if (beam.current) {
      beam.current.scale.y = 1 + Math.sin(t * 5.5) * 0.08
      const material = beam.current.material as { opacity?: number }
      if (typeof material.opacity === 'number') {
        material.opacity = 0.22 + Math.sin(t * 6) * 0.08
      }
    }
    if (group.current) {
      group.current.visible = active
    }
  })

  if (!active) return null

  const editing = kind === 'edit' || kind === 'fix' || kind === 'grow' || kind === 'spawn'
  const scanning = kind === 'scan' || editing

  return (
    <group ref={group}>
      {scanning && (
        <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.34, 0.4, 48]} />
          <meshBasicMaterial color={color} transparent opacity={0.7} />
        </mesh>
      )}
      {scanning && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.52, 0.545, 64]} />
          <meshBasicMaterial color={color} transparent opacity={0.28} />
        </mesh>
      )}
      {editing && (
        <mesh ref={beam} position={[0, -0.85, 0]}>
          <cylinderGeometry args={[0.012, 0.11, 1.7, 12]} />
          <meshBasicMaterial color={color} transparent opacity={0.32} />
        </mesh>
      )}
      {editing && sparks.map((spark) => (
        <mesh
          key={spark.a}
          position={[
            Math.cos(spark.a) * spark.r,
            Math.sin(spark.a * 1.4) * 0.22,
            Math.sin(spark.a) * spark.r,
          ]}
        >
          <sphereGeometry args={[hd ? 0.018 : 0.012, 8, 8]} />
          <meshBasicMaterial color="#f8fafc" />
        </mesh>
      ))}
      {kind === 'spawn' && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.7, 0.76, 48]} />
          <meshBasicMaterial color="#fde68a" transparent opacity={0.35} />
        </mesh>
      )}
    </group>
  )
}
