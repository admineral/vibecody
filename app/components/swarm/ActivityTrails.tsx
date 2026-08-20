'use client'

import { Line } from '@react-three/drei'
import type { TrailSegment, VersionTheme } from '@/app/lib/swarm/types'

interface ActivityTrailsProps {
  trails: TrailSegment[]
  theme: VersionTheme
  now: number
}

export default function ActivityTrails({ trails, theme, now }: ActivityTrailsProps) {
  const keepMs = theme.nodeMode ? 22000 : 9000

  return (
    <group>
      {trails
        .filter((trail) => now - trail.bornAt < keepMs)
        .map((trail) => {
          const age = (now - trail.bornAt) / keepMs
          const width = theme.nodeMode ? 2.4 : 1.4
          return (
            <Line
              key={trail.id}
              points={[trail.from, trail.to]}
              color={trail.color}
              lineWidth={width * (1 - age * 0.4)}
              transparent
              opacity={0.85 - age * 0.7}
            />
          )
        })}
    </group>
  )
}
