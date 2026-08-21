'use client'

import { useMemo } from 'react'
import { DISTRICTS } from '@/app/lib/swarm/cityData'
import type { VersionTheme } from '@/app/lib/swarm/types'
import { themedDistrictY } from '@/app/lib/swarm/cityLayout'

export default function ChessboardGround({ theme }: { theme: VersionTheme }) {
  const squares = useMemo(() => {
    const tiles: Array<{ key: string; x: number; z: number; light: boolean; y: number }> = []
    const gap = 1.9
    for (const district of DISTRICTS) {
      const cols = Math.max(4, Math.round(district.size[0] / gap) + 1)
      const rows = Math.max(3, Math.round(district.size[1] / gap) + 1)
      const originX = district.origin[0] - ((cols - 1) * gap) / 2
      const originZ = district.origin[2] - ((rows - 1) * gap) / 2
      const y = themedDistrictY(district.id, theme)
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          tiles.push({
            key: `${district.id}-${col}-${row}`,
            x: originX + col * gap,
            z: originZ + row * gap,
            light: (col + row) % 2 === 0,
            y,
          })
        }
      }
    }
    return tiles
  }, [theme])

  return (
    <group>
      {squares.map((square) => (
        <mesh key={square.key} position={[square.x, square.y + 0.002, square.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[1.86, 1.86]} />
          <meshStandardMaterial
            color={square.light ? '#f8fafc' : '#94a3b8'}
            roughness={0.92}
            metalness={0.04}
          />
        </mesh>
      ))}
    </group>
  )
}
