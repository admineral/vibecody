'use client'

import { useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Trail } from '@react-three/drei'
import { Group, Vector3 } from 'three'
import type { AgentDef, AgentRuntime, BuildingState, VersionTheme } from '@/app/lib/swarm/types'
import { themedBuildingPosition } from '@/app/lib/swarm/cityLayout'
import AgentEnergy from './AgentEnergy'

interface SwarmDronesProps {
  agents: AgentDef[]
  runtime: AgentRuntime[]
  buildings: BuildingState[]
  theme: VersionTheme
  followId: string | null
  groupRefs: MutableRefObject<Record<string, Group | null>>
  compact?: boolean
  hd?: boolean
  onSelect: (id: string) => void
}

function Drone({
  def,
  runtime,
  buildings,
  theme,
  highlighted,
  compact,
  groupRefs,
  hd,
  onSelect,
}: {
  def: AgentDef
  runtime: AgentRuntime | undefined
  buildings: BuildingState[]
  theme: VersionTheme
  highlighted: boolean
  compact?: boolean
  groupRefs: MutableRefObject<Record<string, Group | null>>
  hd?: boolean
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
      if (theme.chipMode) {
        target.current.set(x, 0.52, z)
      } else if (theme.cardMode) {
        const reading = building.beingWorked
        target.current.set(x, y + (reading ? 1.45 : 1.05), z + (reading ? 1.15 : 0.35))
      } else {
        target.current.set(x, y + building.height * building.growth + 2.3, z)
      }
    } else {
      target.current.set(...runtime.position)
    }

    if (theme.chipMode) {
      const dx = target.current.x - g.position.x
      const dz = target.current.z - g.position.z
      if (Math.abs(dx) > 0.14 && Math.abs(dz) > 0.14) {
        target.current.z = g.position.z
      }
    } else if (theme.hivePull) {
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
    if (!theme.chipMode) {
      g.position.y += Math.sin(state.clock.elapsedTime * 2.2 + def.speed) * 0.012
    }
    groupRefs.current[def.id] = g
  })

  const size = theme.chipMode ? (highlighted ? 0.2 : 0.14) : highlighted ? 0.32 : 0.24

  return (
    <group
      ref={group}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
    >
      <Trail width={highlighted ? 1.1 : 0.55} length={theme.chipMode ? 14 : theme.nodeMode ? 18 : 7} color={def.color} attenuation={(w) => w * 0.4}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[size * 0.28, size * 0.9, 4, 10]} />
          <meshStandardMaterial
            color="#e8eef7"
            emissive={def.color}
            emissiveIntensity={0.55}
            metalness={0.72}
            roughness={0.18}
          />
        </mesh>
      </Trail>
      <mesh rotation={[0, 0, 0.1]}>
        <boxGeometry args={[size * 1.7, 0.02, size * 0.55]} />
        <meshStandardMaterial color={def.color} metalness={0.6} roughness={0.22} emissive={def.color} emissiveIntensity={0.35} />
      </mesh>
      <mesh>
        <sphereGeometry args={[size * 0.18, 12, 12]} />
        <meshBasicMaterial color="#f8fafc" />
      </mesh>
      {!theme.chipMode && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[size * 1.15, size * 1.28, 32]} />
          <meshBasicMaterial color={def.color} transparent opacity={runtime?.beam ? 0.55 : 0.12} />
        </mesh>
      )}
      {runtime?.beam && !theme.chipMode && (
        <mesh position={[0, theme.cardMode ? -0.55 : -1.05, theme.cardMode ? -0.12 : 0]} rotation={theme.cardMode ? [0.35, 0, 0] : [0, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.09, theme.cardMode ? 1.05 : 2.1, 10]} />
          <meshBasicMaterial color={def.color} transparent opacity={0.28} />
        </mesh>
      )}
      <AgentEnergy color={def.color} kind={runtime?.kind ?? 'idle'} active={Boolean(runtime?.beam)} hd={hd} />
      {(!compact || highlighted) && (
        <Text position={[0, size + 0.22, 0]} fontSize={0.12} color={def.color} anchorX="center">
          {def.glyph}
        </Text>
      )}
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
  compact,
  hd,
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
          compact={compact}
          hd={hd}
          groupRefs={groupRefs}
          onSelect={() => onSelect(def.id)}
        />
      ))}
    </group>
  )
}
