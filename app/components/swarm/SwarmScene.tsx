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
import CameraRig from './CameraRig'

interface SwarmSceneProps {
  snapshot: WorldSnapshot
  agents: AgentDef[]
  theme: VersionTheme
  cameraMode: CameraMode
  followId: string | null
  selectedBuildingId: string | null
  onSelectBuilding: (id: string) => void
  onSelectAgent: (id: string) => void
}

function Environment({ theme }: { theme: VersionTheme }) {
  return (
    <>
      <color attach="background" args={[theme.background]} />
      <fog attach="fog" args={[theme.fog, theme.fogNear, theme.fogFar]} />
      <ambientLight intensity={theme.ambient} />
      <directionalLight
        position={theme.sun}
        intensity={theme.sunIntensity}
        color={theme.sunColor}
        castShadow={theme.id === 'daylight'}
      />
      <pointLight position={[0, 10, 0]} intensity={theme.id === 'hive' ? 1.2 : 0.35} color={theme.sunColor} />
      {theme.stars && (
        <Stars radius={90} depth={40} count={theme.nodeMode ? 2800 : 1400} factor={3} saturation={0} fade speed={0.4} />
      )}
      {theme.sky && (
        <Sky distance={450000} sunPosition={[1, 1, 0]} inclination={0.49} azimuth={0.25} />
      )}
      {!theme.nodeMode && !theme.floatIslands && (
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
}: SwarmSceneProps) {
  const groupRefs = useRef<Record<string, Group | null>>({})

  return (
    <>
      <Environment theme={theme} />
      <CodeCity
        buildings={snapshot.buildings}
        theme={theme}
        selectedId={selectedBuildingId}
        onSelect={onSelectBuilding}
      />
      <SwarmDrones
        agents={agents}
        runtime={snapshot.agents}
        buildings={snapshot.buildings}
        theme={theme}
        followId={followId}
        groupRefs={groupRefs}
        onSelect={onSelectAgent}
      />
      <CodeSlabs slabs={snapshot.slabs} buildings={snapshot.buildings} theme={theme} />
      <ActivityTrails trails={snapshot.trails} theme={theme} now={snapshot.time} />
      <CameraRig mode={cameraMode} followId={followId} groupRefs={groupRefs} />
    </>
  )
}

export default function SwarmScene(props: SwarmSceneProps) {
  const cameraPosition = useMemo<[number, number, number]>(() => {
    if (props.theme.nodeMode) return [0, 14, 22]
    if (props.theme.hivePull) return [8, 10, 12]
    if (props.theme.floatIslands) return [16, 18, 20]
    return [18, 14, 18]
  }, [props.theme])

  return (
    <Canvas
      camera={{ position: cameraPosition, fov: 55, near: 0.1, far: 200 }}
      dpr={[1, 1.5]}
      shadows={props.theme.id === 'daylight'}
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
