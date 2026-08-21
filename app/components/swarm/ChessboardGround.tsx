'use client'

import { Grid } from '@react-three/drei'
import type { VersionTheme } from '@/app/lib/swarm/types'
import { DISTRICTS } from '@/app/lib/swarm/cityData'
import { themedDistrictY } from '@/app/lib/swarm/cityLayout'

export default function ChessboardGround({ theme }: { theme: VersionTheme }) {
  return (
    <group>
      <Grid
        position={[0, 0.002, 0]}
        args={[48, 48]}
        cellSize={0.95}
        cellThickness={0.55}
        cellColor={theme.grid}
        sectionSize={3.8}
        sectionThickness={1.05}
        sectionColor={theme.dark ? '#3d4f66' : '#64748b'}
        fadeDistance={52}
        fadeStrength={1.1}
        infiniteGrid
      />
      {DISTRICTS.map((district) => {
        const y = themedDistrictY(district.id, theme)
        return (
          <mesh
            key={district.id}
            position={[district.origin[0], y + 0.008, district.origin[2]]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[district.size[0] + 0.9, district.size[1] + 0.9]} />
            <meshStandardMaterial
              color={theme.paper}
              emissive={district.neon}
              emissiveIntensity={theme.dark ? 0.18 : 0.06}
              transparent
              opacity={theme.dark ? 0.22 : 0.16}
              roughness={0.8}
              metalness={0.2}
            />
          </mesh>
        )
      })}
    </group>
  )
}
