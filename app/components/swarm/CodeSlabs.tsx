'use client'

import { Billboard, Text } from '@react-three/drei'
import type { BuildingState, CodeSlabState, VersionTheme } from '@/app/lib/swarm/types'
import { themedBuildingPosition } from '@/app/lib/swarm/cityLayout'

interface CodeSlabsProps {
  slabs: CodeSlabState[]
  buildings: BuildingState[]
  theme: VersionTheme
  compact?: boolean
  selectedId: string | null
}

export default function CodeSlabs({ slabs, buildings, theme, compact, selectedId }: CodeSlabsProps) {
  if (theme.nodeMode || theme.cardMode) return null

  const visible = compact
    ? slabs.filter((s) => s.visible && s.buildingId === selectedId).slice(0, 1)
    : slabs.filter((s) => s.visible)

  return (
    <group>
      {visible.map((slab) => {
        const building = buildings.find((b) => b.id === slab.buildingId)
        if (!building || !building.spawned) return null
        const [x, y, z] = themedBuildingPosition(building, theme)
        const height = building.height * building.growth
        const lines = slab.text.split('\n').slice(0, 5)

        return (
          <Billboard key={slab.buildingId} position={[x + 1.35, y + height + 1.1, z]}>
            <mesh>
              <planeGeometry args={[2.8, 1.55]} />
              <meshBasicMaterial color="#020617" transparent opacity={0.82} />
            </mesh>
            <mesh position={[0, 0, -0.01]}>
              <planeGeometry args={[2.88, 1.63]} />
              <meshBasicMaterial color={slab.accent} transparent opacity={0.55} />
            </mesh>
            <Text
              position={[-1.25, 0.58, 0.02]}
              fontSize={0.13}
              color={slab.accent}
              anchorX="left"
              anchorY="top"
            >
              {slab.title}
            </Text>
            {lines.map((line, i) => (
              <Text
                key={i}
                position={[-1.25, 0.36 - i * 0.22, 0.02]}
                fontSize={0.11}
                color="#e2e8f0"
                anchorX="left"
                anchorY="top"
                maxWidth={2.5}
              >
                {line || ' '}
              </Text>
            ))}
          </Billboard>
        )
      })}
    </group>
  )
}
