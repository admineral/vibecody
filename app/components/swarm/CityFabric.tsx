'use client'

import { useLayoutEffect, useMemo, useRef } from 'react'
import { InstancedMesh, Object3D } from 'three'
import type { FacadeLibrary } from './cityTextures'
import {
  listFillerPlots,
  listSkylinePlots,
  themedDistrictY,
  themedXZ,
} from '@/app/lib/swarm/cityLayout'
import { DISTRICTS } from '@/app/lib/swarm/cityData'
import type { BuildingState, VersionTheme } from '@/app/lib/swarm/types'

interface CityFabricProps {
  buildings: BuildingState[]
  theme: VersionTheme
  facades: FacadeLibrary | null
}

const dummy = new Object3D()

function Road({
  position,
  size,
  color,
  metalness,
  roughness,
}: {
  position: [number, number, number]
  size: [number, number, number]
  color: string
  metalness: number
  roughness: number
}) {
  return (
    <mesh position={position} receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
    </mesh>
  )
}

export default function CityFabric({ buildings, theme, facades }: CityFabricProps) {
  const fillerMesh = useRef<InstancedMesh>(null)
  const skyMesh = useRef<InstancedMesh>(null)
  const lampMesh = useRef<InstancedMesh>(null)
  const bulbMesh = useRef<InstancedMesh>(null)
  const treeMesh = useRef<InstancedMesh>(null)

  const daylight = true
  const neon = theme.id === 'neon' || theme.id === 'hive' || theme.id === 'repo'
  const showGround = !theme.floatIslands && !theme.nodeMode && !theme.chipMode
  const showSkyline = showGround && !theme.hivePull

  const spawnKey = buildings.filter((b) => b.spawned).map((b) => b.id).join(',')
  const fillers = useMemo(() => {
    if (theme.nodeMode || theme.chipMode || theme.hivePull) return []
    return listFillerPlots(buildings.filter((b) => b.spawned))
  }, [spawnKey, theme.chipMode, theme.nodeMode, theme.hivePull]) // eslint-disable-line react-hooks/exhaustive-deps
  const skyline = useMemo(() => (showSkyline ? listSkylinePlots() : []), [showSkyline])

  const lamps = useMemo(() => {
    if (!showGround) return [] as Array<[number, number, number]>
    const points: Array<[number, number, number]> = []
    for (let x = -18; x <= 16; x += 4) {
      const [lx, lz] = themedXZ(x, -3.35, theme)
      const [rx, rz] = themedXZ(x, -1.05, theme)
      points.push([lx, 0, lz], [rx, 0, rz])
    }
    for (let z = -16; z <= 16; z += 4) {
      const [lx, lz] = themedXZ(-3.35, z, theme)
      const [rx, rz] = themedXZ(-1.05, z, theme)
      points.push([lx, 0, lz], [rx, 0, rz])
    }
    return points
  }, [showGround, theme])

  const trees = useMemo(() => {
    if (!showGround) return [] as Array<[number, number, number]>
    const points: Array<[number, number, number]> = []
    for (const district of DISTRICTS) {
      const y = themedDistrictY(district.id, theme)
      const [w, d] = district.size
      const ring = [
        [district.origin[0] - w / 2 - 0.7, district.origin[2]],
        [district.origin[0] + w / 2 + 0.7, district.origin[2]],
        [district.origin[0], district.origin[2] - d / 2 - 0.7],
        [district.origin[0], district.origin[2] + d / 2 + 0.7],
      ] as const
      ring.forEach(([x, z], i) => {
        const [tx, tz] = themedXZ(x, z, theme)
        points.push([tx, y, tz])
        if (daylight || i % 2 === 0) {
          const [sx, sz] = themedXZ(x + 1.4, z + 0.8, theme)
          points.push([sx, y, sz])
        }
      })
    }
    return points
  }, [daylight, showGround, theme])

  useLayoutEffect(() => {
    const mesh = fillerMesh.current
    if (!mesh) return
    fillers.forEach((plot, i) => {
      const y = themedDistrictY(plot.districtId, theme)
      const [x, z] = themedXZ(plot.x, plot.z, theme)
      dummy.position.set(x, y + plot.h / 2, z)
      dummy.scale.set(plot.w, plot.h, plot.d)
      dummy.rotation.set(0, 0, 0)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [fillers, theme])

  useLayoutEffect(() => {
    const mesh = skyMesh.current
    if (!mesh) return
    skyline.forEach((plot, i) => {
      dummy.position.set(plot.x, plot.h / 2, plot.z)
      dummy.scale.set(plot.w, plot.h, plot.d)
      dummy.rotation.set(0, 0, 0)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [skyline])

  useLayoutEffect(() => {
    const poles = lampMesh.current
    const bulbs = bulbMesh.current
    if (!poles || !bulbs) return
    lamps.forEach((point, i) => {
      dummy.rotation.set(0, 0, 0)
      dummy.position.set(point[0], 0.55, point[2])
      dummy.scale.set(0.06, 1.1, 0.06)
      dummy.updateMatrix()
      poles.setMatrixAt(i, dummy.matrix)
      dummy.position.set(point[0], 1.12, point[2])
      dummy.scale.set(0.12, 0.12, 0.12)
      dummy.updateMatrix()
      bulbs.setMatrixAt(i, dummy.matrix)
    })
    poles.instanceMatrix.needsUpdate = true
    bulbs.instanceMatrix.needsUpdate = true
  }, [lamps])

  useLayoutEffect(() => {
    const mesh = treeMesh.current
    if (!mesh) return
    trees.forEach((point, i) => {
      dummy.rotation.set(0, 0, 0)
      dummy.position.set(point[0], point[1] + 0.55, point[2])
      dummy.scale.set(0.55, 1.1, 0.55)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [trees])

  if (theme.nodeMode || theme.chipMode) return null

  const roadColor = daylight ? '#4b5563' : neon ? '#0b1224' : theme.road
  const metalness = neon ? 0.55 : 0.12
  const roughness = neon ? 0.28 : 0.62

  return (
    <group>
      {showGround && (
        <>
          <Road position={[0, -0.02, -2.2]} size={[38, 0.08, 2.4]} color={roadColor} metalness={metalness} roughness={roughness} />
          <Road position={[-2.2, -0.02, 1]} size={[2.4, 0.08, 36]} color={roadColor} metalness={metalness} roughness={roughness} />
          <Road position={[0, -0.015, 9.2]} size={[22, 0.07, 1.6]} color={roadColor} metalness={metalness} roughness={roughness} />
          <mesh position={[-2.2, 0.005, -2.2]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.55, 20]} />
            <meshStandardMaterial color={daylight ? '#d1d5db' : '#f8fafc'} emissive={neon ? '#fde047' : '#000'} emissiveIntensity={neon ? 0.35 : 0} />
          </mesh>
          {[-6, 2, 10].map((x) => (
            <mesh key={`cross-${x}`} position={[x, 0.02, -2.2]}>
              <boxGeometry args={[0.7, 0.01, 2.1]} />
              <meshStandardMaterial color={daylight ? '#e5e7eb' : '#e2e8f0'} />
            </mesh>
          ))}
        </>
      )}

      {fillers.length > 0 && facades && (
        <instancedMesh ref={fillerMesh} args={[undefined, undefined, fillers.length]} frustumCulled={false}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            map={facades.filler.map}
            emissiveMap={facades.filler.emissiveMap}
            emissive="#f8fafc"
            emissiveIntensity={0.1}
            metalness={neon ? 0.38 : 0.1}
            roughness={0.44}
          />
        </instancedMesh>
      )}

      {skyline.length > 0 && facades && (
        <instancedMesh ref={skyMesh} args={[undefined, undefined, skyline.length]} frustumCulled={false}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            map={facades.filler.map}
            emissiveMap={facades.filler.emissiveMap}
            color="#64748b"
            emissive="#e2e8f0"
            emissiveIntensity={0.08}
            metalness={0.2}
            roughness={0.5}
          />
        </instancedMesh>
      )}

      {showGround && lamps.length > 0 && (
        <>
          <instancedMesh ref={lampMesh} args={[undefined, undefined, lamps.length]} frustumCulled={false}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={daylight ? '#334155' : '#020617'} metalness={0.6} roughness={0.3} />
          </instancedMesh>
          <instancedMesh ref={bulbMesh} args={[undefined, undefined, lamps.length]} frustumCulled={false}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshStandardMaterial
              color={daylight ? '#fef3c7' : '#fde68a'}
              emissive={daylight ? '#fde68a' : '#facc15'}
              emissiveIntensity={daylight ? 0.4 : 1.1}
            />
          </instancedMesh>
        </>
      )}

      {showGround && trees.length > 0 && (
        <instancedMesh ref={treeMesh} args={[undefined, undefined, trees.length]} frustumCulled={false}>
          <coneGeometry args={[1, 1, 7]} />
          <meshStandardMaterial color={daylight ? '#15803d' : '#14532d'} roughness={0.8} />
        </instancedMesh>
      )}
    </group>
  )
}
