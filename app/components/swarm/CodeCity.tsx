'use client'

import { useMemo } from 'react'
import { Text } from '@react-three/drei'
import type { BuildingState, VersionTheme } from '@/app/lib/swarm/types'
import { DISTRICTS } from '@/app/lib/swarm/cityData'
import { themedBuildingPosition, themedDistrictY } from '@/app/lib/swarm/cityLayout'

interface CodeCityProps {
  buildings: BuildingState[]
  theme: VersionTheme
  selectedId: string | null
  compact?: boolean
  onSelect: (id: string) => void
}

function BuildingMesh({
  building,
  theme,
  selected,
  compact,
  onSelect,
}: {
  building: BuildingState
  theme: VersionTheme
  selected: boolean
  compact?: boolean
  onSelect: () => void
}) {
  const [x, y, z] = themedBuildingPosition(building, theme)
  const height = Math.max(0.4, building.height * building.growth)
  const color = building.hasBug ? '#ef4444' : selected ? '#f0abfc' : building.color
  const emissive = building.beingWorked || building.hasBug ? color : theme.nodeMode ? color : '#000000'
  const emissiveIntensity = building.hasBug ? 0.9 : building.beingWorked ? 0.55 : theme.nodeMode ? 0.35 : 0

  if (theme.nodeMode) {
    const radius = 0.28 + building.lines / 800
    return (
      <group position={[x, y + radius, z]}>
        <mesh onClick={(e) => { e.stopPropagation(); onSelect() }}>
          <sphereGeometry args={[radius, 12, 12]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.7}
            roughness={0.25}
          />
        </mesh>
        {selected && (
          <Text position={[0, radius + 0.35, 0]} fontSize={0.22} color="#fff" anchorX="center">
            {building.name}
          </Text>
        )}
      </group>
    )
  }

  return (
    <group position={[x, y, z]} scale={[1, building.growth, 1]}>
      <mesh
        position={[0, height / 2, 0]}
        castShadow={!theme.floatIslands}
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
      >
        <boxGeometry args={[0.95, height, 0.95]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          metalness={theme.id === 'neon' ? 0.55 : 0.2}
          roughness={0.35}
          transparent={building.growth < 1}
          opacity={0.35 + building.growth * 0.65}
        />
      </mesh>
      {Array.from({ length: compact ? 0 : Math.min(2, Math.max(0, Math.floor(height))) }).map((_, i) => (
        <mesh key={i} position={[0.48, 0.28 + i * 0.42, 0.28]}>
          <boxGeometry args={[0.06, 0.14, 0.14]} />
          <meshStandardMaterial
            color={building.beingWorked ? '#fde047' : '#ffe066'}
            emissive="#fde047"
            emissiveIntensity={building.beingWorked ? 1.2 : theme.id === 'daylight' ? 0.15 : 0.45}
          />
        </mesh>
      ))}
      {(!compact || selected) && (
        <Text
          position={[0, height + 0.22, 0]}
          fontSize={selected ? 0.2 : 0.16}
          color={selected ? '#ffffff' : '#cbd5e1'}
          anchorX="center"
          anchorY="bottom"
        >
          {building.name}
        </Text>
      )}
    </group>
  )
}

export default function CodeCity({ buildings, theme, selectedId, compact, onSelect }: CodeCityProps) {
  const visible = useMemo(
    () => buildings.filter((b) => b.spawned),
    [buildings],
  )

  return (
    <group>
      {!theme.nodeMode && DISTRICTS.map((district) => {
        const y = themedDistrictY(district.id, theme)
        const plateColor = theme.id === 'daylight' ? '#e2e8f0' : district.color
        return (
          <group key={district.id} position={[district.origin[0], y, district.origin[2]]}>
            <mesh position={[0, theme.floatIslands ? -0.12 : 0.02, 0]} receiveShadow>
              <boxGeometry args={[district.size[0], theme.floatIslands ? 0.35 : 0.08, district.size[1]]} />
              <meshStandardMaterial
                color={plateColor}
                emissive={theme.id === 'neon' || theme.id === 'hive' ? district.neon : '#000'}
                emissiveIntensity={theme.id === 'neon' || theme.id === 'hive' ? 0.18 : 0}
                transparent
                opacity={theme.floatIslands ? 0.85 : 0.95}
              />
            </mesh>
            {!compact && (
              <Text
                position={[0, theme.floatIslands ? 0.4 : 0.18, district.size[1] / 2 - 0.4]}
                fontSize={0.32}
                color={theme.id === 'daylight' ? '#0f172a' : district.neon}
                anchorX="center"
              >
                {district.name}
              </Text>
            )}
          </group>
        )
      })}

      {theme.hivePull && (
        <mesh position={[0, 1.4, 0]}>
          <octahedronGeometry args={[1.1, 0]} />
          <meshStandardMaterial
            color="#f0abfc"
            emissive="#d946ef"
            emissiveIntensity={1.1}
            metalness={0.6}
            roughness={0.15}
          />
        </mesh>
      )}

      {visible.map((building) => (
        <BuildingMesh
          key={building.id}
          building={building}
          theme={theme}
          selected={selectedId === building.id}
          compact={compact}
          onSelect={() => onSelect(building.id)}
        />
      ))}
    </group>
  )
}
