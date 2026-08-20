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
    () => Array.from({ length: hd ? 10 : 6 }, (_, i) => ({ a: i * 0.7, r: 0.35 + (i % 3) * 0.12 })),
    [hd],
  )

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    if (ring.current) {
      const pulse = 0.7 + Math.sin(t * 5.5) * 0.35
      ring.current.scale.setScalar(pulse)
      ring.current.rotation.z += delta * 2.4
    }
    if (beam.current) {
      beam.current.scale.y = 1.2 + Math.sin(t * 8) * 0.25
      const material = beam.current.material as { opacity?: number }
      if (typeof material.opacity === 'number') {
        material.opacity = 0.25 + Math.sin(t * 10) * 0.15
      }
    }
    if (group.current) {
      group.current.visible = active
      group.current.rotation.y += delta * 1.6
    }
  })

  if (!active) return null

  const editing = kind === 'edit' || kind === 'fix' || kind === 'grow' || kind === 'spawn'
  const scanning = kind === 'scan' || editing

  return (
    <group ref={group}>
      {scanning && (
        <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.42, 0.55, 28]} />
          <meshBasicMaterial color={color} transparent opacity={0.8} />
        </mesh>
      )}
      {editing && (
        <mesh ref={beam} position={[0, -1.15, 0]}>
          <cylinderGeometry args={[0.02, 0.22, 2.3, 10]} />
          <meshBasicMaterial color={color} transparent opacity={0.4} />
        </mesh>
      )}
      {editing && sparks.map((spark) => (
        <mesh
          key={spark.a}
          position={[
            Math.cos(spark.a) * spark.r,
            Math.sin(spark.a * 1.7) * 0.35,
            Math.sin(spark.a) * spark.r,
          ]}
        >
          <sphereGeometry args={[hd ? 0.045 : 0.03, 6, 6]} />
          <meshBasicMaterial color="#fff7ed" />
        </mesh>
      ))}
      <mesh>
        <sphereGeometry args={[0.62, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={editing ? 0.16 : 0.08} />
      </mesh>
      {kind === 'spawn' && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 1.05, 28]} />
          <meshBasicMaterial color="#fde68a" transparent opacity={0.45} />
        </mesh>
      )}
    </group>
  )
}
