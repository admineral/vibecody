'use client'

import { useMemo } from 'react'
import { Text } from '@react-three/drei'
import type { BuildingDef, BuildingState, VersionTheme } from '@/app/lib/swarm/types'
import { DISTRICTS } from '@/app/lib/swarm/cityData'
import { buildingFootprint, themedBuildingPosition, themedDistrictY } from '@/app/lib/swarm/cityLayout'
import CityFabric from './CityFabric'
import SwarmCodeCard from './SwarmCodeCard'
import { useFacadeLibrary, type Facade } from './cityTextures'

interface CodeCityProps {
  buildings: BuildingState[]
  theme: VersionTheme
  selectedId: string | null
  compact?: boolean
  hd?: boolean
  onSelect: (id: string) => void
}

function RoofKit({
  kind,
  width,
  depth,
  y,
  color,
  neon,
}: {
  kind: BuildingDef['kind']
  width: number
  depth: number
  y: number
  color: string
  neon: boolean
}) {
  return (
    <group position={[0, y, 0]}>
      <mesh>
        <boxGeometry args={[width * 0.92, 0.12, depth * 0.92]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.35} roughness={0.4} />
      </mesh>
      {kind === 'page' && (
        <mesh position={[0, 0.55, 0]}>
          <cylinderGeometry args={[0.035, 0.05, 1.1, 6]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={neon ? 0.7 : 0.15} metalness={0.7} roughness={0.25} />
        </mesh>
      )}
      {(kind === 'util' || kind === 'component') && (
        <>
          <mesh position={[width * 0.18, 0.16, depth * 0.12]}>
            <boxGeometry args={[0.28, 0.2, 0.22]} />
            <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.35} />
          </mesh>
          <mesh position={[-width * 0.2, 0.12, -depth * 0.16]}>
            <boxGeometry args={[0.22, 0.14, 0.22]} />
            <meshStandardMaterial color="#64748b" metalness={0.45} roughness={0.4} />
          </mesh>
        </>
      )}
      {kind === 'api' && (
        <mesh position={[0, 0.14, 0]} rotation={[Math.PI / 2.6, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.04, 12]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
        </mesh>
      )}
      {neon && (
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[width * 0.98, 0.04, depth * 0.98]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
        </mesh>
      )}
    </group>
  )
}

function CityBuilding({
  building,
  theme,
  selected,
  compact,
  facade,
  onSelect,
}: {
  building: BuildingState
  theme: VersionTheme
  selected: boolean
  compact?: boolean
  facade: Facade | null
  onSelect: () => void
}) {
  const [x, y, z] = themedBuildingPosition(building, theme)
  const height = Math.max(0.4, building.height * building.growth)
  const [fw, fd] = buildingFootprint(building.kind, building.id)
  const color = building.hasBug ? '#ef4444' : selected ? '#f0abfc' : building.color
  const neon = theme.id === 'neon' || theme.id === 'hive' || theme.id === 'repo'
  const podiumH = Math.min(0.42, height * 0.16)
  const roofH = 0.12
  const towerH = Math.max(0.28, height - podiumH - roofH)
  const emissiveIntensity = building.hasBug ? 0.45 : building.beingWorked ? 0.35 : 0.12

  return (
    <group position={[x, y, z]} scale={[1, building.growth, 1]}>
      <mesh position={[0, podiumH / 2, 0]} onClick={(e) => { e.stopPropagation(); onSelect() }}>
        <boxGeometry args={[fw * 1.14, podiumH, fd * 1.14]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.2} roughness={0.55} />
      </mesh>
      <mesh
        position={[0, podiumH + towerH / 2, 0]}
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
      >
        <boxGeometry args={[fw, towerH, fd]} />
        <meshStandardMaterial
          map={facade?.map}
          emissiveMap={facade?.emissiveMap}
          color={facade ? '#ffffff' : color}
          emissive={building.hasBug ? '#ef4444' : color}
          emissiveIntensity={emissiveIntensity}
          metalness={neon ? 0.42 : 0.12}
          roughness={neon ? 0.28 : 0.46}
          transparent={building.growth < 1}
          opacity={0.4 + building.growth * 0.6}
        />
      </mesh>
      <RoofKit
        kind={building.kind}
        width={fw}
        depth={fd}
        y={podiumH + towerH + roofH / 2}
        color={color}
        neon={neon}
      />
      {selected && (
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[Math.max(fw, fd) * 0.72, Math.max(fw, fd) * 0.95, 28]} />
          <meshBasicMaterial color="#f0abfc" transparent opacity={0.9} />
        </mesh>
      )}
      {(!compact || selected) && (
        <Text
          position={[0, height + 0.38, 0]}
          fontSize={selected ? 0.2 : 0.15}
          color={selected ? '#ffffff' : '#0f172a'}
          anchorX="center"
          anchorY="bottom"
        >
          {building.name}
        </Text>
      )}
    </group>
  )
}

