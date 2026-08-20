'use client'

import { useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Trail } from '@react-three/drei'
import { Group, Vector3 } from 'three'
import type { AgentDef, AgentRuntime, BuildingState, VersionTheme } from '@/app/lib/swarm/types'
import { themedBuildingPosition } from '@/app/lib/swarm/cityLayout'

interface SwarmDronesProps {
  agents: AgentDef[]
  runtime: AgentRuntime[]
  buildings: BuildingState[]
  theme: VersionTheme
  followId: string | null
  groupRefs: MutableRefObject<Record<string, Group | null>>
  onSelect: (id: string) => void
}

function Drone({
  def,
  runtime,
  buildings,
  theme,
  highlighted,
  groupRefs,
  onSelect,
}: {
  def: AgentDef
  runtime: AgentRuntime | undefined
  buildings: BuildingState[]
  theme: VersionTheme
  highlighted: boolean
  groupRefs: MutableRefObject<Record<string, Group | null>>
  onSelect: () => void
}) {
  const group = useRef<Group>(null)
  const target = useRef(new Vector3())
  const dummy = useRef(new Vector3())

  useFrame((state, delta) => {
    const g = group.current
    if (!g || !runtime) return

    const building = buildings.find((b) => b.id === runtime.targetId)
    if (building) {
      const [x, y, z] = themedBuildingPosition(building, theme)
      target.current.set(x, y + building.height * building.growth + 2.3, z)
    } else {
      target.current.set(...runtime.position)
    }

    if (theme.hivePull) {
      const t = state.clock.elapsedTime * (0.7 + def.speed * 0.2) + def.speed * 2
      const radius = 1.35 + (def.speed - 0.8)
      target.current.x += Math.cos(t) * radius
      target.current.z += Math.sin(t) * radius
      target.current.y += 0.4 + Math.sin(t * 1.6) * 0.35
    }

    const k = 1 - Math.exp(-delta * def.speed * 2.4)
    g.position.lerp(target.current, k)
    dummy.current.copy(target.current)
    dummy.current.y = g.position.y
    if (g.position.distanceTo(dummy.current) > 0.05) {
      g.lookAt(dummy.current)
    }
    g.position.y += Math.sin(state.clock.elapsedTime * 2.2 + def.speed) * 0.012
    groupRefs.current[def.id] = g
  })

  const size = highlighted ? 0.38 : 0.3

  return (
    <group
      ref={group}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
    >
      <Trail width={highlighted ? 1.6 : 0.9} length={theme.nodeMode ? 18 : 8} color={def.color} attenuation={(w) => w * 0.45}>
        <mesh>
          <icosahedronGeometry args={[size, 0]} />
          <meshStandardMaterial
            color={def.color}
            emissive={def.color}
            emissiveIntensity={1.1}
            metalness={0.7}
            roughness={0.18}
          />
        </mesh>
      </Trail>
      <mesh>
        <sphereGeometry args={[size * 0.45, 8, 8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[size * 1.6, size * 1.85, 20]} />
        <meshBasicMaterial color={def.color} transparent opacity={runtime?.beam ? 0.7 : 0.2} />
      </mesh>
      {runtime?.beam && (
        <mesh position={[0, -1.2, 0]}>
          <cylinderGeometry args={[0.03, 0.18, 2.4, 8]} />
          <meshBasicMaterial color={def.color} transparent opacity={0.35} />
        </mesh>
      )}
      <Text position={[0, size + 0.38, 0]} fontSize={0.22} color={def.color} anchorX="center">
        {def.glyph} {def.name}
      </Text>
    </group>
  )
}

export default function SwarmDrones({
  agents,
  runtime,
  buildings,
  theme,
  followId,
  groupRefs,
  onSelect,
}: SwarmDronesProps) {
  return (
    <group>
      {agents.map((def) => (
        <Drone
          key={def.id}
          def={def}
          runtime={runtime.find((r) => r.id === def.id)}
          buildings={buildings}
          theme={theme}
          highlighted={followId === def.id}
          groupRefs={groupRefs}
          onSelect={() => onSelect(def.id)}
        />
      ))}
    </group>
  )
}
