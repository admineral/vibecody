'use client'

import { Suspense, useLayoutEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { AdaptiveDpr, ContactShadows, Sky, Stars } from '@react-three/drei'
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

function ToneMap({ exposure }: { exposure: number }) {
  const { gl } = useThree()
  useLayoutEffect(() => {
    gl.toneMapping = ACESFilmicToneMapping
    gl.outputColorSpace = SRGBColorSpace
    gl.toneMappingExposure = exposure
  }, [gl, exposure])
  return null
}

function Environment({ theme, hd }: { theme: VersionTheme; hd?: boolean }) {
  return (
    <>
      <color attach="background" args={[theme.background]} />
      <hemisphereLight args={[theme.hemiSky, theme.hemiGround, theme.dark ? 0.38 : 0.9]} />
      <ambientLight intensity={theme.ambient} />
      <directionalLight
        position={theme.sun}
        intensity={theme.sunIntensity}
        color={theme.sunColor}
        castShadow={false}
      />
      <directionalLight
        position={[-16, 14, -12]}
        intensity={theme.dark ? 0.28 : 0.45}
        color={theme.dark ? '#7dd3fc' : '#dbeafe'}
      />
      <pointLight
        position={[0, 12, 0]}
        intensity={theme.dark ? 0.45 : 0.55}
        color={theme.sunColor}
        distance={90}
      />
      {theme.stars && (
        <Stars
          radius={110}
          depth={50}
          count={theme.nodeMode ? 900 : hd ? 700 : 420}
          factor={theme.dark ? 2.8 : 1.8}
          saturation={0}
          fade
          speed={0.22}
        />
      )}
      {theme.sky && (
        <Sky distance={450000} sunPosition={[1, 1.15, 0.35]} inclination={0.5} azimuth={0.24} />
      )}
      {!theme.nodeMode && !theme.floatIslands && !theme.chipMode && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} receiveShadow>
          <planeGeometry args={[280, 280]} />
          <meshStandardMaterial color={theme.ground} roughness={0.92} metalness={theme.dark ? 0.18 : 0.04} />
        </mesh>
      )}
      {theme.cardMode && !theme.chipMode && (
        <ContactShadows position={[0, 0, 0]} opacity={theme.dark ? 0.45 : 0.22} scale={48} blur={2.6} far={10} />
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
      <ToneMap exposure={theme.exposure} />
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
    if (props.theme.cardMode) return props.portrait ? [7.5, 11.5, 13] : [11, 9.5, 15]
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
      camera={{ position: cameraPosition, fov: props.theme.chipMode ? 62 : props.portrait ? 60 : 48, near: 0.1, far: 800 }}
      dpr={hd ? [1, 2] : [1, 1.25]}
      shadows={false}
      eventSource={(props.eventSource as MutableRefObject<HTMLElement> | undefined) ?? undefined}
      eventPrefix="client"
      onCreated={({ gl, scene }) => {
        scene.fog = null
        gl.shadowMap.type = PCFShadowMap
        gl.toneMapping = ACESFilmicToneMapping
        gl.toneMappingExposure = props.theme.exposure
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