function BuildingMesh({
  building,
  theme,
  selected,
  compact,
  facade,
  hd,
  onSelect,
}: {
  building: BuildingState
  theme: VersionTheme
  selected: boolean
  compact?: boolean
  facade: Facade | null
  hd?: boolean
  onSelect: () => void
}) {
  const [x, y, z] = themedBuildingPosition(building, theme)
  const color = building.hasBug ? '#ef4444' : selected ? '#f0abfc' : building.color

  if (theme.chipMode) {
    const body = 0.38 + Math.min(0.7, building.lines / 500)
    return (
      <group position={[x, y, z]} scale={[1, building.growth, 1]}>
        <mesh
          position={[0, 0.16, 0]}
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
          }}
        >
          <boxGeometry args={[1.15, 0.28, 1.15]} />
          <meshStandardMaterial
            color={building.hasBug ? '#fecaca' : '#cbd5e1'}
            emissive={color}
            emissiveIntensity={building.beingWorked || selected ? 0.55 : 0.12}
            metalness={0.5}
            roughness={0.35}
          />
        </mesh>
        {[-0.28, 0, 0.28].map((fx) => (
          <mesh key={fx} position={[fx, 0.16 + body / 2, 0]}>
            <boxGeometry args={[0.14, body, 0.72]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={building.beingWorked ? 0.8 : 0.25}
              metalness={0.7}
              roughness={0.22}
            />
          </mesh>
        ))}
        {([[-0.48, -0.48], [0.48, -0.48], [-0.48, 0.48], [0.48, 0.48]] as const).map(([px, pz]) => (
          <mesh key={`${px}-${pz}`} position={[px, 0.34, pz]}>
            <cylinderGeometry args={[0.08, 0.08, 0.08, 8]} />
            <meshStandardMaterial color="#facc15" metalness={0.9} roughness={0.15} />
          </mesh>
        ))}
        {selected && (
          <Text position={[0, body + 0.55, 0]} fontSize={0.16} color="#fde68a" anchorX="center">
            {building.name}
          </Text>
        )}
      </group>
    )
  }

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

  if (theme.cardMode) {
    return (
      <SwarmCodeCard
        building={building}
        theme={theme}
        selected={selected}
        hd={hd}
        onSelect={onSelect}
      />
    )
  }

  return (
    <CityBuilding
      building={building}
      theme={theme}
      selected={selected}
      compact={compact}
      facade={facade}
      onSelect={onSelect}
    />
  )
}

export default function CodeCity({ buildings, theme, selectedId, compact, hd, onSelect }: CodeCityProps) {
  const visible = useMemo(
    () => buildings.filter((b) => b.spawned),
    [buildings],
  )
  const facades = useFacadeLibrary(theme)

  return (
    <group>
      <CityFabric buildings={visible} theme={theme} facades={facades} />

      {!theme.nodeMode && !theme.chipMode && DISTRICTS.map((district) => {
        const y = themedDistrictY(district.id, theme)
        const plateColor = '#e2e8f0'
        return (
          <group key={district.id} position={[district.origin[0], y, district.origin[2]]}>
            <mesh position={[0, theme.floatIslands ? -0.12 : 0.015, 0]} receiveShadow>
              <boxGeometry args={[district.size[0] + 0.55, theme.floatIslands ? 0.35 : 0.1, district.size[1] + 0.55]} />
              <meshStandardMaterial
                color={district.color}
                emissive={district.neon}
                emissiveIntensity={0.12}
                metalness={0.2}
                roughness={0.55}
              />
            </mesh>
            <mesh position={[0, theme.floatIslands ? 0.08 : 0.05, 0]} receiveShadow>
              <boxGeometry args={[district.size[0] - 0.25, 0.06, district.size[1] - 0.25]} />
              <meshStandardMaterial color={plateColor} roughness={0.7} metalness={0.08} />
            </mesh>
            {!compact && (
              <Text
                position={[0, theme.floatIslands ? 0.4 : 0.22, district.size[1] / 2 - 0.35]}
                fontSize={0.28}
                color="#0f172a"
                anchorX="center"
              >
                {district.name}
              </Text>
            )}
          </group>
        )
      })}

      {theme.hivePull && !theme.chipMode && (
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
          hd={hd}
          facade={facades?.byKind[building.kind] ?? null}
          onSelect={() => onSelect(building.id)}
        />
      ))}
    </group>
  )
}
