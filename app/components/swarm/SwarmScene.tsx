'use client'

import { Suspense, useLayoutEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { AdaptiveDpr, Sky, Stars } from '@react-three/drei'
import { ACESFilmicToneMapping, Group, PCFShadowMap, SRGBColorSpace } from 'three'
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
  resetNonce?: number
  hd?: boolean
  eventSource?: MutableRefObject<HTMLElement | null>
  onSelectBuilding: (id: string) => void
  onSelectAgent: (id: string) => void
}

function ToneMap() {
  const { gl } = useThree()
  useLayoutEffect(() => {
    gl.toneMapping = ACESFilmicToneMapping
    gl.outputColorSpace = SRGBColorSpace
    gl.toneMappingExposure = 1.18
  }, [gl])
  return null
}

function Environment({ theme, hd }: { theme: VersionTheme; hd?: boolean }) {
  return (
    <>
      <color attach="background" args={[theme.background]} />
      <hemisphereLight args={['#f8fafc', '#86efac', 0.95]} />
      <ambientLight intensity={theme.ambient} />
      <directionalLight
        position={theme.sun}
        intensity={theme.sunIntensity}
        color={theme.sunColor}
        castShadow={false}
      />
      <directionalLight position={[-14, 18, -10]} intensity={0.55} color="#dbeafe" />
      <pointLight position={[0, 14, 0]} intensity={0.7} color="#fff7ed" distance={120} />
      {theme.stars && (
        <Stars radius={90} depth={40} count={theme.nodeMode ? 500 : hd ? 280 : 160} factor={2.2} saturation={0} fade speed={0.35} />
      )}
      {theme.sky && (
        <Sky distance={450000} sunPosition={[1, 1.2, 0.4]} inclination={0.52} azimuth={0.25} />
      )}
      {!theme.nodeMode && !theme.floatIslands && !theme.chipMode && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} receiveShadow>
          <planeGeometry args={[260, 260]} />
          <meshStandardMaterial color={theme.cardMode ? '#cbd5e1' : theme.ground} roughness={0.9} />
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
  resetNonce = 0,
  hd,
  homePosition,
}: SwarmSceneProps & { homePosition: [number, number, number] }) {
  const groupRefs = useRef<Record<string, Group | null>>({})

  return (
    <>
      <ToneMap />
      <Environment theme={theme} hd={hd} />
      {theme.chipMode && <ChipFabric buildings={snapshot.buildings} theme={theme} />}
      <CodeCity
        buildings={snapshot.buildings}
        theme={theme}
        selectedId={selectedBuildingId}
        compact={portrait && !hd}
        hd={hd}
        onSelect={onSelectBuilding}
      />
      <SwarmDrones
        agents={agents}
        runtime={snapshot.agents}
        buildings={snapshot.buildings}
        theme={theme}
        followId={followId}
        groupRefs={groupRefs}
        compact={portrait && !hd}
        hd={hd}
        onSelect={onSelectAgent}
      />
      <CodeSlabs
        slabs={snapshot.slabs}
        buildings={snapshot.buildings}
        theme={theme}
        compact={portrait && !hd}
        selectedId={selectedBuildingId}
      />
      {!theme.chipMode && (
        <ActivityTrails trails={snapshot.trails} theme={theme} now={snapshot.time} />
      )}
      <CameraRig
        mode={cameraMode}
        followId={followId}
        groupRefs={groupRefs}
        portrait={portrait}
        chipMode={theme.chipMode}
        cardMode={theme.cardMode}
        homePosition={homePosition}
        resetNonce={resetNonce}
      />
    </>
  )
}

export default function SwarmScene(props: SwarmSceneProps) {
  const hd = props.hd !== false
  const cameraPosition = useMemo<[number, number, number]>(() => {
    if (props.theme.chipMode) return [0.4, 22, 12]
    if (props.theme.cardMode) return props.portrait ? [8, 13, 14] : [12, 11, 16]
    if (props.portrait) {
      if (props.theme.nodeMode) return [0, 12, 14]
      if (props.theme.hivePull) return [5, 11, 8]
      return [12, 9, 14]
    }
    if (props.theme.nodeMode) return [0, 14, 22]
    if (props.theme.hivePull) return [8, 10, 12]
    if (props.theme.floatIslands) return [16, 18, 20]
    return [18, 12, 16]
  }, [props.theme, props.portrait])

  return (
    <Canvas
      camera={{ position: cameraPosition, fov: props.theme.chipMode ? 62 : props.portrait ? 64 : 50, near: 0.1, far: 800 }}
      dpr={hd ? [1, 2] : [1, 1.25]}
      shadows={false}
      eventSource={(props.eventSource as MutableRefObject<HTMLElement> | undefined) ?? undefined}
      eventPrefix="client"
      onCreated={({ gl, scene }) => {
        scene.fog = null
        gl.shadowMap.type = PCFShadowMap
        gl.toneMapping = ACESFilmicToneMapping
        gl.toneMappingExposure = 1.18
        gl.outputColorSpace = SRGBColorSpace
      }}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        alpha: false,
        stencil: false,
      }}
      style={{ width: '100%', height: '100%', touchAction: 'none', pointerEvents: props.eventSource ? 'none' : 'auto' }}
    >
      {hd ? <AdaptiveDpr /> : <AdaptiveDpr pixelated />}
      <Suspense fallback={null}>
        <SceneBody {...props} hd={hd} homePosition={cameraPosition} />
      </Suspense>
    </Canvas>
  )
}
