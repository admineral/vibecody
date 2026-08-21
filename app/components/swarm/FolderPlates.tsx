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

  return (
    <group>
      {clusters.map((cluster) => {
        const y = theme.floatIslands ? themedBuildingPosition(cluster.members[0], theme)[1] - 0.04 : 0.012
        return (
          <group key={cluster.folder} position={[cluster.x, y, cluster.z]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[cluster.w, cluster.d]} />
              <meshStandardMaterial color="#f8fafc" transparent opacity={0.55} roughness={0.95} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
              <planeGeometry args={[cluster.w - 0.08, cluster.d - 0.08]} />
              <meshBasicMaterial color="#cbd5e1" transparent opacity={0.25} />
            </mesh>
            <Text
              position={[0, 0.05, -cluster.d / 2 + 0.22]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={0.16}
              color="#0f172a"
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
