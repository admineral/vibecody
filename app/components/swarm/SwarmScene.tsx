'use client'

import { Suspense, useMemo, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { AdaptiveDpr, Sky, Stars } from '@react-three/drei'
import { Group, PCFShadowMap } from 'three'
import type { AgentDef, CameraMode, VersionTheme, WorldSnapshot } from '@/app/lib/swarm/types'
import CodeCity from './CodeCity'
import SwarmDrones from './SwarmDrones'
import CodeSlabs from './CodeSlabs'
import ActivityTrails from './ActivityTrails'
import ChipFabric from './ChipFabric'
import CameraRig from './CameraRig'

interface SwarmSceneProps {
  snapshot: WorldSnapshot
  agents: AgentDef[]
  theme: VersionTheme
  cameraMode: CameraMode
  followId: string | null
  selectedBuildingId: string | null
  portrait?: boolean
  onSelectBuilding: (id: string) => void
  onSelectAgent: (id: string) => void
}

function Environment({ theme, portrait }: { theme: VersionTheme; portrait?: boolean }) {
  return (
    <>
      <color attach="background" args={[theme.background]} />
      <fog attach="fog" args={[theme.fog, theme.chipMode ? 16 : portrait ? 10 : theme.fogNear, theme.chipMode ? 56 : portrait ? 42 : theme.fogFar]} />
      <ambientLight intensity={theme.ambient} />
      <directionalLight
        position={theme.sun}
        intensity={theme.sunIntensity}
        color={theme.sunColor}
        castShadow={theme.id === 'daylight'}
      />
      <pointLight position={[0, 10, 0]} intensity={theme.id === 'hive' ? 1.2 : 0.35} color={theme.sunColor} />
      {theme.stars && (
        <Stars radius={70} depth={30} count={theme.nodeMode ? 900 : 500} factor={2.4} saturation={0} fade speed={0.35} />
      )}
      {theme.sky && (
        <Sky distance={450000} sunPosition={[1, 1, 0]} inclination={0.49} azimuth={0.25} />
      )}
      {!theme.nodeMode && !theme.floatIslands && !theme.chipMode && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} receiveShadow>
          <planeGeometry args={[120, 120]} />
          <meshStandardMaterial color={theme.ground} />
        </mesh>
      )}
    </>
  )
}

function SceneBody({
  snapshot,
  agents,
  theme,
  cameraMode,
  followId,
  selectedBuildingId,
  onSelectBuilding,
  onSelectAgent,
  portrait = true,
}: SwarmSceneProps) {
  const groupRefs = useRef<Record<string, Group | null>>({})

  return (
    <>
      <Environment theme={theme} portrait={portrait} />
      {theme.chipMode && <ChipFabric buildings={snapshot.buildings} theme={theme} />}
      <CodeCity
        buildings={snapshot.buildings}
        theme={theme}
        selectedId={selectedBuildingId}
        compact={portrait}
        onSelect={onSelectBuilding}
      />
      <SwarmDrones
        agents={agents}
        runtime={snapshot.agents}
        buildings={snapshot.buildings}
        theme={theme}
        followId={followId}
        groupRefs={groupRefs}
        compact={portrait}
        onSelect={onSelectAgent}
      />
      <CodeSlabs
        slabs={snapshot.slabs}
        buildings={snapshot.buildings}
        theme={theme}
        compact={portrait}
        selectedId={selectedBuildingId}
      />
      {!theme.chipMode && (
        <ActivityTrails trails={snapshot.trails} theme={theme} now={snapshot.time} />
      )}
      <CameraRig mode={cameraMode} followId={followId} groupRefs={groupRefs} portrait={portrait} chipMode={theme.chipMode} />
    </>
  )
}

export default function SwarmScene(props: SwarmSceneProps) {
  const cameraPosition = useMemo<[number, number, number]>(() => {
    if (props.theme.chipMode) return [0.4, 22, 12]
    if (props.portrait) {
      if (props.theme.nodeMode) return [0, 12, 14]
      if (props.theme.hivePull) return [5, 11, 8]
      return [8, 14, 10]
    }
    if (props.theme.nodeMode) return [0, 14, 22]
    if (props.theme.hivePull) return [8, 10, 12]
    if (props.theme.floatIslands) return [16, 18, 20]
    return [18, 14, 18]
  }, [props.theme, props.portrait])

  return (
    <Canvas
      camera={{ position: cameraPosition, fov: props.theme.chipMode ? 62 : props.portrait ? 72 : 55, near: 0.1, far: 160 }}
      dpr={[1, 1.25]}
      shadows={false}
      onCreated={({ gl }) => {
        gl.shadowMap.type = PCFShadowMap
      }}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        alpha: false,
        stencil: false,
      }}
      style={{ width: '100%', height: '100%', touchAction: 'none' }}
    >
      <AdaptiveDpr pixelated />
      <Suspense fallback={null}>
        <SceneBody {...props} />
      </Suspense>
    </Canvas>
  )
}
