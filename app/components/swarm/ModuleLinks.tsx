'use client'

import { useMemo } from 'react'
import { Line, Text } from '@react-three/drei'
import type { BuildingState, VersionTheme } from '@/app/lib/swarm/types'
import { themedBuildingPosition } from '@/app/lib/swarm/cityLayout'

const KIND_TINT: Record<BuildingState['kind'], string> = {
  page: '#2563eb',
  component: '#7c3aed',
  hook: '#ea580c',
  util: '#0f766e',
  api: '#be123c',
  config: '#a16207',
}

export default function ModuleLinks({
  buildings,
  theme,
  selectedId,
}: {
  buildings: BuildingState[]
  theme: VersionTheme
  selectedId: string | null
}) {
  const byId = useMemo(() => new Map(buildings.map((item) => [item.id, item])), [buildings])
  const links = useMemo(() => {
    const next: Array<{ key: string; from: BuildingState; to: BuildingState; hot: boolean }> = []
    for (const from of buildings) {
      if (!from.spawned) continue
      for (const useId of from.uses) {
        const to = byId.get(useId)
        if (!to?.spawned) continue
        const hot = selectedId === from.id || selectedId === to.id || from.beingWorked || to.beingWorked
        next.push({ key: `${from.id}->${to.id}`, from, to, hot })
      }
    }
    return next
  }, [buildings, byId, selectedId])

  return (
    <group>
      {links.map((link) => {
        const [x1, y1, z1] = themedBuildingPosition(link.from, theme)
        const [x2, y2, z2] = themedBuildingPosition(link.to, theme)
        const midY = (link.hot ? 1.15 : 0.28) + (theme.floatIslands ? (y1 + y2) / 2 : 0)
        const start: [number, number, number] = [x1, y1 + 0.08, z1]
        const mid: [number, number, number] = [(x1 + x2) / 2, midY, (z1 + z2) / 2]
        const end: [number, number, number] = [x2, y2 + 0.08, z2]
        const color = KIND_TINT[link.from.kind]
        return (
          <group key={link.key}>
            <Line
              points={[start, mid, end]}
              color={color}
              lineWidth={link.hot ? 2.2 : 1}
              transparent
              opacity={link.hot ? 0.95 : 0.28}
            />
            {link.hot && (
              <Text position={mid} fontSize={0.11} color={color} anchorX="center">
                uses
              </Text>
            )}
          </group>
        )
      })}
    </group>
  )
}
