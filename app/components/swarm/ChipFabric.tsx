'use client'

import { useMemo } from 'react'
import type { BuildingState } from '@/app/lib/swarm/types'
import { DISTRICTS } from '@/app/lib/swarm/cityData'
import { themedBuildingPosition } from '@/app/lib/swarm/cityLayout'
import type { VersionTheme } from '@/app/lib/swarm/types'

interface ChipFabricProps {
  buildings: BuildingState[]
  theme: VersionTheme
}

interface TraceSeg {
  key: string
  position: [number, number, number]
  size: [number, number, number]
}

function manhattanTraces(buildings: BuildingState[], theme: VersionTheme): TraceSeg[] {
  const spawned = buildings.filter((b) => b.spawned)
  const segs: TraceSeg[] = []
  const y = 0.16
  const thick = 0.09

  const addH = (key: string, x1: number, x2: number, z: number) => {
    const len = Math.abs(x2 - x1)
    if (len < 0.05) return
    segs.push({
      key,
      position: [(x1 + x2) / 2, y, z],
      size: [len, thick, thick],
    })
  }
  const addV = (key: string, z1: number, z2: number, x: number) => {
    const len = Math.abs(z2 - z1)
    if (len < 0.05) return
    segs.push({
      key,
      position: [x, y + 0.05, (z1 + z2) / 2],
      size: [thick, thick, len],
    })
  }

  DISTRICTS.forEach((district) => {
    const cells = spawned.filter((b) => b.district === district.id)
    const [ox, , oz] = district.origin
    cells.forEach((cell, i) => {
      const [x, , z] = themedBuildingPosition(cell, theme)
      addH(`h-${district.id}-${cell.id}`, ox, x, z)
      addV(`v-${district.id}-${cell.id}`, oz, z, x)
      const next = cells[i + 1]
      if (next) {
        const [nx, , nz] = themedBuildingPosition(next, theme)
        addH(`n-h-${cell.id}`, x, nx, z)
        addV(`n-v-${cell.id}`, z, nz, nx)
      }
    })
  })

  return segs.slice(0, 80)
}

export default function ChipFabric({ buildings, theme }: ChipFabricProps) {
  const spawnKey = buildings.filter((b) => b.spawned).map((b) => b.id).join(',')
  const traces = useMemo(
    () => manhattanTraces(buildings, theme),
    // rebuild only when cells appear, not on every sim tick
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [spawnKey, theme.id],
  )

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.28, 1]}>
        <circleGeometry args={[26, 48]} />
          <meshStandardMaterial color="#4ade80" metalness={0.35} roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.08, 1]}>
        <boxGeometry args={[38, 0.16, 34]} />
          <meshStandardMaterial color="#86efac" metalness={0.3} roughness={0.48} />
      </mesh>
      {[-16, -8, 0, 8, 16].map((x) => (
        <mesh key={`fill-x-${x}`} position={[x, 0.02, 1]}>
          <boxGeometry args={[0.04, 0.02, 32]} />
          <meshStandardMaterial color="#34d399" />
        </mesh>
      ))}
      {[-12, -4, 4, 12].map((z) => (
        <mesh key={`fill-z-${z}`} position={[0, 0.02, z]}>
          <boxGeometry args={[36, 0.02, 0.04]} />
          <meshStandardMaterial color="#34d399" />
        </mesh>
      ))}

      {DISTRICTS.map((district) => (
        <mesh
          key={`ring-${district.id}`}
          position={[district.origin[0], 0.12, district.origin[2]]}
        >
          <boxGeometry args={[district.size[0] + 0.4, 0.05, district.size[1] + 0.4]} />
          <meshStandardMaterial
            color="#b45309"
            emissive="#d97706"
            emissiveIntensity={0.25}
            metalness={0.8}
            roughness={0.25}
            transparent
            opacity={0.35}
          />
        </mesh>
      ))}

      {traces.map((seg) => (
        <mesh key={seg.key} position={seg.position}>
          <boxGeometry args={seg.size} />
          <meshStandardMaterial
            color="#eab308"
            emissive="#ca8a04"
            emissiveIntensity={0.45}
            metalness={0.85}
            roughness={0.2}
          />
        </mesh>
      ))}
    </group>
  )
}
