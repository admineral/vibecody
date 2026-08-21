'use client'

import { useMemo } from 'react'
import { Text } from '@react-three/drei'
import type { BuildingState, VersionTheme } from '@/app/lib/swarm/types'
import { themedBuildingPosition } from '@/app/lib/swarm/cityLayout'
import { folderClusters } from '@/app/lib/swarm/moduleGraph'

export default function FolderPlates({
  buildings,
  theme,
}: {
  buildings: BuildingState[]
  theme: VersionTheme
}) {
  const clusters = useMemo(() => folderClusters(buildings), [buildings])
  const label = theme.dark ? '#93a4bb' : '#334155'

  return (
    <group>
      {clusters.map((cluster) => {
        const y = theme.floatIslands ? themedBuildingPosition(cluster.members[0], theme)[1] - 0.05 : 0.01
        return (
          <group key={cluster.folder} position={[cluster.x, y, cluster.z]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[cluster.w, cluster.d]} />
              <meshStandardMaterial
                color={theme.paper}
                transparent
                opacity={theme.dark ? 0.28 : 0.2}
                roughness={0.7}
                metalness={0.25}
              />
            </mesh>
            <mesh position={[0, 0.01, 0]}>
              <boxGeometry args={[cluster.w, 0.012, cluster.d]} />
              <meshBasicMaterial color={theme.grid} transparent opacity={0.45} wireframe />
            </mesh>
            <Text
              position={[0, 0.06, -cluster.d / 2 + 0.18]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={0.13}
              color={label}
              anchorX="center"
              anchorY="middle"
            >
              {cluster.folder}
            </Text>
          </group>
        )
      })}
    </group>
  )
}
